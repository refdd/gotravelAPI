import express from "express";

import {
  getAllPages,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  getPageById,
} from "../controllers/page.controller";
import protectRoute from "../middleware/protectRoute";
import upload from "../middleware/multer";

const router = express.Router();

// Routes
router.get("/", getAllPages);
router.get("/:slug", getPageBySlug);
router.get("/getById/:id", getPageById);
router.post("/", protectRoute, upload.singleImage("image"), createPage);
router.put("/:id", protectRoute, upload.singleImage("image"), updatePage);
router.delete("/:id", protectRoute, deletePage);

export default router;
