import { MongoClient, Db } from "mongodb";

// Patch Bun's missing node:v8 getBuiltinModule / isBuildingSnapshot compatibility for bson/mongodb
if (typeof globalThis !== "undefined" && (globalThis as any).process) {
  const originalGetBuiltinModule = (globalThis as any).process.getBuiltinModule;
  (globalThis as any).process.getBuiltinModule = function (name: string) {
    if (name === "v8") {
      return {
        startupSnapshot: {
          isBuildingSnapshot: () => false,
        },
      };
    }
    return originalGetBuiltinModule ? originalGetBuiltinModule.call(this, name) : undefined;
  };
}

const uri = process.env["MONGO_URI"];
if (!uri) {
  throw new Error("MONGO_URI is missing from environment variables");
}

export const client = new MongoClient(uri);
export const db = client.db();

export type DB = Db;

console.log("Connected to MongoDB successfully!");
