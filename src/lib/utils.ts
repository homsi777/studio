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
};

// Generates a mock UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// In a real app, you'd fetch this from your DB. For now, we'll generate it.
// This ensures that each table number has a consistent, unique UUID for the session.
const generateTableUuids = (count: number): Record<string, string> => {
    const map: Record<string, string> = {};
    for (let i = 1; i <= count; i++) {
        // Find if a UUID for this table number already exists in the static map
        const existingUuid = Object.keys(uuidToTableMap).find(key => uuidToTableMap[key] === i.toString());
        if (existingUuid) {
            map[i.toString()] = existingUuid;
        } else {
            map[i.toString()] = generateUUID();
        }
    }
    return map;
};

// We need to define this outside the component to keep it consistent across renders
export const tableIdToUuidMap = generateTableUuids(50); // Generate for up to 50 tables
