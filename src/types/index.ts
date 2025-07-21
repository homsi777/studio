export type TableStatus = "available" | "occupied" | "new_order" | "confirmed" | "needs_attention" | "paying";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  items: MenuItem[];
  total: number;
};

export type Table = {
  id: number;
  status: TableStatus;
  order: Order | null;
  seatingDuration?: string;
  chefConfirmationTime?: string;
};
