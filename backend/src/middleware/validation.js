const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');

// Common validation rules
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

const passwordValidation = body('password')
  .isLength({ min: 6, max: 128 })
  .withMessage('Password must be between 6 and 128 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

const nameValidation = body('name')
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage('Name must be between 2 and 100 characters')
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage('Name can only contain letters and spaces');

// Validation rule sets
const registerValidation = [
  emailValidation,
  passwordValidation,
  nameValidation
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  emailValidation
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  passwordValidation
];

const projectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
];

const uuidValidation = param('id')
  .isUUID()
  .withMessage('Invalid ID format');

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json(
      ApiResponse.validationError(errorMessages, 'Validation failed')
    );
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  projectValidation,
  uuidValidation,
  paginationValidation,
  handleValidationErrors
};