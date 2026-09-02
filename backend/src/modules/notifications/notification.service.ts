import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import type { PaginatedResult } from "../../utils/pagination.js";

const NOTIFICATION_CATEGORY: Record<string, string> = {
  APPOINTMENT_REQUESTED: "APPOINTMENT", APPOINTMENT_CONFIRMED: "APPOINTMENT", APPOINTMENT_CANCELLED: "APPOINTMENT",
  APPOINTMENT_RESCHEDULED: "APPOINTMENT", APPOINTMENT_COMPLETED: "APPOINTMENT", APPOINTMENT_NO_SHOW: "APPOINTMENT",
  LISTING_PUBLISHED: "LISTING", LISTING_SUSPENDED: "LISTING", DRAFT_REMINDER: "LISTING", SYSTEM: "SYSTEM",
};

export interface GetNotificationsParams { status?: string; category?: string; sort?: string; page?: number; pageSize?: number; }

export async function getNotifications(developerId: string, params: GetNotificationsParams = {}): Promise<PaginatedResult<any>> {
  const { skip, take, page, pageSize } = parsePagination(params);
  const where: any = { propertyDeveloperId: developerId };
  if (params.status) where.status = params.status;
  if (params.category) {
    const types = Object.entries(NOTIFICATION_CATEGORY).filter(([, c]) => c === params.category).map(([t]) => t);
    where.type = { in: types };
  }

  const orderBy = params.sort === "date_asc" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };
  const [items, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take, orderBy }),
    prisma.notification.count({ where }),
  ]);
  return paginateResult(items.map(mapNotification), total, page, pageSize);
}

export async function getUnreadCount(developerId: string): Promise<number> {
  return prisma.notification.count({ where: { propertyDeveloperId: developerId, status: "UNREAD" } });
}

export async function markAsRead(developerId: string, id: string) {
  const n = await prisma.notification.findFirst({ where: { id, propertyDeveloperId: developerId } });
  if (!n) throw new NotFoundError("Notification not found");
  if (n.status === "UNREAD") {
    await prisma.notification.update({ where: { id }, data: { status: "READ", readAt: new Date() } });
  }
  const updated = await prisma.notification.findUnique({ where: { id } });
  return mapNotification(updated!);
}

export async function markAllAsRead(developerId: string) {
  await prisma.notification.updateMany({ where: { propertyDeveloperId: developerId, status: "UNREAD" }, data: { status: "READ", readAt: new Date() } });
  const updated = await prisma.notification.findMany({ where: { propertyDeveloperId: developerId, status: "READ", readAt: { not: null } }, select: { id: true } });
  return { updated: updated.map(n => n.id) };
}

function mapNotification(n: any) {
  return { id: n.id, type: n.type, title: n.title, body: n.message, createdAt: n.createdAt?.toISOString?.() ?? n.createdAt, status: n.status, link: n.link ?? undefined };
}
