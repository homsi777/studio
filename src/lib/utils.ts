import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mock data to map a secure UUID to a simple display number for the customer.
// In a real app, this mapping would happen on the backend.
export const uuidToTableMap: Record<string, string> = {
    "a1b2c3d4-e5f6-7890-1234-567890abcdef": "1", // Demo link in sidebar
    "d2a5c1b8-3e9f-4b0a-8d1c-7f8e9a2b3c4d": "5", // Example for QR generator
    // More mappings would be added as QR codes are generated.
};
