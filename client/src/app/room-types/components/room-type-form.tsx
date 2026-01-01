"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useApi } from "@/lib/use-api";
import { getAuth } from "@/lib/auth-storage";
import { toast } from "sonner";

type FormValues = {
  name: string;
  base_rate: string;
};

type ExistingRoomType = {
  id: number;
  hotel_id: number;
  name: string;
  base_rate: number;
};

type RoomTypeFormProps = {
  hotelId: number;
  onSuccess?: () => void;
  initialRoomType?: ExistingRoomType | null;
  mode?: "create" | "edit";
};

const emptyValues: FormValues = {
  name: "",
  base_rate: "",
};

export function RoomTypeForm({
  hotelId,
  onSuccess,
  initialRoomType,
  mode,
}: RoomTypeFormProps) {
  const formMode = mode ?? (initialRoomType ? "edit" : "create");
  const form = useForm<FormValues>({
    defaultValues: emptyValues,
  });
  const { isSubmitting } = form.formState;
  const { createRoomType, updateRoomType } = useApi();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      name: initialRoomType?.name ?? "",
      base_rate:
        initialRoomType && typeof initialRoomType.base_rate === "number"
          ? initialRoomType.base_rate.toString()
          : "",
    });
  }, [initialRoomType, form]);

  const submitLabel = formMode === "edit" ? "Save Changes" : "Create Room Type";
  const pendingLabel = formMode === "edit" ? "Saving..." : "Creating...";

  const handleSubmit = form.handleSubmit(async (values) => {
    const auth = getAuth();
    if (!auth?.user) {
      // Let users know immediately when their cookie expires mid-dialog.
      const message = "Your session has expired. Please sign in again.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    const parsedRate = Number(values.base_rate);
    if (Number.isNaN(parsedRate)) {
      const message = "Base rate must be a number.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    if (parsedRate < 0) {
      // Guard against accidental negative inputs that would tank pricing.
      const message = "Base rate must be zero or higher.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        base_rate: parsedRate,
      };

      if (formMode === "edit" && initialRoomType) {
        await updateRoomType(initialRoomType.id, payload);
        form.reset({
          name: payload.name,
          base_rate: payload.base_rate.toString(),
        });
      } else {
        await createRoomType(hotelId, payload);
        form.reset(emptyValues);
      }

      onSuccess?.();
    } catch (err) {
      const fallbackMessage =
        formMode === "edit"
          ? "Failed to update room type"
          : "Failed to create room type";
      const message = err instanceof Error ? err.message : fallbackMessage;
      setSubmitError(message);
      toast.error(fallbackMessage, {
        description: message,
      });
    }
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Room type name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Deluxe Suite" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="base_rate"
          rules={{ required: "Base rate is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Rate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="249.99"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError ? (
          <p className="text-sm text-destructive">{submitError}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
