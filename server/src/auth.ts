import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { db } from './db/index.js';
import * as schema from './db/schema.js';

export const auth = betterAuth({
  basePath: '/auth',
  trustedOrigins: [process.env.CLIENT_ORIGIN_WEB].filter(
    (origin): origin is string => Boolean(origin),
  ),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    openAPI({
      path: '/reference',
      disableDefaultReference: process.env.NODE_ENV !== 'development',
    }),
  ],
});
