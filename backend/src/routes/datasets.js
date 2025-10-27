const express = require('express');
const router = express.Router();

// load controller: prefer singular DatasetController (what you have), fallback to DatasetsController
let Controller;
try {
  Controller = require('../controllers/DatasetController');
} catch (e1) {
  try {
    Controller = require('../controllers/DatasetsController');
  } catch (e2) {
    throw new Error('Missing controller: DatasetController or DatasetsController not found');
  }
}

// load auth middleware safely
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
  if (authMiddleware && typeof authMiddleware.default === 'function' && typeof authMiddleware !== 'function') {
    authMiddleware = authMiddleware.default;
  }
} catch (e) {
  authMiddleware = null;
}
const ensureAuth = typeof authMiddleware === 'function' ? authMiddleware : (req, res, next) => next();

// try to load dataset validation middleware; fall back to no-op
let datasetValidation;
try {
  datasetValidation = require('../validators/datasetValidation');
  if (datasetValidation && typeof datasetValidation.default === 'function' && typeof datasetValidation !== 'function') {
    datasetValidation = datasetValidation.default;
  }
} catch (e) {
  datasetValidation = (req, res, next) => next();
}

// apply middleware safely
router.use(ensureAuth);

// use whichever method names exist on the controller
router.get('/', Controller.list || Controller.getDatasets || Controller.getAll || Controller.index);
router.post('/', datasetValidation, Controller.create || Controller.createDataset);
router.get('/:id', Controller.get || Controller.getDataset);
router.put('/:id', datasetValidation, Controller.update || Controller.updateDataset);
router.delete('/:id', Controller.delete || Controller.deleteDataset);

module.exports = router;