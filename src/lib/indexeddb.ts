// src/lib/indexeddb.ts
import Dexie from 'dexie';
import type { Table, Order, MenuItem, PendingSyncOperation } from '@/types'; // تأكد من استيراد جميع الأنواع الضرورية

// قم بتعريف فئة قاعدة البيانات الخاصة بك التي توسع Dexie
class MaidaDatabase extends Dexie {
  // تعريف خصائص الجداول لأنواع TypeScript والدعم IntelliSense
  tables!: Dexie.Table<Table, string>; // المفتاح الأساسي هو string (UUID)
  orders!: Dexie.Table<Order, string>; // المفتاح الأساسي هو string (UUID)
  menuItems!: Dexie.Table<MenuItem, string>; // المفتاح الأساسي هو string (UUID)
  pendingSyncOperations!: Dexie.Table<PendingSyncOperation, number>; // المفتاح الأساسي هو number (ترقيم تلقائي)

  constructor() {
    super('maidaAppDb'); // اسم قاعدة بيانات IndexedDB الخاصة بك

    // قم بتعريف مخطط قاعدة البيانات هنا
    this.version(1).stores({
      tables: '&uuid, id, status', // &uuid is the primary key. 'id' and 'status' are indexed.
      orders: '&id, table_uuid, status, created_at',
      menuItems: '&id, name, category, is_available',
      pendingSyncOperations: '++id, type, tableName, timestamp',
    });
    
  }
}

// إنشاء مثيل (Instance) لقاعدة البيانات الخاصة بك
export const db = new MaidaDatabase();

// --- دوال المساعدة لعمليات IndexedDB ---

export const getCachedData = async <T>(tableName: 'tables' | 'orders' | 'menuItems'): Promise<T[]> => {
  try {
    const table = db.table(tableName);
    if (!table) {
      console.warn(`[IndexedDB] Table ${tableName} not found in IndexedDB schema.`);
      return [];
    }
    const data = await table.toArray();
    console.log(`[IndexedDB] Fetched ${data.length} items from IndexedDB table: ${tableName}`);
    return data as T[];
  } catch (error) {
    console.error(`[IndexedDB] Error getting cached data from ${tableName}:`, error);
    return [];
  }
};

export const saveToCache = async <T>(tableName: 'tables' | 'orders' | 'menuItems', data: T[]): Promise<void> => {
  try {
    const table = db.table(tableName);
    if (!table) {
      console.warn(`[IndexedDB] Table ${tableName} not found in IndexedDB schema for saving.`);
      return;
    }
    await db.transaction('rw', table, async () => {
      await table.clear(); // مسح البيانات الموجودة
      await table.bulkPut(data as any[]); // إضافة البيانات الجديدة
    });
    console.log(`[IndexedDB] Saved ${data.length} items to IndexedDB table: ${tableName}`);
  } catch (error: any) {
  // قم بتجاهل الأخطاء التي تحدث إذا كانت القاعدة مغلقة أثناء التنظيف مثلاً
  if (error instanceof Dexie.DatabaseClosedError) {
      console.warn(`[IndexedDB] Database closed during save operation to ${tableName}. Ignoring.`);
  } else {
      console.error(`[IndexedDB] Error saving data to ${tableName}:`, error);
  }
  }
};

export const addToSyncQueue = async (
  type: PendingSyncOperation['type'],
  tableName: PendingSyncOperation['tableName'],
  payload: PendingSyncOperation['payload'],
  timestamp: string = new Date().toISOString()
) => {
  try {
    await db.pendingSyncOperations.add({ type, payload, tableName, timestamp });
    console.log(`[IndexedDB] Operation added to sync queue: ${type} on ${tableName} at ${timestamp}`);
  } catch (error) {
    console.error(`[IndexedDB] Error adding to sync queue:`, error);
  }
};

export const getSyncQueue = async (): Promise<PendingSyncOperation[]> => {
  try {
    const queue = await db.pendingSyncOperations.orderBy('timestamp').toArray();
    console.log(`[IndexedDB] Fetched ${queue.length} items from sync queue.`);
    return queue;
  } catch (error) {
    console.error(`[IndexedDB] Error getting sync queue:`, error);
    return [];
  }
};

export const clearSyncQueueItem = async (id: number): Promise<void> => {
  try {
    await db.pendingSyncOperations.delete(id);
    console.log(`[IndexedDB] Removed sync item with ID: ${id}`);
  } catch (error) {
    console.error(`[IndexedDB] Error clearing sync queue item ${id}:`, error);
  }
};

export const clearAllSyncQueue = async (): Promise<void> => {
  try {
    await db.pendingSyncOperations.clear();
    console.log('[IndexedDB] All pending sync operations cleared.');
  } catch (error) {
    console.error(`[IndexedDB] Error clearing all sync queue:`, error);
  }
};
