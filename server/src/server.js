const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./utils/logger');
const app = require('./app');

// Database connection
const connectDB = async () => {
  try {
    const dbUri = process.env.NODE_ENV === 'test' 
      ? process.env.MONGO_URI_TEST 
      : process.env.MONGO_URI;
    
    await mongoose.connect(dbUri);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  });
}

// For testing purposes, export the app
module.exports = { app, connectDB };
