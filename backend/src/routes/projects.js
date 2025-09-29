const express = require('express');
const ProjectController = require('../controllers/ProjectController');
const { authenticateToken } = require('../middleware/auth');
const { generalRateLimit } = require('../middleware/rateLimiter');
const {
  projectValidation,
  uuidValidation,
  paginationValidation,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);
router.use(generalRateLimit);

// Project routes
router.post('/',
  projectValidation,
  handleValidationErrors,
  ProjectController.createProject
);

router.get('/',
  paginationValidation,
  handleValidationErrors,
  ProjectController.getProjects
);

router.get('/:id',
  uuidValidation,
  handleValidationErrors,
  ProjectController.getProject
);

router.put('/:id',
  uuidValidation,
  [
    require('express-validator').body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name must be between 1 and 255 characters'),
    require('express-validator').body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    require('express-validator').body('status')
      .optional()
      .isIn(['active', 'archived'])
      .withMessage('Status must be either active or archived')
  ],
  handleValidationErrors,
  ProjectController.updateProject
);

router.delete('/:id',
  uuidValidation,
  handleValidationErrors,
  ProjectController.deleteProject
);

router.get('/:id/stats',
  uuidValidation,
  handleValidationErrors,
  ProjectController.getProjectStats
);

module.exports = router;