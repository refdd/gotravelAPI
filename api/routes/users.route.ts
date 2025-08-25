import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/users.controller";
import protectRoute from "../middleware/protectRoute";

const router = express.Router();

// Routes
router.get("/", protectRoute, getAllUsers);
router.get("/:id", protectRoute, getUserById);
router.put("/:id", protectRoute, updateUser);
router.delete("/:id", protectRoute, deleteUser);

export default router;
