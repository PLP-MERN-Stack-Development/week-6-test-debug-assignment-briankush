const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const postRoutes = require('./routes/postRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware - skip in test environment
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is healthy' });
});

// API Routes
app.use('/api/posts', postRoutes);

// Global error handler
app.use(errorHandler);

module.exports = app;
