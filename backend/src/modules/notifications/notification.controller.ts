import type { Request, Response, NextFunction } from "express";
import * as notificationService from "./notification.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = { status: req.query.status as any, category: req.query.category as any, sort: req.query.sort as any, page: req.query.page ? Number(req.query.page) : undefined, pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined };
    sendSuccess(res, await notificationService.getNotifications((req as AuthenticatedRequest).user.developerId!, params));
  } catch (err) { next(err); }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await notificationService.getUnreadCount((req as AuthenticatedRequest).user.developerId!)); } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await notificationService.markAsRead((req as AuthenticatedRequest).user.developerId!, req.params.id as string)); } catch (err) { next(err); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await notificationService.markAllAsRead((req as AuthenticatedRequest).user.developerId!)); } catch (err) { next(err); }
}
