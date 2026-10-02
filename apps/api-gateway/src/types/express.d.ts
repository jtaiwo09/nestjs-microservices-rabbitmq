declare global {
  namespace Express {
    interface User {
      sub: string;
      role: string;
      refreshToken?: string;
    }
  }
}

export {};
