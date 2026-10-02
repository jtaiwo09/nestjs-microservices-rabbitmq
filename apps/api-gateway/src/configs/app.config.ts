import { registerAs } from '@repo/config';

export const appConfig = registerAs('app', () => ({
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
  },
}));
