const EventEmitter = require('events');
// raise default to avoid MaxListenersExceededWarning during dev (nodemon hot reloads)
EventEmitter.defaultMaxListeners = 20;

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { sequelize, testConnection } = require('./src/config/sequelize');
const routes = require('./src/routes');
const globalErrorHandler = require('./src/middleware/errorHandler');
const { generalRateLimit } = require('./src/middleware/rateLimiter');
const ApiResponse = require('./src/utils/ApiResponse');

const app = express();

// Trust proxy (important for rate limiting and getting real IP addresses)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const envOrigins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const allowedOrigins = envOrigins.split(',').map(s => s.trim()).filter(Boolean);
if (!allowedOrigins.includes('http://localhost:5173')) allowedOrigins.push('http://localhost:5173');
if (!allowedOrigins.includes('http://localhost:8080')) allowedOrigins.push('http://localhost:8080');

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (no origin) and whitelisted origins
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept','X-Requested-With']
}));

// ensure preflight requests are handled
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(generalRateLimit);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Expert BI API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      datasets: '/api/datasets'
    }
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  res.status(404).json(
    ApiResponse.notFound(`Route ${req.originalUrl} not found on this server`)
  );
});

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Starting Expert BI API Server...');
    
    // Test database connection
    await testConnection();
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synchronized successfully');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Expert BI API Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received');
      server.close(() => {
        console.log('💨 Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received');
      server.close(() => {
        console.log('💨 Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();