// Establishes the Mongoose connection to MongoDB.
// Called once at server startup from index.js.

import dns from 'dns';
import mongoose from 'mongoose';

// Node.js on this machine inherits 127.0.0.1 as its DNS resolver, which has
// nothing listening on port 53.  Explicitly point to Google Public DNS so that
// the mongodb+srv:// SRV lookup can resolve Atlas cluster hostnames.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

