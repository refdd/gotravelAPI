import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

export const getAllRegions = async (req: Request, res: Response) => {
  try {
    const regions = await prisma.region.findMany();
    res.status(200).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRegionBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const region = await prisma.region.findUnique({
    where: { slug },
  });
  res.status(200).json(region);
  try {
  } catch (error) {
    console.error("Error fetching region:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getRegionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const region = await prisma.region.findUnique({
    where: { id },
  });
  res.status(200).json(region);
  try {
  } catch (error) {
    console.error("Error fetching region:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const createRegion = async (req: Request, res: Response) => {
  try {
    const {
      name,
      title,
      slug,
      description,
      code,
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
      iconUrl,
    } = req.body;

    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;

    // Convert types
    const newRegion = await prisma.region.create({
      data: {
        name,
        title,
        slug,
        description,
        code,
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
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        iconUrl,
      },
    });

    return res.status(201).json(newRegion);
  } catch (error: any) {
    console.error("Error creating region:", error);

    if (error.code === "P2002") {
      // Prisma unique constraint violation
      return res.status(409).json({
        error: `Unique constraint failed on field: ${error.meta?.target}`,
      });
    }

    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const updateRegion = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Step 1: Fetch current region
    const currentRegion = await prisma.region.findUnique({
      where: { id },
      select: { slug: true, imageUrl: true },
    });

    if (!currentRegion) {
      return res.status(404).json({ error: "Region not found" });
    }

    // Step 2: Define fields allowed for update
    const allowedFields: (keyof typeof req.body)[] = [
      "name",
      "title",
      "slug",
      "description",
      "code",
      "metaTitle",
      "metaKeywords",
      "metaDescription",
      "imageTitle",
      "imageAlt",
      "sitemapChangefreq",
      "sitemapPriority",
      "isActive",
      "hideInHome",
      "hideInSitemap",
      "hideInMenu",
      "hideInSubMenu",
      "sortOrder",
      "iconUrl",
    ];

    const updateData: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "slug" && req.body.slug === currentRegion.slug) {
          continue;
        }

        // Convert specific types from string to correct type
        if (
          [
            "isActive",
            "hideInHome",
            "hideInSitemap",
            "hideInMenu",
            "hideInSubMenu",
          ].includes(field as string)
        ) {
          updateData[field] = req.body[field] === "true";
        } else if (["sitemapPriority", "sortOrder"].includes(field as string)) {
          updateData[field] = req.body[field]
            ? Number(req.body[field])
            : undefined;
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    // Step 3: Handle image upload
    const uploadedImage = (req.file as any)?.cloudinary;

    if (uploadedImage?.secure_url) {
      // Delete old image if exists
      if (currentRegion.imageUrl) {
        try {
          await deleteImageFromCloudinary(currentRegion.imageUrl);
        } catch (err) {
          console.warn("Failed to delete old image:", err);
        }
      }

      updateData.imageUrl = uploadedImage.secure_url;
    }

    // Step 4: Update region
    const updatedRegion = await prisma.region.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedRegion);
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (error.meta?.target as string[])?.includes("slug")
    ) {
      return res
        .status(400)
        .json({ error: "Slug already exists. Please choose a different one." });
    }

    console.error("Error updating region:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const deleteRegion = async (req: Request, res: Response) => {
  const { id } = req.params;

  const region = await prisma.region.findUnique({
    where: { id },
  });

  if (!region) {
    return res.status(404).json({ error: "Region not found" });
  }

  if (region.imageUrl) {
    await deleteImageFromCloudinary(region.imageUrl);
  }

  await prisma.region.delete({
    where: { id },
  });

  res.status(200).json({ message: "Region deleted successfully" });
  try {
  } catch (error) {
    console.error("Error deleting region:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
