import { Request, Response } from "express";
import { ai } from "../lib/gemini";
import prisma from "../db/prisma";
import { io } from "../socket/socket";

export const chatWthGemini = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const receiverId = req.user.id;
    const { id: senderId } = req.params;
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        // thinkingConfig: {
        //   thinkingBudget: 0,
        // },
        systemInstruction:
          "You are a man. Your name is refat. and you are a tour guide",
      },
    });
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        conversationId: conversation.id,
        body:
          response?.text && response?.text.trim().length > 0
            ? response?.text.trim()
            : null,
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
    io.to(receiverId).emit("newMessage", newMessage);

    res.status(201).json(newMessage);

    //   console.log(response.text);
  } catch (error) {
    console.error("Error chatting with Gemini:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
