import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper precedence
 * 
 * @description Combines clsx for conditional classes with tailwind-merge to handle
 * Tailwind class conflicts. Later classes override earlier ones.
 * 
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 * 
 * @example
 * ```typescript
 * cn("px-2 py-1", "px-4") // "py-1 px-4"
 * cn("text-red-500", isError && "text-blue-500") // conditional classes
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
