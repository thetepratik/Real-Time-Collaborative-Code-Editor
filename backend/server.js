import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import OpenAI from "openai";

import { connectDB } from "./db.js";
import CodeFile from "./CodeFile.js";
import authRoutes from "./authRoutes.js";

// --------------------
// ENV SETUP
// --------------------
dotenv.config();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing");
  process.exit(1);
}

// --------------------
// OPENAI SETUP (NEW SDK)
// --------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --------------------
// DB CONNECTION
// --------------------
connectDB();

// --------------------
// EXPRESS SETUP
// --------------------
const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

app.use("/auth", authRoutes);

// --------------------
// HTTP + SOCKET.IO
// --------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// --------------------
// SOCKET AUTH
// --------------------
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Socket auth error:", err.message);
    next(new Error("Auth failed"));
  }
});

// --------------------
// IN-MEMORY MEETINGS
// --------------------
const meetings = {};

// --------------------
// SOCKET CONNECTION
// --------------------
io.on("connection", (socket) => {
  console.log(`🟢 Connected: ${socket.user.username}`);

  // JOIN MEETING
  socket.on("join-meeting", async ({ meetingId }) => {
    try {
      if (!meetingId) return;

      socket.join(meetingId);

      if (!meetings[meetingId]) meetings[meetingId] = [];

      if (!meetings[meetingId].some(u => u.id === socket.id)) {
        meetings[meetingId].push({
          id: socket.id,
          username: socket.user.username,
        });
      }

      io.to(meetingId).emit("user-list", meetings[meetingId]);

      const file = await CodeFile.findOneAndUpdate(
        { meetingId },
        { $setOnInsert: { code: "<!-- New File Created -->" } },
        { new: true, upsert: true }
      );

      socket.emit("load-old-code", file.code);
    } catch (err) {
      console.error("❌ join-meeting error:", err.message);
    }
  });

  // CODE CHANGE
  socket.on("code-change", async ({ meetingId, code }) => {
    try {
      if (!meetingId) return;

      socket.to(meetingId).emit("code-update", code);

      await CodeFile.findOneAndUpdate(
        { meetingId },
        { code },
        { upsert: true }
      );
    } catch (err) {
      console.error("❌ code-change error:", err.message);
    }
  });

  // --------------------
  // ✅ AI CODE GENERATOR (FIXED)
  // --------------------
  socket.on("ai-generate", async ({ meetingId, prompt }) => {
    try {
      if (!meetingId || !prompt) return;

      const file = await CodeFile.findOne({ meetingId });
      const currentCode = file?.code || "";

      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: "You are a coding assistant. Return ONLY code. No explanation."
          },
          {
            role: "user",
            content: `Current code:\n${currentCode}\n\nUser request:\n${prompt}`
          }
        ]
      });

      const aiCode = response.output_text;

      // send to everyone in meeting
      io.to(meetingId).emit("ai-result", { code: aiCode });

    } catch (err) {
      console.error("❌ AI error:", err);
      socket.emit("ai-error", { message: err.message });
    }
  });

  // CHAT
  socket.on("send-chat", ({ meetingId, msgData }) => {
    if (!meetingId) return;
    io.to(meetingId).emit("chat-message", msgData);
  });

  // LEAVE MEETING
  socket.on("leave-meeting", ({ meetingId }) => {
    socket.leave(meetingId);

    if (meetings[meetingId]) {
      meetings[meetingId] = meetings[meetingId].filter(
        u => u.id !== socket.id
      );

      io.to(meetingId).emit("user-list", meetings[meetingId]);

      if (meetings[meetingId].length === 0) {
        delete meetings[meetingId];
      }
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(`🔴 Disconnected: ${socket.user.username}`);

    for (const meetingId in meetings) {
      meetings[meetingId] = meetings[meetingId].filter(
        u => u.id !== socket.id
      );
      io.to(meetingId).emit("user-list", meetings[meetingId]);

      if (meetings[meetingId].length === 0) {
        delete meetings[meetingId];
      }
    }
  });
});

// --------------------
// START SERVER
// --------------------
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
