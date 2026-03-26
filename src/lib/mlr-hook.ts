export type MlrOrderFeatures = {
  orderId: number;
  customerId: number;
  productId: number;
  quantity: number;
  orderTotal: number;
  shippingState: string;
  promoUsed: boolean;
  deviceType: string;
  ipCountry: string;
};

// Placeholder extension point for future MLR integration.
export async function onOrderCreatedForMlr(_features: MlrOrderFeatures): Promise<void> {
  return;
}
