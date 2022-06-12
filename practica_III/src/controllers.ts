import e, { Request, Response } from "express";
import { Db } from "mongodb";
import { v4 as uuid } from "uuid";

const checkValidityDate = (day: string, month: string, year: string): boolean => {
  const date = new Date(`${month} ${day}, ${year}`);
  return date.toDateString() !== "Invalid Date"
}

export const status = async (req: Request, res: Response) => {
  const date = new Date();
  const day = date.getDay();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  res.status(200).send(`${day}-${month}-${year}`);
}

export const register = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("users");

  const { email, password } = req.body as {
    email: string
    password: string
  }

  if (!email || !password) {
    return res.status(500).send("Missing email or password");
  }

  const isRegistered = await collection.findOne({ email });

  if (isRegistered) {
    return res.status(409).send("Already registered")
  }

  await collection.insertOne({ email, password });

  return res.status(200).send("User successfully registered");
}

export const login = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("users");

  const { email, password } = req.body as {
    email: string,
    password: string
  }

  if (!email || !password) {
    return res.status(500).send("Missing email or password");
  }

  const user = await collection.find({ email, password })

  if (user) {
    const token = uuid();
    await collection.updateOne({ email }, { $set: { token } });
    return res.status(200).send(token);
  }

  return res.status(401).send("Wrong email or password");
}

export const logout = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection = db.collection("users");

  const active = await collection.findOne({ token: req.headers.token });

  if (active) {
    await collection.updateOne({ token: req.headers.token }, { $set: { token: undefined } });
    return res.status(200).send("Successfully logged out");
  }

  return res.status(500).send("Error logging out");
}

export const freeseats = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection_users = db.collection("users");
  const collection_seats = db.collection("seats");

  const active = await collection_users.findOne({ token: req.headers.token });

  if (!active) {
    return res.status(500).send("Must be logged in");
  }

  if (Object.keys(req.query).length === 0) {
    return res.status(500).send("No params")
  }

  const { day, month, year } = req.query as {
    day: string,
    month: string,
    year: string
  }

  if (!day || !month || !year) {
    return res.status(500).send("Missing day, month or year");
  }

  if (!checkValidityDate(day, month, year)) {
    return res.status(500).send("Invalid Date");
  }

  const date = new Date(`${month} ${day}, ${year}`);
  const today = new Date();

  if (date < today) {
    return res.status(500).send("Date must be from today on")
  }

  const seats = (await collection_seats.find({ day, month, year }).toArray()).map((e) => { return parseInt(e.num) });

  let freeseats: number[] = [];

  for (let i = 1; i <= 20; i++) {
    freeseats.push(i);
  }

  seats.forEach(elem => {
    freeseats = freeseats.filter(num => {
      return num != elem;
    });
  });

  return res.status(200).json(freeseats);
}

export const book = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection_seats = db.collection("seats");
  const collection_users = db.collection("users");

  const active = await collection_users.findOne({ token: req.headers.token });

  if (!active) {
    return res.status(500).send("Must be logged in");
  }

  if (Object.keys(req.query).length === 0) {
    return res.status(500).send("No params")
  }

  const { day, month, year, num } = req.query as {
    day: string,
    month: string,
    year: string,
    num: string
  }

  if (!day || !month || !year || !num) {
    return res.status(500).send("Missing day, month, year or seat number");
  }

  if (!checkValidityDate(day, month, year)) {
    return res.status(500).send("Invalid Date");
  }

  const date = new Date(`${month} ${day}, ${year}`);
  const today = new Date();

  if (date < today) {
    return res.status(500).send("Date must be from today on");
  }

  const isUsed = await collection_seats.findOne({ day, month, year, num });

  if (!isUsed) {
    if (parseInt(num) <= 20) {
      await collection_seats.insertOne({ day, month, year, num, email: active.email });
      return res.status(200).send({ seat_number: num, date: `${day}-${month}-${year}` });
    } else {
      return res.status(500).send("There are only 20 seats");
    }
  }

  return res.status(404).send("Seat is not free");
}

export const free = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection_seats = db.collection("seats");
  const collection_users = db.collection("users");

  const active = await collection_users.findOne({ token: req.headers.token });

  if (!active) {
    return res.status(500).send("Must be logged in");
  }

  if (Object.keys(req.query).length === 0) {
    return res.status(500).send("No params")
  }

  const { day, month, year } = req.query as {
    day: string,
    month: string,
    year: string
  }

  if (!day || !month || !year) {
    return res.status(500).send("Missing day, month, year or seat number");
  }

  const booked = await collection_seats.find({ day, month, year, email: active.email });

  if (booked) {
    await collection_seats.deleteMany({ day, month, year, email: active.email });
    return res.status(200).send("Seat/s is now free");
  }

  return res.status(404).send("No seat/s to free");
}

export const mybookings = async (req: Request, res: Response) => {
  const db: Db = req.app.get("db");
  const collection_seats = db.collection("seats");
  const collection_users = db.collection("users");

  const active = await collection_users.findOne({ token: req.headers.token });

  if (!active) {
    return res.status(500).send("Must be logged in");
  }

  const today = new Date();

  let myseats = await collection_seats.find({ email: active.email }).toArray();

  myseats = myseats.filter(e => {
    const date = new Date(`${e.month} ${e.day}, ${e.year}`);
    return today < date;
  })

  if (myseats.length == 0) {
    return res.status(404).send("No future bookings")
  }

  return res.status(200).send(myseats);
}