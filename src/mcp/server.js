import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';
import { fetchBlogInventory } from '../blogger/inventory.js';
import { auditSearchConsole } from '../searchconsole/audit.js';
import { auditAdSense } from '../adsense/audit.js';
import { runPageSpeedAudit } from '../pagespeed/audit.js';

// Cria o servidor MCP
const server = new McpServer({
  name: 'validablog-mcp',
  version: '1.0.0'
});

// Ferramenta 1: Listar blogs do usuário
server.tool(
  'list_blogs',
  'Lista todos os blogs do Blogger associados à conta Google autenticada.',
  {},
  async () => {
    try {
      const client = getAuthenticatedClient();
      const blogger = google.blogger({ version: 'v3', auth: client });
      quotaManager.recordCall('blogger', 1);

      const res = await blogger.blogs.listByUser({ userId: 'self' });
      const blogs = (res.data.items || []).map((b) => ({
        id: b.id,
        name: b.name,
        url: b.url,
        postsCount: b.posts?.totalItems || 0,
        pagesCount: b.pages?.totalItems || 0
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ blogs }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Erro ao listar blogs: ${err.message}` }]
      };
    }
  }
);

// Ferramenta 2: Inventário do Blogger (Fase 1)
server.tool(
  'audit_blogger_inventory',
  'Coleta e analisa todo o inventário de artigos e páginas de um blog Blogger.',
  {
    blogId: z.string().describe('ID numérico do blog no Blogger (ex: "2609663586053425832")')
  },
  async ({ blogId }) => {
    try {
      const result = await fetchBlogInventory(blogId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                blog: result.blog,
                metrics: result.metrics,
                recentPostsSample: result.posts.slice(0, 5),
                pages: result.pages
              },
              null,
              2
            )
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Erro na auditoria do Blogger: ${err.message}` }]
      };
    }
  }
);

// Ferramenta 3: Auditoria Search Console (Fase 2)
server.tool(
  'audit_search_console',
  'Audita a indexação, erros de sitemaps e métricas de cliques/impressões de pesquisa.',
  {
    targetUrl: z.string().describe('URL completa do blog (ex: "https://mundoereceitas.blogspot.com/")'),
    blogId: z.string().optional().describe('ID do blog para identificação nos relatórios')
  },
  async ({ targetUrl, blogId }) => {
    try {
      const result = await auditSearchConsole(targetUrl, blogId || 'default');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Erro no Search Console: ${err.message}` }]
      };
    }
  }
);

// Ferramenta 4: Auditoria Google AdSense (Fase 3)
server.tool(
  'audit_adsense',
  'Verifica status de aprovação de sites, conformidade com políticas e ganhos na conta AdSense.',
  {
    targetDomain: z.string().describe('Domínio alvo (ex: "mundoereceitas.blogspot.com")'),
    blogId: z.string().optional().describe('ID do blog para identificação')
  },
  async ({ targetDomain, blogId }) => {
    try {
      const result = await auditAdSense(targetDomain, blogId || 'default');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Erro no AdSense: ${err.message}` }]
      };
    }
  }
);

// Ferramenta 5: PageSpeed Insights & Core Web Vitals (Fase 4)
server.tool(
  'audit_pagespeed',
  'Audita velocidade, Lighthouse score e métricas do Core Web Vitals (LCP, CLS, TBT) para Mobile e Desktop.',
  {
    targetUrl: z.string().describe('URL da página a analisar (ex: "https://mundoereceitas.blogspot.com/")'),
    blogId: z.string().optional().describe('ID do blog')
  },
  async ({ targetUrl, blogId }) => {
    try {
      const result = await runPageSpeedAudit(targetUrl, blogId || 'default');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Erro no PageSpeed: ${err.message}` }]
      };
    }
  }
);

// Ferramenta 6: Status do Gerenciador de Cotas (R$ 0)
server.tool(
  'get_quota_status',
  'Retorna o consumo atual de cotas gratuitas do dia e a margem preventiva de segurança.',
  {},
  async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(quotaManager.state, null, 2)
        }
      ]
    };
  }
);

// Inicia o transporte Stdio
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ValidaBlog MCP Server rodando via stdio...');
}

run().catch((err) => {
  console.error('Erro ao iniciar MCP Server:', err);
  process.exit(1);
});
