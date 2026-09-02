import { Router } from "express";
import multer from "multer";
import type { RequestHandler } from "express";
import * as uploadController from "./upload.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = Router();
const authenticateHandler = authenticate as unknown as RequestHandler;
const developerOnly = authorize("PROPERTY_DEVELOPER") as unknown as RequestHandler;

// Configure multer to use memory storage (buffer in memory, then save to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

// POST /uploads/file — upload a single file
router.post(
  "/file",
  authenticateHandler,
  developerOnly,
  upload.single("file"),
  uploadController.uploadFile,
);

// DELETE /uploads/:publicId — delete an uploaded file
router.delete("/:publicId", authenticateHandler, developerOnly, uploadController.deleteUpload);

export default router;
