const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const http = require('http');

const PWA_DIR = path.resolve(__dirname, '../../pwa');

function createDevPeekServer({ pwaPort, localIP, devPort, onConnect, onDisconnect }) {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  app.get('/config', (req, res) => {
    res.json({
      devServerUrl: `http://${localIP}:${pwaPort}/proxy/`,
      version: '0.1.0'
    });
  });

  // Route proxy — récupère le contenu du dev server et le sert via DevPeek
  app.use('/proxy', (req, res) => {
    const targetPath = req.url || '/';
    const options = {
      hostname: 'localhost',
      port: devPort,
      path: targetPath,
      method: req.method,
      headers: { ...req.headers, host: `${localIP}:${devPort}` }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', () => {
      res.status(502).send('Dev server inaccessible. Vérifiez que votre serveur tourne sur le port ' + devPort);
    });

    req.pipe(proxyReq, { end: true });
  });

  app.use(express.static(PWA_DIR));

  app.get('*', (req, res) => {
    res.sendFile(path.join(PWA_DIR, 'index.html'));
  });

  io.on('connection', (socket) => {
    socket.emit('config', {
      devServerUrl: `http://${localIP}:${pwaPort}/proxy/`
    });
    if (onConnect) onConnect(socket.id);
    socket.on('disconnect', () => {
      if (onDisconnect) onDisconnect(socket.id);
    });
  });

  httpServer.listen(pwaPort, '0.0.0.0');

  return { httpServer, io, close: () => httpServer.close() };
}

module.exports = { createDevPeekServer };