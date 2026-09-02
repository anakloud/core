import mongoose from "mongoose";

type MongoClient = InstanceType<typeof mongoose.mongo.MongoClient>;

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is required");

const globalMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
  mongoConnection?: Promise<MongoClient>;
};

if (!(globalMongo.mongoClient instanceof mongoose.mongo.MongoClient)) {
  globalMongo.mongoClient = new mongoose.mongo.MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 0,
    maxIdleTimeMS: 30_000,
  });
  globalMongo.mongoConnection = undefined;
}

export const mongoClient = globalMongo.mongoClient as MongoClient;
export const database = mongoClient.db();

export async function connectDatabase() {
  globalMongo.mongoConnection ??= mongoClient.connect();
  await globalMongo.mongoConnection;

  if (mongoose.connection.readyState === 0) {
    mongoose.connection.setClient(mongoClient);
  }

  return database;
}

export async function closeDatabase() {
  await mongoose.connection.close();
}
