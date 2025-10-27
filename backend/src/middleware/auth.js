const JWTService = require('../utils/jwt');
const ApiResponse = require('../utils/ApiResponse');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('[auth] authorization header:', req.headers.authorization);
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json(ApiResponse.unauthorized('Access token is required'));
    }

    const decoded = JWTService.verifyAccessToken(token);
    if (!decoded || !decoded.id) {
      console.log('[auth] invalid decoded token:', decoded);
      return res.status(401).json(ApiResponse.unauthorized('Invalid or expired token'));
    }

    // Get user from database (exclude password fields)
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'password_hash'] }
    });

    // Treat any existing user as active (DB has no isActive column). Adjust if your schema differs.
    if (!user) {
      return res.status(401).json(ApiResponse.unauthorized('User not found or inactive'));
    }

    req.user = user;
    req.userId = user.id;
    console.log('[auth] authenticated userId:', req.userId);
    next();
  } catch (error) {
    console.log('[auth] verify error:', error && error.message);
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
        if (decoded && decoded.id) {
          const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'password_hash'] }
          });
          if (user) {
            req.user = user;
            req.userId = user.id;
          }
        }
      } catch (err) {
        // ignore token errors for optional auth
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

// Export the main middleware as the module default (for routes that expect a function)
// and also attach named exports for other usages.
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.optionalAuth = optionalAuth;
module.exports.requirePlan = requirePlan;