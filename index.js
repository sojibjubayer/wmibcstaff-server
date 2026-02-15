const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Use a global variable to cache the connection
let cachedDb = null;

async function getDatabase() {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  cachedDb = client.db("wmibcstaff");
  return cachedDb;
}

// ==========================
// LOGIN ROUTE (Your Existing)
// ==========================
app.post("/api/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    const db = await getDatabase();
    const usersCollection = db.collection("staffs");

    const user = await usersCollection.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (!user)
      return res.status(400).json({ message: "Staff not found" });

    if (user.password !== password)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Database connection error", error: err.message });
  }
});

// ==========================
// CLIENT FORM ROUTES (NEW)
// ==========================

// Create Client
app.post("/api/clients", async (req, res) => {
  try {
    const db = await getDatabase();
    const clientsCollection = db.collection("clients");

    const clientData = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await clientsCollection.insertOne(clientData);

    res.status(201).json({
      message: "Client saved successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save client" });
  }
});

// Get All Clients
app.get("/api/clients", async (req, res) => {
  try {
    const db = await getDatabase();
    const clientsCollection = db.collection("clients");

    const clients = await clientsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// Get Single Client by ID
app.get("/api/clients/:id", async (req, res) => {
  try {
    const db = await getDatabase();
    const clientsCollection = db.collection("clients");

    const client = await clientsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!client)
      return res.status(404).json({ message: "Client not found" });

    res.status(200).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching client" });
  }
});

// ==========================
// ROOT ROUTE
// ==========================
app.get("/", (req, res) => res.send("Server is running!"));

module.exports = app;
