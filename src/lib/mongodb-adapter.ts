import { MongoClient } from 'mongodb';

const options = {};
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const mongoUriFromEnv = process.env.MONGODB_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (isBuildPhase) {
  // During Next.js build, avoid opening DB connections. Use a non-connecting client instance.
  client = new MongoClient(mongoUriFromEnv || 'mongodb://localhost:27017', options);
  clientPromise = Promise.resolve(client);
} else if (process.env.NODE_ENV === 'development') {
  // In development, cache the client promise across HMR reloads.
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient((mongoUriFromEnv as string) || 'mongodb://localhost:27017', options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production runtime, create a fresh client and connect.
  client = new MongoClient(mongoUriFromEnv as string, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

