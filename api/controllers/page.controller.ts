import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

export const getAllPages = async (req: Request, res: Response) => {
  try {
    const pages = await prisma.pages.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(pages);
  } catch (error) {
    console.error("Error fetching pages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPageBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = await prisma.pages.findUnique({
      where: { slug },
    });
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }
    return res.status(200).json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = await prisma.pages.findUnique({
      where: { id },
    });
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }
    return res.status(200).json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createPage = async (req: Request, res: Response) => {
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
    } = req.body;

    // ✅ Optional: handle Cloudinary file upload
    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;

    const newPage = await prisma.pages.create({
      data: {
        title,
        slug,
        content,
        imageUrl,
        imageAlt,
        imageTitle,
        author,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        metaTitle,
        metaKeywords,
        metaDescription,
      },
    });

    return res.status(201).json(newPage);
  } catch (error: any) {
    console.error("Error creating page:", error);

    if (
      error.code === "P2002" &&
      (error.meta?.target as string[])?.includes("slug")
    ) {
      return res
        .status(409)
        .json({ error: "Slug already exists. Please choose a different one." });
    }

    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const updatePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Step 1: Fetch current page
    const currentPage = await prisma.pages.findUnique({
      where: { id },
      select: { slug: true, imageUrl: true },
    });

    if (!currentPage) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Step 2: Allowed fields
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
        // Skip unchanged slug
        if (field === "slug" && body.slug === currentPage.slug) continue;

        if (field === "publishedAt" && body.publishedAt) {
          updateData.publishedAt = new Date(body.publishedAt);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Step 3: Handle image update
    const uploadedImage = (req.file as any)?.cloudinary;

    if (uploadedImage?.secure_url) {
      // Delete old image if exists
      if (currentPage.imageUrl) {
        try {
          await deleteImageFromCloudinary(currentPage.imageUrl);
        } catch (deleteError) {
          console.warn("Failed to delete old image:", deleteError);
        }
      }

      updateData.imageUrl = uploadedImage.secure_url;
    }

    // Step 4: Perform update
    const updatedPage = await prisma.pages.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedPage);
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

    console.error("Error updating page:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const deletePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Step 1: Fetch current page
    const currentPage = await prisma.pages.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!currentPage) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Step 2: Delete image from Cloudinary if exists
    if (currentPage.imageUrl) {
      try {
        await deleteImageFromCloudinary(currentPage.imageUrl);
      } catch (deleteError) {
        console.warn("Failed to delete image:", deleteError);
      }
    }

    // Step 3: Delete page from database
    await prisma.pages.delete({ where: { id } });

    res.status(204).json({ message: "Page deleted successfully" });
  } catch (error) {
    console.error("Error creating page:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
