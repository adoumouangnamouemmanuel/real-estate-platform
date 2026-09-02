import { prisma } from "../../config/prisma.js";

export async function getDashboard(developerId: string) {
  const developer = await prisma.propertyDeveloper.findUnique({ where: { id: developerId }, include: { user: { select: { fullName: true } } } });
  if (!developer) throw new Error("Developer not found");

  const [listings, appointments, notifications] = await Promise.all([
    prisma.property.findMany({ where: { propertyDeveloperId: developerId, deletedAt: null }, orderBy: { updatedAt: "desc" }, include: { media: { orderBy: { order: "asc" } }, cityRef: { select: { name: true } } } }),
    prisma.appointment.findMany({ where: { propertyDeveloperId: developerId }, orderBy: { scheduledFor: "asc" }, include: { property: { select: { id: true, title: true } }, history: { orderBy: { createdAt: "asc" }, take: 1 } } }),
    prisma.notification.findMany({ where: { propertyDeveloperId: developerId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const summary = { developerName: developer.user?.fullName || developer.businessName || "Developer", companyName: developer.businessName || developer.user?.fullName || "Company" };
  const metrics = {
    totalProperties: listings.length, activeListings: listings.filter(l => l.status === "ACTIVE").length,
    draftListings: listings.filter(l => l.status === "DRAFT").length,
    appointmentRequests: appointments.filter(a => a.status === "REQUESTED").length,
    unreadNotifications: notifications.filter(n => n.status === "UNREAD").length,
  };

  const recentListings = listings.slice(0, 5).map(p => ({
    id: p.id, slug: p.slug, title: p.title, description: p.description, price: Number(p.price),
    listingType: p.listingType, category: p.category, city: p.cityRef?.name ?? "", region: "", status: p.status,
    media: (p.media ?? []).map((m: any) => ({ url: m.url, publicId: m.publicId, order: m.order })),
    updatedAt: p.updatedAt?.toISOString?.(),
    bedrooms: p.bedrooms ?? undefined, bathrooms: p.bathrooms ?? undefined,
  }));

  const now = new Date();
  const bySoonest = (a: any, b: any) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
  const appointmentOverview = {
    upcoming: appointments.filter(a => a.status === "CONFIRMED").sort(bySoonest).map(mapAppointment),
    requested: appointments.filter(a => a.status === "REQUESTED").sort(bySoonest).map(mapAppointment),
    completed: appointments.filter(a => a.status === "COMPLETED").sort((a: any, b: any) => bySoonest(b, a)).map(mapAppointment),
  };

  const actionNeeded: any[] = [];
  const overdue = appointments.filter(a => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status) && new Date(a.scheduledFor).getTime() < now.getTime());
  if (overdue.length > 0) actionNeeded.push({ type: "OVERDUE_APPOINTMENTS", severity: overdue.length >= 3 ? "high" : "medium", title: `${overdue.length} overdue appointment${overdue.length > 1 ? "s" : ""}`, description: "These appointments have passed their scheduled time.", count: overdue.length, href: "/dashboard/appointments?timeframe=overdue" });

  const staleDrafts = listings.filter(l => l.status === "DRAFT");
  if (staleDrafts.length > 0) actionNeeded.push({ type: "STALE_DRAFTS", severity: staleDrafts.length >= 3 ? "high" : "medium", title: `${staleDrafts.length} unpublished draft${staleDrafts.length > 1 ? "s" : ""}`, description: "These listings have not been published.", count: staleDrafts.length, href: "/dashboard/listings?status=DRAFT" });

  const newRequests = appointments.filter(a => a.status === "REQUESTED");
  if (newRequests.length > 0) actionNeeded.push({ type: "NEW_APPOINTMENT_REQUESTS", severity: "medium", title: `${newRequests.length} new appointment request${newRequests.length > 1 ? "s" : ""}`, description: "Prospective buyers/renters are waiting.", count: newRequests.length, href: "/dashboard/appointments?status=REQUESTED" });

  const recentNotifications = notifications.map(n => ({ id: n.id, type: n.type, title: n.title, body: n.message, createdAt: n.createdAt?.toISOString?.() ?? n.createdAt, status: n.status, link: n.link ?? undefined }));

  const activity: any[] = [];
  for (const apt of appointments) { if (apt.history) { for (const h of apt.history) { activity.push({ id: h.id, type: h.type, message: h.message, timestamp: h.createdAt?.toISOString?.() ?? h.createdAt }); } } }
  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { summary, metrics, recentListings, appointmentOverview, actionNeeded, recentNotifications, recentActivity: activity.slice(0, 6) };
}

function mapAppointment(a: any) {
  return { id: a.id, propertyId: a.propertyId, propertyTitle: a.property?.title ?? "", clientName: a.clientName, scheduledFor: a.scheduledFor?.toISOString?.() ?? a.scheduledFor, status: a.status, previousScheduledFor: a.previousScheduledFor?.toISOString?.() ?? a.previousScheduledFor, history: (a.history ?? []).map((h: any) => ({ id: h.id, type: h.type, message: h.message, timestamp: h.createdAt?.toISOString?.() ?? h.createdAt })) };
}
