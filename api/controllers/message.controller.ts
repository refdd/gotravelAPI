import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import cloudinary from "../lib/cloudinary";
import { getReceiverSocketId, io } from "../socket/socket";

export const getUsersForSidebar = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user.id;
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: authUserId,
        },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        participantIds: {
          hasEvery: [senderId, userToChatId],
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!conversation) {
      res.status(200).json([]);
      return;
    }

    res.status(200).json(conversation.messages);
  } catch (error: any) {
    console.error("Error in getMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    const uploadedImages = (req.files as Express.Multer.File[]) || [];

    let conversation = await prisma.conversation.findFirst({
      where: {
        participantIds: {
          hasEvery: [senderId, receiverId],
        },
      },
    });

    // the very first message is being sent, that's why we need to create a new conversation
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participantIds: {
            set: [senderId, receiverId],
          },
        },
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId,
        conversationId: conversation.id,
        body: message && message.trim().length > 0 ? message.trim() : null,
        attachments: uploadedImages.length
          ? {
              create: uploadedImages?.map((file: any) => ({
                type: file.cloudinary.fileType.toUpperCase(), // or determine type based on mimetype
                url: file.cloudinary.secure_url, // Use Cloudinary secure URL
                mimeType: file.mimetype,
                fileName: file.originalname,
                fileSize: file.cloudinary.bytes,
                width: file.cloudinary.width,
                height: file.cloudinary.height,
                durationSec: null, // Only for videos/audio todo
                metadata: {
                  cloudinaryPublicId: file.cloudinary.public_id,
                  cloudinaryAssetId: file.cloudinary.asset_id,
                  cloudinaryVersion: file.cloudinary.version,
                  format: file.cloudinary.format,
                  resourceType: file.cloudinary.resource_type,
                },
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePic: true,
          },
        },
      },
    });

    if (newMessage) {
      conversation = await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          messages: {
            connect: {
              id: newMessage.id,
            },
          },
        },
      });
    }

    // Socket io will go here
    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log("receiverSocketId", receiverSocketId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error: any) {
    console.error("Error in sendMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
