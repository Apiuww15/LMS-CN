import { MongoClient, ServerApiVersion, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
  mongoClientPromise?: Promise<MongoClient>;
  mongoUri?: string;
};

function getUri(): string {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      "MONGODB_URI belum ditemukan. Pastikan .env.local berada di folder project."
    );
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error(
      'MONGODB_URI harus diawali "mongodb://" atau "mongodb+srv://".'
    );
  }

  return uri;
}

function createClient(uri: string): MongoClient {
  return new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 20000,
    retryReads: true,
    retryWrites: true,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });
}

function getClientPromise(): Promise<MongoClient> {
  const uri = getUri();

  if (
    !globalForMongo.mongoClientPromise ||
    globalForMongo.mongoUri !== uri
  ) {
    globalForMongo.mongoUri = uri;

    const client = createClient(uri);
    globalForMongo.mongoClient = client;

    globalForMongo.mongoClientPromise = client.connect().catch((error) => {
      globalForMongo.mongoClientPromise = undefined;
      globalForMongo.mongoClient = undefined;
      globalForMongo.mongoUri = undefined;
      throw error;
    });
  }

  return globalForMongo.mongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return getClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || "educn_lms";
  return client.db(dbName);
}

export async function pingMongoDB(): Promise<string> {
  const client = await getClientPromise();
  await client.db(process.env.MONGODB_DB_NAME?.trim() || "educn_lms").command({ ping: 1 });
  return process.env.MONGODB_DB_NAME?.trim() || "educn_lms";
}
