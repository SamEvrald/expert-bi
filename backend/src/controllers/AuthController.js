const { User } = require('../models');
const JWTService = require('../utils/jwt');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json(
          ApiResponse.error('User with this email already exists', 400)
        );
      }

      // Create new user
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        plan: 'free'
      });

      // Generate tokens
      const { accessToken, refreshToken } = JWTService.generateTokenPair({
        id: user.id,
        email: user.email,
        plan: user.plan
      });

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();

      res.status(201).json(
        ApiResponse.success(
          {
            user: userResponse,
            accessToken,
            refreshToken
          },
          'User registered successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user || !user.isActive) {
        return res.status(401).json(
          ApiResponse.unauthorized('Invalid email or password')
        );
      }

      // Check password
      const isValidPassword = await user.checkPassword(password);
      if (!isValidPassword) {
        return res.status(401).json(
          ApiResponse.unauthorized('Invalid email or password')
        );
      }

      // Generate tokens
      const { accessToken, refreshToken } = JWTService.generateTokenPair({
        id: user.id,
        email: user.email,
        plan: user.plan
      });

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();

      res.json(
        ApiResponse.success(
          {
            user: userResponse,
            accessToken,
            refreshToken
          },
          'Login successful'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json(
          ApiResponse.unauthorized('Refresh token is required')
        );
      }

      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json(
          ApiResponse.unauthorized('User not found or inactive')
        );
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = JWTService.generateTokenPair({
        id: user.id,
        email: user.email,
        plan: user.plan
      });

      res.json(
        ApiResponse.success(
          {
            accessToken,
            refreshToken: newRefreshToken
          },
          'Token refreshed successfully'
        )
      );
    } catch (error) {
      return res.status(401).json(
        ApiResponse.unauthorized('Invalid or expired refresh token')
      );
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        // Don't reveal if email exists
        return res.json(
          ApiResponse.success(
            null,
            'If an account with that email exists, a password reset link has been sent'
          )
        );
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validate: false });

      // In a real application, you would send an email here
      // For now, we'll just log it (remove in production)
      console.log('Password reset token:', resetToken);

      res.json(
        ApiResponse.success(
          null,
          'Password reset link has been sent to your email'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      // Hash the token to compare with stored version
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user by token and check if token is still valid
      const user = await User.findOne({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: {
            [require('sequelize').Op.gt]: new Date()
          }
        }
      });

      if (!user) {
        return res.status(400).json(
          ApiResponse.error('Token is invalid or has expired', 400)
        );
      }

      // Update password and clear reset token
      user.password = password;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      res.json(
        ApiResponse.success(null, 'Password has been reset successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req, res, next) {
    try {
      const { password: _, ...userResponse } = req.user.toJSON();

      res.json(
        ApiResponse.success(userResponse, 'User retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name } = req.body;
      const user = req.user;

      // Update user
      await user.update({ name: name.trim() });

      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();

      res.json(
        ApiResponse.success(userResponse, 'Profile updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Verify current password
      const isValidPassword = await user.checkPassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json(
          ApiResponse.error('Current password is incorrect', 400)
        );
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json(
        ApiResponse.success(null, 'Password changed successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;