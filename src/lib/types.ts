export type Product = {
  product_id: number;
  sku: string;
  product_name: string;
  category: string;
  price: number;
  is_active: boolean;
};

export type Customer = {
  customer_id: number;
  full_name: string;
  email: string;
  zip_code: string | null;
  city: string | null;
  state: string | null;
};

export type OrderSummary = {
  orderCount: number;
  totalSpent: number;
  avgOrderValue: number;
  latestOrderAt: string | null;
};

export type CreateOrderInput = {
  customerId?: number;
  fullName?: string;
  email?: string;
  zipCode: string;
  productId: number;
  quantity: number;
};
