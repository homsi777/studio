
import Dexie from 'dexie';
import type { Table, Order, MenuItem, PendingSyncOperation } from '@/types';

// تعريف قاعدة بيانات IndexedDB
class MaidaDatabase extends Dexie {
  tables!: Dexie.Table<Table, number>; // Primary key is 'id' (number)
  orders!: Dexie.Table<Order, string>; // Primary key is 'id' (string)
  menuItems!: Dexie.Table<MenuItem, string>; // Primary key is 'id' (string)
  pendingSyncOperations!: Dexie.Table<PendingSyncOperation, number>;

  constructor() {
    super('maidaAppDb'); // اسم قاعدة البيانات
    this.version(2).stores({
      tables: '++id, status', 
      orders: '&id, table_id, status, created_at',
      menuItems: '&id, name, category, is_available',
      pendingSyncOperations: '++id, type, tableName, timestamp',
    });
    
    this.on('ready', () => console.log('IndexedDB is ready!'));
    this.open().catch((err) => {
      console.error(`Failed to open IndexedDB: ${err.stack || err}`);
    });
  }
}

export const db = new MaidaDatabase();

// --- دوال مساعدة عامة ---

export const getCachedData = async <T>(tableName: 'tables' | 'orders' | 'menuItems'): Promise<T[]> => {
  return await db[tableName].toArray();
};

export const saveToCache = async <T>(tableName: 'tables' | 'orders' | 'menuItems', data: T[]) => {
  try {
    await db[tableName].bulkPut(data as any[]); // Cast to any[] to satisfy Dexie's bulkPut
    console.log(`Saved ${data.length} items to ${tableName} in IndexedDB cache.`);
  } catch(error) {
    console.error(`Error saving to ${tableName}:`, error);
  }
};

export const addToSyncQueue = async (
    type: 'insert' | 'update' | 'delete', 
    tableName: 'tables' | 'orders' | 'menu_items' | 'expenses', 
    payload: any
) => {
  await db.pendingSyncOperations.add({ type, payload, tableName, timestamp: Date.now() });
  console.log(`Operation added to sync queue: ${type} on ${tableName}`);
};

export const getSyncQueue = async (): Promise<PendingSyncOperation[]> => {
  return await db.pendingSyncOperations.orderBy('timestamp').toArray();
};

export const clearSyncQueueItem = async (id: number) => {
  await db.pendingSyncOperations.delete(id);
  console.log(`Sync queue item ${id} cleared.`);
};

export const clearAllSyncQueue = async () => {
    await db.pendingSyncOperations.clear();
    console.log("All pending sync operations cleared.");
};
