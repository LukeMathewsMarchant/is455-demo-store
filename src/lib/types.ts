export type Product = {
  product_id: number;
  sku: string;
  product_name: string;
  category: string;
  price: number;
  is_active: boolean;
};

export type CreateOrderInput = {
  fullName: string;
  email: string;
  zipCode: string;
  productId: number;
  quantity: number;
};
