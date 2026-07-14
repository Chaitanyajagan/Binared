const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    let dbUrl = process.env.MONGODB_URI;

    if (!dbUrl || dbUrl === 'memory') {
      console.log('No MONGODB_URI found or set to memory. Starting MongoDB Memory Server...');
      mongod = await MongoMemoryServer.create();
      dbUrl = mongod.getUri();
      console.log(`MongoDB Memory Server started at: ${dbUrl}`);
    }

    const conn = await mongoose.connect(dbUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error(`Database disconnection error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
