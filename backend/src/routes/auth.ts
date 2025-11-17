import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', AuthController.register);

// Login
router.post('/login', AuthController.login);

// Get current user
router.get('/me', authMiddleware, AuthController.getCurrentUser);

// Logout (optional - mainly for token blacklisting if implemented)
router.post('/logout', authMiddleware, AuthController.logout);

export default router;