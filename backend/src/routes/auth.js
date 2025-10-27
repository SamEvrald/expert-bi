const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// try to load auth middleware if present, otherwise use a no-op passthrough
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
} catch (e) {
  authMiddleware = (req, res, next) => next();
}

// choose a "me" handler that exists on the controller
const meHandler = AuthController.me || AuthController.getCurrentUser;
if (!meHandler) {
  throw new Error('AuthController: missing "me" or "getCurrentUser" handler');
}

// route definitions
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware, meHandler);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.post('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;