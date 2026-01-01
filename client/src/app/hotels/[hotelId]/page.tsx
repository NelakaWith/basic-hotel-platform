"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSectionHeader } from "@/components/app-section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useApi } from "@/lib/use-api";
import { getAuth } from "@/lib/auth-storage";

type HotelDetail = {
  id: number;
  name: string;
  location: string;
  status: string;
  created_at: string;
};

type RoomType = {
  id: number;
  name: string;
  base_rate: number;
  effective_rate?: number;
  created_at: string;
};

function normalizeHotelResponse(payload: unknown): HotelDetail | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("hotel" in payload) {
    const extracted = (payload as { hotel?: HotelDetail }).hotel;
    return extracted ?? null;
  }

  return payload as HotelDetail;
}

function DetailStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 rounded-md border bg-muted/40 px-3 py-2">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function HotelDetailPage() {
  const params = useParams<{ hotelId: string }>();
  const router = useRouter();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [hotelLoading, setHotelLoading] = useState(true);
  const [roomTypesLoading, setRoomTypesLoading] = useState(true);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [roomTypesError, setRoomTypesError] = useState<string | null>(null);
  const { getHotel, getRoomTypes } = useApi();

  const hotelId = useMemo(() => {
    const raw = params?.hotelId;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params]);

  const formatStatus = (status?: string | null) => {
    if (!status) return "—";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  };

  const fetchHotel = useCallback(
    async (token: string, id: number) => {
      setHotelLoading(true);
      setHotelError(null);
      try {
        const data = await getHotel<HotelDetail | { hotel: HotelDetail }>(id, {
          authToken: token,
        });
        const detail = normalizeHotelResponse(data);
        if (!detail) {
          throw new Error("Hotel not found");
        }
        setHotel(detail);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load hotel";
        setHotel(null);
        setHotelError(message);
        toast.error("Unable to load hotel", {
          description: message,
        });
      } finally {
        setHotelLoading(false);
      }
    },
    [getHotel]
  );

  const fetchRoomTypes = useCallback(
    async (token: string, id: number) => {
      setRoomTypesLoading(true);
      setRoomTypesError(null);
      try {
        const data = await getRoomTypes<{ room_types: RoomType[] }>(id, {
          authToken: token,
        });
        setRoomTypes(data.room_types || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load room types";
        setRoomTypes([]);
        setRoomTypesError(message);
        toast.error("Unable to load room types", {
          description: message,
        });
      } finally {
        setRoomTypesLoading(false);
      }
    },
    [getRoomTypes]
  );

  useEffect(() => {
    if (hotelId === null) {
      setHotelError("Invalid hotel identifier.");
      setRoomTypesError("Room types unavailable for this hotel.");
      setHotelLoading(false);
      setRoomTypesLoading(false);
      return;
    }

    const auth = getAuth();
    if (!auth?.token) {
      router.replace("/auth");
      return;
    }

    fetchHotel(auth.token, hotelId);
    fetchRoomTypes(auth.token, hotelId);
  }, [fetchHotel, fetchRoomTypes, hotelId, router]);

  const headerSubtitle = useMemo(() => {
    if (hotelLoading) return "Loading hotel details...";
    if (hotelError) return "Unable to load hotel details";
    if (!hotel) return undefined;
    return `${hotel.location} • ${formatStatus(hotel.status)}`;
  }, [hotel, hotelError, hotelLoading]);

  const summaryDescription = hotel
    ? `Property #${hotel.id} was created on ${formatDate(hotel.created_at)}.`
    : "Overview of the selected property.";

  return (
    <section className="space-y-6 p-4">
      <AppSectionHeader
        title={hotel?.name ?? "Hotel Details"}
        subtitle={headerSubtitle}
        backHref="/hotels"
        ctaLabel={hotelId ? "Manage Room Types" : undefined}
        onCtaClick={
          hotelId
            ? () => router.push(`/room-types?hotelId=${hotelId}`)
            : undefined
        }
        ctaDisabled={!hotelId}
      />

      <Card>
        <CardHeader>
          <CardTitle>Property Snapshot</CardTitle>
          <CardDescription>{summaryDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {hotelLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading property details...
            </p>
          ) : hotelError ? (
            <p className="text-sm text-destructive">{hotelError}</p>
          ) : hotel ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailStat label="Location" value={hotel.location} />
              <DetailStat label="Status" value={formatStatus(hotel.status)} />
              <DetailStat
                label="Created"
                value={formatDate(hotel.created_at)}
              />
              <DetailStat
                label="Room Types"
                value={
                  roomTypesLoading
                    ? "Loading..."
                    : `${roomTypes.length} ${
                        roomTypes.length === 1 ? "type" : "types"
                      }`
                }
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Base Rate</TableHead>
              <TableHead>Effective Rate</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roomTypesLoading && (
              <TableRow>
                <TableCell colSpan={5}>Loading room types...</TableCell>
              </TableRow>
            )}
            {roomTypesError && !roomTypesLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-destructive">
                  {roomTypesError}
                </TableCell>
              </TableRow>
            )}
            {!roomTypesLoading && !roomTypesError && roomTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  {hotel ? "No room types configured." : "Select a hotel."}
                </TableCell>
              </TableRow>
            )}
            {!roomTypesLoading &&
              !roomTypesError &&
              roomTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.id}</TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>${type.base_rate.toFixed(2)}</TableCell>
                  <TableCell>
                    {type.effective_rate !== undefined
                      ? `$${type.effective_rate.toFixed(2)}`
                      : "—"}
                  </TableCell>
                  <TableCell>{formatDate(type.created_at)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default HotelDetailPage;
