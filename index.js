const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@fs.tvevqb6.mongodb.net/?appName=FS`;

const client = new MongoClient(uri);

async function run() {
  await client.connect();

  const db = client.db("finEaseDB");
  const transactionsCollection = db.collection("transactions");

  app.get("/transactions", async (req, res) => {
    const result = await transactionsCollection.find().toArray();
    res.send(result);
  });

  app.get("/summary", async (req, res) => {
    const transactions = await transactionsCollection.find().toArray();

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    res.send({
      income,
      expenses,
      balance: income - expenses,
    });
  });

  app.post("/transactions", async (req, res) => {
    const result = await transactionsCollection.insertOne(req.body);
    res.send(result);
  });

  app.delete("/transactions/:id", async (req, res) => {
    const result = await transactionsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  });

  app.put("/transactions/update/:id", async (req, res) => {
    const result = await transactionsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
    );
    res.send(result);
  });
}

run();

module.exports = app;
