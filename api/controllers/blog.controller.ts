import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";
import { log } from "console";
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany();
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBlogDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    return res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        relatedTours: true, // Include related tours if needed
      },
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    return res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Your delete logic here
    // For example: await Blog.findByIdAndDelete(id);

    res.json({
      message: "Blog deleted successfully",
      id: id,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res
        .status(404)
        .json({ error: "Blog not found or already deleted" });
    }

    console.error("Error deleting blog:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteBlogsByIds = async (req: Request, res: Response) => {
  const { ids } = req.body; // Expect: { ids: ['id1', 'id2', ...] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "IDs are required" });
  }

  try {
    const blogs = await prisma.blog.findMany({
      where: { id: { in: ids } },
    });

    for (const blog of blogs) {
      if (blog.imageUrl) {
        await deleteImageFromCloudinary(blog.imageUrl);
      }
    }

    await prisma.blog.deleteMany({
      where: { id: { in: ids } },
    });

    return res.status(200).json({ message: "Blogs deleted successfully" });
  } catch (error) {
    console.error("Error deleting blogs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createBlog = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      content,
      imageTitle,
      author,
      publishedAt,
      metaTitle,
      metaKeywords,
      metaDescription,
      relatedTourIds = [],
    } = req.body;

    // ✅ If an image was uploaded
    const uploadedImage = (req.file as any)?.cloudinary;
    console.log("Uploaded image data:", req.file);

    const imageUrl = uploadedImage?.secure_url;
    let relatedTourIdsParsed: string[] = [];
    relatedTourIdsParsed = JSON.parse(relatedTourIds);
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        imageUrl,
        imageTitle,
        author,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        metaTitle,
        metaKeywords,
        metaDescription,
        relatedTours: {
          connect: relatedTourIdsParsed?.map((id: string) => ({ id })),
        },
      },
    });

    res.status(201).json(blog);
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
    console.error("Error creating blog:", error);
    res.status(500).json({ error: "Internal server error", message: error });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch current blog to compare the existing slug
    const currentBlog = await prisma.blog.findUnique({
      where: { id },
      select: { slug: true, imageUrl: true },
    });

    if (!currentBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const allowedFields: (keyof typeof req.body)[] = [
      "title",
      "slug",
      "content",
      "imageUrl",
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
        // Skip slug if it is the same as the current one
        if (field === "slug" && req.body.slug === currentBlog.slug) {
          continue;
        }
        updateData[field] = req.body[field];
      }
    }
    // Handle image update
    const uploadedImage = (req.file as any)?.cloudinary;
    console.log("Uploaded image data:", req.file);

    if (uploadedImage?.secure_url) {
      // Delete old image from Cloudinary if it exists
      if (currentBlog.imageUrl) {
        try {
          await deleteImageFromCloudinary(currentBlog.imageUrl);
        } catch (deleteError) {
          console.error("Error deleting old image:", deleteError);
          // Continue with update even if old image deletion fails
        }
      }

      // Set new image URL
      updateData.imageUrl = uploadedImage.secure_url;
    }

    // Handle related tours update
    if (req.body.relatedTourIds) {
      const relatedTourIdsParsed = JSON.parse(req.body.relatedTourIds);
      updateData.relatedTours = relatedTourIdsParsed.map((id: string) => id);
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        ...updateData,
        relatedTours: {
          set: updateData.relatedTours?.map((id: string) => ({ id })),
        },
      },
      include: { relatedTours: true },
    });

    res.status(200).json(updatedBlog);
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
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error", message: error });
  }
};
