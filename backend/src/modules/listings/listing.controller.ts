import type { Request, Response, NextFunction } from "express";
import * as listingService from "./listing.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export async function getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const params = { q: req.query.q as string | undefined, status: req.query.status as any, category: req.query.category as any, listingType: req.query.listingType as any, sort: req.query.sort as any, page: req.query.page ? Number(req.query.page) : undefined, pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined };
    const result = await listingService.getListings(devReq.user.developerId!, params);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getStatusCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const counts = await listingService.getStatusCounts(devReq.user.developerId!);
    sendSuccess(res, counts);
  } catch (err) { next(err); }
}

export async function getListingForEdit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const listing = await listingService.getListingForEdit(devReq.user.developerId!, req.params.id as string);
    sendSuccess(res, listing);
  } catch (err) { next(err); }
}

export async function createListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const listing = await listingService.createListing(devReq.user.developerId!, req.body);
    sendSuccess(res, listing, 201, "Listing created");
  } catch (err) { next(err); }
}

export async function updateListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const listing = await listingService.updateListing(devReq.user.developerId!, req.params.id as string, req.body);
    sendSuccess(res, listing, 200, "Listing updated");
  } catch (err) { next(err); }
}

export async function updateListingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const listing = await listingService.updateListingStatus(devReq.user.developerId!, req.params.id as string, req.body.status);
    sendSuccess(res, listing, 200, "Status updated");
  } catch (err) { next(err); }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    await listingService.deleteListing(devReq.user.developerId!, req.params.id as string);
    sendSuccess(res, null, 200, "Listing deleted");
  } catch (err) { next(err); }
}

export async function bulkUpdateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const result = await listingService.bulkUpdateStatus(devReq.user.developerId!, req.body.ids, req.body.status);
    sendSuccess(res, result, 200, "Bulk status updated");
  } catch (err) { next(err); }
}

export async function bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const result = await listingService.bulkDelete(devReq.user.developerId!, req.body.ids);
    sendSuccess(res, result, 200, "Bulk delete completed");
  } catch (err) { next(err); }
}
