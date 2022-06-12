import { Request, Response } from "express";
import { Db } from "mongodb";

export const characters = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const db: Db = req.app.get("db");
  debugger;
  const chars = await db
    .collection("Characters")
    .find()
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .toArray();
  res.status(200).json(chars);
};

export const character = async (req: Request, res: Response) => {
  const id = req.params.id;
  const db: Db = req.app.get("db");
  const collection = db.collection("Characters");

  const char = await collection.findOne({ id: parseInt(id) });

  if (char) {
    res.status(200).json(char);
  } else {
    res.status(404).send("Not found");
  }
};

export const switchstatus = async (req: Request, res: Response) => {
  const id = req.params.id;
  const db: Db = req.app.get("db");
  const collection = db.collection("Characters");

  const char = await collection.findOne({ id: parseInt(id) });

  if (char) {
    if (char.status === "Alive") {
      await collection.updateOne({ id: parseInt(id) }, { $set: { status: "Dead" } });
      const ch = await collection.findOne({ id: parseInt(id) });
      return res.status(200).json(ch);
    } else {
      await collection.updateOne({ id: parseInt(id) }, { $set: { status: "Alive" } });
      const ch = await collection.findOne({ id: parseInt(id) });
      return res.status(200).json(ch);
    }
  }
  return res.status(404).send("Not found");
}

export const del = async (req: Request, res: Response) => {
  const id = req.params.id;
  const db: Db = req.app.get("db");
  const collection = db.collection("Characters");

  const ch = await collection.findOne({ id: parseInt(id) });

  if (ch) {
    await collection.deleteOne({ id: parseInt(id) });
    return res.status(200).send("OK");
  }

  return res.status(404).send("Not found");
}