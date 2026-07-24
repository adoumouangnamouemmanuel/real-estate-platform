import type { AppointmentStatus, UserRole } from "@/types";

export type AppointmentActionKey =
  "CONFIRM" | "RESCHEDULE" | "COMPLETE" | "NO_SHOW" | "CANCEL";

export interface AppointmentAction {
  key: AppointmentActionKey;
  label: string;
  /** The status this action moves to — absent for RESCHEDULE, which needs a new date/time as input, not just a status flip. */
  target?: AppointmentStatus;
  /** Whether this action is safe to apply across a mixed-status bulk selection. */
  bulkSafe: boolean;
}

/**
 * Reserved for future role-based permissioning (e.g. an ADMIN seeing every
 * action, a read-only support role seeing none) — unused today, since every
 * action is available to any authenticated developer viewing their own
 * appointments. Threading this through `getActions` now means adding a real
 * role check later is a policy change inside this one module, not a new
 * parameter every call site (row menu, bulk bar, service layer) has to learn.
 */
export interface AppointmentActionContext {
  role?: UserRole;
}

const ACTION_DEFINITIONS: Record<
  AppointmentActionKey,
  Omit<AppointmentAction, "key">
> = {
  CONFIRM: { label: "Confirm", target: "CONFIRMED", bulkSafe: true },
  RESCHEDULE: { label: "Reschedule", bulkSafe: false },
  COMPLETE: { label: "Mark Complete", target: "COMPLETED", bulkSafe: false },
  NO_SHOW: { label: "Mark No-Show", target: "NO_SHOW", bulkSafe: false },
  CANCEL: { label: "Cancel", target: "CANCELLED", bulkSafe: true },
};

/**
 * The appointment lifecycle graph — not a strict linear chain. REQUESTED can
 * only move forward to CONFIRMED or CANCELLED; COMPLETED/CANCELLED/NO_SHOW
 * are terminal (a real visit's outcome can't be undone by clicking a button).
 * RESCHEDULED behaves like CONFIRMED for onward moves, plus can be
 * rescheduled again.
 */
const AVAILABLE_ACTIONS: Record<AppointmentStatus, AppointmentActionKey[]> = {
  REQUESTED: ["CONFIRM", "CANCEL"],
  CONFIRMED: ["RESCHEDULE", "COMPLETE", "NO_SHOW", "CANCEL"],
  RESCHEDULED: ["CONFIRM", "RESCHEDULE", "COMPLETE", "NO_SHOW", "CANCEL"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/**
 * Centralizes "what can happen to an appointment in this status" so the row
 * action menu, the bulk actions toolbar, and the service layer's transition
 * validation all read from one place — a business-rule change here can't
 * update one surface and silently miss another, the same reasoning behind
 * `STATUS_TRANSITIONS` in `services/listing.service.ts`.
 */
export const AppointmentActionPolicy = {
  /** Every action valid from this status — drives the per-row action menu and the details drawer. */
  getActions(
    status: AppointmentStatus,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future role-based filtering, see AppointmentActionContext
    _context: AppointmentActionContext = {},
  ): AppointmentAction[] {
    return AVAILABLE_ACTIONS[status].map((key) => ({
      key,
      ...ACTION_DEFINITIONS[key],
    }));
  },

  /**
   * The fixed set of actions the bulk toolbar offers — Confirm/Cancel only.
   * Reschedule needs a per-row date input; Complete/No-Show are per-visit
   * outcomes, not something to batch-apply (see the Phase 6.4 review).
   * `_context` is accepted for API symmetry with `getActions` and future
   * role-based filtering, even though it's unused today.
   */
  getBulkActions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future role-based filtering, see AppointmentActionContext
    _context: AppointmentActionContext = {},
  ): AppointmentAction[] {
    return (Object.keys(ACTION_DEFINITIONS) as AppointmentActionKey[])
      .filter((key) => ACTION_DEFINITIONS[key].bulkSafe)
      .map((key) => ({ key, ...ACTION_DEFINITIONS[key] }));
  },

  isValidTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    return AVAILABLE_ACTIONS[from].some(
      (key) => ACTION_DEFINITIONS[key].target === to,
    );
  },

  isTerminal(status: AppointmentStatus): boolean {
    return AVAILABLE_ACTIONS[status].length === 0;
  },
};
