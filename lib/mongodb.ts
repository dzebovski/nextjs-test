import mongoose, { type Mongoose } from "mongoose";

/**
 * MongoDB connection URI.
 *
 * Expected to be provided via the `MONGODB_URI` environment variable.
 * Do not hard-code credentials in source control.
 */
if (!process.env.MONGODB_URI) {
  // Failing fast at module load time helps surface misconfiguration early
  // in both development and production environments.
  throw new Error(
    "Please define the MONGODB_URI environment variable in your environment.",
  );
}

// TypeScript now knows this is defined (non-null assertion)
const MONGODB_URI: string = process.env.MONGODB_URI;

/**
 * Shape of the cached Mongoose connection stored on the global object.
 *
 * Caching the connection is important in Next.js (especially in development),
 * because the App Router can re-run module code multiple times due to
 * hot reloading and route-level bundling. Without this cache, each reload
 * would create a new connection, quickly exhausting the MongoDB connection
 * limit.
 */
interface MongooseConnectionCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Augment the global scope to include our Mongoose cache. This avoids using
// `any` on `globalThis` and keeps the type information precise.
declare global {
  var __mongooseConnection: MongooseConnectionCache | undefined;
}

// Initialize the global cache if it does not yet exist. In a serverless or
// hot-reload scenario, this module can be evaluated multiple times, but the
// global value will be reused across evaluations.
const cached: MongooseConnectionCache = globalThis.__mongooseConnection ?? {
  conn: null,
  promise: null,
};

if (!globalThis.__mongooseConnection) {
  globalThis.__mongooseConnection = cached;
}

/**
 * Establish (or reuse) a Mongoose connection.
 *
 * This function should be used anywhere you need database access, for example,
 * inside route handlers or server actions. It guarantees that at most one
 * connection is created per server instance.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // If a connection already exists, reuse it.
  if (cached.conn) {
    return cached.conn;
  }

  // If there is no existing connection promise, create one and store it
  //  in the cache so that concurrent calls share the same in-flight promise.
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // If the connection fails, reset the promise so that future calls can
    // retry establishing a connection.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Optional helper type for consumers that want to annotate a variable
 * with the concrete Mongoose connection type.
 */
export type DatabaseConnection = Mongoose;
