import { Db, MongoClient } from "mongodb";
require('dotenv').config();

export const connectDB = async (): Promise<Db> => {
  const usr = process.env.DB_USER;
  const pwd = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  const mongouri: string = `mongodb+srv://${usr}:${pwd}@cluster0.tkkvx.mongodb.net/${dbName}?retryWrites=true&w=majority`;

  const client = new MongoClient(mongouri);

  try {
    await client.connect();
    console.info("Mongo connected");

    return client.db(dbName);
  } catch (e) {
    throw (e);
  }
}