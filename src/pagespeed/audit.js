import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';
import { CONFIG } from '../config.js';

export async function runPageSpeedAudit(targetUrl = 'https://mundoereceitas.blogspot.com/', blogId = '2609663586053425832') {
  console.log(`\n========================================================`);
  console.log(` INICIANDO FASE 4: Auditoria PageSpeed Insights & CrUX`);
  console.log(` Alvo: ${targetUrl}`);
  console.log(`========================================================\n`);

  const client = getAuthenticatedClient();
  const tokenRes = await client.getAccessToken();
  const accessToken = tokenRes.token;

  const strategies = ['mobile', 'desktop'];
  const results = {};

  for (const strategy of strategies) {
    quotaManager.recordCall('pagespeed', 1);
    console.log(`[PageSpeed] Executando análise para ${strategy.toUpperCase()}... (aguarde ~15s)`);

    const apiUrl = new URL('https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', targetUrl);
    apiUrl.searchParams.set('strategy', strategy);
    apiUrl.searchParams.append('category', 'performance');
    apiUrl.searchParams.append('category', 'seo');
    apiUrl.searchParams.append('category', 'best-practices');

    try {
      const response = await fetch(apiUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const lh = data.lighthouseResult;
      const categories = lh.categories || {};
      const audits = lh.audits || {};

      // Extrair pontuações
      const perfScore = Math.round((categories.performance?.score || 0) * 100);
      const seoScore = Math.round((categories.seo?.score || 0) * 100);
      const bpScore = Math.round((categories['best-practices']?.score || 0) * 100);

      // Core Web Vitals
      const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
      const fcp = audits['first-contentful-paint']?.displayValue || 'N/A';
      const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';
      const tbt = audits['total-blocking-time']?.displayValue || 'N/A';
      const speedIndex = audits['speed-index']?.displayValue || 'N/A';

      // Principais oportunidades
      const opportunities = [];
      const oppKeys = [
        'modern-image-formats',
        'uses-optimized-images',
        'render-blocking-resources',
        'unused-css-rules',
        'unused-javascript',
        'unminified-javascript',
        'unminified-css'
      ];

      for (const k of oppKeys) {
        const audit = audits[k];
        if (audit && audit.score !== 1) {
          const savings = audit.displayValue || (audit.details?.overallSavingsMs ? `${audit.details.overallSavingsMs}ms` : null);
          if (savings) {
            opportunities.push({
              title: audit.title,
              savings,
              description: audit.description
            });
          }
        }
      }

      results[strategy] = {
        scores: { performance: perfScore, seo: seoScore, bestPractices: bpScore },
        coreWebVitals: { lcp, fcp, cls, tbt, speedIndex },
        opportunities
      };

      console.log(`✓ ${strategy.toUpperCase()} -> Performance: ${perfScore}/100 | SEO: ${seoScore}/100 | LCP: ${lcp}`);
    } catch (err) {
      console.error(`[PageSpeed] Erro na análise ${strategy}: ${err.message}`);
      results[strategy] = { error: err.message };
    }
  }

  // Salvar JSON
  const auditResult = {
    auditedAt: new Date().toISOString(),
    blogId,
    targetUrl,
    results
  };

  const jsonPath = path.join(CONFIG.rootDir, 'data', `pagespeed-${blogId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2), 'utf-8');
  console.log(`\n✓ Dados PageSpeed salvos em: ${jsonPath}`);

  // Gerar Markdown
  const mdReport = generateMarkdownReport(auditResult);
  const mdPath = path.join(CONFIG.rootDir, 'data', `relatorio-pagespeed-${blogId}.md`);
  fs.writeFileSync(mdPath, mdReport, 'utf-8');
  console.log(`✓ Relatório Markdown salvo em: ${mdPath}`);

  return auditResult;
}

function generateMarkdownReport(res) {
  const { targetUrl, results, auditedAt } = res;
  const mob = results.mobile || {};
  const dsk = results.desktop || {};

  return `# Relatório de Desempenho e Velocidade (PageSpeed & Core Web Vitals)
**URL:** [${targetUrl}](${targetUrl})  
**Data da Auditoria:** ${auditedAt}

---

## 1. Pontuação Geral (Lighthouse)

| Categoria | Mobile (Celular) | Desktop (Computador) |
| :--- | :--- | :--- |
| **Desempenho (Performance)** | **${mob.scores?.performance ?? 'N/A'}/100** | **${dsk.scores?.performance ?? 'N/A'}/100** |
| **SEO Técnico** | **${mob.scores?.seo ?? 'N/A'}/100** | **${dsk.scores?.seo ?? 'N/A'}/100** |
| **Boas Práticas** | **${mob.scores?.bestPractices ?? 'N/A'}/100** | **${dsk.scores?.bestPractices ?? 'N/A'}/100** |

---

## 2. Métricas do Core Web Vitals (Experiência do Usuário)

| Métrica | Mobile | Desktop | Meta Google (Bom) |
| :--- | :--- | :--- | :--- |
| **LCP (Carregamento do Conteúdo Principal)** | ${mob.coreWebVitals?.lcp ?? 'N/A'} | ${dsk.coreWebVitals?.lcp ?? 'N/A'} | ≤ 2.5s |
| **FCP (Primeira Pintura com Conteúdo)** | ${mob.coreWebVitals?.fcp ?? 'N/A'} | ${dsk.coreWebVitals?.fcp ?? 'N/A'} | ≤ 1.8s |
| **CLS (Estabilidade Visual do Layout)** | ${mob.coreWebVitals?.cls ?? 'N/A'} | ${dsk.coreWebVitals?.cls ?? 'N/A'} | ≤ 0.1 |
| **TBT (Tempo de Bloqueio da Thread)** | ${mob.coreWebVitals?.tbt ?? 'N/A'} | ${dsk.coreWebVitals?.tbt ?? 'N/A'} | ≤ 200ms |
| **Speed Index (Índice de Velocidade)** | ${mob.coreWebVitals?.speedIndex ?? 'N/A'} | ${dsk.coreWebVitals?.speedIndex ?? 'N/A'} | ≤ 3.4s |

---

## 3. Principais Oportunidades de Otimização (Mobile)
${
  mob.opportunities && mob.opportunities.length > 0
    ? mob.opportunities.map((o) => `- **${o.title}** (Economia estimada: \`${o.savings}\`)`).join('\n')
    : '✓ Nenhuma oportunidade crítica de economia de tempo detectada.'
}
`;
}

// Execução direta via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const urlArg = process.argv[2] || 'https://mundoereceitas.blogspot.com/';
  runPageSpeedAudit(urlArg).catch(console.error);
}
