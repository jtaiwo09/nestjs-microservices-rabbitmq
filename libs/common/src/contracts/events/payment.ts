export interface PaymentCompletedEvent {
  orderId: string;
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  completedAt: string;
}

export interface PaymentFailedEvent {
  orderId: string;
  userId: string;
  reason: string;
  failedAt: string;
}
