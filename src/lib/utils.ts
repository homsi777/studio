import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generates a mock UUID - This is a fallback and should ideally be handled by the database.
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// In a real app, this mapping would come from a single source of truth, like the fetched tables data.
// For now, these are just illustrative fallbacks.
export const uuidToTableMap: Record<string, string> = {};
export const tableIdToUuidMap: Record<string, string> = {};
