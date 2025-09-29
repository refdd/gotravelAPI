import express, { Request, Response } from "express";

import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { app, server } from "./socket/socket";
import authRoutes from "./routes/auth.route";
import blogRoutes from "./routes/blog.route";
import regionRoutes from "./routes/region.route";
import usersRoutes from "./routes/users.route";
import pagesRoutes from "./routes/pages.route";
import wikisRoutes from "./routes/wikis.route";
import faqsRoutes from "./routes/faqs.route";
import destinationsRoutes from "./routes/destinations.route";
import hotelsRoutes from "./routes/hotels.route";
import toursRoutes from "./routes/tours.route";
import bookingsRoutes from "./routes/bookings.route";
import reviewsRoutes from "./routes/reviews.route";
import analyticsRoutes from "./routes/analytics.route";
import messageRoutes from "./routes/message.route";
import geminiRoutes from "./routes/gemini.route";

dotenv.config();

app.use(express.json());
app.use(cookieParser());
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["http://localhost:5173", "http://127.0.0.1:5173"]
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Set CORS first
app.use(cors(corsOptions));

app.use("/auth", authRoutes); // done
app.use("/blog", blogRoutes); // done
app.use("/region", regionRoutes); // done
app.use("/users", usersRoutes); // done
app.use("/pages", pagesRoutes); // done
app.use("/wikis", wikisRoutes); // done
app.use("/faqs", faqsRoutes); //done
app.use("/destinations", destinationsRoutes); //done
app.use("/hotels", hotelsRoutes); //done
app.use("/tours", toursRoutes); // done
app.use("/bookings", bookingsRoutes); // done
app.use("/reviews", reviewsRoutes); //done
app.use("/analytics", analyticsRoutes); //done
app.use("/messages", messageRoutes);
app.use("/ai", geminiRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API is working" });
});

// ✅ Don't use app.listen here — use server.listen instead
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
