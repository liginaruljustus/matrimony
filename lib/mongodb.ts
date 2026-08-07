import mongoose from "mongoose";

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("DATABASE_URL is not defined");
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = global.mongooseConn || { conn: null, promise: null };
global.mongooseConn = cached;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  const mongoUri = MONGODB_URI as string;
  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      dbName: "matrimony",
      bufferCommands: false,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // A failed connection attempt must not poison the cache — otherwise every
    // later call on this warm serverless instance replays the same rejected
    // promise forever instead of retrying. Reset so the next call tries fresh.
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
