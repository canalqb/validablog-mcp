import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';
import { CONFIG } from '../config.js';

export async function auditSearchConsole(targetUrl = 'https://mundoereceitas.blogspot.com/', blogId = '2609663586053425832') {
  console.log(`\n========================================================`);
  console.log(` INICIANDO FASE 2: Auditoria Google Search Console`);
  console.log(` Alvo: ${targetUrl}`);
  console.log(`========================================================\n`);

  const client = getAuthenticatedClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth: client });

  // 1. Listar sites verificados para confirmar permissão e encontrar a propriedade exata
  quotaManager.recordCall('searchconsole', 1);
  console.log('[Search Console] Consultando propriedades cadastradas na conta...');
  const sitesRes = await searchconsole.sites.list();
  const siteEntries = sitesRes.data.siteEntry || [];

  console.log(`Propriedades encontradas no Search Console: ${siteEntries.length}`);
  siteEntries.forEach((s) => console.log(` - ${s.siteUrl} (${s.permissionLevel})`));

  // Encontra a propriedade exata ou correspondente
  const normalizedTarget = targetUrl.toLowerCase().replace(/\/$/, '');
  const matchedSite = siteEntries.find((s) => {
    const url = s.siteUrl.toLowerCase().replace(/\/$/, '');
    return url === normalizedTarget || url === `sc-domain:${normalizedTarget.replace(/^https?:\/\//, '')}` || url === targetUrl;
  });

  const siteUrl = matchedSite ? matchedSite.siteUrl : targetUrl;
  console.log(`\n[Search Console] Utilizando propriedade: ${siteUrl}`);

  // 2. Consultar Sitemaps
  let sitemaps = [];
  try {
    quotaManager.recordCall('searchconsole', 1);
    console.log('[Search Console] Verificando sitemaps submetidos...');
    const sitemapsRes = await searchconsole.sitemaps.list({ siteUrl });
    sitemaps = sitemapsRes.data.sitemap || [];
    console.log(`✓ Sitemaps encontrados: ${sitemaps.length}`);
  } catch (err) {
    console.warn(`[Search Console] Aviso ao consultar sitemaps: ${err.message}`);
  }

  // 3. Consultar Desempenho de Pesquisa (Últimos 28 dias)
  const endDate = new Date().toISOString().split('T')[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 28);
  const startDate = startDateObj.toISOString().split('T')[0];

  let analyticsData = {
    summary: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    topQueries: [],
    topPages: []
  };

  try {
    quotaManager.recordCall('searchconsole', 1);
    console.log(`[Search Console] Consultando desempenho de pesquisa (${startDate} até ${endDate})...`);
    
    // Consulta por termos de busca (queries)
    const queriesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 10
      }
    });

    // Consulta por páginas (pages)
    quotaManager.recordCall('searchconsole', 1);
    const pagesRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 10
      }
    });

    const queryRows = queriesRes.data.rows || [];
    const pageRows = pagesRes.data.rows || [];

    const totalClicks = pageRows.reduce((acc, r) => acc + (r.clicks || 0), 0);
    const totalImpressions = pageRows.reduce((acc, r) => acc + (r.impressions || 0), 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = pageRows.length > 0 ? pageRows.reduce((acc, r) => acc + (r.position || 0), 0) / pageRows.length : 0;

    analyticsData = {
      period: { startDate, endDate },
      summary: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: avgCtr.toFixed(2) + '%',
        position: avgPosition.toFixed(1)
      },
      topQueries: queryRows.map((r) => ({
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: ((r.ctr || 0) * 100).toFixed(2) + '%',
        position: (r.position || 0).toFixed(1)
      })),
      topPages: pageRows.map((r) => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: ((r.ctr || 0) * 100).toFixed(2) + '%',
        position: (r.position || 0).toFixed(1)
      }))
    };
  } catch (err) {
    console.warn(`[Search Console] Aviso no Search Analytics: ${err.message}`);
  }

  // 4. Salvar dados estruturados JSON
  const auditResult = {
    auditedAt: new Date().toISOString(),
    blogId,
    siteUrl,
    hasPropertyAccess: Boolean(matchedSite),
    sitemaps,
    analytics: analyticsData
  };

  const jsonPath = path.join(CONFIG.rootDir, 'data', `searchconsole-${blogId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2), 'utf-8');
  console.log(`✓ Dados Search Console salvos em: ${jsonPath}`);

  // 5. Gerar Relatório Markdown
  const mdReport = generateMarkdownReport(auditResult);
  const mdPath = path.join(CONFIG.rootDir, 'data', `relatorio-searchconsole-${blogId}.md`);
  fs.writeFileSync(mdPath, mdReport, 'utf-8');
  console.log(`✓ Relatório Markdown salvo em: ${mdPath}`);

  return auditResult;
}

function generateMarkdownReport(res) {
  const { siteUrl, hasPropertyAccess, sitemaps, analytics } = res;

  return `# Relatório Google Search Console
**Propriedade:** \`${siteUrl}\`  
**Status de Acesso:** ${hasPropertyAccess ? '✓ Verificada na Conta' : '⚠️ Propriedade não listada diretamente'}  
**Período Analisado:** ${analytics.period ? `${analytics.period.startDate} a ${analytics.period.endDate}` : 'N/A'}  
**Data da Auditoria:** ${res.auditedAt}

---

## 1. Desempenho de Pesquisa Orgânica (Últimos 28 dias)

| Métrica | Valor |
| :--- | :--- |
| **Total de Cliques** | ${analytics.summary.clicks} |
| **Total de Impressões** | ${analytics.summary.impressions} |
| **CTR Médio** | ${analytics.summary.ctr} |
| **Posição Média** | ${analytics.summary.position} |

---

## 2. Status dos Sitemaps Submetidos
${
  sitemaps.length > 0
    ? sitemaps
        .map(
          (s) =>
            `- **[${s.path}](${s.path})**  
  Tipo: \`${s.type}\` | Status: \`${s.errors ? 'Com Erros' : 'Processado'}\` | Último Envio: ${s.lastSubmitted || 'N/A'}`
        )
        .join('\n')
    : '⚠️ **Nenhum sitemap encontrado submetido no Search Console.**  \n*Recomendação:* Submeter `https://mundoereceitas.blogspot.com/sitemap.xml` para garantir rastreamento de todos os posts.'
}

---

## 3. Principais Termos de Pesquisa (Top Queries)
${
  analytics.topQueries && analytics.topQueries.length > 0
    ? `| Termo de Busca | Cliques | Impressões | CTR | Posição Média |
| :--- | :--- | :--- | :--- | :--- |
` +
      analytics.topQueries
        .map((q) => `| ${q.query} | ${q.clicks} | ${q.impressions} | ${q.ctr} | ${q.position} |`)
        .join('\n')
    : '*Sem dados suficientes de palavras-chave no período selecionado.*'
}

---

## 4. Principais Páginas com Tráfego de Busca (Top Pages)
${
  analytics.topPages && analytics.topPages.length > 0
    ? `| Página | Cliques | Impressões | CTR | Posição Média |
| :--- | :--- | :--- | :--- | :--- |
` +
      analytics.topPages
        .map((p) => `| [${p.page}](${p.page}) | ${p.clicks} | ${p.impressions} | ${p.ctr} | ${p.position} |`)
        .join('\n')
    : '*Sem dados suficientes de tráfego de páginas no período selecionado.*'
}
`;
}

// Execução direta
const targetArg = process.argv[2] || 'https://mundoereceitas.blogspot.com/';
auditSearchConsole(targetArg).catch(console.error);
