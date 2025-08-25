import express from "express";
import protectRoute from "../middleware/protectRoute";
import {
  createHotel,
  deleteHotel,
  getAllHotels,
  getHotelById,
  getHotelBySlug,
  getHotelsByDestination,
  getHotelsByRegion,
  updateHotel,
} from "../controllers/hotels.controller";
import upload from "../middleware/multer";

const router = express.Router();

// Routes
router.get("/", getAllHotels); // Supports query params for filtering
router.get("/:slug", getHotelBySlug);
router.get("/hotelsById/:id", getHotelById);
router.post("/", protectRoute, upload.singleImage("image"), createHotel);
router.put("/:id", protectRoute, upload.singleImage("image"), updateHotel);
router.delete("/:id", protectRoute, deleteHotel);

// Filter routes
// router.get("/destination/:destinationId", getHotelsByDestination);
// router.get("/region/:regionId", getHotelsByRegion);

export default router;
