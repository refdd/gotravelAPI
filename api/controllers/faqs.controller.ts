import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

export const getAllFaqs = async (req: Request, res: Response) => {
  try {
    const faqs = await prisma.faqs.findMany();
    res.status(200).json(faqs);
  } catch (error) {
    console.error("Error fetching faqs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFaqsByDestination = async (req: Request, res: Response) => {
  const { destination } = req.params;
  try {
    const faqs = await prisma.faqs.findMany({
      where: { destinationId: destination },
    });
    res.status(200).json(faqs);
  } catch (error) {
    console.error("Error fetching faqs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFaqsById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const faqs = await prisma.faqs.findUnique({
      where: { id },
    });
    if (!faqs) {
      return res.status(404).json({ error: "Faq not found" });
    }
    res.status(200).json(faqs);
  } catch (error) {
    console.error("Error fetching faqs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const {
      question,
      answer,
      regionId,
      destinationId,
      imageAlt,
      imageTitle,
      author,
      publishedAt,
      metaTitle,
      metaKeywords,
      metaDescription,
    } = req.body;

    // ✅ Required fields only
    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "Question and answer are required" });
    }

    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;
    const parsedPublishedAt = publishedAt ? new Date(publishedAt) : undefined;

    const newFaq = await prisma.faqs.create({
      data: {
        question,
        answer,
        regionId: regionId || null,
        destinationId: destinationId || null,
        imageUrl,
        imageAlt,
        imageTitle,
        author,
        publishedAt: parsedPublishedAt,
        metaTitle,
        metaKeywords,
        metaDescription,
      },
      include: {
        destination: true,
      },
    });

    res.status(201).json(newFaq);
  } catch (error: any) {
    console.error("Error creating faq:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      question,
      answer,
      regionId,
      destinationId,
      imageAlt,
      imageTitle,
      author,
      publishedAt,
      metaTitle,
      metaKeywords,
      metaDescription,
    } = req.body;

    // ✅ Required fields only
    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "Question and answer are required" });
    }

    const uploadedImage = (req.file as any)?.cloudinary;
    const imageUrl = uploadedImage?.secure_url;

    const parsedPublishedAt = publishedAt ? new Date(publishedAt) : undefined;

    const updatedFaq = await prisma.faqs.update({
      where: { id },
      data: {
        question,
        answer,
        regionId: regionId || null,
        destinationId: destinationId || null,
        imageUrl,
        imageAlt,
        imageTitle,
        author,
        publishedAt: parsedPublishedAt,
        metaTitle,
        metaKeywords,
        metaDescription,
      },
      include: {
        destination: true,
      },
    });

    res.status(200).json(updatedFaq);
  } catch (error) {
    console.error("Error fetching faqs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const faq = await prisma.faqs.findUnique({
      where: { id },
    });
    if (faq?.imageUrl) {
      await deleteImageFromCloudinary(faq.imageUrl);
    }
    await prisma.faqs.delete({
      where: { id },
    });
    res.status(200).json({ message: "Faq deleted successfully" });
  } catch (error) {
    console.error("Error fetching faqs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
