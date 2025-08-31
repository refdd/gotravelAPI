import { Request, Response } from "express";
import prisma from "../db/prisma";
import generateToken from "../utils/generateToken";
import { comparePassword, hashPassword } from "../utils/password";
import {
  upsertStreamUser,
  addUserToPublicChannels,
  generateStreamToken,
} from "../lib/stream";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update Stream Chat user on login
    try {
      await upsertStreamUser({
        id: user.id,
        name: user.name,
        image: user.imageUrl || undefined,
        email: user.email,
        online: true,
      });
    } catch (streamError) {
      console.error("Error updating Stream user on login:", streamError);
      // Don't fail the login if Stream Chat fails
    }

    // Generate JWT token for your app
    generateToken(user.id, res);

    // Generate Stream Chat token
    const streamToken = generateStreamToken(user.id);

    res.status(200).json({
      message: "Login successful",
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      streamToken: streamToken, // Include Stream token for frontend
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const avatar = `https://avatar.iran.liara.run/public/boy?username=${name}`;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
        imageUrl: avatar,
      },
    });

    if (newUser) {
      // Create Stream Chat user
      try {
        await upsertStreamUser({
          id: newUser.id,
          name: newUser.name,
          image: newUser.imageUrl || undefined,
          email: newUser.email,
          online: true,
        });

        // Add user to public channels
        await addUserToPublicChannels(newUser.id).then((result) => {
          console.log("User added to public channels", result);
        });
      } catch (streamError) {
        console.error("Error creating Stream user:", streamError);
        // Don't fail the signup if Stream Chat fails, but log it
      }

      // Generate JWT token for your app
      generateToken(newUser.id, res);

      // Generate Stream Chat token
      const streamToken = generateStreamToken(newUser.id);

      res.status(201).json({
        message: "User created successfully",
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        imageUrl: newUser.imageUrl,
        streamToken: streamToken, // Include Stream token for frontend
      });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    // Generate fresh Stream token for the current session
    const streamToken = generateStreamToken(user.id);

    res.json({
      ...user,
      streamToken: streamToken,
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Update Stream Chat user to offline status
    if (req.user) {
      try {
        await upsertStreamUser({
          id: req.user.id,
          name: req.user.name,
          image: req.user.imageUrl || undefined,
          email: req.user.email,
          online: false,
        });
      } catch (streamError) {
        console.error("Error updating Stream user on logout:", streamError);
        // Don't fail the logout if Stream Chat fails
      }
    }

    // Clear the session cookie
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
