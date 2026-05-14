const app = require('../erp-backend/src/app');
const connectDB = require('../erp-backend/src/config/database');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('Database connection failed in serverless function:', err);
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  }
  
  return app(req, res);
};
