import type { Request, Response, NextFunction } from "express";
import * as dashboardService from "./dashboard.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await dashboardService.getDashboard((req as AuthenticatedRequest).user.developerId!)); } catch (err) { next(err); }
}
