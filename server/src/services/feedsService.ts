import { and, eq } from 'drizzle-orm';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { fileStorage } from '../storage/fileStorage.js';
import { db } from '../db';
import { feed } from '../db/schema.js';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { isValidUUID } from '../utils/isValidUUID';

const DEFAULT_TITLE = 'Redish';
const DEFAULT_DESCRIPTION =
  'Save links to an RSS feed you can ignore from anywhere.';
const DEFAULT_LINK = 'https://redish.app';

const xmlOptions = {
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  preserveOrder: true,
};

const xmlBuilder = new XMLBuilder({
  ...xmlOptions,
  format: true,
  indentBy: '  ',
});

const xmlParser = new XMLParser(xmlOptions);

/**
 * Create a new RSS feed.
 * @returns {string} ID of feed
 */
async function createFeed(userId: string): Promise<string> {
  return db.transaction(async (tx) => {
    const [{ feedId }] = await tx
      .insert(feed)
      .values({
        userId,
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        link: DEFAULT_LINK,
      })
      .returning({ feedId: feed.id });

    const feedContent = [
      {
        '?xml': [{ '#text': '' }],
        ':@': {
          '@_version': '1.0',
        },
      },
      {
        rss: [
          {
            channel: [
              { title: [{ '#text': DEFAULT_TITLE }] },
              { description: [{ '#text': DEFAULT_DESCRIPTION }] },
              { link: [{ '#text': DEFAULT_LINK }] },
            ],
          },
        ],
        ':@': {
          '@_version': '2.0',
        },
      },
    ];

    const xml = xmlBuilder.build(feedContent);

    await fileStorage.write(`${userId}/${feedId}.xml`, xml);

    return feedId;
  });
}

/**
 * List feeds for a user.
 */
async function listFeeds(userId: string) {
  const feeds = await db.query.feed.findMany({
    columns: { id: true, title: true, description: true, link: true },
    where: eq(feed.userId, userId),
  });

  return feeds;
}

/**
 * Fetch an RSS feed by ID.
 * @returns {Promise<string>} XML of RSS feed
 */
async function getFeed(userId: string, feedId: string): Promise<string> {
  if (!isValidUUID(feedId)) {
    throw new BadRequestError('invalid feed ID');
  }

  const feedRecord = await db.query.feed.findFirst({
    columns: { id: true },
    where: and(eq(feed.id, feedId), eq(feed.userId, userId)),
  });

  if (!feedRecord) {
    throw new ForbiddenError();
  }

  return fileStorage.read(`${userId}/${feedRecord.id}.xml`);
}

/**
 * Update a feed by ID.
 */
function addItemToFeed(
  userId: string,
  feedId: string,
  link: string,
): Promise<void> {
  return db.transaction(async (tx) => {
    const feedRecord = await tx.query.feed.findFirst({
      columns: { id: true },
      where: and(eq(feed.id, feedId), eq(feed.userId, userId)),
    });

    if (!feedRecord) {
      throw new ForbiddenError();
    }

    if (!link) {
      throw new BadRequestError('link is required');
    }

    const filePath = `${userId}/${feedRecord.id}.xml`;
    const file = await fileStorage.read(filePath);
    const feedContent = xmlParser.parse(file);

    const channel = feedContent[1].rss[0].channel;
    channel.push({
      item: [{ title: [{ '#text': link }] }, { link: [{ '#text': link }] }],
    });

    await fileStorage.write(filePath, xmlBuilder.build(feedContent));
  });
}

export const feedsService = {
  createFeed,
  getFeed,
  listFeeds,
  addItemToFeed,
};
