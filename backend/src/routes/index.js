const express = require('express');
const authRoutes = require('./auth');
const projectRoutes = require('./projects');
const datasetRoutes = require('./datasets');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/datasets', datasetRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Expert BI API',
    version: '1.0.0',
    documentation: 'https://api.expertbi.com/docs',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      datasets: '/api/datasets',
      health: '/api/health'
    }
  });
});

module.exports = router;