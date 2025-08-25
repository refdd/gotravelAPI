import express from "express";
import { getMe, login, logout, signup } from "../controllers/auth.controller";
import protectRoute from "../middleware/protectRoute";

const router = express.Router();
router.get("/me", protectRoute, getMe);
router.post("/sigup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;
