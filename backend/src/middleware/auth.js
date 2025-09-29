const JWTService = require('../utils/jwt');
const ApiResponse = require('../utils/ApiResponse');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json(ApiResponse.unauthorized('Access token is required'));
    }

    const decoded = JWTService.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json(ApiResponse.unauthorized('User not found or inactive'));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(ApiResponse.unauthorized('Invalid or expired token'));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      try {
        const decoded = JWTService.verifyAccessToken(token);
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors in optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(ApiResponse.unauthorized('Authentication required'));
    }

    if (requiredPlan === 'premium' && req.user.plan !== 'premium') {
      return res.status(403).json(ApiResponse.forbidden('Premium plan required for this feature'));
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requirePlan
};