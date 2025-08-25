import express from "express";
import {
  createDestination,
  deleteDestination,
  getAllDestinations,
  getDestinationById,
  getDestinationBySlug,
  updateDestination,
} from "../controllers/destinations.controller";
import protectRoute from "../middleware/protectRoute";
import upload from "../middleware/multer";

const router = express.Router();

// Routes
router.get("/", getAllDestinations);
router.get("/:slug", getDestinationBySlug);
router.get("/destinationsById/:id", getDestinationById);
router.post("/", protectRoute, upload.singleImage("image"), createDestination);
router.put(
  "/:id",
  protectRoute,
  upload.singleImage("image"),
  updateDestination
);
router.delete("/:id", protectRoute, deleteDestination);

export default router;
