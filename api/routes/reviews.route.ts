import express from "express";
import protectRoute from "../middleware/protectRoute";

import {
  createReview,
  getAllReviews,
  getReviewById,
  deleteReview,
  editReview,
} from "../controllers/reviews.controller";
import upload from "../middleware/multer";
import { validateRequest } from "../middleware/validateRequest";
import { reviewSchema } from "../schemas/review.schema";

const router = express.Router();

// Routes
router.post(
  "/",
  protectRoute,
  upload.singleImage("image"),
  validateRequest(reviewSchema),
  createReview
);
router.put(
  "/:id",
  protectRoute,
  upload.singleImage("image"),
  validateRequest(reviewSchema),
  editReview
);
router.get("/", getAllReviews);
router.get("/:id", getReviewById);
router.delete("/:id", protectRoute, deleteReview);

export default router;
