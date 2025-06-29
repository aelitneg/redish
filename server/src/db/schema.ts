import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  feeds: many(feed),
}));

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp('updated_at').$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const feed = pgTable('feeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  description: text('description'),
  link: text('link'),
  userId: text('user_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const feeRelations = relations(feed, ({ one }) => ({
  user: one(user, {
    fields: [feed.userId],
    references: [user.id],
  }),
}));

export const oauthClient = pgTable('oauth_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  secret: text('secret').notNull(),
  redirect: text('redirect'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const oauthClientRelations = relations(oauthClient, ({ many }) => ({
  authorizations: many(oauthAuthorization),
  tokens: many(oauthToken),
}));

export const oauthAuthorization = pgTable('oauth_authorizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  state: text('state'),
  clientId: uuid('client_id')
    .notNull()
    .references(() => oauthClient.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  used: boolean('used').notNull().default(false),
});

export const oauthAuthorizationRelations = relations(
  oauthAuthorization,
  ({ one }) => ({
    client: one(oauthClient, {
      fields: [oauthAuthorization.clientId],
      references: [oauthClient.id],
    }),
    user: one(user, {
      fields: [oauthAuthorization.userId],
      references: [user.id],
    }),
  }),
);

export const oauthToken = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  accessToken: text('access_token').notNull().unique(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => oauthClient.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const oauthTokenRelations = relations(oauthToken, ({ one }) => ({
  client: one(oauthClient, {
    fields: [oauthToken.clientId],
    references: [oauthClient.id],
  }),
  user: one(user, {
    fields: [oauthToken.userId],
    references: [user.id],
  }),
}));
