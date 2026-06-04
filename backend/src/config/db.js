import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kotoba_translate';
  try {
    // Attempt Mongoose connection with a 4-second timeout to avoid long waits
    console.log('Attempting connection to MongoDB at:', mongoUri);
    
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useLocalDB = false;
  } catch (error) {
    // Check if the connection failed due to DNS lookup issues (common on Windows DNS setups defaulting to localhost)
    const isDnsError = 
      error.code === 'ENOTFOUND' || 
      error.code === 'ECONNREFUSED' || 
      error.message.includes('querySrv') || 
      error.message.includes('ENOTFOUND') || 
      error.message.includes('ECONNREFUSED');

    if (isDnsError) {
      console.warn(`\n⚠️  DNS resolution failed for MongoDB connection. Attempting auto-fix with public DNS servers (8.8.8.8, 1.1.1.1)...`);
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 4000
        });
        console.log(`MongoDB Connected (after DNS adjustment): ${conn.connection.host}`);
        global.useLocalDB = false;
        return;
      } catch (retryError) {
        console.error(`❌ Retry connection with public DNS also failed: ${retryError.message}`);
      }
    }

    console.warn(`\n⚠️  WARNING: Could not connect to MongoDB: ${error.message}`);
    console.warn('⚙️  Switching to LOCAL FILE DATABASE fallback (stored in backend/data/)...');
    console.warn('💡 App is fully functional and can be tested without a local MongoDB running!\n');
    global.useLocalDB = true;
  }
};

export default connectDB;
