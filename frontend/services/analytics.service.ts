import {
  buildActionNeeded,
  buildAnalyticsStats,
  buildAppointmentFunnel,
  buildPortfolioComposition,
} from "@/lib/analyticsCalculations";
import type { AnalyticsPeriod, AnalyticsSnapshot } from "@/types";

import { appointmentService } from "./appointment.service";
import { listingService } from "./listing.service";

/** Large enough to cover every mock listing/appointment in one page — a real backend aggregates server-side and never needs to paginate through the underlying rows to compute a snapshot. */
const ALL_ITEMS_PAGE_SIZE = 1000;

/**
 * The Analytics domain's only service — every aggregation lives behind this
 * one method, never in a component. Deliberately does not read
 * `mocks/listings.mock.ts`/`mocks/appointments.mock.ts` directly: it goes
 * through `listingService`/`appointmentService`, the same way any other
 * consumer of those domains would, so there is exactly one owner per mock
 * array (see ADR-011/012/014's "deliberately independent dataset"
 * precedent — this is the same rule from the other direction, a *consumer*
 * respecting someone else's ownership rather than introducing a second one).
 *
 * All the real business logic (the funnel, the composition, what counts as
 * "needs attention") lives in `lib/analyticsCalculations.ts` as pure
 * functions — this service's only job is fetching the source data and
 * handing it to them, exactly what a real aggregation endpoint's resolver
 * would do once the math moves server-side.
 * TODO(backend): replace with GET /api/v1/developers/me/analytics?period=
 * once it exists — the response shape should match `AnalyticsSnapshot`
 * exactly, so this method disappears and the hook layer is untouched.
 */
export const analyticsService = {
  getSnapshot: async (
    period: AnalyticsPeriod = "30d",
  ): Promise<AnalyticsSnapshot> => {
    const now = new Date();

    const [listingsResult, appointmentsResult] = await Promise.all([
      listingService.getListings({ pageSize: ALL_ITEMS_PAGE_SIZE }),
      appointmentService.getAppointments({ pageSize: ALL_ITEMS_PAGE_SIZE }),
    ]);

    const properties = listingsResult.items;
    const appointments = appointmentsResult.items;

    const funnel = buildAppointmentFunnel(appointments, period, now);
    const portfolio = buildPortfolioComposition(properties);
    const actionNeeded = buildActionNeeded(
      appointments,
      properties,
      funnel,
      now,
    );
    const stats = buildAnalyticsStats(appointments, portfolio, funnel, period, now);

    return {
      period,
      generatedAt: now.toISOString(),
      actionNeeded,
      stats,
      funnel,
      portfolio,
    };
  },
};
