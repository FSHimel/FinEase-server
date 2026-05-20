const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@fs.tvevqb6.mongodb.net/?appName=FS`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const finEaseDB = client.db("finEaseDB");
    const transactionsCollection = finEaseDB.collection("transactions");

    //Get all the data

    app.get("/transactions", async (req, res) => {
      const cursor = transactionsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get one data using id

    app.get("/transactions/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await transactionsCollection.findOne(query);
      res.send(result);
    });

    // Get Income, Expense and balance

    app.get("/summary", async (req, res) => {
      const transactions = await transactionsCollection.find().toArray();

      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const balance = income - expenses;

      res.send({
        balance,
        income,
        expenses,
      });
    });

    //Post method

    app.post("/transactions", async (req, res) => {
      const newTransaction = req.body;
      console.log(newTransaction);
      const result = await transactionsCollection.insertOne(newTransaction);
      res.send(result);
    });

    //Delet method

    app.delete("/transactions/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await transactionsCollection.deleteOne(query);
      res.send(result);
    });

    //Update method

    //   {
    //     "type": "expense",
    //     "category": "home",
    //     "amount": 1200,
    //     "description": "house rent",
    //     "date": "2025-01-15T00:00:00.000Z",
    //     "email": "hero1@gmail.com",
    //     "name": "Hero"
    //   }

    app.put("/transactions/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedTransaction = req.body;
      const update = {
        $set: updatedTransaction,
      };

      const result = await transactionsCollection.updateOne(query, update);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!",
    // );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("FinEase server is running now");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
