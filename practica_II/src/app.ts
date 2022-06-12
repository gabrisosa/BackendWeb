import { Db } from "mongodb";
import { getAndSaveRickyMortyCharacters } from "./populatedb";
import express from "express";
import { character, characters, del, switchstatus } from "./controllers";

const run = async () => {
  const db: Db = await getAndSaveRickyMortyCharacters();
  const app = express();
  app.set("db", db);

  app.use((req, res, next) => {
    next();
  });

  app.get("/status", async (req, res) => {
    res.status(200).send("Todo OK");
  });

  app.get("/characters", characters);
  app.get("/character/:id", character);
  app.put("/switchstatus/:id", switchstatus);
  app.delete("/character/:id", del)

  await app.listen(process.env.PORT);
};

try {
  run();
} catch (e) {
  console.error(e);
}