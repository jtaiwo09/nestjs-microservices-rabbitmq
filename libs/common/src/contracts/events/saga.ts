export interface ReserveInventoryCommand {
  orderId: string;
  userId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  currency: string;
}

export interface ReserveInventoryResult {
  ok: boolean;
  reason?: string;
}

export interface ReleaseInventoryCommand {
  orderId: string;
}

export interface ReleaseInventoryResult {
  ok: boolean;
}

export interface ProcessPaymentCommand {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
}

export interface ProcessPaymentResult {
  ok: boolean;
  paymentId?: string;
  reason?: string;
}
