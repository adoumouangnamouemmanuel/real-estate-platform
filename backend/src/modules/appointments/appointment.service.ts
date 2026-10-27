import { prisma } from "../../config/prisma.js";
import { requireDeveloperId } from "../../middleware/auth.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import { localeConfig, resolveTranslation } from "../../lib/localization.js";
type Status =
  | "REQUESTED"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
const transitions: Record<Status, Status[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["RESCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"],
  RESCHEDULED: ["RESCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};
const terminal = ["COMPLETED", "CANCELLED", "NO_SHOW"];
const include = {
  property: {
    select: {
      id: true,
      title: true,
      sourceLanguageCode: true,
      translations: true,
    },
  },
  history: { orderBy: { createdAt: "asc" as const } },
};
export interface GetAppointmentsParams {
  q?: string;
  status?: string;
  timeframe?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}
function dayBounds() {
  const now = new Date(),
    start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return { now, start, end: new Date(start.getTime() + 86400000) };
}
function map(a: any, locale: { requested: string; fallback: string }) {
  const t = resolveTranslation<any>(
    a.property?.translations ?? [],
    locale.requested,
    locale.fallback,
    a.property?.sourceLanguageCode,
  );
  const fr = locale.requested === "fr";
  const messages: Record<string, string> = fr
    ? {
        APPOINTMENT_REQUESTED: "Visite demandée.",
        APPOINTMENT_CONFIRMED: "Visite confirmée.",
        APPOINTMENT_RESCHEDULED: "Visite reprogrammée.",
        APPOINTMENT_COMPLETED: "Visite terminée.",
        APPOINTMENT_CANCELLED: "Visite annulée.",
        APPOINTMENT_NO_SHOW: "Client absent.",
      }
    : {};
  return {
    id: a.id,
    propertyId: a.propertyId,
    propertyTitle: t?.title ?? a.property?.title ?? "",
    clientName: a.clientName,
    scheduledFor: a.scheduledFor.toISOString(),
    previousScheduledFor: a.previousScheduledFor?.toISOString(),
    status: a.status,
    history: a.history.map((h: any) => ({
      id: h.id,
      type: h.type,
      message: messages[h.type] ?? h.message,
      timestamp: h.createdAt.toISOString(),
    })),
  };
}
export async function getAppointments(
  developerId: string,
  params: GetAppointmentsParams = {},
) {
  requireDeveloperId(developerId);
  const locale = await localeConfig(),
    { skip, take, page, pageSize } = parsePagination(params),
    where: any = { propertyDeveloperId: developerId };
  if (params.status) {
    if (!(params.status in transitions))
      throw new BadRequestError("Invalid appointment status");
    where.status = params.status;
  }
  if (params.q)
    where.OR = [
      { clientName: { contains: params.q, mode: "insensitive" } },
      {
        property: {
          translations: {
            some: {
              languageCode: { in: [locale.requested, locale.fallback] },
              title: { contains: params.q, mode: "insensitive" },
            },
          },
        },
      },
    ];
  if (params.timeframe) {
    const { now, start, end } = dayBounds();
    where.AND = [{ status: { notIn: terminal } }];
    if (params.timeframe === "today")
      where.scheduledFor = { gte: start, lt: end };
    else if (params.timeframe === "upcoming") where.scheduledFor = { gt: now };
    else if (params.timeframe === "overdue") where.scheduledFor = { lt: start };
    else throw new BadRequestError("Invalid timeframe");
  }
  const orderBy: any = [
    { scheduledFor: params.sort === "date_desc" ? "desc" : "asc" },
    { id: "asc" },
  ];
  const [items, total] = await Promise.all([
    prisma.appointment.findMany({ where, skip, take, orderBy, include }),
    prisma.appointment.count({ where }),
  ]);
  return paginateResult(
    items.map((a) => map(a, locale)),
    total,
    page,
    pageSize,
  );
}
export async function getStatusCounts(developerId: string) {
  requireDeveloperId(developerId);
  const counts = await prisma.appointment.groupBy({
    by: ["status"],
    where: { propertyDeveloperId: developerId },
    _count: { status: true },
  });
  const result: Record<Status, number> = {
    REQUESTED: 0,
    CONFIRMED: 0,
    RESCHEDULED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  for (const c of counts) result[c.status] = c._count.status;
  return result;
}
export async function getAppointment(developerId: string, id: string) {
  requireDeveloperId(developerId);
  const locale = await localeConfig(),
    a = await prisma.appointment.findFirst({
      where: { id, propertyDeveloperId: developerId },
      include,
    });
  if (!a) throw new NotFoundError("Appointment not found");
  return map(a, locale);
}
async function change(
  developerId: string,
  id: string,
  status: Status,
  date?: Date,
) {
  const locale = await localeConfig();
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"appointment:" + id},0))::text`;
    const a = await tx.appointment.findFirst({
      where: { id, propertyDeveloperId: developerId },
    });
    if (!a) throw new NotFoundError("Appointment not found");
    if (!transitions[a.status]?.includes(status))
      throw new BadRequestError(
        "Invalid appointment transition",
        "INVALID_TRANSITION",
      );
    await tx.appointment.update({
      where: { id },
      data: {
        status,
        ...(date
          ? { previousScheduledFor: a.scheduledFor, scheduledFor: date }
          : {}),
      },
    });
    await tx.appointmentHistory.create({
      data: {
        appointmentId: id,
        type: "APPOINTMENT_" + status,
        message: status,
      },
    });
    return map(
      await tx.appointment.findUniqueOrThrow({ where: { id }, include }),
      locale,
    );
  });
}
export async function updateStatus(
  developerId: string,
  id: string,
  status: string,
) {
  requireDeveloperId(developerId);
  if (!(status in transitions) || status === "RESCHEDULED")
    throw new BadRequestError("Use reschedule for a new date");
  return change(developerId, id, status as Status);
}
export async function reschedule(
  developerId: string,
  id: string,
  scheduledFor: string,
) {
  requireDeveloperId(developerId);
  if (!/T.*(Z|[+-]\d{2}:\d{2})$/.test(scheduledFor))
    throw new BadRequestError("An explicit timezone is required");
  const date = new Date(scheduledFor);
  if (!Number.isFinite(date.getTime()) || date <= new Date())
    throw new BadRequestError("Choose a future date");
  return change(developerId, id, "RESCHEDULED", date);
}
export async function bulkUpdateStatus(
  developerId: string,
  ids: string[],
  status: string,
) {
  requireDeveloperId(developerId);
  if (!["CONFIRMED", "CANCELLED"].includes(status))
    throw new BadRequestError("Invalid bulk action");
  const updated: string[] = [],
    skipped: string[] = [];
  for (const id of [...new Set(ids)])
    try {
      await updateStatus(developerId, id, status);
      updated.push(id);
    } catch (e) {
      if (e instanceof BadRequestError || e instanceof NotFoundError)
        skipped.push(id);
      else throw e;
    }
  return { updated, skipped };
}
