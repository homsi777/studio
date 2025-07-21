export type TableStatus = "available" | "occupied" | "new_order" | "confirmed" | "needs_attention" | "paying";

export type OrderStatus = 'new' | 'in_progress' | 'ready';

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
  total: number;
  tableId?: number;
  status?: OrderStatus;
  timestamp?: number;
  confirmationTimestamp?: number; // Added to track when the chef confirms the order
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
};
    