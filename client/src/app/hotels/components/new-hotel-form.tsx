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

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

type FormValues = {
  name: string;
  location: string;
  status: (typeof STATUS_OPTIONS)[number]["value"];
};

type ExistingHotel = {
  id: number;
  name: string;
  location: string;
  status: string;
};

type NewHotelFormProps = {
  onSuccess?: () => void;
  initialHotel?: ExistingHotel | null;
  mode?: "create" | "edit";
};

export function NewHotelForm({
  onSuccess,
  initialHotel,
  mode,
}: NewHotelFormProps) {
  const formMode = mode ?? (initialHotel ? "edit" : "create");
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      location: "",
      status: "active",
    },
  });
  const { isSubmitting } = form.formState;
  const { createHotel, updateHotel } = useApi();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      name: initialHotel?.name ?? "",
      location: initialHotel?.location ?? "",
      status: initialHotel?.status ?? "active",
    });
  }, [initialHotel, form]);

  const submitLabel = formMode === "edit" ? "Save Changes" : "Create Hotel";
  const pendingLabel = formMode === "edit" ? "Saving..." : "Creating...";

  const handleSubmit = form.handleSubmit(async (values) => {
    const auth = getAuth();
    if (!auth?.user) {
      // Server rejects calls without cookies, but short-circuit for UX.
      const message = "Your session has expired. Please sign in again.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        location: values.location.trim(),
        status: values.status,
      };

      if (formMode === "edit" && initialHotel) {
        await updateHotel(initialHotel.id, payload);
        form.reset(payload);
      } else {
        await createHotel(payload);
        // Reset to defaults so the dialog is ready for the next entry.
        form.reset({ name: "", location: "", status: "active" });
      }

      onSuccess?.();
    } catch (err) {
      const fallbackMessage =
        formMode === "edit"
          ? "Failed to update hotel"
          : "Failed to create hotel";
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
          rules={{ required: "Hotel name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Lakeside Resort" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          rules={{ required: "Location is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Austin, TX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
