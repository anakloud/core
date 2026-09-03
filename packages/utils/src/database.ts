import mongoose from "mongoose";

type MongoClient = InstanceType<typeof mongoose.mongo.MongoClient>;

const globalMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
  mongoConnection?: Promise<MongoClient>;
};

function getMongoClient(): MongoClient {
  if (!(globalMongo.mongoClient instanceof mongoose.mongo.MongoClient)) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is required");
    globalMongo.mongoClient = new mongoose.mongo.MongoClient(uri, {
      maxPoolSize: 20,
      minPoolSize: 0,
      maxIdleTimeMS: 30_000,
    });
    globalMongo.mongoConnection = undefined;
  }
  return globalMongo.mongoClient;
}

export function getDatabase() {
  return getMongoClient().db();
}

export async function connectDatabase() {
  const client = getMongoClient();
  globalMongo.mongoConnection ??= client.connect();
  await globalMongo.mongoConnection;

  if (mongoose.connection.readyState === 0) {
    mongoose.connection.setClient(client);
  }

  return client.db();
}

export async function closeDatabase() {
  await mongoose.connection.close();
}
