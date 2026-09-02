import type { Request, Response, NextFunction } from "express";
import * as propertyService from "./property.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function getProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = {
      q: req.query.q as string | undefined,
      category: req.query.category as any,
      listingType: req.query.listingType as any,
      city: req.query.city as string | undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      minBedrooms: req.query.minBedrooms ? Number(req.query.minBedrooms) : undefined,
      sort: req.query.sort as any,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };
    const result = await propertyService.getProperties(params);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getPropertyBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const property = await propertyService.getPropertyBySlug(req.params.slug as string);
    sendSuccess(res, property);
  } catch (err) { next(err); }
}

export async function getRelatedProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    const properties = await propertyService.getRelatedProperties(req.params.id as string, limit);
    sendSuccess(res, properties);
  } catch (err) { next(err); }
}
