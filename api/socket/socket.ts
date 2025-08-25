import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "https://pern-chat.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://pern-chat.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

const userSocketMap: { [key: string]: string } = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId as string;

  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // socket.on() is used to listen to the events. can be used both on client and server side
  socket.on("disconnect", () => {
    // console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
