const { RateLimiterMemory } = require('rate-limiter-flexible');
const ApiResponse = require('../utils/ApiResponse');

// General rate limiter
const generalLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Number of requests
  duration: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60, // Per 15 minutes by default
});

// Strict rate limiter for auth endpoints
const authLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 5, // 5 attempts
  duration: 15 * 60, // Per 15 minutes
});

// File upload rate limiter
const uploadLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
  points: 10, // 10 uploads
  duration: 60 * 60, // Per hour
});

const createRateLimitMiddleware = (limiter, message = 'Too many requests') => {
  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch (rateLimiterRes) {
      const remainingPoints = rateLimiterRes.remainingPoints;
      const msBeforeNext = rateLimiterRes.msBeforeNext;
      const secsBeforeNext = Math.round(msBeforeNext / 1000) || 1;

      res.set('Retry-After', String(Math.round(msBeforeNext / 1000) || 1));
      res.set('X-RateLimit-Limit', limiter.points);
      res.set('X-RateLimit-Remaining', remainingPoints);
      res.set('X-RateLimit-Reset', new Date(Date.now() + msBeforeNext).toISOString());

      return res.status(429).json(
        ApiResponse.error(
          `${message}. Try again in ${secsBeforeNext} seconds.`,
          429
        )
      );
    }
  };
};

module.exports = {
  generalRateLimit: createRateLimitMiddleware(generalLimiter, 'Too many requests'),
  authRateLimit: createRateLimitMiddleware(authLimiter, 'Too many authentication attempts'),
  uploadRateLimit: createRateLimitMiddleware(uploadLimiter, 'Too many file uploads')
};