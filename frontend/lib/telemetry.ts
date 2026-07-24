import type { AppointmentStatus } from "@/types";

/**
 * Event names follow the same snake_case convention as the backend's real
 * analytics events (`property_view`, `whatsapp_click`, `property_liked` —
 * see docs/ARCHITECTURE.md §11), even though none of these are wired to a
 * real endpoint yet.
 */
export type AppointmentLifecycleEvent =
  | { name: "appointment_confirmed"; appointmentId: string }
  | {
      name: "appointment_rescheduled";
      appointmentId: string;
      from: string;
      to: string;
    }
  | { name: "appointment_completed"; appointmentId: string }
  | {
      name: "appointment_cancelled";
      appointmentId: string;
      from: AppointmentStatus;
    }
  | { name: "appointment_no_show"; appointmentId: string };

// TODO(backend): POST /api/v1/analytics/events once it exists (§11). Until
// then this is a documented no-op seam — it exists so call sites are already
// in place and correct, and wiring the real endpoint later is a one-line
// change inside this function, not a hunt through every mutation that should
// have been tracking something.
export function trackAppointmentEvent(event: AppointmentLifecycleEvent): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[telemetry]", event.name, event);
  }
}
