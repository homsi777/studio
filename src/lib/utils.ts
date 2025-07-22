import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generates a mock UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- Centralized UUID Mapping ---
// In a real app, this would be fetched from your DB. For now, we'll generate it
// and keep it consistent across the app.

// Base static map for specific UUIDs we control (e.g., in demos, tests)
const staticUuidMap: Record<string, string> = {
    "a1b2c3d4-e5f6-7890-1234-567890abcdef": "1", // Demo link in sidebar
    "d2a5c1b8-3e9f-4b0a-8d1c-7f8e9a2b3c4d": "5", // Example for QR generator
};

const generateConsistentUuids = (count: number): { tableToUuid: Record<string, string>, uuidToTable: Record<string, string> } => {
    const tableToUuid: Record<string, string> = {};
    const uuidToTable: Record<string, string> = { ...staticUuidMap };

    // First, populate the map with static values reversed
    for (const uuid in staticUuidMap) {
        const tableId = staticUuidMap[uuid];
        tableToUuid[tableId] = uuid;
    }

    // Generate UUIDs for the rest of the tables
    for (let i = 1; i <= count; i++) {
        const tableIdStr = i.toString();
        if (!tableToUuid[tableIdStr]) {
            const newUuid = generateUUID();
            tableToUuid[tableIdStr] = newUuid;
            uuidToTable[newUuid] = tableIdStr;
        }
    }
    
    return { tableToUuid, uuidToTable };
};

const { tableToUuid, uuidToTable } = generateConsistentUuids(50); // Generate for up to 50 tables

export const tableIdToUuidMap = tableToUuid;
export const uuidToTableMap = uuidToTable;
