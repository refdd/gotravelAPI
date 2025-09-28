import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { toInt } from "../helper/converterData";

export const getAllTours = async (req: Request, res: Response) => {
  try {
    const tours = await prisma.tour.findMany({
      include: {
        galleries: true,
        itineraries: true,
        accommodations: {
          include: {
            prices: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });
    res.status(200).json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTourBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const tour = await prisma.tour.findUnique({
      where: { slug },
      include: {
        galleries: true,
        itineraries: true,
        accommodations: {
          include: {
            prices: {
              include: {
                items: true,
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

export const getTourById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        galleries: true,
        itineraries: true,
        accommodations: {
          include: {
            prices: {
              include: {
                items: true,
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
    console.error("Error fetching tour by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTour = async (req: Request, res: Response) => {
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
    itineraries, // Expecting a JSON string for itineraries
    accommodations, // Expecting a JSON string for accommodations
  } = req.body;

  try {
    // ✅ Validate required fields
    if (!title || !duration || !price || !regionId || !destinationId) {
      return res.status(400).json({
        error:
          "Missing required fields: title, duration, price, regionId, destinationId",
      });
    }

    // ✅ Validate foreign keys
    const [region, destination] = await Promise.all([
      prisma.region.findUnique({ where: { id: regionId } }),
      prisma.destination.findUnique({ where: { id: destinationId } }),
      hotelId ? prisma.hotel.findUnique({ where: { id: hotelId } }) : null,
    ]);

    if (!region || !destination) {
      return res
        .status(400)
        .json({ error: "Invalid regionId or destinationId" });
    }

    // ✅ Handle image uploads to Cloudinary
    const uploadedImages = (req.files as Express.Multer.File[]) || [];
    const imageUrls = uploadedImages.map(
      (file: any) => file.cloudinary.secure_url
    );
    console.log(uploadedImages);

    // ✅ Parse JSON strings for itineraries and accommodations
    const parsedItineraries = itineraries ? JSON.parse(itineraries) : [];
    const parsedIncludes = includes ? JSON.parse(includes) : [];
    const parsedExcludes = excludes ? JSON.parse(excludes) : [];
    const parsedAccommodations = accommodations
      ? JSON.parse(accommodations)
      : [];

    // ✅ Create the tour and related entities in a transaction
    const newTour = await prisma.tour.create({
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
        images: imageUrls, // Store image URLs
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

        // ✅ Create related galleries, itineraries, and accommodations
        galleries: {
          create: uploadedImages.map((file: any) => ({
            imageUrl: file.cloudinary.secure_url,
            imageAlt: title, // Use tour title as alt text
            imageTitle: file.originalname,
          })),
        },
        itineraries: {
          create: parsedItineraries.map((item: any) => ({
            title: item.title,
            body: item.body,
            meals: item.meals,
            accommodation: item.accommodation,
            sort: toInt(item.sort) || 0,
          })),
        },
        accommodations: {
          create: parsedAccommodations.map((acc: any) => ({
            name: acc.name,
            image: acc.image,
            prices: {
              create: acc.prices.map((price: any) => ({
                name: price.name,
                items: {
                  create: price.items.map((item: any) => ({
                    priceValue: new Prisma.Decimal(item.priceValue),
                    body: item.body,
                    sort: toInt(item.sort) || 0,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        galleries: true,
        itineraries: true,
        accommodations: {
          include: {
            prices: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(newTour);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[])?.includes("slug")
    ) {
      return res
        .status(400)
        .json({ error: "Slug already exists. Please choose a different one." });
    }
    console.error("Error creating tour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTour = async (req: Request, res: Response) => {
  const { id } = req.params;
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
    itineraries, // Expecting a JSON string for itineraries
    accommodations, // Expecting a JSON string for accommodations
  } = req.body;

  try {
    // ✅ Validate foreign keys if they are provided
    if (regionId) {
      const region = await prisma.region.findUnique({
        where: { id: regionId },
      });
      if (!region) {
        return res.status(400).json({ error: "Invalid regionId" });
      }
    }
    if (destinationId) {
      const destination = await prisma.destination.findUnique({
        where: { id: destinationId },
      });
      if (!destination) {
        return res.status(400).json({ error: "Invalid destinationId" });
      }
    }
    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
      if (!hotel) {
        return res.status(400).json({ error: "Invalid hotelId" });
      }
    }

    // ✅ Handle image uploads to Cloudinary
    const uploadedImages = (req.files as Express.Multer.File[]) || [];
    const imageUrls = uploadedImages.map(
      (file: any) => file.cloudinary.secure_url
    );

    // ✅ Parse JSON strings for itineraries and accommodations
    const parsedItineraries = itineraries ? JSON.parse(itineraries) : [];
    const parsedIncludes = includes ? JSON.parse(includes) : [];
    const parsedExcludes = excludes ? JSON.parse(excludes) : [];
    const parsedAccommodations = accommodations
      ? JSON.parse(accommodations)
      : [];

    // ✅ Update the tour and related entities in a transaction
    const updatedTour = await prisma.tour.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        shortDescription,
        duration: duration ? Number(duration) : undefined,
        maxGroupSize: maxGroupSize ? Number(maxGroupSize) : undefined,
        price: price ? new Prisma.Decimal(price) : undefined,
        currency,
        includes: parsedIncludes,
        excludes: parsedExcludes,
        images: {
          push: imageUrls,
        },
        tourType,
        groupType,
        tourCode,
        tourLanguage,
        airportPickup: airportPickup ? airportPickup === "true" : undefined,
        visaIncluded: visaIncluded ? visaIncluded === "true" : undefined,
        accommodation,
        transportType,
        guideIncluded: guideIncluded ? guideIncluded === "true" : undefined,
        minAge: minAge ? Number(minAge) : undefined,
        maxAge: maxAge ? Number(maxAge) : undefined,
        cancellationPolicy,
        isActive: isActive ? isActive !== "false" : undefined,
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        availableTo: availableTo ? new Date(availableTo) : undefined,
        ...(regionId && { region: { connect: { id: regionId } } }),
        ...(destinationId && {
          destination: { connect: { id: destinationId } },
        }),
        ...(hotelId && { hotel: { connect: { id: hotelId } } }),

        // ✅ Handle updates for related galleries, itineraries, and accommodations
        galleries: {
          create: uploadedImages.map((file: any) => ({
            imageUrl: file.cloudinary.secure_url,
            imageAlt: title, // Use tour title as alt text
            imageTitle: file.originalname,
          })),
        },
        itineraries: {
          deleteMany: {},
          create: parsedItineraries.map((item: any) => ({
            title: item.title,
            body: item.body,
            meals: item.meals,
            accommodation: item.accommodation,
            sort: item.sort,
          })),
        },
        accommodations: {
          deleteMany: {},
          create: parsedAccommodations.map((acc: any) => ({
            name: acc.name,
            image: acc.image,
            prices: {
              create: acc.prices?.map((price: any) => ({
                name: price.name,
                items: {
                  create: price.items.map((item: any) => ({
                    priceValue: new Prisma.Decimal(item.priceValue),
                    body: item.body,
                    sort: item.sort,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        galleries: true,
        itineraries: true,
        accommodations: {
          include: {
            prices: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedTour);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[])?.includes("slug")
    ) {
      return res
        .status(400)
        .json({ error: "Slug already exists. Please choose a different one." });
    }
    console.error("Error updating tour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteTour = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tour = await prisma.tour.delete({
      where: { id },
    });
    res.status(200).json({ message: "Tour deleted successfully" });
  } catch (error) {
    console.error("Error deleting tour:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getToursByDestination = async (req: Request, res: Response) => {
  const { destinationId } = req.params;
  try {
    const tours = await prisma.tour.findMany({
      where: { destinationId },
      include: {
        galleries: true,
        itineraries: true,
        accommodations: {
          include: {
            prices: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });
    res.status(200).json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getToursByRegion = async (req: Request, res: Response) => {
  const { regionId } = req.params;
  try {
    const tours = await prisma.tour.findMany({
      where: { regionId },
      include: {
        galleries: true,
        itineraries: true,
        accommodations: {
          include: {
            prices: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });
    res.status(200).json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getToursByDate = async (req: Request, res: Response) => {
  try {
    const tours = await prisma.tour.findMany();
    res.status(200).json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
