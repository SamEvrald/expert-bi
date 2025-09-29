const { Project, Dataset } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const { Op } = require('sequelize');

class ProjectController {
  static async createProject(req, res, next) {
    try {
      const { name, description } = req.body;

      // Check if user is on free plan and already has a project
      if (req.user.plan === 'free') {
        const existingProjects = await Project.count({
          where: {
            userId: req.user.id,
            status: 'active'
          }
        });

        if (existingProjects >= 1) {
          return res.status(403).json(
            ApiResponse.forbidden('Free plan allows only one active project. Upgrade to premium for unlimited projects.')
          );
        }
      }

      const project = await Project.create({
        name: name.trim(),
        description: description?.trim(),
        userId: req.user.id
      });

      res.status(201).json(
        ApiResponse.success(project, 'Project created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req, res, next) {
    try {
      const { page = 1, limit = 10, status = 'active', search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        userId: req.user.id,
        status: status
      };

      if (search) {
        whereClause.name = {
          [Op.like]: `%${search}%`
        };
      }

      const { count, rows: projects } = await Project.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['updatedAt', 'DESC']],
        include: [{
          model: Dataset,
          as: 'datasets',
          attributes: ['id', 'status'],
          separate: true,
          limit: 5
        }]
      });

      // Add dataset counts
      const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
          const datasetCounts = await Dataset.count({
            where: { projectId: project.id },
            group: ['status']
          });

          const counts = datasetCounts.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {});

          return {
            ...project.toJSON(),
            datasetCounts: {
              total: await Dataset.count({ where: { projectId: project.id } }),
              completed: counts.completed || 0,
              processing: counts.processing || 0,
              error: counts.error || 0
            }
          };
        })
      );

      res.json(
        ApiResponse.success({
          projects: projectsWithCounts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }, 'Projects retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getProject(req, res, next) {
    try {
      const { id } = req.params;

      const project = await Project.findOne({
        where: {
          id,
          userId: req.user.id
        },
        include: [{
          model: Dataset,
          as: 'datasets',
          order: [['createdAt', 'DESC']],
          limit: 10
        }]
      });

      if (!project) {
        return res.status(404).json(
          ApiResponse.notFound('Project not found')
        );
      }

      res.json(
        ApiResponse.success(project, 'Project retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;

      const project = await Project.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json(
          ApiResponse.notFound('Project not found')
        );
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim();
      if (status !== undefined) updateData.status = status;

      await project.update(updateData);

      res.json(
        ApiResponse.success(project, 'Project updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req, res, next) {
    try {
      const { id } = req.params;

      const project = await Project.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json(
          ApiResponse.notFound('Project not found')
        );
      }

      // Soft delete by updating status
      await project.update({ status: 'deleted' });

      // Also mark all datasets as deleted
      await Dataset.update(
        { status: 'deleted' },
        { where: { projectId: id } }
      );

      res.json(
        ApiResponse.success(null, 'Project deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getProjectStats(req, res, next) {
    try {
      const { id } = req.params;

      const project = await Project.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!project) {
        return res.status(404).json(
          ApiResponse.notFound('Project not found')
        );
      }

      // Get dataset statistics
      const totalDatasets = await Dataset.count({
        where: { projectId: id }
      });

      const completedDatasets = await Dataset.count({
        where: { projectId: id, status: 'completed' }
      });

      const totalRows = await Dataset.sum('rowCount', {
        where: { projectId: id, status: 'completed' }
      }) || 0;

      const totalSize = await Dataset.sum('fileSize', {
        where: { projectId: id }
      }) || 0;

      const recentDatasets = await Dataset.findAll({
        where: { projectId: id },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'originalName', 'status', 'createdAt', 'rowCount']
      });

      const stats = {
        totalDatasets,
        completedDatasets,
        totalRows,
        totalSize,
        completionRate: totalDatasets > 0 ? (completedDatasets / totalDatasets * 100).toFixed(1) : 0,
        recentDatasets
      };

      res.json(
        ApiResponse.success(stats, 'Project statistics retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProjectController;