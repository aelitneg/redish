import { and, eq } from 'drizzle-orm';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { nanoid } from 'nanoid';
import { fileStorage } from '../storage/fileStorage.js';
import { db } from '../db/index.js';
import { feed } from '../db/schema.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import { isValidUUID } from '../utils/isValidUUID.js';
import { parseLink } from '../utils/parseLink.js';

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
 * Fetch a public RSS feed by ID.
 * @returns {Promise<string>} XML of RSS feed
 */
async function getPublicFeed(feedId: string): Promise<string> {
  if (!isValidUUID(feedId)) {
    throw new BadRequestError('invalid feed ID');
  }

  const feedRecord = await db.query.feed.findFirst({
    columns: { id: true, userId: true },
    where: eq(feed.id, feedId),
  });

  if (!feedRecord) {
    throw new NotFoundError(`Feed ${feedId} not found.`);
  }

  return fileStorage.read(`${feedRecord.userId}/${feedRecord.id}.xml`);
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

    const { title, description } = await parseLink(link);

    const filePath = `${userId}/${feedRecord.id}.xml`;
    const file = await fileStorage.read(filePath);
    const feedContent = xmlParser.parse(file);
    const channel = feedContent[1].rss[0].channel;

    const item = {
      item: [
        { guid: [{ '#text': nanoid() }] },
        { title: [{ '#text': title }] },
        { description: [{ '#text': description }] },
        { link: [{ '#text': link }] },
        { pubDate: [{ '#text': new Date().toISOString() }] },
      ],
    };

    const insertIndex = channel.findIndex(
      (element: { item?: [] }) => element.item,
    );
    console.debug('insertIndex', insertIndex);
    if (insertIndex === -1) {
      // No existing items, add to end
      channel.push(item);
    } else {
      // Insert before the first item
      channel.splice(insertIndex, 0, item);
    }

    await fileStorage.write(filePath, xmlBuilder.build(feedContent));
  });
}

type FeedItem = {
  guid: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
};

/**
 * Get all items from a feed.
 */
async function getFeedItems(
  userId: string,
  feedId: string,
): Promise<FeedItem[]> {
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

  const filePath = `${userId}/${feedRecord.id}.xml`;
  const file = await fileStorage.read(filePath);
  const feedContent = xmlParser.parse(file);
  const channel = feedContent[1].rss[0].channel;

  const items: FeedItem[] = [];
  for (const element of channel) {
    if (element.item) {
      items.push({
        guid: element.item.find((e: { guid?: [] }) => e.guid)?.guid[0]['#text'],
        title: element.item.find((e: { title?: [] }) => e.title)?.title[0][
          '#text'
        ],
        description: element.item.find(
          (e: { description?: [] }) => e.description,
        )?.description[0]['#text'],
        link: element.item.find((e: { link?: [] }) => e.link)?.link[0]['#text'],
        pubDate: element.item.find((e: { pubDate?: [] }) => e.pubDate)
          ?.pubDate[0]['#text'],
      });
    }
  }

  return items;
}

/**
 * Remove an item from a feed by its guid.
 */
function removeItemFromFeed(
  userId: string,
  feedId: string,
  itemGuid: string,
): Promise<void> {
  return db.transaction(async (tx) => {
    const feedRecord = await tx.query.feed.findFirst({
      columns: { id: true },
      where: and(eq(feed.id, feedId), eq(feed.userId, userId)),
    });

    if (!feedRecord) {
      throw new ForbiddenError();
    }

    if (!itemGuid) {
      throw new BadRequestError('item guid is required');
    }

    const filePath = `${userId}/${feedRecord.id}.xml`;
    const file = await fileStorage.read(filePath);
    const feedContent = xmlParser.parse(file);
    const channel = feedContent[1].rss[0].channel;

    const itemIndex = channel.findIndex(
      (element: { item?: { guid?: { '#text': string }[] }[] }) => {
        if (!element.item) return false;
        const guidElement = element.item.find(
          (e: { guid?: { '#text': string }[] }) => e.guid,
        );
        return guidElement?.guid?.[0]['#text'] === itemGuid;
      },
    );

    if (itemIndex === -1) {
      throw new NotFoundError('Item not found', itemGuid);
    }

    channel.splice(itemIndex, 1);

    await fileStorage.write(filePath, xmlBuilder.build(feedContent));
  });
}

export const feedsService = {
  createFeed,
  getFeed,
  getPublicFeed,
  listFeeds,
  addItemToFeed,
  getFeedItems,
  removeItemFromFeed,
};
