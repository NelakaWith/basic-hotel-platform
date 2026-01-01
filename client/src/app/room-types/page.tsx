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
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/use-api";
import { getAuth } from "@/lib/auth-storage";
import { useRouter } from "next/navigation";

type RoomType = {
  id: number;
  hotel_id: number;
  name: string;
  base_rate: number;
  effective_rate?: number;
  created_at: string;
};

function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { request } = useApi();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) {
      router.replace("/auth");
      return;
    }

    const fetchRoomTypes = async () => {
      try {
        const data = await request<{ room_types: RoomType[] }>(
          "/hotels/1/room-types",
          { authToken: auth.token }
        );
        setRoomTypes(data.room_types || []);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load room types"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoomTypes();
  }, [request, router]);

  const subtitle = useMemo(() => {
    if (loading) return "Loading room types...";
    if (error) return "Error loading room types";
    return `${roomTypes.length} room type${roomTypes.length === 1 ? "" : "s"}`;
  }, [loading, error, roomTypes.length]);

  return (
    <section className="space-y-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Room Types</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button disabled>New Room Type</Button>
      </header>

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
            {!loading && !error && roomTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No room types found.</TableCell>
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
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default RoomTypesPage;
