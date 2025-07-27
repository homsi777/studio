
// src/hooks/use-settings-command.tsx

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { addToSyncQueue, putToCache, deleteFromCache, getFromCache } from '../lib/indexeddb';
import { Table, UserProfile, TableStatus, UserRole } from '../types';
import { toast } from 'sonner';

// تهيئة Supabase Client (للاستخدام في الواجهة الأمامية)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const useSettingsCommand = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // دالة لجلب الطاولات من الكاش
  const fetchTablesFromCache = useCallback(async () => {
    try {
      const cachedTables = await getFromCache<Table>('tables');
      setTables(cachedTables);
    } catch (err) {
      console.error('Error fetching tables from cache:', err);
      setError('Failed to load tables from cache.');
    }
  }, []);

  // دالة لجلب المستخدمين من الكاش
  const fetchUsersFromCache = useCallback(async () => {
    try {
      const cachedUsers = await getFromCache<UserProfile>('userProfiles');
      setUserProfiles(cachedUsers);
    } catch (err) {
      console.error('Error fetching user profiles from cache:', err);
      setError('Failed to load user profiles from cache.');
    }
  }, []);

  // دالة لإضافة طاولة جديدة
  const addTable = useCallback(async (newTableData: { display_number: string, capacity: number }) => {
    setLoading(true);
    setError(null);
    try {
      const tableUuid = crypto.randomUUID();
      const tableToAdd: Table = {
        uuid: tableUuid,
        is_active: true,
        status: TableStatus.AVAILABLE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_order_id: null,
        assigned_user_id: null,
        ...newTableData,
      } as Table;

      // 1. حفظ الطاولة في IndexedDB فورياً (المصدر الوحيد للحقيقة محلياً)
      await putToCache('tables', tableToAdd);
      setTables(prev => [...prev, tableToAdd]); // تحديث الحالة المحلية فوراً

      // 2. إضافة العملية إلى قائمة انتظار المزامنة
      await addToSyncQueue('addTable', tableToAdd);

      // تم إزالة استدعاء API المباشر هنا.
      // سيتم التعامل مع الإرسال إلى Supabase بواسطة دالة syncPendingOperations.

      toast.success('تمت إضافة الطاولة محلياً. سيتم مزامنتها قريباً.'); // رسالة للمستخدم
    } catch (err) {
      console.error('Failed to add table to local cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to add table to local cache.');
    } finally {
      setLoading(false);
    }
  }, []);

  // دالة لتعديل طاولة
  const updateTable = useCallback(async (uuid: string, updatedData: Partial<Table>) => {
    setLoading(true);
    setError(null);
    try {
      const tableToUpdate = { ...updatedData, updated_at: new Date().toISOString() };

      // 1. تحديث الطاولة في IndexedDB فورياً
      await putToCache('tables', { uuid, ...tableToUpdate } as Table); // put سيقوم بالتحديث إذا كان UUID موجوداً
      setTables(prev => prev.map(t => t.uuid === uuid ? { ...t, ...tableToUpdate } : t));

      // 2. إضافة العملية إلى قائمة انتظار المزامنة
      await addToSyncQueue('updateTable', { uuid, updatedData: tableToUpdate });

      // تم إزالة استدعاء API المباشر هنا.

      toast.success('تم تحديث الطاولة محلياً. سيتم مزامنتها قريباً.');
    } catch (err) {
      console.error('Failed to update table in local cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to update table in local cache.');
    } finally {
      setLoading(false);
    }
  }, []);

  // دالة لتعطيل/حذف طاولة (حذف ناعم)
  const deactivateTable = useCallback(async (uuid: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. التحقق من التبعيات محلياً (يمكن تعزيزها على الخادم أيضاً)
      const table = tables.find(t => t.uuid === uuid);
      if (table && table.current_order_id) {
        throw new Error('Cannot deactivate table with an active order.');
      }

      const updatedData = { is_active: false, updated_at: new Date().toISOString() };

      // 2. تحديث الحالة في IndexedDB فورياً
      await putToCache('tables', { uuid, ...updatedData } as Table);
      setTables(prev => prev.map(t => t.uuid === uuid ? { ...t, ...updatedData } : t));

      // 3. إضافة العملية إلى قائمة انتظار المزامنة
      await addToSyncQueue('deactivateTable', { uuid });

      // تم إزالة استدعاء API المباشر هنا.

      toast.success('تم تعطيل الطاولة محلياً. سيتم مزامنتها قريباً.');
    } catch (err) {
      console.error('Failed to deactivate table in local cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate table in local cache.');
    } finally {
      setLoading(false);
    }
  }, [tables]); // تبعية tables للتحقق المحلي

  // دالة لإضافة ملف تعريف مستخدم جديد
  const addUserProfile = useCallback(async (newUserData: Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'> & { user_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      // توليد user_id إذا لم يتم توفيره (للحالات غير المرتبطة بـ Supabase Auth signUp)
      const userId = newUserData.user_id || crypto.randomUUID();
      const userProfileToAdd: UserProfile = {
        user_id: userId,
        is_active: true,
        hire_date: new Date().toISOString(),
        last_login: null,
        profile_image_url: null,
        salary: null,
        department: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newUserData,
      };

      // 1. حفظ ملف التعريف في IndexedDB فورياً
      await putToCache('userProfiles', userProfileToAdd);
      setUserProfiles(prev => [...prev, userProfileToAdd]);

      // 2. إضافة العملية إلى قائمة انتظار المزامنة
      await addToSyncQueue('addUserProfile', userProfileToAdd);

      // تم إزالة استدعاء API المباشر هنا.

      toast.success('تمت إضافة المستخدم محلياً. سيتم مزامنته قريباً.');
    } catch (err) {
      console.error('Failed to add user profile to local cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to add user profile to local cache.');
    } finally {
      setLoading(false);
    }
  }, []);

  // دالة لتعديل ملف تعريف مستخدم
  const updateUserProfile = useCallback(async (userId: string, updatedData: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const userProfileToUpdate = { ...updatedData, updated_at: new Date().toISOString() };

      // 1. تحديث ملف التعريف في IndexedDB فورياً
      await putToCache('userProfiles', { user_id: userId, ...userProfileToUpdate } as UserProfile);
      setUserProfiles(prev => prev.map(u => u.user_id === userId ? { ...u, ...userProfileToUpdate } : u));

      // 2. إضافة العملية إلى قائمة انتظار المزامنة
      await addToSyncQueue('updateUserProfile', { userId, updatedData: userProfileToUpdate });

      // تم إزالة استدعاء API المباشر هنا.

      toast.success('تم تحديث المستخدم محلياً. سيتم مزامنته قريباً.');
    } catch (err) {
      console.error('Failed to update user profile in local cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user profile in local cache.');
    } finally {
      setLoading(false);
    }
  }, []);

  // دالة لتعطيل ملف تعريف مستخدم (حذف ناعم)
  const deactivateUserProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedData = { is_active: false, updated_at: new Date().toISOString() };

      // 1. تحديث الحالة في IndexedDB فورياً
      await putToCache('userProfiles', { user_id: userId, ...updatedData } as UserProfile);
      setUserProfiles(prev => prev.map(u => u.user_id === userId ? { ...u, ...updatedData } : u));

      // 2. إضافة العملية إلى قائمة انتظار المزامنة
      await addToSyncQueue('deactivateUserProfile', { userId });

      // تم إزالة استدعاء API المباشر هنا.

      toast.success('تم تعطيل المستخدم محلياً. سيتم مزامنته قريباً.');
    } catch (err) {
      console.error('Failed to deactivate user profile in local cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate user profile in local cache.');
    } finally {
      setLoading(false);
    }
  }, []);

  // دالة لتوليد رابط QR للطاولة
  const generateTableQRUrl = useCallback((tableUuid: string): string => {
    // تأكد من أن هذا يتطابق مع المسار الذي سيصل إليه الزبون
    return `${window.location.origin}/menu/${tableUuid}`;
  }, []);


  return {
    tables,
    userProfiles,
    loading,
    error,
    fetchTablesFromCache, // لجلب الطاولات عند تحميل صفحة الإعدادات
    fetchUsersFromCache, // لجلب المستخدمين عند تحميل صفحة الإعدادات
    addTable,
    updateTable,
    deactivateTable,
    addUserProfile,
    updateUserProfile,
    deactivateUserProfile,
    generateTableQRUrl,
  };
};
