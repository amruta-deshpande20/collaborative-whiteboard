const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

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

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });

  socket.on("undo", () => {
    socket.broadcast.emit("undo");
  });

  socket.on("redo", () => {
    socket.broadcast.emit("redo");
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
