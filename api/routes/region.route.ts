import express from "express";
import protectRoute from "../middleware/protectRoute";
import {
  createRegion,
  deleteRegion,
  getAllRegions,
  getRegionById,
  getRegionBySlug,
  updateRegion,
} from "../controllers/region.controller";
import upload from "../middleware/multer";
import { getDestinationsByRegion } from "../controllers/destinations.controller";

const router = express.Router();

// Routes
router.get("/", getAllRegions);
router.get("/:slug", getRegionBySlug);
router.get("/GetById/:id", getRegionById);
router.post("/", protectRoute, upload.singleImage("image"), createRegion);
router.put("/:id", protectRoute, upload.singleImage("image"), updateRegion);
router.delete("/:id", protectRoute, deleteRegion);

router.get("/:regionId/destinations", getDestinationsByRegion);

export default router;
