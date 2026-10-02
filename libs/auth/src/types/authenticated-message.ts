import type { AuthContext } from "./auth-context.js";

export interface AuthenticatedMessage<T = unknown> {
  data: T;
  auth: AuthContext;
  metadata?: {
    requestId?: string;
  };
}
