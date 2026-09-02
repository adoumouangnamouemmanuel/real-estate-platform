import { prisma } from "../../config/prisma.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import type { PaginatedResult } from "../../utils/pagination.js";

type AptStatus = "REQUESTED" | "CONFIRMED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const VALID_TRANSITIONS: Record<AptStatus, AptStatus[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"],
  RESCHEDULED: ["RESCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [], CANCELLED: [], NO_SHOW: [],
};
const TERMINAL: AptStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

const HISTORY_MESSAGES: Record<AptStatus, string> = {
  REQUESTED: "Viewing requested.", CONFIRMED: "You confirmed the viewing.", RESCHEDULED: "You rescheduled the viewing.",
  COMPLETED: "Viewing marked complete.", CANCELLED: "You cancelled the request.", NO_SHOW: "Client did not show up.",
};

function isTerminal(s: string): boolean { return TERMINAL.includes(s as AptStatus); }
function isToday(d: Date): boolean { const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); }

export interface GetAppointmentsParams { q?: string; status?: string; timeframe?: string; sort?: string; page?: number; pageSize?: number; }

export async function getAppointments(developerId: string, params: GetAppointmentsParams = {}): Promise<PaginatedResult<any>> {
  const { skip, take, page, pageSize } = parsePagination(params);
  const where: any = { propertyDeveloperId: developerId };
  if (params.status) where.status = params.status;
  if (params.q) {
    where.OR = [
      { clientName: { contains: params.q, mode: "insensitive" } },
      { property: { title: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  let items = await prisma.appointment.findMany({
    where,
    orderBy: params.sort === "date_desc" ? { scheduledFor: "desc" } : { scheduledFor: "asc" },
    include: { property: { select: { id: true, title: true } }, history: { orderBy: { createdAt: "asc" } } },
  });

  if (params.timeframe) {
    items = items.filter(item => {
      if (isTerminal(item.status)) return false;
      const d = new Date(item.scheduledFor);
      if (params.timeframe === "today") return isToday(d);
      if (params.timeframe === "upcoming") return d.getTime() > Date.now();
      if (params.timeframe === "overdue") return d.getTime() < Date.now() && !isToday(d);
      return true;
    });
  }

  const total = items.length;
  return paginateResult(items.map(mapAppointment), total, page, pageSize);
}

export async function getStatusCounts(developerId: string) {
  const counts = await prisma.appointment.groupBy({ by: ["status"], where: { propertyDeveloperId: developerId }, _count: { status: true } });
  const result: Record<AptStatus, number> = { REQUESTED: 0, CONFIRMED: 0, RESCHEDULED: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0 };
  for (const c of counts) { const s = c.status as AptStatus; if (s in result) result[s] = c._count.status; }
  return result;
}

export async function getAppointment(developerId: string, id: string) {
  const apt = await prisma.appointment.findFirst({
    where: { id, propertyDeveloperId: developerId },
    include: { property: { select: { id: true, title: true } }, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!apt) throw new NotFoundError("Appointment not found");
  return mapAppointment(apt);
}

export async function updateStatus(developerId: string, id: string, status: string) {
  const apt = await prisma.appointment.findFirst({ where: { id, propertyDeveloperId: developerId }, include: { property: { select: { id: true, title: true } } } });
  if (!apt) throw new NotFoundError("Appointment not found");
  if (!VALID_TRANSITIONS[apt.status as AptStatus]?.includes(status as AptStatus)) {
    throw new BadRequestError(`Cannot move an appointment from ${apt.status} to ${status}.`, "INVALID_TRANSITION");
  }
  await prisma.appointment.update({ where: { id }, data: { status } });
  await prisma.appointmentHistory.create({ data: { appointmentId: id, type: `APPOINTMENT_${status}`, message: HISTORY_MESSAGES[status as AptStatus] } });
  const final = await prisma.appointment.findUnique({ where: { id }, include: { property: { select: { id: true, title: true } }, history: { orderBy: { createdAt: "asc" } } } });
  return mapAppointment(final!);
}

export async function reschedule(developerId: string, id: string, scheduledFor: string) {
  const apt = await prisma.appointment.findFirst({ where: { id, propertyDeveloperId: developerId } });
  if (!apt) throw new NotFoundError("Appointment not found");
  if (isTerminal(apt.status)) throw new BadRequestError(`A ${apt.status.toLowerCase()} appointment can't be rescheduled.`, "TERMINAL_STATUS");

  const prev = apt.scheduledFor;
  await prisma.appointment.update({ where: { id }, data: { previousScheduledFor: prev, scheduledFor: new Date(scheduledFor), status: "RESCHEDULED" } });
  await prisma.appointmentHistory.create({ data: { appointmentId: id, type: "APPOINTMENT_RESCHEDULED", message: `Viewing rescheduled.` } });
  const final = await prisma.appointment.findUnique({ where: { id }, include: { property: { select: { id: true, title: true } }, history: { orderBy: { createdAt: "asc" } } } });
  return mapAppointment(final!);
}

export async function bulkUpdateStatus(developerId: string, ids: string[], status: string) {
  if (!["CONFIRMED", "CANCELLED"].includes(status)) throw new BadRequestError("Bulk actions only for Confirm and Cancel.", "INVALID_BULK_ACTION");
  const updated: string[] = [], skipped: string[] = [];
  const apts = await prisma.appointment.findMany({ where: { id: { in: ids }, propertyDeveloperId: developerId } });
  const map = new Map(apts.map(a => [a.id, a]) as [string, any][]);
  for (const id of ids) {
    const a = map.get(id);
    if (a && VALID_TRANSITIONS[a.status as AptStatus]?.includes(status as AptStatus)) {
      await prisma.appointment.update({ where: { id }, data: { status } });
      await prisma.appointmentHistory.create({ data: { appointmentId: id, type: `APPOINTMENT_${status}`, message: HISTORY_MESSAGES[status as AptStatus] } });
      updated.push(id);
    } else skipped.push(id);
  }
  return { updated, skipped };
}

function mapAppointment(a: any) {
  return {
    id: a.id, propertyId: a.propertyId, propertyTitle: a.property?.title ?? "", clientName: a.clientName,
    scheduledFor: a.scheduledFor?.toISOString?.() ?? a.scheduledFor, status: a.status,
    previousScheduledFor: a.previousScheduledFor?.toISOString?.() ?? a.previousScheduledFor,
    history: (a.history ?? []).map((h: any) => ({ id: h.id, type: h.type, message: h.message, timestamp: h.createdAt?.toISOString?.() ?? h.createdAt })),
  };
}
