export interface StoreRefreshTokenPayload {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface FindRefreshTokenPayload {
  tokenHash: string;
}

export interface DeleteRefreshTokenPayload {
  tokenHash: string;
}
