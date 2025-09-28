import express from "express";
import {
  createBlog,
  deleteBlogsByIds,
  deleteBlog,
  getAllBlogs,
  getBlogDetails,
  updateBlog,
  getBlogById,
} from "../controllers/blog.controller";
import upload from "../middleware/multer";

const router = express.Router();

// GET routes
router.get("/", getAllBlogs); // GET /blog
router.get("/:slug", getBlogDetails); // GET /blog/:slug
router.get("/BlogById/:id", getBlogById); // GET /blog/:id (for ID-based retrieval)

// POST routes
router.post("/", upload.singleImage("image"), createBlog); // POST /blog
router.post("/bulk-delete", deleteBlogsByIds); // POST /blog/bulk-delete

// PUT routes
router.put("/:id", upload.singleImage("image"), updateBlog); // PUT /blog/:id

// DELETE routes
router.get("/delete/:id", deleteBlog); // DELETE /blog/:id

export default router;
