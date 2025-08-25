import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

export const getAllDestinations = async (req: Request, res: Response) => {
  try {
    const destinations = await prisma.destination.findMany();
    res.status(200).json(destinations);
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDestinationBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const destination = await prisma.destination.findUnique({
      where: { slug },
    });
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }
    res.status(200).json(destination);
  } catch (error) {
    console.error("Error fetching destination:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDestinationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        region: true,
      },
    });
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }
    res.status(200).json(destination);
  } catch (error) {
    console.error("Error fetching destination:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createDestination = async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      title,
      destinationTitle,
      description,
      body,
      country,
      city,
      coordinates,
      metaTitle,
      metaKeywords,
      metaDescription,
      imageAlt,
      imageTitle,
      sitemapChangefreq,
      sitemapPriority,
      isActive,
      hideInHome,
      hideInSitemap,
      hideInMenu,
      hideInSubMenu,
      sortOrder,
      regionId,
    } = req.body;

    // ✅ Validation
    if (!name || !country || !regionId) {
      return res
        .status(400)
        .json({ error: "name, country, and regionId are required" });
    }

    // ✅ Validate region existence
    const regionExists = await prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!regionExists) {
      return res.status(400).json({ error: "Invalid regionId" });
    }

    // ✅ Cloudinary file (if provided)
    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;

    // ✅ Create destination
    const newDestination = await prisma.destination.create({
      data: {
        name,
        slug,
        title,
        destinationTitle,
        description,
        body,
        country,
        city,
        coordinates,
        metaTitle,
        metaKeywords,
        metaDescription,
        imageUrl,
        imageAlt,
        imageTitle,
        sitemapChangefreq,
        sitemapPriority: sitemapPriority
          ? parseFloat(sitemapPriority)
          : undefined,
        isActive: isActive === "true",
        hideInHome: hideInHome === "true",
        hideInSitemap: hideInSitemap === "true",
        hideInMenu: hideInMenu === "true",
        hideInSubMenu: hideInSubMenu === "true",
        sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
        regionId,
      },
    });

    res.status(201).json(newDestination);
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

    console.error("Error creating destination:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const updateDestination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ✅ Fetch current destination
    const current = await prisma.destination.findUnique({
      where: { id },
      select: { imageUrl: true, slug: true },
    });

    if (!current) {
      return res.status(404).json({ error: "Destination not found" });
    }

    // ✅ Fields that may be updated
    const allowedFields = [
      "name",
      "slug",
      "title",
      "destinationTitle",
      "description",
      "body",
      "country",
      "city",
      "coordinates",
      "metaTitle",
      "metaKeywords",
      "metaDescription",
      "imageAlt",
      "imageTitle",
      "sitemapChangefreq",
      "sitemapPriority",
      "isActive",
      "hideInHome",
      "hideInSitemap",
      "hideInMenu",
      "hideInSubMenu",
      "sortOrder",
      "regionId",
    ] as const;

    const body = req.body as Record<string, any>;
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (
          [
            "isActive",
            "hideInHome",
            "hideInSitemap",
            "hideInMenu",
            "hideInSubMenu",
          ].includes(field)
        ) {
          updateData[field] = body[field] === "true";
        } else if (["sitemapPriority"].includes(field)) {
          updateData[field] = parseFloat(body[field]);
        } else if (["sortOrder"].includes(field)) {
          updateData[field] = parseInt(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // ✅ Handle image update
    const uploadedImage = (req.file as any)?.cloudinary;
    if (uploadedImage?.secure_url) {
      // Optionally delete old image
      if (current.imageUrl) {
        try {
          await deleteImageFromCloudinary(current.imageUrl);
        } catch (err) {
          console.warn("Failed to delete old image:", err);
        }
      }

      updateData.imageUrl = uploadedImage.secure_url;
    }

    // ✅ Update destination
    const updated = await prisma.destination.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updated);
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

    console.error("Error updating destination:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const deleteDestination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ✅ Fetch current destination
    const current = await prisma.destination.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!current) {
      return res.status(404).json({ error: "Destination not found" });
    }

    // ✅ Delete image from Cloudinary if it exists
    if (current.imageUrl) {
      try {
        await deleteImageFromCloudinary(current.imageUrl);
      } catch (err) {
        console.warn("Failed to delete image:", err);
      }
    }

    // ✅ Delete destination
    await prisma.destination.delete({ where: { id } });

    res.status(204).json({ message: "Destination deleted successfully" });
  } catch (error) {
    console.error("Error deleting destination:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDestinationsByRegion = async (req: Request, res: Response) => {
  try {
    const { regionId } = req.params;
    const destinations = await prisma.destination.findMany({
      where: { regionId: regionId },
    });
    res.status(200).json(destinations);
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
