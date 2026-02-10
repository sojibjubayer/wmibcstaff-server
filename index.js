// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Configuration
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let usersCollection;

// Connect to MongoDB once when the serverless function initializes
async function connectDB() {
  if (!usersCollection) {
    try {
      await client.connect();
      const database = client.db("wmibcstaff");
      usersCollection = database.collection("staffs");
      console.log("Connected to MongoDB!");
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  }
}

// =========================
// LOGIN (NO BCRYPT)
// =========================
app.post("/api/login", async (req, res) => {
  await connectDB(); // ensure DB is connected

  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  try {
    // Case-insensitive search for username
    const user = await usersCollection.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (!user) {
      return res.status(400).json({ message: "Staff not found" });
    }

    // Direct password comparison
    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create JWT token
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
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET ALL USERS
// =========================
app.get("/api/users", async (req, res) => {
  await connectDB(); // ensure DB is connected

  try {
    const users = await usersCollection.find().toArray();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// Vercel Serverless Export
// =========================
module.exports = app;
