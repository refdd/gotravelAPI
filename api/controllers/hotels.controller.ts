import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

export const getAllHotels = async (req: Request, res: Response) => {
  try {
    const hotels = await prisma.hotel.findMany();
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHotelBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { slug },
    });
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    res.status(200).json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id },
    });
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    res.status(200).json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createHotel = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      slug,
      link,
      imageAlt,
      imageTitle,
      regionId,
      destinationId,
    } = req.body;

    // ✅ Validation
    // if (!title || !regionId || !destinationId) {
    //   return res.status(400).json({
    //     error: "title, regionId, and destinationId are required",
    //   });
    // }

    // ✅ Validate region and destination existence
    // const [regionExists, destinationExists] = await Promise.all([
    //   prisma.region.findUnique({ where: { id: regionId } }),
    //   prisma.destination.findUnique({ where: { id: destinationId } }),
    // ]);

    // if (!regionExists) {
    //   return res.status(400).json({ error: "Invalid regionId" });
    // }
    // if (!destinationExists) {
    //   return res.status(400).json({ error: "Invalid destinationId" });
    // }

    // ✅ Handle Cloudinary upload
    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;

    // ✅ Create hotel
    const newHotel = await prisma.hotel.create({
      data: {
        title,
        description,
        slug,
        link,
        imageUrl,
        imageAlt,
        imageTitle,
        regionId,
        destinationId,
      },
    });

    res.status(201).json(newHotel);
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[])?.includes("slug")
    ) {
      return res
        .status(409)
        .json({ error: "Slug already exists. Please choose a different one." });
    }

    console.error("Error creating hotel:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const updateHotel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ✅ Fetch current hotel
    const currentHotel = await prisma.hotel.findUnique({
      where: { id },
      select: { slug: true, imageUrl: true },
    });

    if (!currentHotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    const body = req.body as Record<string, any>;
    const updateData: any = {};

    const allowedFields = [
      "title",
      "description",
      "slug",
      "link",
      "imageAlt",
      "imageTitle",
      "regionId",
      "destinationId",
    ] as const;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // ✅ Skip slug if unchanged
        if (field === "slug") {
          if (body.slug === currentHotel.slug) continue;

          const existing = await prisma.hotel.findFirst({
            where: {
              slug: body.slug,
              NOT: { id },
            },
          });

          if (existing) {
            return res.status(400).json({
              error: "Slug already exists. Please choose a different one.",
            });
          }

          updateData.slug = body.slug;
          continue;
        }

        updateData[field] = body[field];
      }
    }

    // ✅ Handle image update
    const uploadedImage = (req.file as any)?.cloudinary;
    if (uploadedImage?.secure_url) {
      if (currentHotel.imageUrl) {
        try {
          await deleteImageFromCloudinary(currentHotel.imageUrl);
        } catch (err) {
          console.warn("Failed to delete old image:", err);
        }
      }

      updateData.imageUrl = uploadedImage.secure_url;
    }

    // ✅ Perform update
    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedHotel);
  } catch (error: any) {
    console.error("Error updating hotel:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const deleteHotel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ✅ Fetch hotel to delete
    const hotelToDelete = await prisma.hotel.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!hotelToDelete) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    // ✅ Delete image from Cloudinary if it exists
    if (hotelToDelete.imageUrl) {
      try {
        await deleteImageFromCloudinary(hotelToDelete.imageUrl);
      } catch (err) {
        console.warn("Failed to delete image from Cloudinary:", err);
      }
    }

    // ✅ Delete hotel
    await prisma.hotel.delete({ where: { id } });

    res.status(204).json({ message: "Hotel deleted successfully" });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHotelsByDestination = async (req: Request, res: Response) => {
  const { region } = req.params;
  try {
    const hotels = await prisma.hotel.findMany({
      where: { regionId: region },
    });
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHotelsByRegion = async (req: Request, res: Response) => {
  const { region } = req.params;
  try {
    const hotels = await prisma.hotel.findMany({
      where: { regionId: region },
    });
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
