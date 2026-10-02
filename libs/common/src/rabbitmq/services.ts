import { createRmqClientConfig } from "./client.js";
import { QUEUES } from "./queues.js";

// Injection tokens — pass directly to @Inject()
export const ORDER_SERVICE = "ORDER_SERVICE" as const;
export const USER_SERVICE = "USER_SERVICE" as const;
export const PAYMENT_SERVICE = "PAYMENT_SERVICE" as const;
export const INVENTORY_SERVICE = "INVENTORY_SERVICE" as const;
export const PAYMENT_PUBLISHER = "PAYMENT_PUBLISHER" as const;

// Client providers — pass to ClientsModule.registerAsync()
export const ORDER_SERVICE_PROVIDER = createRmqClientConfig({
  name: ORDER_SERVICE,
  queue: QUEUES.ORDERS,
});
export const USER_SERVICE_PROVIDER = createRmqClientConfig({
  name: USER_SERVICE,
  queue: QUEUES.USERS,
});
export const PAYMENT_SERVICE_PROVIDER = createRmqClientConfig({
  name: PAYMENT_SERVICE,
  queue: QUEUES.PAYMENTS,
});
export const INVENTORY_SERVICE_PROVIDER = createRmqClientConfig({
  name: INVENTORY_SERVICE,
  queue: QUEUES.INVENTORY,
});
export const PAYMENT_PUBLISHER_PROVIDER = createRmqClientConfig({
  name: PAYMENT_PUBLISHER,
});
