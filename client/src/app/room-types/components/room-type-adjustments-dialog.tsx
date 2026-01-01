"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApi } from "@/lib/use-api";
import { getAuth } from "@/lib/auth-storage";
import type { RoomTypeRow } from "@/components/room-types/room-type-table";

export type RateAdjustment = {
  id: number;
  room_type_id: number;
  effective_date: string;
  adjustment_amount: number;
  reason: string;
  created_at: string;
};

type RoomTypeAdjustmentsDialogProps = {
  roomType: RoomTypeRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjustmentSaved?: () => void;
};

const textareaClasses =
  "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const RECENT_HISTORY_LIMIT = 3;

const formatAdjustment = (value: number) => {
  const abs = Math.abs(value);
  if (value > 0) return `+${formatCurrency(abs)}`;
  if (value < 0) return `-${formatCurrency(abs)}`;
  return formatCurrency(abs);
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const toLocalInputValue = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function RoomTypeAdjustmentsDialog({
  roomType,
  open,
  onOpenChange,
  onAdjustmentSaved,
}: RoomTypeAdjustmentsDialogProps) {
  const [adjustments, setAdjustments] = useState<RateAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveDate, setEffectiveDate] = useState(() =>
    toLocalInputValue(new Date())
  );
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { getRoomTypeAdjustments, createRoomTypeAdjustment } = useApi();

  const canSubmit = !!roomType;

  const resetForm = useCallback(() => {
    setEffectiveDate(toLocalInputValue(new Date()));
    setAmount("");
    setReason("");
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const fetchAdjustments = useCallback(async () => {
    const session = getAuth();
    if (!roomType || !session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRoomTypeAdjustments<{
        adjustments: RateAdjustment[];
      }>(roomType.id);
      const normalized = (data.adjustments || []).map((entry) => ({
        ...entry,
        adjustment_amount: Number(entry.adjustment_amount),
      }));
      setAdjustments(normalized);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load adjustments";
      setError(message);
      toast.error("Unable to load adjustments", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [roomType, getRoomTypeAdjustments]);

  useEffect(() => {
    if (open && roomType) {
      fetchAdjustments();
    }
  }, [open, roomType, fetchAdjustments]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomType) return;
    const session = getAuth();
    if (!session?.user) {
      const message = "Session expired. Please sign in again.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount)) {
      setSubmitError("Enter a numeric adjustment amount.");
      return;
    }
    if (!effectiveDate) {
      setSubmitError("Choose an effective date.");
      return;
    }
    if (!reason.trim()) {
      setSubmitError("Include a brief reason for this change.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const isoEffectiveDate = new Date(effectiveDate).toISOString();
      await createRoomTypeAdjustment(roomType.id, {
        effective_date: isoEffectiveDate,
        adjustment_amount: parsedAmount,
        reason: reason.trim(),
      });
      toast.success("Rate adjustment recorded", {
        description: `${roomType.name} now reflects the new change.`,
      });
      resetForm();
      await fetchAdjustments();
      onAdjustmentSaved?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save adjustment";
      setSubmitError(message);
      toast.error("Unable to save adjustment", {
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {roomType
              ? `Rate Adjustments · ${roomType.name}`
              : "Rate Adjustments"}
          </DialogTitle>
          <DialogDescription>
            The effective rate equals the base rate plus the latest adjustment
            that is in effect for the selected date.
          </DialogDescription>
        </DialogHeader>
        {roomType ? (
          <div className="space-y-6">
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Current Snapshot
              </p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Base rate</p>
                  <p className="font-semibold">
                    {formatCurrency(roomType.base_rate)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Effective rate</p>
                  <p className="font-semibold">
                    {formatCurrency(
                      roomType.effective_rate ?? roomType.base_rate
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                <p>Recent adjustments</p>
                {adjustments.length > RECENT_HISTORY_LIMIT ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    Showing the latest {RECENT_HISTORY_LIMIT}. Use the history
                    icon to review the full log.
                  </span>
                ) : null}
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border bg-background p-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading adjustments...
                  </p>
                ) : error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : adjustments.length ? (
                  adjustments
                    .slice(0, RECENT_HISTORY_LIMIT)
                    .map((entry, index) => (
                      <div
                        key={entry.id}
                        className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {formatAdjustment(entry.adjustment_amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(entry.effective_date)}
                          </p>
                        </div>
                        <p className="text-muted-foreground">{entry.reason}</p>
                        {index === 0 ? (
                          <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            Latest
                          </span>
                        ) : null}
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No adjustments recorded yet.
                  </p>
                )}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="adjustment-effective-date">
                  Effective date
                </Label>
                <Input
                  id="adjustment-effective-date"
                  type="datetime-local"
                  value={effectiveDate}
                  onChange={(event) => setEffectiveDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment-amount">Adjustment amount</Label>
                <Input
                  id="adjustment-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="e.g. 15 or -10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment-reason">Reason</Label>
                <textarea
                  id="adjustment-reason"
                  className={textareaClasses}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain why this change is needed"
                  required
                />
              </div>
              {submitError ? (
                <p className="text-sm text-destructive">{submitError}</p>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Saving..." : "Add adjustment"}
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a room type to manage its adjustments.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
