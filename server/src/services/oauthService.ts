import { nanoid } from 'nanoid';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { oauthClient, oauthAuthorization, oauthToken } from '../db/schema.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import { isValidUUID } from '../utils/isValidUUID.js';

/**
 * Get OAuth client by ID
 */
async function getClient(clientId: string) {
  if (!isValidUUID(clientId)) {
    throw new BadRequestError('invalid client id');
  }

  const client = await db.query.oauthClient.findFirst({
    columns: { id: true, name: true, redirect: true },
    where: eq(oauthClient.id, clientId),
  });

  if (!client) {
    throw new ForbiddenError();
  }

  return client;
}

/**
 * Generate an OAuth authorization code
 */
async function createAuthorization(
  userId: string,
  clientId: string,
  consent?: boolean,
  state?: string,
) {
  if (consent !== true) {
    throw new ForbiddenError();
  }

  const [authorization] = await db
    .insert(oauthAuthorization)
    .values({
      userId,
      clientId,
      state,
      code: nanoid(43),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })
    .returning({
      code: oauthAuthorization.code,
      state: oauthAuthorization.state,
      expiresAt: oauthAuthorization.expiresAt,
    });

  return authorization;
}

/**
 * Authenticate OAuth client with credentials
 */
async function authenticateClient(clientId: string, clientSecret: string) {
  if (!isValidUUID(clientId)) {
    throw new BadRequestError('invalid client id');
  }

  const client = await db.query.oauthClient.findFirst({
    columns: { id: true, secret: true },
    where: eq(oauthClient.id, clientId),
  });

  if (!client || client.secret !== clientSecret) {
    throw new ForbiddenError('invalid client credentials');
  }

  return client;
}

/**
 * Exchange OAuth code for token
 */
async function createToken(
  code: string,
  clientId: string,
  clientSecret?: string,
) {
  // Authenticate client first
  if (clientSecret) {
    await authenticateClient(clientId, clientSecret);
  }

  const authorization = await db.query.oauthAuthorization.findFirst({
    where: and(
      eq(oauthAuthorization.code, code),
      eq(oauthAuthorization.clientId, clientId),
      gt(oauthAuthorization.expiresAt, new Date()),
      eq(oauthAuthorization.used, false),
    ),
  });

  if (!authorization) {
    throw new ForbiddenError('invalid authorization code');
  }

  // Use transaction to create token and mark authorization as used
  const result = await db.transaction(async (tx) => {
    // Create token record
    const [token] = await tx
      .insert(oauthToken)
      .values({
        accessToken: nanoid(43),
        clientId: authorization.clientId,
        userId: authorization.userId,
        expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
      })
      .returning({
        accessToken: oauthToken.accessToken,
        expiresAt: oauthToken.expiresAt,
      });

    // Mark authorization as used
    await tx
      .update(oauthAuthorization)
      .set({ used: true })
      .where(eq(oauthAuthorization.id, authorization.id));

    return token;
  });

  return result;
}

/**
 * Revoke an OAuth token
 */
async function revokeToken(token: string) {
  const result = await db
    .delete(oauthToken)
    .where(eq(oauthToken.accessToken, token));

  if (result.rowCount === 0) {
    throw new ForbiddenError();
  }
}

export const oauthService = {
  getClient,
  createAuthorization,
  createToken,
  revokeToken,
  authenticateClient,
};
