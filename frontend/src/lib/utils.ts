import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitaire pour combiner des classes CSS conditionnellement
 * Fusionne les classes avec clsx et optimise les classes Tailwind avec twMerge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
