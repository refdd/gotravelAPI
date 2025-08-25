import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

export const getAllWikis = async (req: Request, res: Response) => {
  try {
    const wikis = await prisma.wikis.findMany();
    res.status(200).json(wikis);
  } catch (error) {
    console.error("Error fetching wiks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getWikiBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const wiki = await prisma.wikis.findUnique({
      where: { slug },
      include: {
        relatedTours: true, // Include related tours if needed
      },
    });
    if (!wiki) {
      return res.status(404).json({ error: "Wiki not found" });
    }
    res.status(200).json(wiki);
  } catch (error) {
    console.error("Error fetching wiks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getWikiById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const wiki = await prisma.wikis.findUnique({
      where: { id },
      include: {
        relatedTours: true, // Include related tours if needed
      },
    });
    if (!wiki) {
      return res.status(404).json({ error: "Wiki not found" });
    }
    res.status(200).json(wiki);
  } catch (error) {
    console.error("Error fetching wiks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createWiki = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      content,
      imageAlt,
      imageTitle,
      author,
      publishedAt,
      metaTitle,
      metaKeywords,
      metaDescription,
      relatedTourIds, // expects an array of tour IDs
    } = req.body;

    // ✅ Validation: title is required
    if (!title) {
      return res.status(400).json({ error: "Wiki title is required" });
    }

    // ✅ Parse publishedAt if present
    const parsedPublishedAt = publishedAt ? new Date(publishedAt) : undefined;

    // ✅ Cloudinary image (if available)
    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;

    // ✅ Handle relatedTours (if provided as JSON string or array)
    let relatedTourIdsParsed: string[] = [];
    relatedTourIdsParsed = JSON.parse(relatedTourIds);

    // ✅ Create wiki
    const newWiki = await prisma.wikis.create({
      data: {
        title,
        slug,
        content,
        imageUrl,
        imageAlt,
        imageTitle,
        author,
        publishedAt: parsedPublishedAt,
        metaTitle,
        metaKeywords,
        metaDescription,
        relatedTours: {
          connect: relatedTourIdsParsed?.map((id: string) => ({ id })),
        },
      },
      include: {
        relatedTours: true,
      },
    });

    res.status(201).json(newWiki);
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

    console.error("Error creating wiki:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const updateWiki = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Step 1: Find existing wiki
    const currentWiki = await prisma.wikis.findUnique({
      where: { id },
      select: { slug: true, imageUrl: true },
    });

    if (!currentWiki) {
      return res.status(404).json({ error: "Wiki not found" });
    }

    // Step 2: Define fields that can be updated
    const allowedFields = [
      "title",
      "slug",
      "content",
      "imageAlt",
      "imageTitle",
      "author",
      "publishedAt",
      "metaTitle",
      "metaKeywords",
      "metaDescription",
    ] as const;

    const body = req.body as Record<string, any>;
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "slug" && body.slug === currentWiki.slug) continue;

        if (field === "publishedAt" && body.publishedAt) {
          updateData.publishedAt = new Date(body.publishedAt);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Step 3: Handle image upload
    const uploadedImage = (req.file as any)?.cloudinary;

    if (uploadedImage?.secure_url) {
      if (currentWiki.imageUrl) {
        try {
          await deleteImageFromCloudinary(currentWiki.imageUrl);
        } catch (err) {
          console.warn("Failed to delete old image:", err);
        }
      }
      updateData.imageUrl = uploadedImage.secure_url;
    }

    // Step 4: Handle relatedTours update
    if (Array.isArray(body.relatedTourIds)) {
      updateData.relatedTours = {
        set: body.relatedTourIds.map((id: string) => ({ id })),
      };
    } else if (typeof body.relatedTourIds === "string") {
      try {
        const ids = JSON.parse(body.relatedTourIds);
        if (Array.isArray(ids)) {
          updateData.relatedTours = {
            set: ids.map((id: string) => ({ id })),
          };
        }
      } catch (err) {
        return res.status(400).json({ error: "Invalid relatedTourIds format" });
      }
    }

    // Step 5: Perform update
    const updatedWiki = await prisma.wikis.update({
      where: { id },
      data: updateData,
      include: { relatedTours: true },
    });

    res.status(200).json(updatedWiki);
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

    console.error("Error updating wiki:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const deleteWiki = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Step 1: Fetch current page
    const currentWiki = await prisma.wikis.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!currentWiki) {
      return res.status(404).json({ error: "Wiki not found" });
    }

    // Step 2: Delete image from Cloudinary if exists
    if (currentWiki.imageUrl) {
      try {
        await deleteImageFromCloudinary(currentWiki.imageUrl);
      } catch (deleteError) {
        console.warn("Failed to delete image:", deleteError);
      }
    }

    // Step 3: Delete page from database
    await prisma.wikis.delete({ where: { id } });

    res.status(200).json({ message: "Wiki deleted successfully" });
  } catch (error) {
    console.error("Error creating wiki:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
