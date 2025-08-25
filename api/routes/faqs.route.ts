import express from "express";

import {
  getAllFaqs,
  getFaqsByDestination,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqsById,
} from "../controllers/faqs.controller";
import protectRoute from "../middleware/protectRoute";
import upload from "../middleware/multer";

const router = express.Router();

// Routes
router.get("/", getAllFaqs);
router.get("/:destinationId", getFaqsByDestination);
router.get("/FaqsById/:id", getFaqsById);
router.post("/", protectRoute, upload.singleImage("image"), createFaq);
router.put("/:id", protectRoute, upload.singleImage("image"), updateFaq);
router.delete("/:id", protectRoute, deleteFaq);

export default router;
