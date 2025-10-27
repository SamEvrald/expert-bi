const { Project } = require('../models');
const ApiResponse = require('../utils/ApiResponse');

class ProjectsController {
  static async list(req, res, next) {
    try {
      const userId = req.userId || (req.user && req.user.id);
      if (!userId) return res.status(401).json(ApiResponse.unauthorized('Unauthorized'));

      const projects = await Project.findAll({ where: { userId } });
      return res.json(ApiResponse.success(projects));
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const userId = req.userId || (req.user && req.user.id);
      if (!userId) return res.status(401).json(ApiResponse.unauthorized('Unauthorized'));

      const { name, description } = req.body || {};
      if (!name) return res.status(400).json(ApiResponse.error('Project name is required', 400));

      const project = await Project.create({ name, description, userId });
      return res.status(201).json(ApiResponse.success(project, 'Project created'));
    } catch (err) {
      next(err);
    }
  }

  static async get(req, res, next) {
    try {
      const id = req.params.id;
      const project = await Project.findByPk(id);
      if (!project) return res.status(404).json(ApiResponse.error('Project not found', 404));
      return res.json(ApiResponse.success(project));
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const id = req.params.id;
      const project = await Project.findByPk(id);
      if (!project) return res.status(404).json(ApiResponse.error('Project not found', 404));

      const userId = req.userId || (req.user && req.user.id);
      if (!userId || project.userId !== userId) return res.status(403).json(ApiResponse.error('Forbidden', 403));

      const { name, description } = req.body || {};
      await project.update({
        name: name ?? project.name,
        description: description ?? project.description,
      });

      return res.json(ApiResponse.success(project, 'Project updated'));
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = req.params.id;
      const project = await Project.findByPk(id);
      if (!project) return res.status(404).json(ApiResponse.error('Project not found', 404));

      const userId = req.userId || (req.user && req.user.id);
      if (!userId || project.userId !== userId) return res.status(403).json(ApiResponse.error('Forbidden', 403));

      await project.destroy();
      return res.json(ApiResponse.success(null, 'Project deleted'));
    } catch (err) {
      next(err);
    }
  }
}

// compatibility aliases in case routes expect different names
ProjectsController.getProjects = ProjectsController.list;
ProjectsController.getProject = ProjectsController.get;
ProjectsController.createProject = ProjectsController.create;
ProjectsController.updateProject = ProjectsController.update;
ProjectsController.deleteProject = ProjectsController.delete;

module.exports = ProjectsController;