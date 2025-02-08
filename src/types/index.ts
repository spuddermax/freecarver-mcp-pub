export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  pre_order_available: boolean;
  limited_edition_count?: number | null;
  discontinued: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  order_type: string;
  status: string;
  order_date: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}