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
const videoFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  file.mimetype.startsWith("video/")
    ? cb(null, true)
    : cb(new Error("Not a video file"));
};

const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  file.mimetype.startsWith("image/")
    ? cb(null, true)
    : cb(new Error("Not an image file"));
};

const mixedFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")
    ? cb(null, true)
    : cb(new Error("Not a valid media file"));
};

// Multer upload instances
const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});
const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
const mixedUpload = multer({
  storage,
  fileFilter: mixedFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Upload to Cloudinary helper
async function uploadToCloudinary(
  file: Express.Multer.File,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> {
  const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";
  const folder = `${resourceType}s`;

  // Extract original file name without extension
  // Generate random public_id for images, keep original name for videos
  const publicId =
    resourceType === "image"
      ? generateRandomPublicId()
      : path.parse(file.originalname).name;

  const uploadOptions: UploadApiOptions = {
    resource_type: resourceType,
    folder,
    use_filename: true,
    unique_filename: false, // <--- critical to prevent duplicates
    public_id: publicId, // <--- explicitly set name
    overwrite: true, // <--- optional, overwrite if same name exists
    ...options,
    transformation: [
      resourceType === "video"
        ? { width: 1280, height: 720, crop: "limit" }
        : { width: 1000, height: 1000, crop: "limit" },
    ],
  };

  try {
    const result = await cloudinary.uploader.upload(file.path, uploadOptions);
    await fs.unlink(file.path); // Remove temp file
    return result;
  } catch (error) {
    await fs
      .unlink(file.path)
      .catch((e) => console.error("Failed to clean up file:", e));
    throw error;
  }
}

// Upload middleware
const upload = {
  singleVideo: (fieldName = "video") => {
    return (req: Request, res: Response, next: NextFunction) => {
      videoUpload.single(fieldName)(req, res, async (err: any) => {
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

  singleImage: (fieldName = "image") => {
    return (req: Request, res: Response, next: NextFunction) => {
      imageUpload.single(fieldName)(req, res, async (err: any) => {
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

  multipleVideos: (fieldName = "videos", maxCount = 5) => {
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

  multipleImages: (fieldName = "images", maxCount = 10) => {
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

  mixed: (
    fields = [
      { name: "video", maxCount: 1 },
      { name: "image", maxCount: 1 },
    ]
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      mixedUpload.fields(fields)(req, res, async (err: any) => {
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

export default upload;
