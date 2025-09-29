const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', 
  authRateLimit,
  registerValidation,
  handleValidationErrors,
  AuthController.register
);

router.post('/login',
  authRateLimit,
  loginValidation,
  handleValidationErrors,
  AuthController.login
);

router.post('/refresh-token',
  AuthController.refreshToken
);

router.post('/forgot-password',
  authRateLimit,
  forgotPasswordValidation,
  handleValidationErrors,
  AuthController.forgotPassword
);

router.post('/reset-password',
  authRateLimit,
  resetPasswordValidation,
  handleValidationErrors,
  AuthController.resetPassword
);

// Protected routes
router.get('/me',
  authenticateToken,
  AuthController.getCurrentUser
);

router.put('/profile',
  authenticateToken,
  [
    require('express-validator').body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
  ],
  handleValidationErrors,
  AuthController.updateProfile
);

router.put('/change-password',
  authenticateToken,
  [
    require('express-validator').body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    require('express-validator').body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('New password must be between 6 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  handleValidationErrors,
  AuthController.changePassword
);

module.exports = router;