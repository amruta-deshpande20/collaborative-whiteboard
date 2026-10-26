const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const client = new MongoClient(process.env.MONGODB_URI);

let boardsCollection;

app.post("/api/boards", async (req, res) => {
  try {
    const { name, canvasData } = req.body;

    const result = await boardsCollection.insertOne({
      name,
      canvasData,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Board saved successfully!",
      boardId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving board:", error);
    res.status(500).json({ message: "Failed to save board." });
  }
});

app.get("/api/boards", async (req, res) => {
  try {
    const boards = await boardsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ message: "Failed to fetch boards." });
  }
});

async function startServer() {
  try {
    await client.connect();

    const database = client.db("gatherboard");
    boardsCollection = database.collection("boards");

    console.log("Connected to MongoDB Atlas!");

    server.listen(3001, () => {
      console.log("Server running on http://localhost:3001");
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

app.get("/", (req, res) => {
  res.send("Gatherboard server is running!");
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("drawing-start", (data) => {
    socket.broadcast.emit("drawing-start", data);
  });

  socket.on("drawing", (data) => {
    socket.broadcast.emit("drawing", data);
  });

  socket.on("undo", () => {
    socket.broadcast.emit("undo");
  });

  socket.on("redo", () => {
    socket.broadcast.emit("redo");
  });

  socket.on("canvas-update", (imageData) => {
    socket.broadcast.emit("canvas-update", imageData);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

startServer();
