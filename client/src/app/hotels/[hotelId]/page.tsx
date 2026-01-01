"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { AppSectionHeader } from "@/components/app-section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useApi } from "@/lib/use-api";
import { getAuth } from "@/lib/auth-storage";
import {
  RoomTypeTable,
  type RoomTypeRow,
} from "@/components/room-types/room-type-table";
import { TrendingUp } from "lucide-react";
import { RoomTypeAdjustmentsDialog } from "@/app/room-types/components/room-type-adjustments-dialog";

type HotelDetail = {
  id: number;
  name: string;
  location: string;
  status: string;
  created_at: string;
};

type RoomType = RoomTypeRow;

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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [adjustmentRoomType, setAdjustmentRoomType] = useState<RoomType | null>(
    null
  );
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

  const handleAdjustmentsClick = (roomType: RoomTypeRow) => {
    setAdjustmentRoomType(roomType as RoomType);
    setIsAdjustmentDialogOpen(true);
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
        const list = data.room_types || [];
        setRoomTypes(list);
        setAdjustmentRoomType((current) => {
          if (!current) return current;
          const next = list.find((item) => item.id === current.id);
          return next ?? current;
        });
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

    setAuthToken(auth.token);
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

      <RoomTypeTable
        roomTypes={roomTypes}
        loading={roomTypesLoading}
        error={roomTypesError}
        emptyMessage={hotel ? "No room types configured." : "Select a hotel."}
        actionsColumnLabel="Adjustments"
        renderActions={(roomType) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Adjust rate for ${roomType.name}`}
            onClick={() => handleAdjustmentsClick(roomType)}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="sr-only">Adjust rate for {roomType.name}</span>
          </Button>
        )}
      />

      <RoomTypeAdjustmentsDialog
        roomType={adjustmentRoomType}
        open={isAdjustmentDialogOpen}
        authToken={authToken}
        onOpenChange={(open) => {
          setIsAdjustmentDialogOpen(open);
          if (!open) {
            setAdjustmentRoomType(null);
          }
        }}
        onAdjustmentSaved={() => {
          if (authToken && hotelId !== null) {
            fetchRoomTypes(authToken, hotelId);
          }
        }}
      />
    </section>
  );
}

export default HotelDetailPage;
