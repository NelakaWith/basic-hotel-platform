"use client";

import { useCallback, useMemo } from "react";

const DEFAULT_API_BASE = "http://localhost:4000/api";

type RequestOptions = RequestInit & {
  authToken?: string | null;
};

type ApiClient = {
  request: <T = unknown>(path: string, options?: RequestOptions) => Promise<T>;
  getHotels: <T = { hotels: unknown[] }>(
    options?: RequestOptions
  ) => Promise<T>;
  getHotel: <T = { hotel: unknown }>(
    id: number,
    options?: RequestOptions
  ) => Promise<T>;
  createHotel: <T = unknown>(
    payload: { name: string; location: string; status?: string },
    options?: RequestOptions
  ) => Promise<T>;
  updateHotel: <T = unknown>(
    id: number,
    payload: Partial<{ name: string; location: string; status: string }>,
    options?: RequestOptions
  ) => Promise<T>;
  deleteHotel: (
    id: number,
    options?: RequestOptions
  ) => Promise<void>;
  getRoomTypes: <T = { room_types: unknown[] }>(
    hotelId: number,
    options?: RequestOptions
  ) => Promise<T>;
  createRoomType: <T = unknown>(
    hotelId: number,
    payload: { name: string; base_rate: number },
    options?: RequestOptions
  ) => Promise<T>;
  updateRoomType: <T = unknown>(
    id: number,
    payload: Partial<{ name: string; base_rate: number }>,
    options?: RequestOptions
  ) => Promise<T>;
  deleteRoomType: (
    id: number,
    options?: RequestOptions
  ) => Promise<void>;
  getRoomTypeAdjustments: <T = { adjustments: unknown[] }>(
    roomTypeId: number,
    options?: RequestOptions
  ) => Promise<T>;
  createRoomTypeAdjustment: <T = unknown>(
    roomTypeId: number,
    payload: {
      effective_date: string;
      adjustment_amount: number;
      reason: string;
    },
    options?: RequestOptions
  ) => Promise<T>;
};

export function useApi(): ApiClient {
  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE,
    []
  );

  const request = useCallback(
    async <T = unknown>(path: string, options: RequestOptions = {}) => {
      const { authToken, headers, ...rest } = options;
      const mergedHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(headers as Record<string, string> | undefined),
      };
      if (authToken) {
        mergedHeaders.Authorization = `Bearer ${authToken}`;
      }

      const res = await fetch(`${baseUrl}${path}`, {
        ...rest,
        headers: mergedHeaders,
      });

      if (!res.ok) {
        const message = await safeErrorMessage(res);
        throw new Error(message || `Request failed (${res.status})`);
      }

      // Handle empty responses
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [baseUrl]
  );

  const getHotels: ApiClient["getHotels"] = useCallback(
    (options) => request("/hotels", options),
    [request]
  );

  const getHotel: ApiClient["getHotel"] = useCallback(
    (id, options) => request(`/hotels/${id}`, options),
    [request]
  );

  const createHotel: ApiClient["createHotel"] = useCallback(
    (payload, options) =>
      request("/hotels", {
        ...options,
        method: "POST",
        body: JSON.stringify(payload),
      }),
    [request]
  );

  const updateHotel: ApiClient["updateHotel"] = useCallback(
    (id, payload, options) =>
      request(`/hotels/${id}`, {
        ...options,
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    [request]
  );

  const deleteHotel: ApiClient["deleteHotel"] = useCallback(
    (id, options) =>
      request<void>(`/hotels/${id}`, {
        ...options,
        method: "DELETE",
      }),
    [request]
  );

  const getRoomTypes: ApiClient["getRoomTypes"] = useCallback(
    (hotelId, options) => request(`/hotels/${hotelId}/room-types`, options),
    [request]
  );

  const createRoomType: ApiClient["createRoomType"] = useCallback(
    (hotelId, payload, options) =>
      request(`/hotels/${hotelId}/room-types`, {
        ...options,
        method: "POST",
        body: JSON.stringify(payload),
      }),
    [request]
  );

  const updateRoomType: ApiClient["updateRoomType"] = useCallback(
    (id, payload, options) =>
      request(`/room-types/${id}`, {
        ...options,
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    [request]
  );

  const deleteRoomType: ApiClient["deleteRoomType"] = useCallback(
    (id, options) =>
      request<void>(`/room-types/${id}`, {
        ...options,
        method: "DELETE",
      }),
    [request]
  );

  const getRoomTypeAdjustments: ApiClient["getRoomTypeAdjustments"] =
    useCallback(
      (roomTypeId, options) =>
        request(`/room-types/${roomTypeId}/adjustments`, options),
      [request]
    );

  const createRoomTypeAdjustment: ApiClient["createRoomTypeAdjustment"] =
    useCallback(
      (roomTypeId, payload, options) =>
        request(`/room-types/${roomTypeId}/adjustments`, {
          ...options,
          method: "POST",
          body: JSON.stringify(payload),
        }),
      [request]
    );

  return {
    request,
    getHotels,
    getHotel,
    createHotel,
    updateHotel,
    deleteHotel,
    getRoomTypes,
    createRoomType,
    updateRoomType,
    deleteRoomType,
    getRoomTypeAdjustments,
    createRoomTypeAdjustment,
  };
}

async function safeErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    if (data?.error) return data.error as string;
  } catch {
    // ignore JSON parse errors
  }
  return null;
}
