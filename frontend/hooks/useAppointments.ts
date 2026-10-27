"use client";
import { useContentLocale as useLanguage } from "@/hooks/useContentLocale";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/errors";
import { appointmentService, type GetAppointmentsParams } from "@/services";
import type { AppointmentStatus } from "@/types";

const APPOINTMENTS_KEY = ["appointments"] as const;

/** Keeps the previous page visible while the next page/filter loads, same as useListings. */
export function useAppointments(params: GetAppointmentsParams = {}) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, params, language],
    queryFn: () => appointmentService.getAppointments(params),
    placeholderData: keepPreviousData,
  });
}

export function useAppointmentStatusCounts() {
  const { language } = useLanguage();
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, "counts", language],
    queryFn: () => appointmentService.getStatusCounts(),
  });
}

export function useAppointment(id: string | undefined) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, "detail", id, language],
    queryFn: () => appointmentService.getAppointment(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateAppointments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
}

export function useUpdateAppointmentStatus() {
  const invalidate = useInvalidateAppointments();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentService.updateStatus(id, status),
    onSuccess: (appointment) => {
      invalidate();
      toast.success(`Appointment with ${appointment.clientName} updated.`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRescheduleAppointment() {
  const invalidate = useInvalidateAppointments();

  return useMutation({
    mutationFn: ({ id, scheduledFor }: { id: string; scheduledFor: string }) =>
      appointmentService.reschedule(id, scheduledFor),
    onSuccess: (appointment) => {
      invalidate();
      toast.success(`Appointment with ${appointment.clientName} rescheduled.`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBulkUpdateAppointmentStatus() {
  const invalidate = useInvalidateAppointments();

  return useMutation({
    mutationFn: ({
      ids,
      status,
    }: {
      ids: string[];
      status: AppointmentStatus;
    }) => appointmentService.bulkUpdateStatus(ids, status),
    onSuccess: ({ updated, skipped }) => {
      invalidate();
      if (skipped.length === 0) {
        toast.success(`${updated.length} appointment(s) updated.`);
      } else {
        toast.warning(
          `${updated.length} updated, ${skipped.length} skipped (not eligible for that status).`,
        );
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
