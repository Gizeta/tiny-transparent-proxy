const http = require('http');
const https = require('https');
const url = require('url');
const auth = require('http-auth');
const config = require('./config');

const basic = auth.basic({
  realm: 'proxy'
}, (username, password, callback) => {
  callback((username === config.username && password === config.password))
});

http.createServer(basic, (req, res) => {
  if (req.method === 'POST' && req.url === '/proxy') {
    let reqChunks = [];

    req.on('data', (chunk) => {
      reqChunks.push(chunk);
    });

    req.on('end', () => {
      let reqBody = JSON.parse(Buffer.concat(reqChunks));
      let { protocol, host, path } = url.parse(reqBody.url);

      (protocol === 'https:' ? https : http).request({
        host,
        path,
        method: reqBody.data ? 'POST' : 'GET',
        headers: reqBody.headers,
      }, response => {
        response.pause();
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res, {end: true});
      }).end(reqBody.data);
    });

    return;
  }

  res.writeHead(404);
  res.end();
}).listen(config.port);
