import { randomUUID } from 'crypto';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { fileStorage } from '../storage/fileStorage.js';

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
async function createFeed() {
  const id = randomUUID();

  const feed = [
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

  const xml = xmlBuilder.build(feed);

  await fileStorage.write(`/feeds/${id}.xml`, xml);

  return id;
}

/**
 * Fetch an RSS feed by ID.
 * @param {string} id
 * @returns {Promise<string>} XML of RSS feed
 */
function getFeed(id) {
  return fileStorage.read(`feeds/${id}.xml`);
}

/**
 * Update a feed by ID.
 * @param {string} id
 * @param {string} link
 * @returns {Promise<void>}
 */
async function addItemToFeed(id, link) {
  const filePath = `feeds/${id}.xml`;

  const file = await fileStorage.read(filePath);
  const feed = xmlParser.parse(file);

  const channel = feed[1].rss[0].channel;
  channel.push({
    item: [{ title: [{ '#text': link }] }, { link: [{ '#text': link }] }],
  });

  await fileStorage.write(filePath, xmlBuilder.build(feed));
}

export const feedsService = {
  createFeed,
  getFeed,
  addItemToFeed,
};
