import express from "express";
import { Db } from "mongodb"
import { connectDB } from "./mongo"
import { book, free, freeseats, login, logout, mybookings, register, status } from "./controllers";

const run = async () => {
  const db: Db = await connectDB();
  const app = express();
  app.set("db", db);

  const bodyParser = require('express');

  app.use((req, res, next) => {
    next();
  })

  app.use(bodyParser.urlencoded({ extended: true }))

  app.get("/status", status);
  app.post("/register", register);
  app.post("/login", login);
  app.post("/logout", logout);
  app.get("/freeseats", freeseats);
  app.post("/book", book);
  app.post("/free", free);
  app.get("/mybookings", mybookings);

  await app.listen(process.env.PORT);
}

try {
  run();
} catch (e) {
  console.error(e)
}