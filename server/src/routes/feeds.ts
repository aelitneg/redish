import { Hono } from 'hono';
import { auth } from '../auth.js';
import { feedsService } from '../services/feedsService.js';
import { ForbiddenError } from '../utils/errors.js';

const feeds = new Hono<{
  // Make user and session a part of context
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

/**
 * Fetch feed by ID, returning XML
 */
feeds.get('/:id', async (c) => {
  const feedId = c.req.param('id');
  const feed = await feedsService.getPublicFeed(feedId);

  c.header('Content-Type', 'application/xml');
  return c.text(feed);
});

/**
 * Feeds routes require authentication
 */
feeds.use('*', async (c, next) => {
  if (!c.get('session')) {
    throw new ForbiddenError();
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
  const feeds = await feedsService.listFeeds(c.get('session')?.userId!);
  return c.json(feeds);
});

/**
 * Add a new item to a feed
 */
feeds.post('/:id/items', async (c) => {
  const feedId = c.req.param('id');
  const [link] = c.req.queries('link') ?? [];

  await feedsService.addItemToFeed(c.get('session')?.userId!, feedId, link);

  return c.json({});
});

export default feeds;
