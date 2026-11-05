import http from 'http';
import url from 'url';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpServer } from './create-server.js';
import { CONFIG } from '../config.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const transports = new Map();

const httpServer = http.createServer(async (req, res) => {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Health check / Página inicial
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'validablog-mcp',
        version: '1.0.0',
        sseEndpoint: '/sse',
        messagesEndpoint: '/messages',
        uptimeSeconds: Math.floor(process.uptime())
      })
    );
    return;
  }

  // Endpoint SSE (Server-Sent Events) para conexões MCP remotas
  if (parsedUrl.pathname === '/sse' && req.method === 'GET') {
    console.log('[SSE] Nova conexão recebida...');
    const server = createMcpServer();
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId;

    transports.set(sessionId, transport);

    req.on('close', () => {
      console.log(`[SSE] Conexão encerrada: ${sessionId}`);
      transports.delete(sessionId);
    });

    await server.connect(transport);
    return;
  }

  // Endpoint POST para mensagens do protocolo MCP
  if (parsedUrl.pathname === '/messages' && req.method === 'POST') {
    const sessionId = parsedUrl.query.sessionId;
    const transport = transports.get(sessionId);

    if (!transport) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Sessão ${sessionId} não encontrada.` }));
      return;
    }

    await transport.handlePostMessage(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint não encontrado.' }));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================================`);
  console.log(` ValidaBlog MCP HTTP/SSE Server iniciado na porta ${PORT}`);
  console.log(` Healthcheck:  http://0.0.0.0:${PORT}/health`);
  console.log(` MCP SSE URL:  http://0.0.0.0:${PORT}/sse`);
  console.log(`========================================================\n`);
});

