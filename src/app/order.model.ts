export interface Order {
  id: number;
  orderId: string;
  name: string;
  address: string;
  date: string; // yyyy-MM-dd
  type: string;
  status: string;
}

export interface OrdersMeta {
  types: string[];
  statuses: string[];
}

export interface OrderFilters {
  status?: string[];
  type?: string[];
  date?: string | null;
}
