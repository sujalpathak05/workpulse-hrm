const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Agar MONGODB_URI nahi diya to in-memory MongoDB use karo (dev only)
    if (!uri) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { port: 27099 },
        binary: { downloadDir: require('path').join(require('os').homedir(), '.cache/mongodb-binaries') },
      });
      uri = mongod.getUri();
      console.log('⚠️  No MONGODB_URI found — using in-memory MongoDB (data resets on restart)');
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
