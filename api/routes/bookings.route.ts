import express from "express";
import protectRoute from "../middleware/protectRoute";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
} from "../controllers/bookings.controller";
import { validateRequest } from "../middleware/validateRequest";
import { bookingSchema } from "../schemas/booking.schema";

const router = express.Router();

// Routes
router.post(
  "/",
  protectRoute,
  validateRequest(bookingSchema, true),
  createBooking
);
router.get("/", protectRoute, getAllBookings);
router.get("/:id", protectRoute, getBookingById);
router.put(
  "/:id",
  protectRoute,
  validateRequest(bookingSchema, true),
  updateBooking
);
router.delete("/:id", protectRoute, deleteBooking);

export default router;
