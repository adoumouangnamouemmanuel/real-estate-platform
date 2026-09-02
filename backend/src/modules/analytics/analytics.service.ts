import { prisma } from "../../config/prisma.js";

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export async function getSnapshot(developerId: string, period: AnalyticsPeriod = "30d") {
  const now = new Date();
  const periodMs = period === "7d" ? 7 * 86400000 : period === "90d" ? 90 * 86400000 : 30 * 86400000;
  const periodStart = new Date(now.getTime() - periodMs);

  const [listings, appointments] = await Promise.all([
    prisma.property.findMany({ where: { propertyDeveloperId: developerId, deletedAt: null } }),
    prisma.appointment.findMany({ where: { propertyDeveloperId: developerId }, include: { history: { orderBy: { createdAt: "asc" } } } }),
  ]);

  const portfolio = buildPortfolio(listings);
  const funnel = buildFunnel(appointments, periodStart, now);
  const actionNeeded = buildActionNeeded(appointments, listings, funnel, now);
  const stats = buildStats(appointments, portfolio, funnel, period, now);

  return { period, generatedAt: now.toISOString(), actionNeeded, stats, funnel, portfolio };
}

function buildPortfolio(listings: any[]) {
  const byStatus: Record<string, number> = {}, byCategory: Record<string, number> = {};
  for (const l of listings) { byStatus[l.status] = (byStatus[l.status] ?? 0) + 1; byCategory[l.category] = (byCategory[l.category] ?? 0) + 1; }
  return { totalListings: listings.length, byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })), byCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })) };
}

function buildFunnel(appointments: any[], periodStart: Date, now: Date) {
  const periodApts = appointments.filter(a => {
    const req = a.history?.find((h: any) => h.type === "APPOINTMENT_REQUESTED");
    return req && new Date(req.createdAt) >= periodStart && new Date(req.createdAt) <= now;
  });

  const stages = ["REQUESTED", "CONFIRMED", "RESCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
  const stageCounts = stages.map(status => ({ status, count: periodApts.filter(a => a.status === status).length }));
  const totalRequested = periodApts.length;
  const confirmed = stageCounts.find(s => s.status === "CONFIRMED")?.count ?? 0;
  const completed = stageCounts.find(s => s.status === "COMPLETED")?.count ?? 0;
  const cancelled = stageCounts.find(s => s.status === "CANCELLED")?.count ?? 0;
  const noShow = stageCounts.find(s => s.status === "NO_SHOW")?.count ?? 0;
  const responded = confirmed + completed + cancelled + noShow;

  let totalHrs = 0, cnt = 0;
  for (const apt of periodApts) {
    const req = apt.history?.find((h: any) => h.type === "APPOINTMENT_REQUESTED");
    const act = apt.history?.find((h: any) => h.type !== "APPOINTMENT_REQUESTED" && h.type !== "APPOINTMENT_RESCHEDULED");
    if (req && act) { totalHrs += (new Date(act.createdAt).getTime() - new Date(req.createdAt).getTime()) / 3600000; cnt++; }
  }

  return {
    period: "", stages: stageCounts, totalRequested,
    responseRate: totalRequested > 0 ? responded / totalRequested : 0,
    completionRate: confirmed + completed + noShow > 0 ? completed / (confirmed + completed + noShow) : 0,
    cancellationRate: totalRequested > 0 ? cancelled / totalRequested : 0,
    noShowRate: confirmed + completed + noShow > 0 ? noShow / (confirmed + completed + noShow) : 0,
    averageResponseHours: cnt > 0 ? totalHrs / cnt : null,
  };
}

function buildActionNeeded(appointments: any[], listings: any[], funnel: any, now: Date) {
  const items: any[] = [];
  const overdue = appointments.filter(a => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status) && new Date(a.scheduledFor).getTime() < now.getTime());
  if (overdue.length > 0) items.push({ type: "OVERDUE_APPOINTMENTS", severity: overdue.length >= 3 ? "high" : "medium", title: `${overdue.length} overdue appointment${overdue.length > 1 ? "s" : ""}`, description: "These appointments have passed their scheduled time.", count: overdue.length, href: "/dashboard/appointments?timeframe=overdue" });
  const stale = listings.filter(l => l.status === "DRAFT" && !l.publishedAt);
  if (stale.length > 0) items.push({ type: "STALE_DRAFTS", severity: stale.length >= 3 ? "high" : "medium", title: `${stale.length} unpublished draft${stale.length > 1 ? "s" : ""}`, description: "These listings have never been published.", count: stale.length, href: "/dashboard/listings?status=DRAFT" });
  if (funnel.totalRequested >= 5 && funnel.cancellationRate > 0.3) items.push({ type: "HIGH_CANCELLATION_RATE", severity: "high", title: "High cancellation rate", description: `${Math.round(funnel.cancellationRate * 100)}% of appointments were cancelled.`, count: Math.round(funnel.cancellationRate * 100), href: "/dashboard/analytics" });
  return items;
}

function buildStats(appointments: any[], portfolio: any, funnel: any, period: AnalyticsPeriod, now: Date) {
  const periodMs = period === "7d" ? 7 * 86400000 : period === "90d" ? 90 * 86400000 : 30 * 86400000;
  const periodStart = new Date(now.getTime() - periodMs);
  const periodApts = appointments.filter(a => { const r = a.history?.find((h: any) => h.type === "APPOINTMENT_REQUESTED"); return r && new Date(r.createdAt) >= periodStart; });
  const completed = periodApts.filter(a => a.status === "COMPLETED").length;
  const activeListings = portfolio.byStatus.find((s: any) => s.status === "ACTIVE")?.count ?? 0;

  return [
    { key: "total_listings", label: "Total Listings", value: portfolio.totalListings, format: "number" },
    { key: "active_listings", label: "Active Listings", value: activeListings, format: "number" },
    { key: "completed_viewings", label: "Completed Viewings", value: completed, format: "number", trend: buildTrend(appointments, periodStart, now) },
    { key: "response_rate", label: "Response Rate", value: Math.round(funnel.responseRate * 100), format: "percent" },
    { key: "completion_rate", label: "Completion Rate", value: Math.round(funnel.completionRate * 100), format: "percent" },
    { key: "avg_response_time", label: "Avg Response Time", value: funnel.averageResponseHours !== null ? Math.round(funnel.averageResponseHours * 10) / 10 : 0, format: "hours" },
  ];
}

function buildTrend(appointments: any[], periodStart: Date, now: Date) {
  const days = Math.ceil((now.getTime() - periodStart.getTime()) / 86400000);
  const trend = new Array(days).fill(0);
  for (const apt of appointments) {
    if (apt.status !== "COMPLETED") continue;
    const e = apt.history?.find((h: any) => h.type === "APPOINTMENT_COMPLETED");
    if (!e) continue;
    const d = new Date(e.createdAt);
    if (d < periodStart || d > now) continue;
    const idx = Math.floor((d.getTime() - periodStart.getTime()) / 86400000);
    if (idx >= 0 && idx < days) trend[idx]++;
  }
  return trend;
}
