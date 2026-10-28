const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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
let usersCollection;

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await usersCollection.insertOne({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const user = {
      _id: result.insertedId,
      name: name.trim(),
      email: normalizedEmail,
    };

    return res.status(201).json({
      message: "Account created successfully!",
      token: generateToken(user),
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed.",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await usersCollection.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.json({
      message: "Login successful!",
      token: generateToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }
}

app.post("/api/boards", authenticateToken, async (req, res) => {
  try {
    const { name, canvasData } = req.body;

    const result = await boardsCollection.insertOne({
      name,
      canvasData,
      ownerId: req.user.userId,
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

app.post("/api/boards/:boardId/invite", authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: "Invalid board ID." });
    }

    const board = await boardsCollection.findOne({
      _id: new ObjectId(boardId),
      ownerId: req.user.userId,
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found or you are not its owner.",
      });
    }

    // Reuse an existing invitation, or create a new one
    const token = board.inviteToken || crypto.randomBytes(16).toString("hex");

    await boardsCollection.updateOne(
      { _id: board._id, ownerId: req.user.userId },
      { $set: { inviteToken: token } },
    );

    res.json({
      message: "Invitation created successfully!",
      shareCode: token,
      shareLink: `${process.env.CLIENT_URL || "http://localhost:5173"}/join/${token}`,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ message: "Failed to create invitation." });
  }
});

app.post("/api/boards/join/:token", authenticateToken, async (req, res) => {
  try {
    const { token } = req.params;

    const board = await boardsCollection.findOne({
      inviteToken: token,
    });

    if (!board) {
      return res.status(404).json({
        message: "Invalid or expired invitation.",
      });
    }

    const userId = req.user.userId;

    // The owner already has access
    if (board.ownerId === userId) {
      return res.json({
        message: "You already own this board.",
        boardId: board._id,
      });
    }

    // Add this user to the board's shared users
    await boardsCollection.updateOne(
      { _id: board._id },
      { $addToSet: { sharedWith: userId } },
    );

    res.json({
      message: "You joined the board successfully!",
      boardId: board._id,
    });
  } catch (error) {
    console.error("Error joining shared board:", error);
    res.status(500).json({
      message: "Failed to join the board.",
    });
  }
});

app.get("/api/boards", authenticateToken, async (req, res) => {
  try {
    const boards = await boardsCollection
      .find({
        $or: [{ ownerId: req.user.userId }, { sharedWith: req.user.userId }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ message: "Failed to fetch boards." });
  }
});

app.get("/api/boards/:boardId", authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!ObjectId.isValid(boardId)) {
      return res.status(400).json({ message: "Invalid board ID." });
    }

    const board = await boardsCollection.findOne({
      _id: new ObjectId(boardId),
      $or: [{ ownerId: req.user.userId }, { sharedWith: req.user.userId }],
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found or you don't have access.",
      });
    }

    res.json(board);
  } catch (error) {
    console.error("Error opening board:", error);
    res.status(500).json({ message: "Failed to open board." });
  }
});

async function startServer() {
  try {
    await client.connect();

    const database = client.db("gatherboard");
    boardsCollection = database.collection("boards");
    usersCollection = database.collection("users");

    await usersCollection.createIndex({ email: 1 }, { unique: true });

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

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("join-board", async (boardId) => {
    if (!boardId) return;

    try {
      // Check whether the user has access to this board
      const board = await boardsCollection.findOne({
        _id: new ObjectId(boardId),
        $or: [
          { ownerId: socket.data.userId },
          { sharedWith: socket.data.userId },
        ],
      });

      if (!board) {
        socket.emit("board-join-error", "You don't have access to this board.");
        return;
      }

      // Leave the previously joined board room
      for (const room of socket.rooms) {
        if (room.startsWith("board:")) {
          socket.leave(room);
        }
      }

      // Join only the authorized board
      socket.join(`board:${boardId}`);

      console.log("JOINED BOARD:", boardId);
    } catch (error) {
      console.error("Error joining board:", error.message);
      socket.emit("board-join-error", "Unable to open this board.");
    }
  });

  socket.on("drawing-start", (data) => {
    if (!data.boardId) return;

    socket.to(`board:${data.boardId}`).emit("drawing-start", data);
  });

  socket.on("drawing", (data) => {
    console.log("DRAWING EVENT:", data.boardId);

    if (!data.boardId) return;

    socket.to(`board:${data.boardId}`).emit("drawing", data);
  });

  socket.on("undo", (data) => {
    if (!data?.boardId) return;

    socket.to(`board:${data.boardId}`).emit("undo", data);
  });

  socket.on("redo", (data) => {
    if (!data?.boardId) return;

    socket.to(`board:${data.boardId}`).emit("redo", data);
  });

  socket.on("canvas-update", (data) => {
    console.log("server got canvas-update for", data?.boardId);
    if (!data?.boardId) return;

    socket.to(`board:${data.boardId}`).emit("canvas-update", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });

  socket.on("leave-board", () => {
    for (const room of socket.rooms) {
      if (room.startsWith("board:")) {
        socket.leave(room);
      }
    }
  });
});

startServer();
