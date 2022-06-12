import { getCharacters } from "./rickmortyapi";
import { Character } from "./types";
import { Db, MongoClient } from "mongodb";
require('dotenv').config();

export const getAndSaveRickyMortyCharacters = async (): Promise<Db> => {
  const usr = process.env.DB_USER;
  const pwd = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  const mongouri: string = `mongodb+srv://${usr}:${pwd}@cluster0.tkkvx.mongodb.net/${dbName}?retryWrites=true&w=majority`;

  const collection: string = "Characters";

  const client = new MongoClient(mongouri);

  try {
    await client.connect();
    console.info("MongoDB connected");
    const docs = await client
      .db(dbName)
      .collection(collection)
      .countDocuments();
    if (docs > 0) {
      console.info("Characters are already in the DB");
      return client.db(dbName);
    }

    console.info("Empty DB. Populating...");

    let next: string = "https://rickandmortyapi.com/api/character";
    while (next) {
      const data: { next: string; characters: Character[] } =
        await getCharacters(next);
      const characters = data.characters.map((char) => {
        const { id, name, status, species, episode } = char;
        return {
          id,
          name,
          status,
          species,
          episode,
        };
      });
      await client.db(dbName).collection(collection).insertMany(characters);
      next = data.next;
      console.log(next);
    }

    return client.db(dbName);
  } catch (e) {
    throw e;
  }
};