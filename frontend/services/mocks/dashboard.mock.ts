import type {
  ActivityItem,
  Appointment,
  DashboardSummary,
  Notification,
  Property,
} from "@/types";

// TODO(backend): replace every export here with the developer-scoped dashboard
// endpoints (GET /api/v1/dashboard/{summary,metrics,listings,appointments,
// notifications,activity}) once they exist. The dashboard service (see
// services/dashboard.service.ts) is the single seam that changes then — these
// records model one authenticated developer's own workspace, not the public
// cross-developer catalogue in properties.mock.ts.

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

/** ISO string `n` hours from load time — positive is future, negative is past. */
function hoursFromNow(n: number): string {
  return new Date(Date.now() + n * HOUR).toISOString();
}

/** ISO string `n` days from load time — positive is future, negative is past. */
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * DAY).toISOString();
}

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  developerName: "Kwame Mensah",
  companyName: "Atlantic Properties",
};

/**
 * The developer's own listings — the existing Property model, but unlike the
 * all-ACTIVE public catalogue these carry the DRAFT/RESERVED/SOLD statuses a real
 * portfolio has, so the KPI counts (active vs draft) and the status badges have
 * something real to show. Ordered newest-updated first.
 */
export const MOCK_DASHBOARD_LISTINGS: Property[] = [
  {
    id: "dl1",
    slug: "luxury-3br-apartment-east-legon",
    title: "Luxury 3BR Apartment in East Legon",
    description:
      "A modern 3-bedroom apartment with a private balcony and secure parking.",
    price: 450000,
    listingType: "SALE",
    category: "apartment",
    city: "Accra",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
    updatedAt: hoursFromNow(-2),
  },
  {
    id: "dl2",
    slug: "waterfront-villa-ada-foah",
    title: "Waterfront Villa, Ada Foah",
    description:
      "A four-bedroom villa on the estuary, sold with a private jetty.",
    price: 980000,
    listingType: "SALE",
    category: "house",
    city: "Ada Foah",
    region: "Greater Accra",
    status: "RESERVED",
    media: [],
    updatedAt: hoursFromNow(-20),
  },
  {
    id: "dl3",
    slug: "serviced-office-airport-city",
    title: "Serviced Office, Airport City",
    description: "Open-plan serviced office with fibre and 24/7 access.",
    price: 7500,
    listingType: "RENT",
    category: "office",
    city: "Accra",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
    updatedAt: hoursFromNow(-28),
  },
  {
    id: "dl4",
    slug: "2br-apartment-cantonments-draft",
    title: "2BR Apartment, Cantonments",
    description:
      "Draft listing — awaiting final photography before publishing.",
    price: 320000,
    listingType: "SALE",
    category: "apartment",
    city: "Accra",
    region: "Greater Accra",
    status: "DRAFT",
    media: [],
    updatedAt: daysFromNow(-2),
  },
  {
    id: "dl5",
    slug: "townhouse-tema-community-25-draft",
    title: "Townhouse, Tema Community 25",
    description: "Draft listing — pricing under review with the sales team.",
    price: 410000,
    listingType: "SALE",
    category: "house",
    city: "Tema",
    region: "Greater Accra",
    status: "DRAFT",
    media: [],
    updatedAt: daysFromNow(-4),
  },
  {
    id: "dl6",
    slug: "studio-apartment-osu-sold",
    title: "Studio Apartment, Osu",
    description: "Compact studio in the heart of Osu — recently sold.",
    price: 180000,
    listingType: "SALE",
    category: "apartment",
    city: "Accra",
    region: "Greater Accra",
    status: "SOLD",
    media: [],
    updatedAt: daysFromNow(-6),
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    propertyId: "dl1",
    propertyTitle: "Luxury 3BR Apartment in East Legon",
    clientName: "Adjoa Sarpong",
    scheduledFor: hoursFromNow(3),
    status: "CONFIRMED",
  },
  {
    id: "a2",
    propertyId: "dl3",
    propertyTitle: "Serviced Office, Airport City",
    clientName: "Kofi An, Delta Logistics",
    scheduledFor: daysFromNow(1),
    status: "CONFIRMED",
  },
  {
    id: "a3",
    propertyId: "dl2",
    propertyTitle: "Waterfront Villa, Ada Foah",
    clientName: "Nadia Owusu",
    scheduledFor: daysFromNow(2),
    status: "REQUESTED",
  },
  {
    id: "a4",
    propertyId: "dl1",
    propertyTitle: "Luxury 3BR Apartment in East Legon",
    clientName: "Yaw Boadu",
    scheduledFor: daysFromNow(4),
    status: "REQUESTED",
  },
  {
    id: "a5",
    propertyId: "dl6",
    propertyTitle: "Studio Apartment, Osu",
    clientName: "Efua Ansah",
    scheduledFor: daysFromNow(-2),
    status: "COMPLETED",
  },
  {
    id: "a6",
    propertyId: "dl3",
    propertyTitle: "Serviced Office, Airport City",
    clientName: "Michael Tetteh",
    scheduledFor: daysFromNow(-5),
    status: "COMPLETED",
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "APPOINTMENT",
    title: "New viewing request",
    body: "Nadia Owusu requested a viewing for Waterfront Villa, Ada Foah.",
    createdAt: hoursFromNow(-1),
    read: false,
  },
  {
    id: "n2",
    type: "MESSAGE",
    title: "New enquiry",
    body: "Yaw Boadu sent a question about the East Legon apartment.",
    createdAt: hoursFromNow(-4),
    read: false,
  },
  {
    id: "n3",
    type: "LISTING",
    title: "Listing reserved",
    body: "Waterfront Villa, Ada Foah is now marked as reserved.",
    createdAt: hoursFromNow(-26),
    read: false,
  },
  {
    id: "n4",
    type: "SYSTEM",
    title: "Weekly performance summary",
    body: "Your listings were viewed 214 times in the last 7 days.",
    createdAt: daysFromNow(-3),
    read: true,
  },
  {
    id: "n5",
    type: "APPOINTMENT",
    title: "Viewing completed",
    body: "Your viewing with Efua Ansah for the Osu studio is complete.",
    createdAt: daysFromNow(-4),
    read: true,
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "act1",
    type: "APPOINTMENT_REQUESTED",
    message: "Nadia Owusu requested a viewing for Waterfront Villa, Ada Foah.",
    timestamp: hoursFromNow(-1),
  },
  {
    id: "act2",
    type: "PROPERTY_VIEWED",
    message: "Luxury 3BR Apartment in East Legon reached 1,000 total views.",
    timestamp: hoursFromNow(-6),
  },
  {
    id: "act3",
    type: "LISTING_UPDATED",
    message: "You updated the price on Serviced Office, Airport City.",
    timestamp: hoursFromNow(-28),
  },
  {
    id: "act4",
    type: "APPOINTMENT_COMPLETED",
    message: "Viewing with Efua Ansah for Studio Apartment, Osu completed.",
    timestamp: daysFromNow(-2),
  },
  {
    id: "act5",
    type: "LISTING_PUBLISHED",
    message: "You published Serviced Office, Airport City.",
    timestamp: daysFromNow(-6),
  },
  {
    id: "act6",
    type: "PROFILE_UPDATED",
    message: "You updated your company profile and contact details.",
    timestamp: daysFromNow(-9),
  },
];
