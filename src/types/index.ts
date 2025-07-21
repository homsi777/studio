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
  image: string;
  "data-ai-hint"?: string;
};

export type Order = {
  id: string;
  items: MenuItem[];
  total: number;
  tableId?: number;
  status?: OrderStatus;
  timestamp?: number;
};

export type Table = {
  id: number;
  status: TableStatus;
  order: Order | null;
  seatingDuration?: string;
  chefConfirmationTime?: string;
};

export type ExpenseCategory = 'rent' | 'bills' | 'salaries' | 'supplies';

export type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
};
