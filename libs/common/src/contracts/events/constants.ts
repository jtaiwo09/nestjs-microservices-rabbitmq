export const ORDER_EVENTS = {
  CREATED: "order.created",
  CONFIRMED: "order.confirmed",
  CANCELLED: "order.cancelled",
} as const;

export const INVENTORY_EVENTS = {
  RESERVED: "inventory.reserved",
  FAILED: "inventory.failed",
  RELEASED: "inventory.released",
  RELEASE_FAILED: "inventory.release_failed",
} as const;

export const PAYMENT_EVENTS = {
  COMPLETED: "payment.completed",
  FAILED: "payment.failed",
} as const;

export const SAGA_PATTERNS = {
  RESERVE_INVENTORY: "saga.reserve-inventory",
  RELEASE_INVENTORY: "saga.release-inventory",
  PROCESS_PAYMENT: "saga.process-payment",
} as const;

export const MESSAGE_PATTERNS = {
  ORDERS: {
    CREATE: "orders.create",
  },
  USERS: {
    GET: "users.get",
    CREATE: "users.create",
    FIND_BY_EMAIL: "users.find-by-email",
    FIND_OR_CREATE_GOOGLE_ACCOUNT: "users.find-or-create-google-account",
    STORE_REFRESH_TOKEN: "users.store-refresh-token",
    FIND_REFRESH_TOKEN: "users.find-refresh-token",
    DELETE_REFRESH_TOKEN: "users.delete-refresh-token",
  },
  SAGA: {
    GET: "saga.get",
  },
} as const;
