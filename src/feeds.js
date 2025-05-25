import { randomUUID } from 'crypto';
import { createReadStream, constants } from 'fs';
import { access, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  preserveOrder: true,
  format: true,
  indentBy: '  ', // 2 spaces
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  preserveOrder: true,
});

const DEFAULT_TITLE = 'Redish';
const DEFAULT_DESCRIPTION =
  'Save links to an RSS feed you can ignore from anywhere.';
const DEFAULT_LINK = 'https://redish.app';

/**
 * Handle requests to /feeds endpoint.
 * @param {URL} url
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function feeds(url, req, res) {
  switch (req.method) {
    case 'POST':
      return createFeed(res);
    case 'PUT':
      return addToFeed(url, res);
    case 'GET':
      return getFeedAsStream(url, res);
    default:
      res.writeHead(405, 'Method Not Allowed');
      res.end();
  }
}

/**
 * Creates a new, empty RSS feed and returns the ID to the client.
 * @param {import('http').ServerResponse} res
 */
async function createFeed(res) {
  const id = randomUUID();
  const filePath = resolve(process.cwd(), `feeds/${id}.xml`);

  const canCreate = await access(filePath, constants.W_OK)
    .then(() => {
      console.error(`File with id ${id} exists.`);
      res.writeHead(500, 'Internal Server Error');
      res.end();
      return false;
    })
    .catch((error) => {
      if (error.code !== 'ENOENT') {
        console.error(error);
        res.writeHead(500, 'Internal Server Error');
        res.end();
        return false;
      }

      return true;
    });

  if (!canCreate) return;

  const feed = builder.build({
    '?xml': {
      '@version': '1.0',
    },
    rss: [
      {
        '@version': '2.0',
        channel: {
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          link: DEFAULT_LINK,
        },
      },
    ],
  });

  writeFile(filePath, feed);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ id }));
}

/**
 * Add an item to an existing RSS feed.
 * @param {URL} url
 * @param {import('http').ServerResponse*} res
 */
async function addToFeed(url, res) {
  const id = url.pathname.split('/').pop();
  const filePath = resolve(process.cwd(), `feeds/${id}.xml`);

  const urlParam = url.searchParams.get('url');
  if (!urlParam) {
    res.writeHead(400, 'Bad Request');
    res.end();
    return;
  }

  const canUpdate = await access(filePath, constants.W_OK)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') {
        console.warn(error);
        res.writeHead(404, 'Not Found');
        res.end();
      } else {
        console.error(error);
        res.writeHead(500, 'Internal Server Error');
        res.end();
      }

      return false;
    });

  if (!canUpdate) return;

  const feed = parser.parse(await readFile(filePath, { encoding: 'utf-8' }));

  const channel = feed[1].rss[0].channel;
  channel.push({
    item: [
      { title: [{ '#text': urlParam }] },
      { link: [{ '#text': urlParam }] },
    ],
  });

  await writeFile(filePath, builder.build(feed));

  res.writeHead(200, 'OK');
  res.end();
}

/**
 * Streams an RSS feed back to a client.
 * @param {URL} url
 * @param {import('http').ServerResponse} res
 */
async function getFeedAsStream(url, res) {
  const id = url.pathname.split('/').pop();
  const filePath = resolve(process.cwd(), `feeds/${id}.xml`);

  const canRead = await access(filePath, constants.R_OK)
    .then(() => true)
    .catch((error) => {
      console.warn(error);
      res.writeHead(404, 'Not Found');
      res.end();

      return false;
    });

  if (!canRead) return;

  const fileStream = createReadStream(filePath);
  fileStream.on('error', (error) => {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, 'Internal Server Error');
    res.end();
  });

  fileStream.on('ready', () => {
    res.writeHead(200, { 'content-type': 'text/xml' });
    fileStream.pipe(res);
  });
}

export default feeds;
