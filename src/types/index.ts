

export type TableStatus = "available" | "occupied" | "new_order" | "confirmed" | "needs_attention" | "paying" | "pending_cashier_approval" | "awaiting_final_confirmation" | "ready";

export type OrderStatus = 'pending_chef_approval' | 'pending_cashier_approval' | 'pending_final_confirmation' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

export type MenuItemCategory = 'main' | 'appetizer' | 'drink' | 'dessert';

export type MenuItem = {
  id: string;
  name: string;
  name_en?: string;
  price: number;
  quantity: number;
  description?: string;
  description_en?: string;
  category: MenuItemCategory;
  offer?: string;
  offer_en?: string;
  image?: string;
  image_hint?: string;
};

export type Order = {
  id: string;
  items: MenuItem[];
  subtotal: number;
  serviceCharge: number;
  tax: number;
  finalTotal: number;
  tableId: number;
  tableUuid: string;
  sessionId: string; // Unique identifier for the customer's session
  status: OrderStatus;
  timestamp: number;
  confirmationTimestamp?: number;
};

export type Table = {
  id: number;
  status: TableStatus;
  order: Order | null;
  seatingDuration?: string;
  chefConfirmationTimestamp?: number;
};

export type ExpenseCategory = 'rent' | 'bills' | 'salaries' | 'supplies' | 'maintenance' | 'other';

export type Expense = {
    id: string;
    description: string;
    description_en?: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
};

export type UserRole = 'manager' | 'employee';

export type User = {
    id: string;
    username: string;
    role: UserRole;
    password?: string; // Note: For demonstration. Passwords should be handled securely on the backend.
};
