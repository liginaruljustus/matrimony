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
  cached.conn = await cached.promise;
  return cached.conn;
}
