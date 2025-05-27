import { Hono } from 'hono';
import feeds from './routes/feeds.js';

const app = new Hono();

app.route('/feeds', feeds);

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
