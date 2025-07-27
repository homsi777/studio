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
  status: TableStatus | null; // حالة الطاولة باستخدام Enum (يمكن أن يكون NULLABLE حسب المخطط)
  current_order_id: string | null; // معرف الطلب الحالي المرتبط بالطاولة (Foreign Key to orders.id)
  assigned_user_id: string | null; // معرف المستخدم المسؤول عن الطاولة (REFERENCES auth.users(id))
  // created_at و updated_at غير موجودة في مخطط جدول tables الذي قدمته، لذا لا يتم تضمينها هنا.
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
  category: string; // الفئة (text, IN ('main', 'appetizer', 'drink', 'dessert'))
  is_available: boolean; // هل العنصر متاح
  offer: string | null; // العرض
  offer_en: string | null; // العرض بالإنجليزية
  image: string | null; // رابط الصورة (text)
  image_hint: string | null; // تلميح الصورة (text)
}

// واجهة لتمثيل عنصر داخل الطلب (عندما يكون جزءاً من orders.items JSONB)
// هذا يعكس قرار استخدام JSONB وليس جدولاً منفصلاً لـ OrderItem
export interface OrderItem {
  menu_item_id: string; // معرف العنصر في قائمة الطعام
  quantity: number; // الكمية المطلوبة
  price: number; // سعر الوحدة وقت الطلب
  name: string; // اسم العنصر (للتخزين السريع، ليس في المخطط ولكن مفيد)
  subtotal?: number; // الإجمالي (quantity * price) - ليس في المخطط ولكن مفيد
  notes?: string | null; // ملاحظات خاصة بالصنف (اختياري)
}

// تعريف حالة الطلب كـ Enum
export enum OrderStatus {
  PENDING_CHEF_APPROVAL = 'pending_chef_approval',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// واجهة لتمثيل الطلب بناءً على جدول public.orders
export interface Order {
  id: string; // معرف الطلب (uuid)
  created_at: string; // timestamp with time zone
  session_id: string; // معرف جلسة الزبون (REFERENCES customer_sessions(id))
  table_uuid: string; // معرف الطاولة المرتبطة بالطلب (REFERENCES tables(uuid))
  table_id: string | null; // <--- تم التعديل هنا: أصبح string | null بدلاً من number
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