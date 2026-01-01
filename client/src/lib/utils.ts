import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind-friendly class combiner that dedupes conflicting utilities.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
