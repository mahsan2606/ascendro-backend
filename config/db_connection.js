import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed", error);
    process.exit(1);
  }
};


const dbQueryAttributes = (query, params = []) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(query, params, (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results);
    });
  });
};

export { dbConnection, dbQueryAttributes };
