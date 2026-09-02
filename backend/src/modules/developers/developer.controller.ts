import type { Request, Response, NextFunction } from "express";
import * as developerService from "./developer.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function getDevelopers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = { q: req.query.q as string | undefined, city: req.query.city as string | undefined, sort: req.query.sort as any, page: req.query.page ? Number(req.query.page) : undefined, pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined };
    sendSuccess(res, await developerService.getDevelopers(params));
  } catch (err) { next(err); }
}

export async function getDeveloperBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await developerService.getDeveloperBySlug(req.params.slug as string)); } catch (err) { next(err); }
}

export async function getDeveloperListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = { page: req.query.page ? Number(req.query.page) : undefined, pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined };
    sendSuccess(res, await developerService.getDeveloperListings(req.params.id as string, params));
  } catch (err) { next(err); }
}
