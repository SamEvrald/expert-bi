const { Dataset } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

class DatasetController {
  static async list(req, res, next) {
    try {
      const userId = req.userId || (req.user && (req.user.id || req.user.userId));
      if (!userId) return res.status(401).json(ApiResponse.unauthorized('Unauthorized'));

      const datasets = await Dataset.findAll({
        where: {
          [Op.or]: [{ user_id: userId }, { userId }]
        }
      });
      return res.json(ApiResponse.success(datasets));
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const userId = req.userId || (req.user && (req.user.id || req.user.userId));
      if (!userId) return res.status(401).json(ApiResponse.unauthorized('Unauthorized'));

      const { name, description, original_filename, size_bytes } = req.body || {};
      if (!name) return res.status(400).json(ApiResponse.error('Dataset name is required', 400));

      const dataset = await Dataset.create({
        user_id: userId,
        name,
        description,
        original_filename,
        size_bytes
      });

      return res.status(201).json(ApiResponse.success(dataset, 'Dataset created'));
    } catch (err) {
      next(err);
    }
  }

  static async get(req, res, next) {
    try {
      const id = req.params.id;
      const dataset = await Dataset.findByPk(id);
      if (!dataset) return res.status(404).json(ApiResponse.error('Dataset not found', 404));
      return res.json(ApiResponse.success(dataset));
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const id = req.params.id;
      const dataset = await Dataset.findByPk(id);
      if (!dataset) return res.status(404).json(ApiResponse.error('Dataset not found', 404));

      const userId = req.userId || (req.user && (req.user.id || req.user.userId));
      if (!userId || ((dataset.user_id && dataset.user_id !== userId) && (dataset.userId && dataset.userId !== userId))) {
        return res.status(403).json(ApiResponse.error('Forbidden', 403));
      }

      const { name, description } = req.body || {};
      await dataset.update({
        name: name ?? dataset.name,
        description: description ?? dataset.description
      });

      return res.json(ApiResponse.success(dataset, 'Dataset updated'));
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = req.params.id;
      const dataset = await Dataset.findByPk(id);
      if (!dataset) return res.status(404).json(ApiResponse.error('Dataset not found', 404));

      const userId = req.userId || (req.user && (req.user.id || req.user.userId));
      if (!userId || ((dataset.user_id && dataset.user_id !== userId) && (dataset.userId && dataset.userId !== userId))) {
        return res.status(403).json(ApiResponse.error('Forbidden', 403));
      }

      await dataset.destroy();
      return res.json(ApiResponse.success(null, 'Dataset deleted'));
    } catch (err) {
      next(err);
    }
  }
}

// aliases in case routes expect different names
DatasetController.getDatasets = DatasetController.list;
DatasetController.getDataset = DatasetController.get;
DatasetController.createDataset = DatasetController.create;
DatasetController.updateDataset = DatasetController.update;
DatasetController.deleteDataset = DatasetController.delete;

module.exports = DatasetController;