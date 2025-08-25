import express from "express";

import {
  getAllWikis,
  getWikiBySlug,
  createWiki,
  updateWiki,
  deleteWiki,
  getWikiById,
} from "../controllers/wiki.controller";
import protectRoute from "../middleware/protectRoute";
import upload from "../middleware/multer";

const router = express.Router();

// Routes
router.get("/", getAllWikis);
router.get("/:slug", getWikiBySlug);
router.get("/wikisById/:id", getWikiById);
router.post("/", protectRoute, upload.singleImage("image"), createWiki);
router.put("/:id", protectRoute, upload.singleImage("image"), updateWiki);
router.delete("/:id", protectRoute, deleteWiki);

export default router;
