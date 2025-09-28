import express from "express";
import protectRoute from "../middleware/protectRoute";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller";
import attachmentMiddleware from "../middleware/attachments"; // Your new middleware

const router = express.Router();

router.get("/conversations", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

// Route for sending messages with mixed attachments
router.post(
  "/send/:id",
  protectRoute,
  attachmentMiddleware.multiple("attachments", 10), // Accept any type of attachment
  sendMessage
);

// // Alternative routes for specific attachment types:

// // Only images
// router.post(
//   "/send-images/:id",
//   protectRoute,
//   attachmentMiddleware.images("images", 10),
//   sendMessage
// );

// // Only videos
// router.post(
//   "/send-videos/:id",
//   protectRoute,
//   attachmentMiddleware.videos("videos", 5),
//   sendMessage
// );

// // Only audio files
// router.post(
//   "/send-audio/:id",
//   protectRoute,
//   attachmentMiddleware.audios("audios", 5),
//   sendMessage
// );

// // Only document files
// router.post(
//   "/send-files/:id",
//   protectRoute,
//   attachmentMiddleware.files("files", 5),
//   sendMessage
// );

// // Single attachment of any type
// router.post(
//   "/send-single/:id",
//   protectRoute,
//   attachmentMiddleware.single("attachment"),
//   sendMessage
// );

// // Mixed fields (separate fields for each type)
// router.post(
//   "/send-mixed/:id",
//   protectRoute,
//   attachmentMiddleware.mixed([
//     { name: "images", maxCount: 5 },
//     { name: "videos", maxCount: 2 },
//     { name: "audios", maxCount: 3 },
//     { name: "files", maxCount: 5 },
//   ]),
//   sendMessage
// );

export default router;
