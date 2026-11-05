import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './create-server.js';

async function run() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ValidaBlog MCP Server rodando via stdio...');
}

run().catch((err) => {
  console.error('Erro ao iniciar MCP Server stdio:', err);
  process.exit(1);
});
