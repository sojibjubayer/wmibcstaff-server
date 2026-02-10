/////////////////////////
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = 5000;

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

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("wmibcstaff");
    const usersCollection = database.collection("staffs");

    // =========================
    // LOGIN (NO BCRYPT)
    // =========================
    app.post("/api/login", async (req, res) => {
      const { name, password } = req.body;

      if (!name || !password) {
        return res.status(400).json({
          message: "Username and password are required",
        });
      }

      try {
        // const user = await usersCollection.findOne({ name });
          // Case-insensitive search for username
    const user = await usersCollection.findOne({
      name: { $regex: `^${name}$`, $options: "i" } // "i" makes it case-insensitive
    });

        if (!user) {
          return res.status(400).json({
            message: "Staff not found",
          });
        }

        // Direct password comparison
        if (user.password !== password) {
          return res.status(400).json({
            message: "Invalid password",
          });
        }

        // Create JWT token
        const token = jwt.sign(
          {
            userId: user._id,
            name: user.name,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(200).json({
          message: "Login successful",
          token,
          user: {
            id: user._id,
            name: user.name,
          },
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // =========================
    // GET ALL USERS
    // =========================
    app.get("/api/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
