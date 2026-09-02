import type { Request, Response, NextFunction } from "express";
import * as uploadService from "./upload.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded", code: "BAD_REQUEST" });
      return;
    }
    const folder = (req.body.folder as string) || "listings";
    const result = uploadService.saveFile(req.file.originalname, req.file.buffer, folder);
    sendSuccess(res, result, 201, "File uploaded");
  } catch (err) {
    next(err);
  }
}

export async function deleteUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await uploadService.deleteUpload(req.params.publicId as string);
    sendSuccess(res, null, 200, "Upload deleted");
  } catch (err) {
    next(err);
  }
}
