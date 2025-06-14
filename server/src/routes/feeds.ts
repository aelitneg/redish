import { Hono } from 'hono';
import { auth } from '../auth';
import { feedsService } from '../services/feedsService';
import { BadRequestError, ForbiddenError } from '../utils/errors';

const feeds = new Hono<{
  // Make user and session a part of context
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

/**
 * Feeds routes require authentication
 */
feeds.use('*', async (c, next) => {
  if (!c.get('session')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});

/**
 * Create a new empty feed
 */
feeds.post('/', async (c) => {
  const feedId = await feedsService.createFeed(c.get('session')?.userId!);
  return c.json({ feedId });
});

/**
 * List all feeds for a user
 */
feeds.get('/', async (c) => {
  try {
    const feeds = await feedsService.listFeeds(c.get('session')?.userId!);
    return c.json(feeds);
  } catch (error) {}
});

/**
 * Fetch feed by ID, returning XML
 */
feeds.get('/:id', async (c) => {
  try {
    const feedId = c.req.param('id');
    const feed = await feedsService.getFeed(c.get('session')?.userId!, feedId);

    c.header('Content-Type', 'application/xml');
    return c.text(feed);
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof ForbiddenError) {
      return c.json({ error: error.message }, error.status_code);
    }

    throw error;
  }
});

/**
 * Add a new item to a feed
 */
feeds.post('/:id/items', async (c) => {
  try {
    const feedId = c.req.param('id');
    const [link] = c.req.queries('link') ?? [];

    await feedsService.addItemToFeed(c.get('session')?.userId!, feedId, link);

    return c.json({});
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof ForbiddenError) {
      return c.json({ error: error.message }, error.status_code);
    }

    throw error;
  }
});

export default feeds;
