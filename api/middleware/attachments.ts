import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
} from "cloudinary";
import multer, { FileFilterCallback } from "multer";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Use NodeJS built-in __dirname since you're in CommonJS mode
const tempDir = path.join(__dirname, "../temp");

// Ensure temp directory exists
(async () => {
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create temp directory:", err);
  }
})();

// Generate random public_id
function generateRandomPublicId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Detect file type based on mimetype
function getFileType(mimetype: string): "image" | "video" | "audio" | "file" {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "file";
}

// Get Cloudinary resource type
function getCloudinaryResourceType(
  fileType: string
): "image" | "video" | "raw" {
  switch (fileType) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "audio":
      return "video"; // Cloudinary treats audio as video
    default:
      return "raw"; // For files/documents
  }
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// File filters
const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ];
  allowedTypes.includes(file.mimetype.toLowerCase())
    ? cb(null, true)
    : cb(new Error("Not a valid image file"));
};

const videoFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "video/mp4",
    "video/avi",
    "video/mkv",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
    "video/m4v",
  ];
  allowedTypes.includes(file.mimetype.toLowerCase())
    ? cb(null, true)
    : cb(new Error("Not a valid video file"));
};

const audioFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "audio/m4a",
    "audio/wma",
    "audio/mpeg",
  ];
  allowedTypes.includes(file.mimetype.toLowerCase())
    ? cb(null, true)
    : cb(new Error("Not a valid audio file"));
};

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-rar-compressed",
    "application/json",
    "application/xml",
  ];
  allowedTypes.includes(file.mimetype.toLowerCase())
    ? cb(null, true)
    : cb(new Error("Not a valid file type"));
};

const attachmentFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const fileType = getFileType(file.mimetype);

  // Check against all allowed types
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ];
  const videoTypes = [
    "video/mp4",
    "video/avi",
    "video/mkv",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
    "video/m4v",
  ];
  const audioTypes = [
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "audio/m4a",
    "audio/wma",
    "audio/mpeg",
  ];
  const fileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-rar-compressed",
    "application/json",
    "application/xml",
  ];

  const allAllowedTypes = [
    ...imageTypes,
    ...videoTypes,
    ...audioTypes,
    ...fileTypes,
  ];

  allAllowedTypes.includes(file.mimetype.toLowerCase())
    ? cb(null, true)
    : cb(new Error("Not a valid attachment type"));
};

// Multer upload instances with different size limits
const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const audioUpload = multer({
  storage,
  fileFilter: audioFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const fileUpload = multer({
  storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const attachmentUpload = multer({
  storage,
  fileFilter: attachmentFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (max for all types)
});

// Upload to Cloudinary helper
async function uploadToCloudinary(
  file: Express.Multer.File,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse & { fileType: string }> {
  const fileType = getFileType(file.mimetype);
  const resourceType = getCloudinaryResourceType(fileType);
  const folder = `attachments/${fileType}s`;

  // Generate appropriate public_id
  const publicId = generateRandomPublicId();

  const uploadOptions: UploadApiOptions = {
    resource_type: resourceType,
    folder,
    use_filename: true,
    unique_filename: false,
    public_id: publicId,
    overwrite: true,
    access_mode: "public", // ✨ make it publicly deliverable
    ...options,
  };

  // Add transformations based on file type
  if (fileType === "image") {
    uploadOptions.transformation = [
      { width: 1000, height: 1000, crop: "limit" },
    ];
  } else if (fileType === "video") {
    uploadOptions.transformation = [
      { width: 1280, height: 720, crop: "limit" },
    ];
  }
  // Audio and file types don't need transformations

  try {
    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
    await fs.unlink(file.path); // Remove temp file
    return { ...result, fileType };
  } catch (error) {
    await fs
      .unlink(file.path)
      .catch((e) => console.error("Failed to clean up file:", e));
    throw error;
  }
}

// Upload middleware for attachments
const attachmentMiddleware = {
  // Single attachment (any type)
  single: (fieldName = "attachment") => {
    return (req: Request, res: Response, next: NextFunction) => {
      attachmentUpload.single(fieldName)(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return next();

        try {
          const result = await uploadToCloudinary(req.file);
          (req.file as any).cloudinary = result;
          next();
        } catch (error: any) {
          res.status(500).json({ error: "Upload failed: " + error.message });
        }
      });
    };
  },

  // Multiple attachments (mixed types)
  multiple: (fieldName = "attachments", maxCount = 10) => {
    return (req: Request, res: Response, next: NextFunction) => {
      attachmentUpload.array(fieldName, maxCount)(
        req,
        res,
        async (err: any) => {
          if (err) return res.status(400).json({ error: err.message });
          if (!req.files || !(req.files instanceof Array)) return next();

          try {
            const results = await Promise.all(
              req.files.map((file) => uploadToCloudinary(file))
            );
            req.files.forEach(
              (file, i) => ((file as any).cloudinary = results[i])
            );
            next();
          } catch (error: any) {
            res.status(500).json({ error: "Upload failed: " + error.message });
          }
        }
      );
    };
  },

  // Specific type uploads
  images: (fieldName = "images", maxCount = 10) => {
    return (req: Request, res: Response, next: NextFunction) => {
      imageUpload.array(fieldName, maxCount)(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.files || !(req.files instanceof Array)) return next();

        try {
          const results = await Promise.all(
            req.files.map((file) => uploadToCloudinary(file))
          );
          req.files.forEach(
            (file, i) => ((file as any).cloudinary = results[i])
          );
          next();
        } catch (error: any) {
          res.status(500).json({ error: "Upload failed: " + error.message });
        }
      });
    };
  },

  videos: (fieldName = "videos", maxCount = 5) => {
    return (req: Request, res: Response, next: NextFunction) => {
      videoUpload.array(fieldName, maxCount)(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.files || !(req.files instanceof Array)) return next();

        try {
          const results = await Promise.all(
            req.files.map((file) => uploadToCloudinary(file))
          );
          req.files.forEach(
            (file, i) => ((file as any).cloudinary = results[i])
          );
          next();
        } catch (error: any) {
          res.status(500).json({ error: "Upload failed: " + error.message });
        }
      });
    };
  },

  audios: (fieldName = "audios", maxCount = 5) => {
    return (req: Request, res: Response, next: NextFunction) => {
      audioUpload.array(fieldName, maxCount)(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.files || !(req.files instanceof Array)) return next();

        try {
          const results = await Promise.all(
            req.files.map((file) => uploadToCloudinary(file))
          );
          req.files.forEach(
            (file, i) => ((file as any).cloudinary = results[i])
          );
          next();
        } catch (error: any) {
          res.status(500).json({ error: "Upload failed: " + error.message });
        }
      });
    };
  },

  files: (fieldName = "files", maxCount = 5) => {
    return (req: Request, res: Response, next: NextFunction) => {
      fileUpload.array(fieldName, maxCount)(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.files || !(req.files instanceof Array)) return next();

        try {
          const results = await Promise.all(
            req.files.map((file) => uploadToCloudinary(file))
          );
          req.files.forEach(
            (file, i) => ((file as any).cloudinary = results[i])
          );
          next();
        } catch (error: any) {
          res.status(500).json({ error: "Upload failed: " + error.message });
        }
      });
    };
  },

  // Mixed fields for specific attachment types
  mixed: (
    fields = [
      { name: "images", maxCount: 5 },
      { name: "videos", maxCount: 2 },
      { name: "audios", maxCount: 3 },
      { name: "files", maxCount: 5 },
    ]
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      attachmentUpload.fields(fields)(req, res, async (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.files || Object.keys(req.files).length === 0) return next();

        const allFiles = Object.values(req.files).flat();

        try {
          const results = await Promise.all(
            allFiles.map((file) => uploadToCloudinary(file))
          );

          let i = 0;
          for (const field of fields) {
            const files =
              (req.files as Record<string, Express.Multer.File[]>)[
                field.name
              ] || [];
            for (const file of files) {
              (file as any).cloudinary = results[i++];
            }
          }

          next();
        } catch (error: any) {
          res.status(500).json({ error: "Upload failed: " + error.message });
        }
      });
    };
  },
};

export default attachmentMiddleware;
