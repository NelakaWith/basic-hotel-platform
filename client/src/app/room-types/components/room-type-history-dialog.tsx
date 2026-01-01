"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useApi } from "@/lib/use-api";
import type { RateAdjustment } from "./room-type-adjustments-dialog";
import type { RoomTypeRow } from "@/components/room-types/room-type-table";
import { getAuth } from "@/lib/auth-storage";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

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

export type RoomTypeHistoryDialogProps = {
  roomType: RoomTypeRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoomTypeHistoryDialog({
  roomType,
  open,
  onOpenChange,
}: RoomTypeHistoryDialogProps) {
  const [adjustments, setAdjustments] = useState<RateAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getRoomTypeAdjustments } = useApi();

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
      toast.error("Unable to load adjustment history", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [roomType, getRoomTypeAdjustments]);

  useEffect(() => {
    if (open && roomType) {
      fetchAdjustments();
    } else if (!open) {
      setAdjustments([]);
      setError(null);
    }
  }, [open, roomType, fetchAdjustments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {roomType
              ? `Adjustment History · ${roomType.name}`
              : "Adjustment History"}
          </DialogTitle>
          <DialogDescription>
            Review every recorded rate change for this room type.
          </DialogDescription>
        </DialogHeader>
        {roomType ? (
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading adjustment history...
              </p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : adjustments.length ? (
              <div className="max-h-120 space-y-3 overflow-y-auto pr-1">
                {adjustments.map((entry, index) => (
                  <div
                    key={`${entry.id}-${index}`}
                    className="rounded-md border bg-muted/30 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {formatAdjustment(entry.adjustment_amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        In effect {formatDateTime(entry.effective_date)}
                      </p>
                    </div>
                    <p className="text-muted-foreground">{entry.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Logged {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No rate adjustments have been recorded for this room type.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a room type to view its adjustment history.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
