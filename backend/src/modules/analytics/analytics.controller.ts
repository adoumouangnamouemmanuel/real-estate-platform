import type { Request, Response, NextFunction } from "express";
import * as analyticsService from "./analytics.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export async function getSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = (req.query.period as any) || "30d";
    sendSuccess(res, await analyticsService.getSnapshot((req as AuthenticatedRequest).user.developerId!, period));
  } catch (err) { next(err); }
}
