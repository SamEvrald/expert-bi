const express = require('express');
const DatasetController = require('../controllers/DatasetController');
const { authenticateToken } = require('../middleware/auth');
const { generalRateLimit, uploadRateLimit } = require('../middleware/rateLimiter');
const { upload, handleMulterError } = require('../middleware/upload');
const {
  uuidValidation,
  paginationValidation,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);
router.use(generalRateLimit);

// Dataset upload
router.post('/upload',
  uploadRateLimit,
  upload.single('file'),
  handleMulterError,
  [
    require('express-validator').body('projectId')
      .isUUID()
      .withMessage('Valid project ID is required')
  ],
  handleValidationErrors,
  DatasetController.uploadDataset
);

// List datasets (optionally filtered by project)
router.get('/',
  paginationValidation,
  [
    require('express-validator').query('projectId')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID'),
    require('express-validator').query('status')
      .optional()
      .isIn(['uploading', 'processing', 'completed', 'error'])
      .withMessage('Invalid status value')
  ],
  handleValidationErrors,
  DatasetController.getDatasets
);

// Get datasets for a specific project
router.get('/project/:projectId',
  [
    require('express-validator').param('projectId')
      .isUUID()
      .withMessage('Invalid project ID format')
  ],
  paginationValidation,
  handleValidationErrors,
  (req, res, next) => {
    req.params.id = req.params.projectId;
    next();
  },
  DatasetController.getDatasets
);

// Get specific dataset
router.get('/:id',
  uuidValidation,
  handleValidationErrors,
  DatasetController.getDataset
);

// Get dataset analysis
router.get('/:id/analysis',
  uuidValidation,
  handleValidationErrors,
  DatasetController.getDatasetAnalysis
);

// Reanalyze dataset
router.post('/:id/reanalyze',
  uuidValidation,
  handleValidationErrors,
  DatasetController.reanalyzeDataset
);

// Delete dataset
router.delete('/:id',
  uuidValidation,
  handleValidationErrors,
  DatasetController.deleteDataset
);

module.exports = router;