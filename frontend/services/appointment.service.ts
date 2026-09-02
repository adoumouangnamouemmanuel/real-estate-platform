import { api } from "@/lib/api";
import type {
  Appointment,
  AppointmentStatus,
  PaginatedResult,
  ApiResponse,
} from "@/types";

const DEFAULT_PAGE_SIZE = 10;

export type AppointmentSort = "date_asc" | "date_desc";

export type AppointmentTimeframe = "today" | "upcoming" | "overdue";

export interface AppointmentFilters {
  q?: string;
  status?: AppointmentStatus;
  timeframe?: AppointmentTimeframe;
  sort?: AppointmentSort;
}

export interface GetAppointmentsParams extends AppointmentFilters {
  page?: number;
  pageSize?: number;
}

export type AppointmentStatusCounts = Record<AppointmentStatus, number>;

export const appointmentService = {
  getAppointments: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetAppointmentsParams = {}): Promise<PaginatedResult<Appointment>> => {
    const params: Record<string, string | number> = { page, pageSize };
    if (filters.q) params.q = filters.q;
    if (filters.status) params.status = filters.status;
    if (filters.timeframe) params.timeframe = filters.timeframe;
    if (filters.sort) params.sort = filters.sort;

    return api
      .get<ApiResponse<PaginatedResult<Appointment>>>(
        "/developers/me/appointments",
        { params },
      )
      .then((res) => res.data.data);
  },

  getStatusCounts: (): Promise<AppointmentStatusCounts> =>
    api
      .get<ApiResponse<AppointmentStatusCounts>>(
        "/developers/me/appointments/counts",
      )
      .then((res) => res.data.data),

  getAppointment: (id: string): Promise<Appointment> =>
    api
      .get<ApiResponse<Appointment>>(
        `/developers/me/appointments/${id}`,
      )
      .then((res) => res.data.data),

  updateStatus: async (
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> => {
    const res = await api.patch<ApiResponse<Appointment>>(
      `/developers/me/appointments/${id}/status`,
      { status },
    );
    return res.data.data;
  },

  reschedule: async (
    id: string,
    scheduledFor: string,
  ): Promise<Appointment> => {
    const res = await api.patch<ApiResponse<Appointment>>(
      `/developers/me/appointments/${id}/reschedule`,
      { scheduledFor },
    );
    return res.data.data;
  },

  bulkUpdateStatus: (
    ids: string[],
    status: AppointmentStatus,
  ): Promise<{ updated: string[]; skipped: string[] }> =>
    api
      .patch<ApiResponse<{ updated: string[]; skipped: string[] }>>(
        "/developers/me/appointments/bulk-status",
        { ids, status },
      )
      .then((res) => res.data.data),
};
