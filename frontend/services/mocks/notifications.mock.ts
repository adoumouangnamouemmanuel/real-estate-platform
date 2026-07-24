import type { Notification } from "@/types";

// TODO(backend): replace with GET /api/v1/developers/me/notifications once it
// exists (see docs/ARCHITECTURE.md §9 for the enqueue-on-mutation flow this
// stands in for). Deliberately independent from services/mocks/dashboard.mock.ts's
// small MOCK_NOTIFICATIONS array — that one powers the already-shipped,
// already-reviewed Dashboard Home widget (Phase 6.1) and this phase doesn't
// touch it, same reasoning as MOCK_APPOINTMENTS vs dashboard.mock.ts's own
// (ADR-011/012/014). A real backend serves both from one table.

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

function hoursFromNow(n: number): string {
  return new Date(Date.now() + n * HOUR).toISOString();
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * DAY).toISOString();
}

/** Mutable — mark-as-read/mark-all-read write directly to this array, same idiom as appointments.mock.ts/listings.mock.ts. Resets on every reload. */
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif1",
    type: "APPOINTMENT_REQUESTED",
    title: "New viewing request",
    body: "Nadia Owusu requested a viewing for Waterfront Villa, Ada Foah.",
    createdAt: hoursFromNow(-1),
    status: "UNREAD",
    link: "/appointments",
  },
  {
    id: "notif2",
    type: "APPOINTMENT_REQUESTED",
    title: "New viewing request",
    body: "Daniel Yeboah requested a viewing for 2BR Apartment, Asokwa.",
    createdAt: hoursFromNow(-3),
    status: "UNREAD",
    link: "/appointments",
  },
  {
    id: "notif3",
    type: "APPOINTMENT_CONFIRMED",
    title: "Viewing confirmed",
    body: "Your viewing with Adjoa Sarpong for the East Legon apartment is confirmed.",
    createdAt: hoursFromNow(-5),
    status: "UNREAD",
    link: "/appointments",
  },
  {
    id: "notif4",
    type: "APPOINTMENT_RESCHEDULED",
    title: "Viewing rescheduled",
    body: "Ibrahim Mahama's viewing for the Ahodwo land plot moved to a later date.",
    createdAt: hoursFromNow(-9),
    status: "UNREAD",
    link: "/appointments",
  },
  {
    id: "notif5",
    type: "APPOINTMENT_CANCELLED",
    title: "Viewing cancelled",
    body: "Kwabena Owusu cancelled the viewing for 2BR Apartment, Cantonments.",
    createdAt: hoursFromNow(-14),
    status: "UNREAD",
    link: "/appointments",
  },
  {
    id: "notif6",
    type: "APPOINTMENT_NO_SHOW",
    title: "Client did not show up",
    body: "Grace Amponsah did not show up for the Office Suite viewing.",
    createdAt: hoursFromNow(-20),
    status: "UNREAD",
    link: "/appointments",
  },
  {
    id: "notif7",
    type: "LISTING_SUSPENDED",
    title: "Listing suspended",
    body: "Waterfront Villa, Ada Foah has been suspended.",
    createdAt: hoursFromNow(-30),
    status: "UNREAD",
    link: "/listings",
  },
  {
    id: "notif8",
    type: "DRAFT_REMINDER",
    title: "Draft reminder",
    body: "2BR Apartment, Cantonments has been sitting as a draft for 5 days.",
    createdAt: daysFromNow(-2),
    status: "UNREAD",
    link: "/listings",
  },
  {
    id: "notif9",
    type: "SYSTEM",
    title: "Weekly performance summary",
    body: "Your listings were viewed 214 times in the last 7 days.",
    createdAt: daysFromNow(-2.3),
    status: "UNREAD",
  },
  {
    id: "notif10",
    type: "APPOINTMENT_COMPLETED",
    title: "Viewing completed",
    body: "Your viewing with Michael Tetteh for the Osu studio is complete.",
    createdAt: daysFromNow(-3),
    status: "READ",
    link: "/appointments",
  },
  {
    id: "notif11",
    type: "APPOINTMENT_COMPLETED",
    title: "Viewing completed",
    body: "Your viewing with Selina Owusu-Mensah for the Airport City office is complete.",
    createdAt: daysFromNow(-4),
    status: "READ",
    link: "/appointments",
  },
  {
    id: "notif12",
    type: "LISTING_PUBLISHED",
    title: "Listing published",
    body: "Serviced Office, Airport City is now live.",
    createdAt: daysFromNow(-5),
    status: "READ",
    link: "/listings",
  },
  {
    id: "notif13",
    type: "LISTING_PUBLISHED",
    title: "Listing published",
    body: "Luxury 3BR Apartment in East Legon is now live.",
    createdAt: daysFromNow(-6),
    status: "READ",
    link: "/listings",
  },
  {
    id: "notif14",
    type: "APPOINTMENT_CANCELLED",
    title: "Viewing cancelled",
    body: "Kwabena Owusu cancelled the viewing for 2BR Apartment, Cantonments.",
    createdAt: daysFromNow(-7),
    status: "READ",
    link: "/appointments",
  },
  {
    id: "notif15",
    type: "SYSTEM",
    title: "Account verified",
    body: "Atlantic Properties is now a verified developer on ByTe.",
    createdAt: daysFromNow(-10),
    status: "READ",
  },
  {
    id: "notif16",
    type: "DRAFT_REMINDER",
    title: "Draft reminder",
    body: "Townhouse, Tema Community has been sitting as a draft for 10 days.",
    createdAt: daysFromNow(-12),
    status: "READ",
    link: "/listings",
  },
  {
    id: "notif17",
    type: "APPOINTMENT_NO_SHOW",
    title: "Client did not show up",
    body: "A prospective buyer did not show up for the Ridge house viewing.",
    createdAt: daysFromNow(-15),
    status: "READ",
    link: "/appointments",
  },
  {
    id: "notif18",
    type: "SYSTEM",
    title: "Weekly performance summary",
    body: "Your listings were viewed 189 times in the last 7 days.",
    createdAt: daysFromNow(-17),
    status: "READ",
  },
];
