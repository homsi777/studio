// src/types/index.ts
// هذه الأنواع تمثل البنية الموحدة لبياناتنا عبر النظام

export type TableStatus =
  | 'available'
  | 'occupied'
  | 'new_order'
  | 'confirmed'
  | 'needs_attention'
  | 'paying'
  | 'pending_cashier_approval'
  | 'awaiting_final_confirmation'
  | 'ready';

export interface Table {
  id: number;
  uuid: string;
  status: TableStatus; // This is a client-side derived status
  order: Order | null;
  seatingDuration?: string;
  chefConfirmationTimestamp?: number;
  is_active?: boolean;
}

export type OrderStatus =
  | 'pending_chef_approval'
  | 'pending_cashier_approval'
  | 'pending_final_confirmation'
  | 'confirmed'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'paying'
  | 'needs_attention';

export interface MenuItem {
  id: string; // UUID
  name: string;
  name_en?: string;
  price: number;
  quantity: number; // This is a client-side addition, not in the DB table
  description?: string;
  description_en?: string;
  category: MenuItemCategory;
  is_available: boolean;
  offer?: string;
  offer_en?: string;
  image?: string;
  image_hint?: string;
  created_at?: string;
  updated_at?: string;
}

export type MenuItemCategory = 'main' | 'appetizer' | 'drink' | 'dessert';


export interface Order {
  id: string; // UUID
  items: MenuItem[]; // Stored as JSONB
  subtotal: number;
  service_charge: number;
  tax: number;
  final_total: number;
  table_id: number;
  table_uuid: string; // UUID
  session_id: string; // UUID, Foreign key to CustomerSession
  status: OrderStatus;
  timestamp: number; // Converted from created_at
  confirmationTimestamp?: number; // Converted from customer_confirmed_at
  created_at: string;
  updated_at?: string;
  chef_approved_at?: string;
  cashier_approved_at?: string;
  customer_confirmed_at?: string;
  completed_at?: string;
}


export type ExpenseCategory = 'rent' | 'bills' | 'salaries' | 'supplies' | 'maintenance' | 'other';
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer';

export interface Expense {
    id: string; // UUID
    description: string;
    description_en?: string;
    amount: number;
    date: string; // YYYY-MM-DD
    category: ExpenseCategory;
    payment_method?: PaymentMethod;
    supplier?: string;
    invoice_number?: string;
    notes?: string;
    user_id?: string; // UUID, Foreign key to auth.users
    created_at?: string;
    last_updated?: string;
}

export type UserRole = 'manager' | 'chef' | 'employee';

export interface User {
    id: string; // UUID from auth.users
    username: string;
    email: string;
    role: UserRole;
    password?: string; // Only for creating/updating, not stored
}

export interface CustomerSession {
    id: string; // UUID
    table_uuid: string; // UUID, Foreign key to tables
    created_at: string;
}


// النوع الخاص بعمليات المزامنة المعلقة في IndexedDB
export type SyncOperationType = 'insert' | 'update' | 'delete';

export interface PendingSyncOperation {
  id?: number; // مفتاح أساسي تلقائي الزيادة في IndexedDB (++id)
  type: SyncOperationType; // نوع العملية: 'insert', 'update', 'delete'
  tableName: 'tables' | 'orders' | 'menu_items' | 'expenses'; // اسم الجدول في Supabase و IndexedDB
  payload: any; // حمولة البيانات: الكائن المراد إضافته/تعديله/حذفه
  timestamp: number; // وقت إضافة العملية إلى قائمة الانتظار (مهم للترتيب وحل التعارضات)
}
