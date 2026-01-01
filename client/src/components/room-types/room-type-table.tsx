"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type RoomTypeRow = {
  id: number;
  hotel_id?: number;
  name: string;
  base_rate: number;
  effective_rate?: number;
  created_at: string;
};

type RoomTypeTableProps = {
  roomTypes: RoomTypeRow[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showHotelColumn?: boolean;
  renderActions?: (roomType: RoomTypeRow) => ReactNode;
  actionsColumnLabel?: string;
  className?: string;
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export function RoomTypeTable({
  roomTypes,
  loading,
  error,
  emptyMessage = "No room types found.",
  showHotelColumn,
  renderActions,
  actionsColumnLabel = "Actions",
  className,
}: RoomTypeTableProps) {
  const columnCount = 5 + (showHotelColumn ? 1 : 0) + (renderActions ? 1 : 0);

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            {showHotelColumn ? <TableHead>Hotel ID</TableHead> : null}
            <TableHead>Name</TableHead>
            <TableHead>Base Rate</TableHead>
            <TableHead>Effective Rate</TableHead>
            <TableHead>Created</TableHead>
            {renderActions ? (
              <TableHead className="text-right">{actionsColumnLabel}</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columnCount}>Loading...</TableCell>
            </TableRow>
          ) : null}
          {error && !loading ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="text-destructive">
                {error}
              </TableCell>
            </TableRow>
          ) : null}
          {!loading && !error && roomTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount}>{emptyMessage}</TableCell>
            </TableRow>
          ) : null}
          {!loading &&
            !error &&
            roomTypes.map((roomType) => (
              <TableRow key={roomType.id}>
                <TableCell>{roomType.id}</TableCell>
                {showHotelColumn ? (
                  <TableCell>{roomType.hotel_id ?? "—"}</TableCell>
                ) : null}
                <TableCell className="font-medium">{roomType.name}</TableCell>
                <TableCell>{formatCurrency(roomType.base_rate)}</TableCell>
                <TableCell>
                  {roomType.effective_rate !== undefined
                    ? formatCurrency(roomType.effective_rate)
                    : "—"}
                </TableCell>
                <TableCell>{formatDate(roomType.created_at)}</TableCell>
                {renderActions ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {renderActions(roomType)}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
