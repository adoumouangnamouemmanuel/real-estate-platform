import type { Request, Response, NextFunction } from "express";
import * as favoriteService from "./favorite.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export async function getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await favoriteService.getFavorites((req as AuthenticatedRequest).user.userId)); } catch (err) { next(err); }
}

export async function toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await favoriteService.toggleFavorite((req as AuthenticatedRequest).user.userId, req.params.propertyId as string);
    sendSuccess(res, result, 200, result.added ? "Property saved" : "Property unsaved");
  } catch (err) { next(err); }
}
