import express from "express";
import {
  createTour,
  deleteTour,
  getAllTours,
  getTourById,
  getTourBySlug,
  getToursByDate,
  getToursByDestination,
  getToursByRegion,
  updateTour,
} from "../controllers/tours.controller";
import protectRoute from "../middleware/protectRoute";
import upload from "../middleware/multer";

const router = express.Router();

// Filter routes
router.get("/destination/:destinationId", getToursByDestination);
router.get("/region/:regionId", getToursByRegion);
router.get("/date/:date", getToursByDate);

// Routes
router.get("/", getAllTours); // Supports query params for filtering
router.get("/:slug", getTourBySlug);
router.get("/getById/:id", getTourById);
router.post("/", protectRoute, upload.multipleImages("images", 10), createTour);
router.put(
  "/:id",
  protectRoute,
  upload.multipleImages("images", 10),
  updateTour
);
router.delete("/:id", protectRoute, deleteTour);

export default router;
