import { Hono } from 'hono';
import { feedsService } from '../services/feedsService.js';
import { NotFoundError } from '../utils/errors.js';

const feeds = new Hono();

/**
 * POST /
 */
feeds.post('/', async (c) => {
  const id = await feedsService.createFeed();

  return c.json({ id });
});

/**
 * GET /
 */
feeds.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    c.header('Content-Type', 'application/xml');
    return c.body(await feedsService.getFeed(id));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: 'Not Found' }, 404);
    }

    throw error;
  }
});

/**
 * PUT /
 */
feeds.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const [link] = c.req.queries('link') ?? [];

    if (!link) {
      return c.json({ error: 'Bad Request', detail: 'link is required' }, 400);
    }

    await feedsService.addItemToFeed(id, link);

    return c.json({});
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: 'Not Found' }, 404);
    }

    throw error;
  }
});

export default feeds;
