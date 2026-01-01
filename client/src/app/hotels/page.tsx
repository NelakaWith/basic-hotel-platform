"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/lib/use-api";
import { getAuth } from "@/lib/auth-storage";
import { useRouter } from "next/navigation";
import { AppSectionHeader } from "@/components/app-section-header";

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
  const { getHotels } = useApi();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) {
      router.replace("/auth");
      return;
    }

    const fetchHotels = async () => {
      try {
        const data = await getHotels<{ hotels: Hotel[] }>({
          authToken: auth?.token,
        });
        setHotels(data.hotels || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load hotels");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [getHotels, router]);

  const subtitle = useMemo(() => {
    if (loading) return "Loading hotels...";
    if (error) return "Error loading hotels";
    return `${hotels.length} hotel${hotels.length === 1 ? "" : "s"}`;
  }, [loading, error, hotels.length]);

  return (
    <section className="space-y-4 p-4">
      <AppSectionHeader
        title="Hotels"
        subtitle={subtitle}
        ctaLabel="New Hotel"
        ctaDisabled
      />

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5}>Loading...</TableCell>
              </TableRow>
            )}
            {error && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && hotels.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No hotels found.</TableCell>
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
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default HotelsPage;
