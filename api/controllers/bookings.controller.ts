import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { bookingSchema } from "../schemas/booking.schema";

export const createBooking = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      numberOfPeople,
      totalAmount,
      currency = "USD",
      travelDate,
      specialRequests,
      notes,
      tourId,
      adults,
      children,
      ageOfChildern,
      arrival,
      departure,
      departure_airport,
      nationality,
      flight,
      Request_Source,
      http_referer,
      url_goal,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = req.body;

    const bookingNumber = `BK-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        customerName,
        customerEmail,
        customerPhone,
        numberOfPeople: parseInt(numberOfPeople, 10),
        totalAmount: parseFloat(totalAmount),
        currency,
        travelDate: new Date(travelDate),
        specialRequests,
        notes,
        tourId: tourId || null,
        adults: adults ? parseInt(adults) : null,
        children: children ? parseInt(children) : null,
        ageOfChildren: ageOfChildern ? JSON.stringify(ageOfChildern) : null,
        arrivalDate: arrival ? new Date(arrival) : null,
        departureDate: departure ? new Date(departure) : null,
        departureAirport: departure_airport || null,
        nationality: nationality || null,
        flightIncluded: flight === "yes",
        requestSource: Request_Source || null,
        httpReferer: http_referer || null,
        urlGoal: url_goal || null,
        utmSource: utm_source || null,
        utmMedium: utm_medium || null,
        utmCampaign: utm_campaign || null,
        utmTerm: utm_term || null,
        utmContent: utm_content || null,
      },
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "A booking with this booking number already exists.",
        });
      }
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany();
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        tour: true,
      },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      numberOfPeople,
      totalAmount,
      currency = "USD",
      travelDate,
      specialRequests,
      notes,
      tourId,
      adults,
      children,
      ageOfChildern,
      arrival,
      departure,
      departure_airport,
      nationality,
      flight,
      Request_Source,
      http_referer,
      url_goal,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = req.body;

    const updateData: any = {
      customerName,
      customerEmail,
      customerPhone,
      numberOfPeople: numberOfPeople ? parseInt(numberOfPeople) : undefined,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      currency,
      travelDate: travelDate ? new Date(travelDate) : undefined,
      specialRequests,
      notes,
      tourId:
        tourId && tourId !== "null" && tourId !== "undefined" && tourId !== ""
          ? tourId
          : null,
      adults: adults ? parseInt(adults) : undefined,
      children: children ? parseInt(children) : undefined,
      ageOfChildren: ageOfChildern ? JSON.stringify(ageOfChildern) : undefined,
      arrivalDate: arrival ? new Date(arrival) : undefined,
      departureDate: departure ? new Date(departure) : undefined,
      departureAirport: departure_airport || null,
      nationality: nationality || null,
      flightIncluded: flight === "yes",

      requestSource: Request_Source || null,
      httpReferer: http_referer || null,
      urlGoal: url_goal || null,
      utmSource: utm_source || null,
      utmMedium: utm_medium || null,
      utmCampaign: utm_campaign || null,
      utmTerm: utm_term || null,
      utmContent: utm_content || null,
    };

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const deletedBooking = await prisma.booking.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ message: "Booking deleted successfully", deletedBooking });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
