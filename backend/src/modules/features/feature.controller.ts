import type { Request, Response, NextFunction } from "express";
import * as featureService from "./feature.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function getFeatures(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    sendSuccess(res, await featureService.getFeatures(category));
  } catch (err) { next(err); }
}
