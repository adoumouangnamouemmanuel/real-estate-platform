import type { Request, Response, NextFunction } from "express";
import * as appointmentService from "./appointment.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export async function getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devReq = req as AuthenticatedRequest;
    const params = { q: req.query.q as string | undefined, status: req.query.status as any, timeframe: req.query.timeframe as any, sort: req.query.sort as any, page: req.query.page ? Number(req.query.page) : undefined, pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined };
    sendSuccess(res, await appointmentService.getAppointments(devReq.user.developerId!, params));
  } catch (err) { next(err); }
}

export async function getStatusCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await appointmentService.getStatusCounts((req as AuthenticatedRequest).user.developerId!)); } catch (err) { next(err); }
}

export async function getAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await appointmentService.getAppointment((req as AuthenticatedRequest).user.developerId!, req.params.id as string)); } catch (err) { next(err); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await appointmentService.updateStatus((req as AuthenticatedRequest).user.developerId!, req.params.id as string, req.body.status)); } catch (err) { next(err); }
}

export async function reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await appointmentService.reschedule((req as AuthenticatedRequest).user.developerId!, req.params.id as string, req.body.scheduledFor)); } catch (err) { next(err); }
}

export async function bulkUpdateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await appointmentService.bulkUpdateStatus((req as AuthenticatedRequest).user.developerId!, req.body.ids, req.body.status)); } catch (err) { next(err); }
}
