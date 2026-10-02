export interface OrderCreatedEvent {
  orderId: string;
  userId: string;

  items: {
    productId: string;
    quantity: number;
  }[];

  totalAmount: number;
  currency: string;
  createdAt: string;
}
