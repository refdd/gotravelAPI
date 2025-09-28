import express from "express";

import protectRoute from "../middleware/protectRoute";
import { chatWthGemini } from "../controllers/gemini.controller";
import attachmentMiddleware from "../middleware/attachments";

const router = express.Router();

// Routes
router.post(
  "/chat/:id",
  protectRoute,
  attachmentMiddleware.multiple("attachments", 10),
  chatWthGemini
);

export default router;
