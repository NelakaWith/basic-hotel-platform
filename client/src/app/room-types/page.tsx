"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/use-api";
import { getAuth } from "@/lib/auth-storage";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppSectionHeader } from "@/components/app-section-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoomTypeForm } from "./components/room-type-form";

type RoomType = {
  id: number;
  hotel_id: number;
  name: string;
  base_rate: number;
  effective_rate?: number;
  created_at: string;
};

type HotelSummary = {
  id: number;
  name: string;
};

function RoomTypesPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [activeRoomType, setActiveRoomType] = useState<RoomType | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<RoomType | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<HotelSummary[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const { getRoomTypes, deleteRoomType, getHotels } = useApi();
  const selectedHotel =
    hotels.find((hotel) => hotel.id === selectedHotelId) ?? null;
  const initialQueryHotelId = useMemo(() => {
    const value = searchParams.get("hotelId");
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const fetchRoomTypes = useCallback(
    async (token: string, hotelId: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRoomTypes<{ room_types: RoomType[] }>(hotelId, {
          authToken: token,
        });
        setRoomTypes(data.room_types || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load room types";
        setError(message);
        toast.error("Unable to load room types", {
          description: message,
        });
      } finally {
        setLoading(false);
      }
    },
    [getRoomTypes]
  );

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) {
      router.replace("/auth");
      return;
    }

    setAuthToken(auth.token);

    if (!hotels.length) {
      const loadHotels = async () => {
        try {
          const data = await getHotels<{ hotels: HotelSummary[] }>({
            authToken: auth.token,
          });
          const list = data.hotels || [];
          setHotels(list);
          if (!list.length) {
            setSelectedHotelId(null);
            setRoomTypes([]);
            setLoading(false);
            return;
          }
          const hasQueryMatch =
            initialQueryHotelId &&
            list.some((hotel) => hotel.id === initialQueryHotelId);
          const resolvedId = hasQueryMatch
            ? (initialQueryHotelId as number)
            : list[0].id;
          setSelectedHotelId(resolvedId);
          fetchRoomTypes(auth.token, resolvedId);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load hotels";
          setError(message);
          toast.error("Unable to load hotels", {
            description: message,
          });
          setLoading(false);
        }
      };

      loadHotels();
      return;
    }

    if (
      initialQueryHotelId &&
      hotels.some((hotel) => hotel.id === initialQueryHotelId) &&
      initialQueryHotelId !== selectedHotelId
    ) {
      setSelectedHotelId(initialQueryHotelId);
      fetchRoomTypes(auth.token, initialQueryHotelId);
    }
  }, [
    fetchRoomTypes,
    getHotels,
    hotels,
    initialQueryHotelId,
    router,
    selectedHotelId,
  ]);

  const subtitle = useMemo(() => {
    if (loading) return "Loading room types...";
    if (error) return "Error loading room types";
    const base = `${roomTypes.length} room type${
      roomTypes.length === 1 ? "" : "s"
    }`;
    return selectedHotel ? `${base} for ${selectedHotel.name}` : base;
  }, [loading, error, roomTypes.length, selectedHotel]);

  const openCreateDialog = () => {
    if (!selectedHotelId) {
      toast.error("Select a hotel before adding room types.");
      return;
    }
    setDialogMode("create");
    setActiveRoomType(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (roomType: RoomType) => {
    setDialogMode("edit");
    setActiveRoomType(roomType);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (roomType: RoomType) => {
    setRoomTypeToDelete(roomType);
    setDeleteError(null);
    setConfirmOpen(true);
  };

  const handleHotelChange = (value: string) => {
    const nextId = Number(value);
    if (Number.isNaN(nextId)) return;
    setSelectedHotelId(nextId);
    setActiveRoomType(null);
    setRoomTypeToDelete(null);
    setConfirmOpen(false);
    if (authToken) {
      fetchRoomTypes(authToken, nextId);
    } else {
      setRoomTypes([]);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("hotelId", String(nextId));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleDeleteConfirm = async () => {
    if (!roomTypeToDelete) return;
    if (!authToken) {
      const message = "Session expired. Please sign in again.";
      setDeleteError(message);
      toast.error(message);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRoomType(roomTypeToDelete.id, { authToken });
      setConfirmOpen(false);
      setRoomTypeToDelete(null);
      if (selectedHotelId) {
        fetchRoomTypes(authToken, selectedHotelId);
      } else {
        setRoomTypes([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete room type";
      setDeleteError(message);
      toast.error("Failed to delete room type", {
        description: message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-4 p-4">
      <AppSectionHeader
        title="Room Types"
        subtitle={subtitle}
        ctaLabel="New Room Type"
        onCtaClick={openCreateDialog}
        ctaDisabled={!authToken || !selectedHotelId}
        backHref="/hotels"
      />

      <div className="flex flex-wrap items-center gap-4 rounded-md border bg-muted/40 px-4 py-3">
        <div className="min-w-[160px]">
          <p className="text-sm font-medium">Hotel</p>
          <p className="text-xs text-muted-foreground">
            Choose which property&apos;s room types to view.
          </p>
        </div>
        <Select
          value={selectedHotelId !== null ? String(selectedHotelId) : undefined}
          onValueChange={handleHotelChange}
          disabled={!hotels.length || !authToken}
        >
          <SelectTrigger className="flex h-10 min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <SelectValue
              placeholder={
                !hotels.length ? "No hotels available" : "Select a hotel"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {hotels.map((hotel) => (
              <SelectItem key={hotel.id} value={String(hotel.id)}>
                {hotel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setDialogMode("create");
            setActiveRoomType(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Edit Room Type" : "Add a New Room Type"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Update the pricing or name for this room type."
                : selectedHotel
                ? `Provide the details for the room type you want to manage at ${selectedHotel.name}.`
                : "Select a hotel to manage its room types."}
            </DialogDescription>
          </DialogHeader>
          {selectedHotelId ? (
            <RoomTypeForm
              hotelId={selectedHotelId}
              mode={dialogMode}
              initialRoomType={dialogMode === "edit" ? activeRoomType : null}
              onSuccess={() => {
                setIsDialogOpen(false);
                setDialogMode("create");
                setActiveRoomType(null);
                if (authToken) {
                  fetchRoomTypes(authToken, selectedHotelId);
                }
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a hotel to manage its room types.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Hotel ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Base Rate</TableHead>
              <TableHead>Effective Rate</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7}>Loading...</TableCell>
              </TableRow>
            )}
            {error && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && roomTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>No room types found.</TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              roomTypes.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell>{rt.id}</TableCell>
                  <TableCell>{rt.hotel_id}</TableCell>
                  <TableCell className="font-medium">{rt.name}</TableCell>
                  <TableCell>${rt.base_rate.toFixed(2)}</TableCell>
                  <TableCell>
                    {rt.effective_rate !== undefined
                      ? `$${rt.effective_rate.toFixed(2)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(rt.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Edit ${rt.name}`}
                        onClick={() => handleEditClick(rt)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {rt.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label={`Delete ${rt.name}`}
                        onClick={() => handleDeleteClick(rt)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {rt.name}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setRoomTypeToDelete(null);
            setDeleteError(null);
            setIsDeleting(false);
          }
        }}
        title="Delete room type"
        description={
          roomTypeToDelete
            ? `This will permanently remove ${roomTypeToDelete.name}.`
            : "This will permanently remove the selected room type."
        }
        confirmLabel="Delete Room Type"
        loadingLabel="Deleting..."
        cancelLabel="Cancel"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      >
        {deleteError ? (
          <p className="text-sm text-destructive">{deleteError}</p>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}

export default RoomTypesPage;
