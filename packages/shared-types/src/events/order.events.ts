export const ORDER_PLACED = 'order.placed';
export const ORDER_STATUS_UPDATED = 'order.status.updated';

export interface OrderPlacedPayload {
  orderId: string;
  userId: string;
  email: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  placedAt: string; // ISO 8601
}

export interface OrderStatusUpdatedPayload {
  orderId: string;
  userId: string;
  email: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string; // ISO 8601
}
