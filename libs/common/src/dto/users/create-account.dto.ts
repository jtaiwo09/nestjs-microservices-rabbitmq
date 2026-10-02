// Used by users.find-or-create-google-account.
// googleId and email come from Google's verified OAuth profile — never from client input.
export interface FindOrCreateGoogleAccountPayload {
  googleId: string;  // Google's unique user ID — the primary identity key
  email: string;     // verified by Google, used for account linking if no Google account exists
  name: string;
}

// What the users-service returns for account lookups used in auth flows.
export interface AccountWithUser {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string | null;
  passwordHash: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
