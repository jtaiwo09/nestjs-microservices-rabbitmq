export interface InventoryReservedEvent {
  orderId: string;
  userId: string;

  items: {
    productId: string;
    quantity: number;
  }[];

  totalAmount: number;
  currency: string;

  reservedAt: string;
}

export interface InventoryFailedEvent {
  orderId: string;
  reason: string;
}
