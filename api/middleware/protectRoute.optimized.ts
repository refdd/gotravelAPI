import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";

interface DecodedToken extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    export interface Request {
      user: {
        id: string;
        name: string;
        email: string;
        imageUrl: string;
        role: string;
      };
    }
  }
}

// ✅ OPTIMIZED: In-memory cache for user data
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ✅ OPTIMIZED: Cache cleanup function
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

// ✅ OPTIMIZED: Cached user lookup
const getCachedUser = async (userId: string) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      role: true,
    },
  });

  if (user) {
    userCache.set(userId, { user, timestamp: Date.now() });
  }

  return user;
};

// ✅ OPTIMIZED: Rate limiting for authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

const isRateLimited = (ip: string): boolean => {
  const attempts = authAttempts.get(ip);
  if (!attempts) return false;

  const now = Date.now();
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    authAttempts.delete(ip);
    return false;
  }

  return attempts.count >= MAX_ATTEMPTS;
};

const recordAuthAttempt = (ip: string, success: boolean) => {
  if (success) {
    authAttempts.delete(ip);
    return;
  }

  const attempts = authAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  authAttempts.set(ip, attempts);
};

// ✅ OPTIMIZED: Enhanced protectRoute middleware
const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";

    // ✅ OPTIMIZED: Rate limiting check
    if (isRateLimited(clientIP)) {
      res.status(429).json({
        error: "Too many authentication attempts. Please try again later.",
      });
      return;
    }

    const token = req.cookies.jwt;

    if (!token) {
      recordAuthAttempt(clientIP, false);
      res.status(401).json({ error: "Unauthorized - No token provided" });
      return;
    }

    // ✅ OPTIMIZED: JWT verification with better error handling
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    } catch (jwtError) {
      recordAuthAttempt(clientIP, false);
      res.status(401).json({ error: "Unauthorized - Invalid token" });
      return;
    }

    if (!decoded || !decoded.userId) {
      recordAuthAttempt(clientIP, false);
      res.status(401).json({ error: "Unauthorized - Invalid token payload" });
      return;
    }

    // ✅ OPTIMIZED: Use cached user lookup
    const user = await getCachedUser(decoded.userId);

    if (!user) {
      recordAuthAttempt(clientIP, false);
      res.status(404).json({ error: "User not found" });
      return;
    }

    // ✅ OPTIMIZED: Record successful authentication
    recordAuthAttempt(clientIP, true);

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl || "",
      role: user.role,
    };

    next();
  } catch (error: any) {
    console.error("Error in protectRoute middleware", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ OPTIMIZED: Role-based access control
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

// ✅ OPTIMIZED: Admin-only middleware
const requireAdmin = requireRole(["ADMIN"]);

// ✅ OPTIMIZED: Admin or Manager middleware
const requireAdminOrManager = requireRole(["ADMIN", "MANAGER"]);

export default protectRoute;
export { requireRole, requireAdmin, requireAdminOrManager, getCachedUser };
