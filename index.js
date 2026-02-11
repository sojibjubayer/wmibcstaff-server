const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json()); // Use express.json() instead of body-parser (it's built-in now)

// Use a global variable to cache the connection
let cachedDb = null;

async function getDatabase() {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });

  await client.connect();
  cachedDb = client.db("wmibcstaff");
  return cachedDb;
}

// API routes
app.post("/api/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    
    // 1. Get DB connection inside the route
    const db = await getDatabase();
    const usersCollection = db.collection("staffs");

    // 2. Logic
    const user = await usersCollection.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (!user) return res.status(400).json({ message: "Staff not found" });
    if (user.password !== password) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ userId: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ 
        message: "Login successful", 
        token, 
        user: { id: user._id, name: user.name } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database connection error", error: err.message });
  }
});

// Root route
app.get("/", (req, res) => res.send("Server is running!"));

module.exports = app;