import http from 'http';
import feeds from './feeds.js';

const server = http.createServer();

server.on('request', (req, res) => {
  try {
    const url = new URL(`http://${process.env.HOST ?? 'localhost'}${req.url}`);

    switch (true) {
      case url.pathname.startsWith('/feeds'):
        return feeds(url, req, res);
      default:
        res.writeHead(404, 'Not Found');
        res.end();
    }
  } catch (error) {
    console.error(error);

    res.writeHead(500, 'Internal Server Error');
    res.end();
  }
});

server.on('error', (error) => {
  console.error('Server encountered an error', error);
  process.exit(1);
});

const port = process.env.PORT ?? 3000;
server.listen(port, () => {
  console.info(`Server is listening on ${port}`);
});
