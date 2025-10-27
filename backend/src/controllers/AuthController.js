const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

class AuthController {
  static async register(req, res, next) {
    try {
      console.log('[Auth.register] body:', JSON.stringify(req.body));

      const { email, password, name } = req.body || {};

      // Basic validation
      const errors = [];
      if (!email) errors.push({ field: 'email', message: 'Email is required' });
      if (!password) errors.push({ field: 'password', message: 'Password is required' });
      if (errors.length) {
        return res.status(400).json({ success: false, status: 400, message: 'Invalid input data', errors, timestamp: new Date().toISOString() });
      }

      // Check existing user
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ success: false, status: 400, message: 'Email already registered', errors: null, timestamp: new Date().toISOString() });
      }

      // Hash password and create user (model expects password_hash)
      const password_hash = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        name,
        password_hash
      });

      const userResp = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at || user.createdAt
      };

      return res.status(201).json({ success: true, status: 201, message: 'User created', data: userResp, timestamp: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, status: 400, message: 'Email and password required' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ success: false, status: 401, message: 'Invalid credentials' });
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ success: false, status: 401, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Login successful',
        data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
      });
    } catch (err) {
      next(err);
    }
  }

  // Minimal placeholder for refreshToken - implement properly if you have a refresh token flow
  static async refreshToken(req, res, next) {
    return res.status(501).json(ApiResponse.error('Refresh token flow not implemented', 501));
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email: (email || '').toLowerCase() } });
      if (!user) {
        return res.json(ApiResponse.success(null, 'If an account with that email exists, a password reset link has been sent'));
      }

      // If your model provides a method to create a reset token, call it; else generate one temporarily
      let resetToken = null;
      if (typeof user.createPasswordResetToken === 'function') {
        resetToken = user.createPasswordResetToken();
        await user.save({ validate: false });
      } else {
        resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = new Date(Date.now() + 3600 * 1000); // 1 hour
        await user.save({ validate: false });
      }

      console.log('Password reset token:', resetToken);

      res.json(ApiResponse.success(null, 'Password reset link has been sent to your email'));
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const hashedToken = crypto.createHash('sha256').update(token || '').digest('hex');

      const Sequelize = require('sequelize');
      const user = await User.findOne({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: { [Sequelize.Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json(ApiResponse.error('Token is invalid or has expired', 400));
      }

      user.password_hash = await bcrypt.hash(password, 10);
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      res.json(ApiResponse.success(null, 'Password has been reset successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req, res, next) {
    try {
      if (!req.user) return res.status(401).json(ApiResponse.unauthorized('Unauthorized'));
      const userObj = req.user.toJSON ? req.user.toJSON() : req.user;
      const { password_hash, ...userResponse } = userObj;
      res.json(ApiResponse.success(userResponse, 'User retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name } = req.body;
      const user = req.user;
      if (!user) return res.status(401).json(ApiResponse.unauthorized('Unauthorized'));

      await user.update({ name: (name || '').trim() });

      const userObj = user.toJSON ? user.toJSON() : user;
      const { password_hash, ...userResponse } = userObj;

      res.json(ApiResponse.success(userResponse, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;
      if (!user) return res.status(401).json(ApiResponse.unauthorized('Unauthorized'));

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json(ApiResponse.error('Current password is incorrect', 400));
      }

      user.password_hash = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json(ApiResponse.success(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const userId = req.userId || (req.user && req.user.id);
      if (!userId) {
        return res.status(401).json({ success: false, status: 401, message: 'Unauthorized' });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(401).json({ success: false, status: 401, message: 'User not found or inactive' });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        data: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;