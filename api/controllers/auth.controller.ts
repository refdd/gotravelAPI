import { Request, Response } from "express";
import prisma from "../db/prisma";
import generateToken from "../utils/generateToken";
import { comparePassword, hashPassword } from "../utils/password";

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
    generateToken(user.id, res);
    res.status(200).json({
      message: "Login successful",
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      imageUrl: user.imageUrl,
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
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await hashPassword(password);
    // https://avatar-placeholder.iran.liara.run/
    const avatar = `https://avatar.iran.liara.run/public/boy?username=${name}`;
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER", // Default to 'user' if no role is provided
        imageUrl: avatar, // Use the generated avatar URL
      },
    });
    if (newUser) {
      //generate token
      generateToken(newUser.id, res);
      res.status(201).json({
        message: "User created successfully",
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        imageUrl: newUser.imageUrl,
      });
    }
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getMe = async (req: Request, res: Response) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the session or token
    res.clearCookie("jwt"); // Assuming you're using cookies for session management
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
