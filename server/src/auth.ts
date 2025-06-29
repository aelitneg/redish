import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { createAuthMiddleware } from 'better-auth/api';
import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { feedsService } from './services/feedsService.js';

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
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Check if this is a sign-up endpoint
      if (ctx.path.startsWith('/sign-up')) {
        const newSession = ctx.context.newSession;

        // If a new session was created (successful sign up)
        if (newSession) {
          try {
            // Create a feed for the new user
            await feedsService.createFeed(newSession.user.id);
          } catch (error) {
            console.error('Failed to create feed for new user:', error);
          }
        }
      }
    }),
  },
});
