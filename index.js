const http = require('http');
const auth = require('http-auth');
const axios = require('axios');
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

    req.on('end', async () => {
      let reqBody = JSON.parse(Buffer.concat(reqChunks));
      
      axios({
        method: reqBody.data ? 'post' : 'get',
        url: reqBody.url,
        headers: reqBody.headers,
        data: reqBody.data,
        responseType: 'stream',
      }).then((response) => {
        res.writeHead(response.status, response.headers);
        response.data.pipe(res);
      });
    });

    return;
  }

  res.writeHead(404);
  res.end();
}).listen(80);
