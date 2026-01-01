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
import { useRouter } from "next/navigation";
import { AppSectionHeader } from "@/components/app-section-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NewHotelForm } from "./components/new-hotel-form";

type Hotel = {
  id: number;
  name: string;
  location: string;
  status: string;
  created_at: string;
};

function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [activeHotel, setActiveHotel] = useState<Hotel | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { getHotels, deleteHotel } = useApi();
  const router = useRouter();

  const fetchHotels = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHotels<{ hotels: Hotel[] }>({
          authToken: token,
        });
        setHotels(data.hotels || []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load hotels";
        setError(message);
        toast.error("Unable to load hotels", {
          description: message,
        });
      } finally {
        setLoading(false);
      }
    },
    [getHotels]
  );

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) {
      router.replace("/auth");
      return;
    }

    setAuthToken(auth.token);
    fetchHotels(auth.token);
  }, [fetchHotels, router]);

  const subtitle = useMemo(() => {
    if (loading) return "Loading hotels...";
    if (error) return "Error loading hotels";
    return `${hotels.length} hotel${hotels.length === 1 ? "" : "s"}`;
  }, [loading, error, hotels.length]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setActiveHotel(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (hotel: Hotel) => {
    setDialogMode("edit");
    setActiveHotel(hotel);
    setIsDialogOpen(true);
  };

  const handleViewClick = (hotelId: number) => {
    router.push(`/hotels/${hotelId}`);
  };

  const handleDeleteClick = (hotel: Hotel) => {
    setHotelToDelete(hotel);
    setDeleteError(null);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!hotelToDelete) return;
    if (!authToken) {
      const message = "Session expired. Please sign in again.";
      setDeleteError(message);
      toast.error(message);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteHotel(hotelToDelete.id, { authToken });
      setConfirmOpen(false);
      setHotelToDelete(null);
      fetchHotels(authToken);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete hotel";
      setDeleteError(message);
      toast.error("Failed to delete hotel", {
        description: message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-4 p-4">
      <AppSectionHeader
        title="Hotels"
        subtitle={subtitle}
        ctaLabel="New Hotel"
        onCtaClick={openCreateDialog}
        ctaDisabled={!authToken}
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setDialogMode("create");
            setActiveHotel(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Edit Hotel" : "Add a New Hotel"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Update the details for this property."
                : "Provide the core details for the property you want to manage."}
            </DialogDescription>
          </DialogHeader>
          <NewHotelForm
            mode={dialogMode}
            initialHotel={dialogMode === "edit" ? activeHotel : null}
            onSuccess={() => {
              setIsDialogOpen(false);
              setDialogMode("create");
              setActiveHotel(null);
              if (authToken) {
                fetchHotels(authToken);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            )}
            {error && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && hotels.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No hotels found.</TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              hotels.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell>{hotel.id}</TableCell>
                  <TableCell className="font-medium">{hotel.name}</TableCell>
                  <TableCell>{hotel.location}</TableCell>
                  <TableCell className="capitalize">{hotel.status}</TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(hotel.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`View ${hotel.name}`}
                        onClick={() => handleViewClick(hotel.id)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View {hotel.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Edit ${hotel.name}`}
                        onClick={() => handleEditClick(hotel)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {hotel.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label={`Delete ${hotel.name}`}
                        onClick={() => handleDeleteClick(hotel)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {hotel.name}</span>
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
            setHotelToDelete(null);
            setDeleteError(null);
            setIsDeleting(false);
          }
        }}
        title="Delete hotel"
        description={
          hotelToDelete
            ? `This will permanently remove ${hotelToDelete.name}.`
            : "This will permanently remove the selected hotel."
        }
        confirmLabel="Delete Hotel"
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

export default HotelsPage;
