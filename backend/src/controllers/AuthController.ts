import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Database from '../config/database';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export class AuthController {
  /**
   * Register new user
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user exists
      const existingUser = await Database.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      ) as Record<string, unknown>[];

      if (existingUser && existingUser.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await Database.query(
        'INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, NOW())',
        [email, hashedPassword, name]
      );

      const userId = (result as any).insertId;

      // Generate token
      const token = jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          id: userId,
          email,
          name,
          token
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const users = await Database.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      ) as Record<string, unknown>[];

      if (!users || users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(
        password,
        user.password as string
      );

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Update last login
      await Database.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const users = await Database.query(
        'SELECT id, email, name, created_at, last_login FROM users WHERE id = ?',
        [userId]
      ) as Record<string, unknown>[];

      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({
        success: true,
        data: users[0]
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }

  /**
   * Logout user (optional - for token blacklisting)
   */
  static async logout(req: AuthRequest, res: Response) {
    try {
      // In a production app, you might want to:
      // 1. Blacklist the token
      // 2. Clear refresh tokens
      // 3. Log the logout event

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }
}