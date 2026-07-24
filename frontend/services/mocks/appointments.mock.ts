import type { Appointment } from "@/types";

// TODO(backend): replace with GET /api/v1/developers/me/appointments once it
// exists. Deliberately independent from services/mocks/dashboard.mock.ts's
// small MOCK_APPOINTMENTS array — that one powers the already-shipped,
// already-reviewed Dashboard Home widget (Phase 6.1) and this phase doesn't
// touch it, same reasoning as MOCK_LISTINGS vs MOCK_DASHBOARD_LISTINGS
// (ADR-011/012). A real backend serves both from one table.

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

function hoursFromNow(n: number): string {
  return new Date(Date.now() + n * HOUR).toISOString();
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * DAY).toISOString();
}

/** Mutable — status changes, reschedules, and their history entries write directly to this array, same idiom as auth.mock.ts/listings.mock.ts. Resets on every reload. */
export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "ap1",
    propertyId: "l1",
    propertyTitle: "Luxury 3BR Apartment in East Legon",
    clientName: "Adjoa Sarpong",
    scheduledFor: hoursFromNow(3),
    status: "CONFIRMED",
    history: [
      {
        id: "ap1-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Adjoa Sarpong requested a viewing.",
        timestamp: daysFromNow(-1),
      },
      {
        id: "ap1-h2",
        type: "APPOINTMENT_CONFIRMED",
        message: "You confirmed the viewing.",
        timestamp: daysFromNow(-1) + "",
      },
    ],
  },
  {
    id: "ap2",
    propertyId: "l3",
    propertyTitle: "Serviced Office, Airport City",
    clientName: "Kofi Antwi, Delta Logistics",
    scheduledFor: daysFromNow(1),
    status: "CONFIRMED",
    history: [
      {
        id: "ap2-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Kofi Antwi requested a viewing.",
        timestamp: daysFromNow(-2),
      },
      {
        id: "ap2-h2",
        type: "APPOINTMENT_CONFIRMED",
        message: "You confirmed the viewing.",
        timestamp: daysFromNow(-2),
      },
    ],
  },
  {
    id: "ap3",
    propertyId: "l2",
    propertyTitle: "Waterfront Villa, Ada Foah",
    clientName: "Nadia Owusu",
    scheduledFor: daysFromNow(2),
    status: "REQUESTED",
    history: [
      {
        id: "ap3-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Nadia Owusu requested a viewing.",
        timestamp: hoursFromNow(-6),
      },
    ],
  },
  {
    id: "ap4",
    propertyId: "l1",
    propertyTitle: "Luxury 3BR Apartment in East Legon",
    clientName: "Yaw Boadu",
    scheduledFor: daysFromNow(4),
    status: "REQUESTED",
    history: [
      {
        id: "ap4-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Yaw Boadu requested a viewing.",
        timestamp: hoursFromNow(-20),
      },
    ],
  },
  {
    id: "ap5",
    propertyId: "l9",
    propertyTitle: "3BR House, Ridge",
    clientName: "Efua Ansah",
    scheduledFor: daysFromNow(-3),
    status: "REQUESTED",
    history: [
      {
        id: "ap5-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Efua Ansah requested a viewing.",
        timestamp: daysFromNow(-4),
      },
    ],
  },
  {
    id: "ap6",
    propertyId: "l6",
    propertyTitle: "Studio Apartment, Osu",
    clientName: "Michael Tetteh",
    scheduledFor: daysFromNow(-2),
    status: "COMPLETED",
    history: [
      {
        id: "ap6-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Michael Tetteh requested a viewing.",
        timestamp: daysFromNow(-6),
      },
      {
        id: "ap6-h2",
        type: "APPOINTMENT_CONFIRMED",
        message: "You confirmed the viewing.",
        timestamp: daysFromNow(-6),
      },
      {
        id: "ap6-h3",
        type: "APPOINTMENT_COMPLETED",
        message: "Viewing marked complete.",
        timestamp: daysFromNow(-2),
      },
    ],
  },
  {
    id: "ap7",
    propertyId: "l3",
    propertyTitle: "Serviced Office, Airport City",
    clientName: "Selina Owusu-Mensah",
    scheduledFor: daysFromNow(-5),
    status: "COMPLETED",
    history: [
      {
        id: "ap7-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Selina Owusu-Mensah requested a viewing.",
        timestamp: daysFromNow(-9),
      },
      {
        id: "ap7-h2",
        type: "APPOINTMENT_CONFIRMED",
        message: "You confirmed the viewing.",
        timestamp: daysFromNow(-9),
      },
      {
        id: "ap7-h3",
        type: "APPOINTMENT_COMPLETED",
        message: "Viewing marked complete.",
        timestamp: daysFromNow(-5),
      },
    ],
  },
  {
    id: "ap8",
    propertyId: "l7",
    propertyTitle: "Gated Land Plot, Ahodwo",
    clientName: "Ibrahim Mahama",
    scheduledFor: daysFromNow(5),
    status: "RESCHEDULED",
    previousScheduledFor: daysFromNow(2.3).replace(/\d+$/, "1"),
    history: [
      {
        id: "ap8-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Ibrahim Mahama requested a viewing.",
        timestamp: daysFromNow(-3),
      },
      {
        id: "ap8-h2",
        type: "APPOINTMENT_CONFIRMED",
        message: "You confirmed the viewing.",
        timestamp: daysFromNow(-3),
      },
      {
        id: "ap8-h3",
        type: "APPOINTMENT_RESCHEDULED",
        message: "You rescheduled the viewing to a later date.",
        timestamp: daysFromNow(-1),
      },
    ],
  },
  {
    id: "ap9",
    propertyId: "l10",
    propertyTitle: "Office Suite, Community 1",
    clientName: "Grace Amponsah",
    scheduledFor: daysFromNow(-1),
    status: "NO_SHOW",
    history: [
      {
        id: "ap9-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Grace Amponsah requested a viewing.",
        timestamp: daysFromNow(-4),
      },
      {
        id: "ap9-h2",
        type: "APPOINTMENT_CONFIRMED",
        message: "You confirmed the viewing.",
        timestamp: daysFromNow(-4),
      },
      {
        id: "ap9-h3",
        type: "APPOINTMENT_NO_SHOW",
        message: "Client did not show up.",
        timestamp: daysFromNow(-1),
      },
    ],
  },
  {
    id: "ap10",
    propertyId: "l4",
    propertyTitle: "2BR Apartment, Cantonments",
    clientName: "Kwabena Owusu",
    scheduledFor: daysFromNow(-4),
    status: "CANCELLED",
    history: [
      {
        id: "ap10-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Kwabena Owusu requested a viewing.",
        timestamp: daysFromNow(-7),
      },
      {
        id: "ap10-h2",
        type: "APPOINTMENT_CANCELLED",
        message: "You cancelled the request.",
        timestamp: daysFromNow(-6),
      },
    ],
  },
  {
    id: "ap11",
    propertyId: "l11",
    propertyTitle: "Retail Block, Adum",
    clientName: "Patricia Boateng",
    scheduledFor: daysFromNow(3),
    status: "CONFIRMED",
    history: [
      {
        id: "ap11-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Patricia Boateng requested a viewing.",
        timestamp: daysFromNow(-1),
      },
      {
        id: "ap11-h2",
        type: "APPOINTMENT_CONFIRMED",
        message: "You confirmed the viewing.",
        timestamp: daysFromNow(-1),
      },
    ],
  },
  {
    id: "ap12",
    propertyId: "l12",
    propertyTitle: "2BR Apartment, Asokwa",
    clientName: "Daniel Yeboah",
    scheduledFor: hoursFromNow(30),
    status: "REQUESTED",
    history: [
      {
        id: "ap12-h1",
        type: "APPOINTMENT_REQUESTED",
        message: "Daniel Yeboah requested a viewing.",
        timestamp: hoursFromNow(-2),
      },
    ],
  },
];
