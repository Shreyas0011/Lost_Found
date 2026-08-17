const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('💡 Make sure MongoDB is running. For local: mongod --dbpath=./data');
    // Don't exit — let the server run so the client is still served
  }
};

module.exports = connectDB;
