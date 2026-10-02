export interface AuthUser {
  sub: string;
  role: string;
  refreshToken?: string;
}
