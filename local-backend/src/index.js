const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./auth/routes');
const databaseRoutes = require('./database/routes');
const storageRoutes = require('./storage/routes');
const functionsRoutes = require('./functions/routes');
const { initializeDatabase } = require('./database/client');
const { initializeStorage } = require('./storage/client');
const migrator = require('./database/migrator');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing with increased limits for large photo uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Health check endpoint with migration status
app.get('/health', async (req, res) => {
  try {
    const migrationStatus = await migrator.getMigrationStatus();
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'portfolio-local-backend',
      migrations: migrationStatus
    });
  } catch (error) {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'portfolio-local-backend',
      migrations: { error: 'Migration status unavailable' }
    });
  }
});

// Test database connection without auth
app.get('/test-db', async (req, res) => {
  try {
    const { query } = require('./database/client');
    const result = await query('SELECT NOW() as current_time');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// API routes with logging
console.log('Mounting API routes...');
app.use('/auth', (req, res, next) => {
  console.log(`Auth route: ${req.method} ${req.path}`);
  next();
}, authRoutes);

app.use('/database', (req, res, next) => {
  console.log(`Database route: ${req.method} ${req.path}`);
  next();
}, databaseRoutes);

app.use('/storage', (req, res, next) => {
  console.log(`Storage route: ${req.method} ${req.path}`);
  next();
}, storageRoutes);

app.use('/functions', (req, res, next) => {
  console.log(`Functions route: ${req.method} ${req.path}`);
  next();
}, functionsRoutes);

console.log('API routes mounted successfully');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(isDevelopment && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      path: req.originalUrl
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Running database migrations...');
    const migrationResult = await migrator.runMigrations();
    if (!migrationResult.success) {
      console.error('❌ Critical: Database migrations failed!');
      console.error('The server will start but some features may not work correctly.');
    }
    
    console.log('Initializing storage...');
    // Don't await - let storage init fail gracefully
    initializeStorage().catch(err => {
      console.log('Storage initialization handled gracefully');
    });
    
    app.listen(PORT, () => {
      console.log(`Portfolio Local Backend running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Migration status: ${migrationResult.applied}/${migrationResult.total} applied`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();