import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

export const createReview = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      rating,
      comment,
      imageAlt,
      imageTitle,
      author,
      publishedAt,
      metaTitle,
      metaKeywords,
      metaDescription,
    } = req.body;
    // ✅ If an image was uploaded
    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;

    const review = await prisma.review.create({
      data: {
        name,
        email,
        rating: parseInt(rating, 10),
        comment,
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
    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch current review to compare / get existing image
    const currentReview = await prisma.review.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!currentReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Allow only whitelisted updatable fields
    const allowedFields: (keyof typeof req.body)[] = [
      "name",
      "email",
      "rating",
      "comment",
      "imageUrl",
      "imageAlt",
      "imageTitle",
      "author",
      "publishedAt",
      "metaTitle",
      "metaKeywords",
      "metaDescription",
    ];

    const updateData: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "rating") {
          const parsed = parseInt(req.body.rating, 10);
          if (!Number.isNaN(parsed)) updateData.rating = parsed;
          continue;
        }
        if (field === "publishedAt") {
          updateData.publishedAt = req.body.publishedAt
            ? new Date(req.body.publishedAt)
            : null;
          continue;
        }
        updateData[field] = req.body[field];
      }
    }

    // Handle image replacement via Cloudinary
    const uploadedImage = (req.file as any)?.cloudinary;
    if (uploadedImage?.secure_url) {
      // Try deleting the old image (non-fatal on failure)
      if (currentReview.imageUrl) {
        try {
          await deleteImageFromCloudinary(currentReview.imageUrl);
        } catch (deleteErr) {
          console.error("Error deleting old image:", deleteErr);
        }
      }
      updateData.imageUrl = uploadedImage.secure_url;
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(updatedReview);
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Adjust message if you know the unique field (e.g., email) in your schema
      return res
        .status(400)
        .json({ error: "A record with this unique value already exists." });
    }

    console.error("Error editing review:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", message: error?.message });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany();
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id },
    });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.status(200).json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({
      where: { id },
    });
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
