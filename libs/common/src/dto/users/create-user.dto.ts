// Payload for users.create — password is already hashed before it reaches the users-service.
export interface CreateUserPayload {
  email: string;
  name: string;
  passwordHash: string;
}
