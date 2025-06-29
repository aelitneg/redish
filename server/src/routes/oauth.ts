import { Hono } from 'hono';
import { oauthService } from '../services/oauthService';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { auth } from '../auth';

const oauth = new Hono<{
  // Make user and session a part of context
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

/**
 * Start OAuth flow for client by validating client ID
 */
oauth.get('/authorize', async (c) => {
  const clientId = c.req.query('clientId');
  const state = c.req.query('state');

  if (!clientId) {
    throw new BadRequestError('clientId is required');
  }

  const client = await oauthService.getClient(clientId);

  // Include state in the redirect if provided
  const consentUrl = new URL(`${process.env.CLIENT_ORIGIN_WEB}/consent`);
  consentUrl.searchParams.set('clientId', client.id);
  if (state) {
    consentUrl.searchParams.set('state', state);
  }

  return c.redirect(consentUrl.toString());
});

/**
 * Generate OAuth code
 */
oauth.post('/authorize', async (c) => {
  const userId = c.get('session')?.userId;
  if (!userId) throw new ForbiddenError();

  const { clientId, consent, state } = await c.req.json();
  if (!clientId) throw new BadRequestError('clientId is required');

  const authorization = await oauthService.createAuthorization(
    userId,
    clientId,
    consent,
    state,
  );

  return c.json(authorization);
});

oauth.post('/token', async (c) => {
  const formData = await c.req.formData();
  const code = formData.get('code');

  if (!code || typeof code !== 'string') {
    throw new BadRequestError('code is required');
  }

  // Extract client credentials - support both Basic Auth and form data
  let clientId: string;
  let clientSecret: string | undefined;

  // Check for HTTP Basic Authentication first
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const credentials = atob(authHeader.slice(6)).split(':');
      clientId = credentials[0];
      clientSecret = credentials[1];
    } catch (error) {
      throw new BadRequestError('invalid authorization header');
    }
  } else {
    // Fall back to form data
    const clientIdFormData = formData.get('client_id');
    const clientSecretFormData = formData.get('client_secret');

    if (!clientIdFormData || typeof clientIdFormData !== 'string') {
      throw new BadRequestError('client_id is required');
    }

    clientId = clientIdFormData;
    clientSecret =
      typeof clientSecretFormData === 'string'
        ? clientSecretFormData
        : undefined;
  }

  if (!clientSecret) {
    throw new BadRequestError('client authentication required');
  }

  const token = await oauthService.createToken(code, clientId, clientSecret);

  return c.json(token);
});

oauth.post('/revoke', async (c) => {
  const formData = await c.req.formData();
  const token = formData.get('token');

  if (!token || typeof token !== 'string') {
    throw new BadRequestError('token is required');
  }

  await oauthService.revokeToken(token);
  return c.json({ message: 'OK' });
});

oauth.post('/clients', async (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

/**
 * Get OAuth client by ID
 */
oauth.get('/clients/:id', async (c) => {
  const clientId = c.req.param('id');

  const client = await oauthService.getClient(clientId);

  return c.json(client);
});

oauth.put('/clients/:id', async (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

oauth.delete('/clients/:id', async (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

export default oauth;
