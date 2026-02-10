const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB setup
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});
const database = client.db("wmibcstaff");
const usersCollection = database.collection("staffs");

// Root route
app.get("/", (req, res) => res.send("Server is running!"));

// API routes
app.post("/api/login", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ message: "Username and password are required" });

  const user = await usersCollection.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  if (!user) return res.status(400).json({ message: "Staff not found" });
  if (user.password !== password) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign({ userId: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.status(200).json({ message: "Login successful", token, user: { id: user._id, name: user.name } });
});

app.get("/api/users", async (req, res) => {
  const users = await usersCollection.find().toArray();
  res.status(200).json(users);
});

module.exports = app;
