import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
import { createAdapter } from "@socket.io/postgres-adapter";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully:", res.rows[0]);
  }
});

try {
  const adapter = createAdapter(pool);
  io.adapter(adapter);
  console.log("PostgreSQL adapter set successfully");
} catch (error) {
  console.error("Error setting up PostgreSQL adapter:", error);
}

// Helper function to get receiver's socket ID
export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

// In-memory map to track online users
const userSocketMap: { [key: string]: string } = {}; // {userId: socketId}

// Helper function to get all online users
const getOnlineUsers = () => {
  return Object.keys(userSocketMap);
};

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  console.log("Adapter name:", io.of("/").adapter.constructor.name);

  const userId = socket.handshake.query.userId as string;

  if (userId && userId !== "undefined") {
    console.log(`User ${userId} with socket ID ${socket.id} joining room.`);

    // Add user to socket map
    userSocketMap[userId] = socket.id;

    // Join user to their own room (for private messaging)
    socket.join(userId);

    // Log room info
    console.log("Rooms after join:", socket.rooms);
    console.log("Current online users:", getOnlineUsers());

    // Emit updated online users list to all clients
    io.emit("getOnlineUsers", getOnlineUsers());
  } else {
    console.log(
      `A user with socket ID ${socket.id} connected with an invalid userId: ${userId}`
    );
  }

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);

    // Find and remove the user from the map
    const disconnectedUserId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );

    if (disconnectedUserId) {
      delete userSocketMap[disconnectedUserId];
      console.log(`User ${disconnectedUserId} removed from online users`);
      console.log("Updated online users:", getOnlineUsers());

      // Emit updated online users list to all clients
      io.emit("getOnlineUsers", getOnlineUsers());
    }
  });
});

export { app, io, server };
