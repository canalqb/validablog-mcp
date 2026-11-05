import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';
import { fetchBlogInventory } from '../blogger/inventory.js';
import { auditSearchConsole } from '../searchconsole/audit.js';
import { auditAdSense } from '../adsense/audit.js';
import { runPageSpeedAudit } from '../pagespeed/audit.js';
import { readGoogleDocInMemory, AUDIT_PROMPT_DOC_ID } from '../docs/reader.js';
import { TemplateEngine } from '../template/engine.js';
import { CONFIG } from '../config.js';

export function createMcpServer() {
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
          content: [{ type: 'text', text: JSON.stringify({ blogs }, null, 2) }]
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
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
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
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
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
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Erro no PageSpeed: ${err.message}` }]
        };
      }
    }
  );

  // Ferramenta 6: Leitor Dinâmico de Google Docs em Memória (Sem baixar arquivo)
  server.tool(
    'read_google_doc',
    'Lê o conteúdo de um Google Doc dinamicamente em memória via API sem baixar o arquivo para o disco.',
    {
      docUrlOrId: z
        .string()
        .optional()
        .describe('URL ou ID do documento Google Docs (padrão: documento oficial de prompt da auditoria)')
    },
    async ({ docUrlOrId }) => {
      try {
        const docContent = await readGoogleDocInMemory(docUrlOrId || AUDIT_PROMPT_DOC_ID);
        return {
          content: [{ type: 'text', text: docContent }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Erro ao ler Google Doc: ${err.message}` }]
        };
      }
    }
  );

  // Ferramenta 7: Obter Prompt Oficial da Auditoria
  server.tool(
    'get_audit_prompt',
    'Obtém o prompt oficial de auditoria diretamente do Google Docs em tempo real.',
    {},
    async () => {
      try {
        const promptText = await readGoogleDocInMemory(AUDIT_PROMPT_DOC_ID);
        return {
          content: [{ type: 'text', text: promptText }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Erro ao obter prompt de auditoria: ${err.message}` }]
        };
      }
    }
  );

  // Ferramenta 8: Status do Gerenciador de Cotas (R$ 0)
  server.tool(
    'get_quota_status',
    'Retorna o consumo atual de cotas gratuitas do dia e a margem preventiva de segurança.',
    {},
    async () => {
      return {
        content: [{ type: 'text', text: JSON.stringify(quotaManager.state, null, 2) }]
      };
    }
  );

  // Ferramenta 9: Gerar Relatório Consolidado de Auditoria e Pendências
  server.tool(
    'generate_consolidated_report',
    'Cruza os dados de inventário, Search Console, AdSense e PageSpeed com o prompt do Google Docs para gerar o relatório final de pendências.',
    {
      blogId: z.string().describe('ID do blog (ex: "2609663586053425832")')
    },
    async ({ blogId }) => {
      try {
        let promptText = '';
        try {
          promptText = await readGoogleDocInMemory(AUDIT_PROMPT_DOC_ID);
        } catch (e) {
          promptText = `[Aviso: Não foi possível obter o prompt em tempo real do Google Docs: ${e.message}]`;
        }

        const invPath = path.join(CONFIG.rootDir, 'data', `inventory-${blogId}.json`);
        const scPath = path.join(CONFIG.rootDir, 'data', `searchconsole-${blogId}.json`);
        const adsPath = path.join(CONFIG.rootDir, 'data', `adsense-${blogId}.json`);
        const psPath = path.join(CONFIG.rootDir, 'data', `pagespeed-${blogId}.json`);

        const inventory = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, 'utf-8')) : null;
        const searchConsole = fs.existsSync(scPath) ? JSON.parse(fs.readFileSync(scPath, 'utf-8')) : null;
        const adsense = fs.existsSync(adsPath) ? JSON.parse(fs.readFileSync(adsPath, 'utf-8')) : null;
        const pagespeed = fs.existsSync(psPath) ? JSON.parse(fs.readFileSync(psPath, 'utf-8')) : null;

        const summary = {
          generatedAt: new Date().toISOString(),
          blogId,
          auditPromptSource: `https://docs.google.com/document/d/${AUDIT_PROMPT_DOC_ID}`,
          hasPromptLoaded: Boolean(promptText && !promptText.startsWith('[Aviso')),
          promptInstructions: promptText,
          diagnostics: {
            inventory: inventory ? inventory.metrics : 'Pendente',
            searchConsole: searchConsole ? { siteUrl: searchConsole.siteUrl, sitemaps: searchConsole.sitemaps } : 'Pendente',
            adsense: adsense ? { account: adsense.account, matchedSite: adsense.matchedSite, policyIssues: adsense.policyIssues } : 'Pendente',
            pagespeed: pagespeed ? { mobile: pagespeed.results?.mobile?.scores, desktop: pagespeed.results?.desktop?.scores } : 'Pendente'
          }
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Erro ao gerar relatório consolidado: ${err.message}` }]
        };
      }
    }
  );

  // Ferramenta 10: Auditoria do Template XML do Blogger
  server.tool(
    'audit_template_xml',
    'Analisa o código-fonte XML de um tema do Blogger verificando SEO, Schema.org, AdSense e scripts bloqueantes.',
    {
      filePathOrXml: z.string().describe('Caminho para o arquivo .xml do tema ou o próprio conteúdo XML em string')
    },
    async ({ filePathOrXml }) => {
      try {
        let content = filePathOrXml;
        if (fs.existsSync(filePathOrXml)) {
          content = fs.readFileSync(filePathOrXml, 'utf-8');
        }
        const report = TemplateEngine.audit(content);
        return {
          content: [{ type: 'text', text: JSON.stringify(report, null, 2) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Erro ao auditar template: ${err.message}` }]
        };
      }
    }
  );

  // Ferramenta 11: Correção e Otimização do Template XML do Blogger
  server.tool(
    'fix_template_xml',
    'Corrige e otimiza o código-fonte XML do tema Blogger (injeta SEO, Schema.org JSON-LD, AdSense e defer em scripts).',
    {
      filePathOrXml: z.string().describe('Caminho para o arquivo .xml do tema ou o código XML em string'),
      publisherId: z.string().optional().describe('ID do editor AdSense (ex: "ca-pub-3614622181047762")'),
      saveToFile: z.boolean().optional().describe('Se true e fornecido um caminho de arquivo, salva o backup e o tema corrigido')
    },
    async ({ filePathOrXml, publisherId, saveToFile }) => {
      try {
        let content = filePathOrXml;
        let isFile = false;
        if (fs.existsSync(filePathOrXml)) {
          content = fs.readFileSync(filePathOrXml, 'utf-8');
          isFile = true;
        }

        const result = TemplateEngine.optimize(content, { publisherId });

        if (isFile && saveToFile !== false) {
          const parsed = path.parse(filePathOrXml);
          const backupPath = path.join(parsed.dir, `${parsed.name}-backup-${Date.now()}${parsed.ext}`);
          const optimizedPath = path.join(parsed.dir, `${parsed.name}-otimizado${parsed.ext}`);

          fs.writeFileSync(backupPath, content, 'utf-8');
          fs.writeFileSync(optimizedPath, result.optimizedContent, 'utf-8');

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    status: 'Sucesso',
                    backupSavedAt: backupPath,
                    optimizedSavedAt: optimizedPath,
                    changesCount: result.changesCount,
                    changes: result.changes
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'Sucesso',
                  changesCount: result.changesCount,
                  changes: result.changes,
                  optimizedPreview: result.optimizedContent.substring(0, 500) + '...'
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
          content: [{ type: 'text', text: `Erro ao corrigir template: ${err.message}` }]
        };
      }
    }
  );

  return server;
}

