const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// env
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

// mongo uri
const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@fs.tvevqb6.mongodb.net/?retryWrites=true&w=majority&appName=FS`;

// client
let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  cachedClient = client;

  return client;
}

/* ---------------- ROUTES ---------------- */

// GET all transactions (with optional email filter)
app.get("/transactions", async (req, res) => {
  try {
    const email = req.query.email;

    const client = await getClient();
    const collection = client.db("finEaseDB").collection("transactions");

    let query = {};
    if (email) {
      query.email = email;
    }

    const result = await collection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch transactions" });
  }
});

// GET single transaction
app.get("/transactions/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const client = await getClient();
    const collection = client.db("finEaseDB").collection("transactions");

    const result = await collection.findOne({ _id: new ObjectId(id) });

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch transaction" });
  }
});

// SUMMARY (income, expense, balance)
app.get("/summary", async (req, res) => {
  try {
    const client = await getClient();
    const collection = client.db("finEaseDB").collection("transactions");

    const transactions = await collection.find().toArray();

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expenses;

    res.send({ income, expenses, balance });
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch summary" });
  }
});

// CREATE transaction
app.post("/transactions", async (req, res) => {
  try {
    const newTransaction = req.body;

    const client = await getClient();
    const collection = client.db("finEaseDB").collection("transactions");

    const result = await collection.insertOne(newTransaction);

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to create transaction" });
  }
});

// UPDATE transaction
app.put("/transactions/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    const client = await getClient();
    const collection = client.db("finEaseDB").collection("transactions");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          type: updatedData.type,
          description: updatedData.description,
          category: updatedData.category,
          amount: Number(updatedData.amount),
          date: updatedData.date,
        },
      },
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to update transaction" });
  }
});

// DELETE transaction
app.delete("/transactions/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const client = await getClient();
    const collection = client.db("finEaseDB").collection("transactions");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to delete transaction" });
  }
});

// test route
app.get("/test", (req, res) => {
  res.send("server working");
});

// root
app.get("/", (req, res) => {
  res.send("FinEase server running on Vercel 🚀");
});

// ❌ IMPORTANT: NO app.listen for Vercel
module.exports = app;
