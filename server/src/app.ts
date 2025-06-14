import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';
import feeds from './routes/feeds';

const app = new Hono<{
  // Make user and session a part of context
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

/**
 * Global CORS - Apply to all routes first
 */
app.use(
  '*',
  cors({
    origin: [process.env.CLIENT_ORIGIN_WEB].filter((origin): origin is string =>
      Boolean(origin),
    ),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

/**
 * Session middleware
 */
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  c.set('user', session.user);
  c.set('session', session.session);
  return next();
});

/**
 * Auth Routes
 */
app.on(['POST', 'GET'], '/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

/**
 * Application Routes
 */
app.route('/feeds', feeds);

/**
 * Not Found Handler
 */
app.notFound((c) => {
  return c.json({ error: 'Not Found ' }, 404);
});

/**
 * Error Handler
 */
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
