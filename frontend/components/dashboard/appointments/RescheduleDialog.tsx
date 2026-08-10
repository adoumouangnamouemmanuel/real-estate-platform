"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/formatters";
import type { Appointment } from "@/types";

interface RescheduleDialogProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scheduledFor: string) => void;
  isPending: boolean;
}

/** "YYYY-MM-DDTHH:mm" in local time, the format <input type="datetime-local"> needs — an ISO string's trailing "Z"/offset isn't valid for its value attribute. */
function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Picks a new date/time for an appointment — always lands it in RESCHEDULED, per appointmentService.reschedule. */
export function RescheduleDialog({
  appointment,
  onOpenChange,
  onConfirm,
  isPending,
}: RescheduleDialogProps) {
  const [value, setValue] = useState("");

  function handleOpenChange(open: boolean) {
    if (open && appointment) {
      setValue(toDateTimeLocalValue(appointment.scheduledFor));
    }
    onOpenChange(open);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value) return;
    onConfirm(new Date(value).toISOString());
  }

  return (
    <Dialog open={Boolean(appointment)} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>
              {appointment &&
                `Pick a new date and time for ${appointment.clientName}'s viewing.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 p-4">
            {appointment && (
              <p className="text-muted-foreground text-sm">
                Currently scheduled for{" "}
                <span className="text-foreground font-medium">
                  {formatDateTime(appointment.scheduledFor)}
                </span>
                .
              </p>
            )}
            <div>
              <label
                htmlFor="reschedule-datetime"
                className="text-muted-foreground mb-1 block text-xs"
              >
                New date &amp; time
              </label>
              <input
                id="reschedule-datetime"
                type="datetime-local"
                required
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="border-border bg-background h-9 w-full rounded-md border px-2 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !value}>
              {isPending ? "Saving…" : "Confirm reschedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
