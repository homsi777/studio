// src/lib/indexeddb.ts

import Dexie, { Table } from 'dexie';
import { Order, Table as TableType, MenuItem, CustomerSession, UserProfile, Expense } from '../types';

// تعريف واجهة قاعدة البيانات المحلية
export interface LocalDB extends Dexie {
  tables: Table<TableType, string>; // uuid هو المفتاح الأساسي
  menuItems: Table<MenuItem, string>; // id هو المفتاح الأساسي
  orders: Table<Order, string>; // id هو المفتاح الأساسي
  customerSessions: Table<CustomerSession, string>; // id هو المفتاح الأساسي
  userProfiles: Table<UserProfile, string>; // user_id هو المفتاح الأساسي
  expenses: Table<Expense, string>; // id هو المفتاح الأساسي
  syncQueue: Table<{ id?: number, operation: string, data: any, timestamp: number }, number>; // قائمة انتظار المزامنة
}

// إنشاء مثيل قاعدة البيانات
export const db = new Dexie('MaaidaDB') as LocalDB;

// تعريف مخطط قاعدة البيانات (stores)
// يجب زيادة رقم الإصدار (version) عند تغيير المخطط (schema)
// تم تغيير الإصدار إلى 4 لضمان تطبيق جميع التعديلات وحل مشاكل الفتح
db.version(4).stores({ // <--- تم تغيير رقم الإصدار هنا إلى 4
  tables: 'uuid, display_number, status, is_active', // المفتاح الأساسي هو 'uuid'
  menuItems: 'id, name, category, is_available', // المفتاح الأساسي هو 'id'
  orders: 'id, table_uuid, session_id, status, created_at', // المفتاح الأساسي هو 'id'
  customerSessions: 'id, table_uuid, created_at', // المفتاح الأساسي هو 'id'
  userProfiles: 'user_id, role, full_name, is_active', // المفتاح الأساسي هو 'user_id'
  expenses: 'id, category, date, user_id', // المفتاح الأساسي هو 'id'
  syncQueue: '++id, operation, timestamp' // المفتاح الأساسي هو 'id' تلقائي الزيادة
});

// معالجة أحداث قاعدة البيانات
db.on('ready', () => {
  console.log('[IndexedDB] Database is ready.');
});

db.on('close', () => {
  console.log('[IndexedDB] Database was closed.');
});

// معالجة تحديثات الإصدار التي قد تتطلب إغلاق المتصفح (نادر)
db.on('versionchange', (event) => {
  console.warn(`[IndexedDB] Database version change detected. Old version: ${event.oldVersion}, New version: ${event.newVersion}. Please reload the page if you experience issues.`);
});

// معالجة حالة الحظر (نادر، يحدث عندما لا يمكن فتح DB بسبب تبويب آخر مفتوح)
db.on('blocked', () => {
  console.error('[IndexedDB] Database access blocked. Another tab might be holding the connection. Please close other tabs or reload.');
});

// دالة لتهيئة وفتح قاعدة البيانات
export async function initializeDb(): Promise<void> {
  if (db.isOpen()) {
    console.log('[IndexedDB] Database is already open.');
    return;
  }
  try {
    await db.open();
    console.log('[IndexedDB] Database opened successfully by initializeDb.');
  } catch (error) {
    console.error('[IndexedDB] Failed to open database by initializeDb:', error);
    throw error; // إعادة رمي الخطأ للسماح للمتصل بالتعامل معه
  }
}

// وظيفة مساعدة لضمان فتح قاعدة البيانات قبل أي عملية
async function ensureDbOpen(): Promise<void> {
  if (!db.isOpen()) {
    console.warn('[IndexedDB] DB was closed. Attempting to re-open for operation...');
    await initializeDb();
  }
}

// وظيفة لحفظ البيانات في IndexedDB
export async function saveToCache<T>(storeName: keyof LocalDB, data: T[]): Promise<void> {
  await ensureDbOpen(); // التأكد من أن قاعدة البيانات مفتوحة
  try {
    await db.transaction('rw', storeName, async () => { // استخدام اسم المتجر مباشرة
      await db.table(storeName).clear();
      await db.table(storeName).bulkAdd(data);
    });
    console.log(`[IndexedDB] Data saved to ${String(storeName)}:`, data.length);
  } catch (error) {
    console.error(`[IndexedDB] Error saving data to ${String(storeName)}:`, error);
    throw error;
  }
}

// وظيفة لإضافة عملية إلى قائمة انتظار المزامنة
export async function addToSyncQueue(operation: string, data: any): Promise<void> {
  await ensureDbOpen(); // التأكد من أن قاعدة البيانات مفتوحة
  try {
    await db.syncQueue.add({ operation, data, timestamp: Date.now() });
    console.log('[IndexedDB] Added to sync queue:', operation, data);
  } catch (error) {
    console.error('[IndexedDB] Error adding to sync queue:', error);
    throw error;
  }
}

// وظيفة لجلب قائمة انتظار المزامنة
export async function getSyncQueue(): Promise<{ id?: number, operation: string, data: any, timestamp: number }[]> {
  await ensureDbOpen(); // التأكد من أن قاعدة البيانات مفتوحة
  try {
    return await db.syncQueue.toArray();
  } catch (error) {
    console.error('[IndexedDB] Error getting sync queue:', error);
    return [];
  }
}

// وظيفة لمسح عملية من قائمة انتظار المزامنة بعد نجاحها
export async function clearSyncQueueItem(id: number): Promise<void> {
  await ensureDbOpen(); // التأكد من أن قاعدة البيانات مفتوحة
  try {
    await db.syncQueue.delete(id);
    console.log('[IndexedDB] Cleared sync queue item:', id);
  } catch (error) {
    console.error('[IndexedDB] Error clearing sync queue item:', error);
    throw error;
  }
}

// وظيفة لمسح قائمة انتظار المزامنة بالكامل (للتنظيف أو إعادة الضبط)
export async function clearSyncQueue(): Promise<void> {
  await ensureDbOpen(); // التأكد من أن قاعدة البيانات مفتوحة
  try {
    await db.syncQueue.clear();
    console.log('[IndexedDB] Sync queue cleared.');
  } catch (error) {
    console.error('[IndexedDB] Error clearing sync queue:', error);
    throw error;
  }
}

// وظيفة لجلب البيانات من IndexedDB
export async function getFromCache<T>(storeName: keyof LocalDB): Promise<T[]> {
  await ensureDbOpen(); // التأكد من أن قاعدة البيانات مفتوحة
  try {
    return await db.table(storeName).toArray() as T[]; // استخدام db.table(storeName)
  } catch (error) {
    console.error(`[IndexedDB] Error getting data from ${String(storeName)}:`, error);
    return [];
  }
}

// وظيفة لإضافة/تحديث عنصر واحد في IndexedDB
export async function putToCache<T>(storeName: keyof LocalDB, item: T): Promise<void> {
  await ensureDbOpen();
  try {
    await db.transaction('rw', storeName, async () => {
      await db.table(storeName).put(item);
    });
    console.log(`[IndexedDB] Item put to ${String(storeName)}:`, item);
  } catch (error) {
    console.error(`[IndexedDB] Error putting item to ${String(storeName)}:`, error);
    throw error;
  }
}

// وظيفة لحذف عنصر واحد من IndexedDB
export async function deleteFromCache(storeName: keyof LocalDB, key: string): Promise<void> {
  await ensureDbOpen();
  try {
    await db.transaction('rw', storeName, async () => {
      await db.table(storeName).delete(key);
    });
    console.log(`[IndexedDB] Item deleted from ${String(storeName)} with key:`, key);
  } catch (error) {
    console.error(`[IndexedDB] Error deleting item from ${String(storeName)}:`, error);
    throw error;
  }
}
