// src/types/index.ts

// تعريف حالة الطاولة كـ Enum لضمان القيم المحددة
export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  NEEDS_CLEANING = 'needs_cleaning',
  RESERVED = 'reserved'
}

// تعريف دور المستخدم كـ Enum
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CHEF = 'chef',
  ACCOUNTANT = 'accountant',
  WAITER = 'waiter',
  CASHIER = 'cashier'
}

// واجهة لتمثيل بيانات الطاولة بناءً على جدول public.tables
export interface Table {
  uuid: string; // المعرف الفريد للطاولة (Primary Key)
  is_active: boolean; // هل الطاولة نشطة
  display_number: string | null; // رقم الطاولة للعرض (نصي، يمكن أن يكون NULLABLE حسب المخطط)
  capacity: number | null; // سعة الطاولة (عدد الأشخاص، يمكن أن يكون NULLABLE حسب المخطط)
  status: TableStatus | string | null; // حالة الطاولة (يمكن أن يكون string لاستيعاب الحالات الجديدة)
  current_order_id: string | null; // معرف الطلب الحالي المرتبط بالطاولة (Foreign Key to orders.id)
  assigned_user_id: string | null; // معرف المستخدم المسؤول عن الطاولة (REFERENCES auth.users(id))
  order?: Order | null; // الطلب المرتبط حالياً بالطاولة
  seatingDuration?: string;
  chefConfirmationTimestamp?: number;
  created_at?: string;
  updated_at?: string;
}


// واجهة لتمثيل عنصر من قائمة الطعام
export interface MenuItem {
  id: string; // معرف العنصر (uuid)
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  name: string; // اسم الصنف (عربي)
  name_en: string | null; // الاسم بالإنجليزية
  description: string | null; // الوصف
  description_en: string | null; // الوصف بالإنجليزية
  price: number; // السعر (numeric)
  category: MenuItemCategory; // الفئة (text, IN ('main', 'appetizer', 'drink', 'dessert'))
  is_available: boolean; // هل العنصر متاح
  offer: string | null; // العرض
  offer_en: string | null; // العرض بالإنجليزية
  image: string | null; // رابط الصورة (text)
  image_hint: string | null; // تلميح الصورة (text)
  quantity?: number; // لتتبع الكمية في السلة
}

export type MenuItemCategory = 'main' | 'appetizer' | 'drink' | 'dessert';


// واجهة لتمثيل عنصر داخل الطلب (عندما يكون جزءاً من orders.items JSONB)
export interface OrderItem extends Omit<MenuItem, 'created_at' | 'updated_at' | 'is_available' | 'category'> {
  menu_item_id: string; // معرف العنصر في قائمة الطعام
  quantity: number; // الكمية المطلوبة
}


// تعريف حالة الطلب كـ Enum
export type OrderStatus = 'pending_chef_approval' | 'pending_cashier_approval' | 'awaiting_final_confirmation' | 'confirmed' | 'ready' | 'paying' | 'completed' | 'cancelled' | 'needs_attention' | string;


// واجهة لتمثيل الطلب بناءً على جدول public.orders
export interface Order {
  id: string; // معرف الطلب (uuid)
  created_at: string; // timestamp with time zone
  session_id: string; // معرف جلسة الزبون (REFERENCES customer_sessions(id))
  table_uuid: string; // معرف الطاولة المرتبطة بالطلب (REFERENCES tables(uuid))
  table_id: number; // رقم الطاولة للعرض (integer, NOT NULL)
  items: OrderItem[]; // مصفوفة من عناصر الطلب (تخزن كـ JSONB في DB)
  status: OrderStatus; // حالة الطلب (text)
  subtotal: number; // المجموع الفرعي (numeric)
  service_charge: number; // رسوم الخدمة (numeric)
  tax: number; // الضريبة (numeric)
  final_total: number; // الإجمالي النهائي (numeric)
  chef_approved_at: string | null; // وقت موافقة الشيف (timestamp with time zone)
  cashier_approved_at: string | null; // وقت موافقة الكاشير (timestamp with time zone)
  customer_confirmed_at: string | null; // وقت تأكيد الزبون (timestamp with time zone)
  completed_at: string | null; // وقت اكتمال الطلب (timestamp with time zone)
}

// واجهة لتمثيل جلسة الزبون بناءً على جدول public.customer_sessions
export interface CustomerSession {
  id: string; // معرف الجلسة (uuid)
  table_uuid: string; // معرف الطاولة المرتبطة بالجلسة (REFERENCES tables(uuid))
  created_at: string; // وقت إنشاء الجلسة (timestamp with time zone)
}

// واجهة لتمثيل ملف تعريف المستخدم بناءً على جدول public.user_profiles
export interface UserProfile {
  user_id: string; // معرف المستخدم (uuid, PRIMARY KEY, REFERENCES auth.users(id))
  full_name: string; // الاسم الكامل (text)
  phone_number: string | null; // رقم الهاتف (text)
  role: UserRole; // دور المستخدم (user_role enum)
  is_active: boolean | null; // هل الحساب نشط (boolean)
  hire_date: string | null; // تاريخ التوظيف (timestamp with time zone)
  last_login: string | null; // آخر تسجيل دخول (timestamp with time zone)
  profile_image_url: string | null; // رابط صورة الملف الشخصي (text)
  salary: number | null; // الراتب (numeric)
  department: string | null; // القسم (text)
  created_at: string | null; // timestamp with time zone
  updated_at: string | null; // timestamp with time zone
}

// واجهة لتمثيل المصاريف بناءً على جدول public.expenses
export interface Expense {
  id: string; // معرف المصروف (uuid)
  created_at: string; // timestamp with time zone
  last_updated: string; // timestamp with time zone
  description: string; // الوصف (text)
  description_en: string | null; // الوصف بالإنجليزية (text)
  amount: number; // المبلغ (numeric)
  date: string; // التاريخ (date)
  category: string; // الفئة (text, IN ('rent', 'bills', 'salaries', 'supplies', 'maintenance', 'other'))
  payment_method: string | null; // طريقة الدفع (text)
  supplier: string | null; // المورد (text)
  invoice_number: string | null; // رقم الفاتورة (text)
  notes: string | null; // ملاحظات (text)
  user_id: string | null; // معرف المستخدم الذي سجل المصروف (REFERENCES auth.users(id))
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  password?: string;
}

export interface PendingSyncOperation {
  id?: number;
  operation: string;
  data: any;
  timestamp: number;
}
