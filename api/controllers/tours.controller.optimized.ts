import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { toInt } from "../helper/converterData";

// ✅ OPTIMIZED: Pagination and selective loading
export const getAllTours = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // ✅ OPTIMIZED: Only load essential fields for list view
    const [tours, totalCount] = await Promise.all([
      prisma.tour.findMany({
        skip,
        take: limit,
        where: {
          isActive: true, // Only active tours
        },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          duration: true,
          price: true,
          currency: true,
          images: true,
          createdAt: true,
          region: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          destination: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.tour.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    res.status(200).json({
      tours,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ OPTIMIZED: Load full details only when needed
export const getTourBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const tour = await prisma.tour.findUnique({
      where: { slug },
      include: {
        region: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        destination: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        galleries: {
          select: {
            id: true,
            imageUrl: true,
            imageAlt: true,
            imageTitle: true,
          },
        },
        itineraries: {
          select: {
            id: true,
            title: true,
            body: true,
            meals: true,
            accommodation: true,
            sort: true,
            mediaUrl: true,
          },
          orderBy: {
            sort: "asc",
          },
        },
        accommodations: {
          select: {
            id: true,
            name: true,
            image: true,
            prices: {
              select: {
                id: true,
                name: true,
                items: {
                  select: {
                    id: true,
                    priceValue: true,
                    body: true,
                    sort: true,
                  },
                  orderBy: {
                    sort: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    res.status(200).json(tour);
  } catch (error) {
    console.error("Error fetching tour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ OPTIMIZED: Cached user lookup for authentication
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedUser = async (userId: string) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      role: true,
    },
  });

  if (user) {
    userCache.set(userId, { user, timestamp: Date.now() });
  }

  return user;
};

// ✅ OPTIMIZED: Batch operations for related data
export const getToursByDestination = async (req: Request, res: Response) => {
  const { destinationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const [tours, totalCount] = await Promise.all([
      prisma.tour.findMany({
        where: {
          destinationId,
          isActive: true,
        },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          duration: true,
          price: true,
          currency: true,
          images: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.tour.count({
        where: {
          destinationId,
          isActive: true,
        },
      }),
    ]);

    res.status(200).json({
      tours,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ OPTIMIZED: Search with full-text search
export const searchTours = async (req: Request, res: Response) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [tours, totalCount] = await Promise.all([
      prisma.tour.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { shortDescription: { contains: q, mode: "insensitive" } },
                { region: { name: { contains: q, mode: "insensitive" } } },
                { destination: { name: { contains: q, mode: "insensitive" } } },
              ],
            },
          ],
        },
        skip,
        take: parseInt(limit as string),
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          duration: true,
          price: true,
          currency: true,
          images: true,
          region: {
            select: {
              name: true,
              slug: true,
            },
          },
          destination: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.tour.count({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { shortDescription: { contains: q, mode: "insensitive" } },
                { region: { name: { contains: q, mode: "insensitive" } } },
                { destination: { name: { contains: q, mode: "insensitive" } } },
              ],
            },
          ],
        },
      }),
    ]);

    res.status(200).json({
      tours,
      query: q,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error searching tours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ OPTIMIZED: Transaction-based tour creation
export const createTourOptimized = async (req: Request, res: Response) => {
  const {
    title,
    description,
    regionId,
    destinationId,
    hotelId,
    duration,
    price,
    currency = "USD",
    includes,
    excludes,
    shortDescription,
    maxGroupSize,
    tourType,
    groupType,
    tourCode,
    tourLanguage,
    airportPickup,
    visaIncluded,
    accommodation,
    transportType,
    guideIncluded,
    minAge,
    maxAge,
    cancellationPolicy,
    isActive = true,
    availableFrom,
    availableTo,
    slug,
    itineraries,
    accommodations,
  } = req.body;

  try {
    // ✅ OPTIMIZED: Validate required fields first
    if (!title || !duration || !price || !regionId || !destinationId) {
      return res.status(400).json({
        error:
          "Missing required fields: title, duration, price, regionId, destinationId",
      });
    }

    // ✅ OPTIMIZED: Parallel validation
    const [region, destination, hotel] = await Promise.all([
      prisma.region.findUnique({ where: { id: regionId } }),
      prisma.destination.findUnique({ where: { id: destinationId } }),
      hotelId ? prisma.hotel.findUnique({ where: { id: hotelId } }) : null,
    ]);

    if (!region || !destination) {
      return res
        .status(400)
        .json({ error: "Invalid regionId or destinationId" });
    }

    // ✅ OPTIMIZED: Handle image uploads
    const uploadedImages = (req.files as Express.Multer.File[]) || [];
    const imageUrls = uploadedImages.map(
      (file: any) => file.cloudinary.secure_url
    );

    // ✅ OPTIMIZED: Parse JSON strings safely
    const parsedItineraries = itineraries ? JSON.parse(itineraries) : [];
    const parsedIncludes = includes ? JSON.parse(includes) : [];
    const parsedExcludes = excludes ? JSON.parse(excludes) : [];
    const parsedAccommodations = accommodations
      ? JSON.parse(accommodations)
      : [];

    // ✅ OPTIMIZED: Use transaction for data consistency
    const newTour = await prisma.$transaction(async (tx) => {
      const tour = await tx.tour.create({
        data: {
          title,
          slug,
          description,
          shortDescription,
          duration: Number(duration),
          maxGroupSize: maxGroupSize ? Number(maxGroupSize) : undefined,
          price: new Prisma.Decimal(price),
          currency,
          includes: parsedIncludes,
          excludes: parsedExcludes,
          images: imageUrls,
          tourType,
          groupType,
          tourCode,
          tourLanguage,
          airportPickup: airportPickup === "true",
          visaIncluded: visaIncluded === "true",
          accommodation,
          transportType,
          guideIncluded: guideIncluded === "true",
          minAge: minAge ? Number(minAge) : undefined,
          maxAge: maxAge ? Number(maxAge) : undefined,
          cancellationPolicy,
          isActive: isActive !== "false",
          availableFrom: availableFrom ? new Date(availableFrom) : undefined,
          availableTo: availableTo ? new Date(availableTo) : undefined,
          region: { connect: { id: regionId } },
          destination: { connect: { id: destinationId } },
          ...(hotelId && { hotel: { connect: { id: hotelId } } }),
        },
      });

      // ✅ OPTIMIZED: Batch create related entities
      if (parsedItineraries.length > 0) {
        await tx.itinerary.createMany({
          data: parsedItineraries.map((item: any) => ({
            tourId: tour.id,
            title: item.title,
            body: item.body,
            meals: item.meals,
            accommodation: item.accommodation,
            sort: toInt(item.sort) || 0,
          })),
        });
      }

      if (uploadedImages.length > 0) {
        await tx.gallery.createMany({
          data: uploadedImages.map((file: any) => ({
            tourId: tour.id,
            imageUrl: file.cloudinary.secure_url,
            imageAlt: title,
            imageTitle: file.originalname,
          })),
        });
      }

      return tour;
    });

    res.status(201).json(newTour);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[])?.includes("slug")
    ) {
      return res.status(400).json({
        error: "Slug already exists. Please choose a different one.",
      });
    }
    console.error("Error creating tour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
