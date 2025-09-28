import { Request, Response } from "express";
import prisma from "../db/prisma";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    // Get current date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Total Bookings
    const totalBookings = await prisma.booking.count();
    const recentBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Active Trips (Tours)
    const activeTrips = await prisma.tour.count({
      where: {
        isActive: true,
      },
    });

    // Total Destinations
    const destinations = await prisma.destination.count({
      where: {
        isActive: true,
      },
    });

    // New destinations in last 30 days
    const newDestinations = await prisma.destination.count({
      where: {
        isActive: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Simulate travelers online (recent bookings + random number)
    const recentHourBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });
    const travelersOnline =
      Math.floor(Math.random() * 50) + recentHourBookings * 5;

    // Booking trends for last 12 months
    const bookingTrends = [];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyRevenue = await prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      bookingTrends.push({
        month: months[date.getMonth()],
        revenue: Number(monthlyRevenue._sum.totalAmount) || 0,
      });
    }

    // Recent bookings
    const recentBookingsList = await prisma.booking.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tour: {
          select: {
            title: true,
          },
        },
      },
    });

    const formattedRecentBookings = recentBookingsList.map((booking) => ({
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      totalAmount: Number(booking.totalAmount),
      currency: booking.currency,
      status: booking.status,
      bookingDate: booking.bookingDate,
      tourTitle: booking.tour?.title || "N/A",
      initials: booking.customerName
        .split(" ")
        .map((name) => name.charAt(0).toUpperCase())
        .join("")
        .substring(0, 2),
    }));

    // Calculate growth percentage
    const previousBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo,
        },
      },
    });
    const bookingsGrowth =
      previousBookings > 0
        ? ((recentBookings - previousBookings) / previousBookings) * 100
        : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings: {
            value: totalBookings,
            growth: Math.round(bookingsGrowth * 100) / 100,
          },
          activeTrips: {
            value: activeTrips,
            growth: 8.5, // Mock data
          },
          destinations: {
            value: destinations,
            newCount: newDestinations,
          },
          travelersOnline: {
            value: travelersOnline,
          },
        },
        bookingTrends,
        recentBookings: {
          total: formattedRecentBookings.length,
          data: formattedRecentBookings,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
