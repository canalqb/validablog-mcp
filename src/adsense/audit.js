import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';
import { CONFIG } from '../config.js';

export async function auditAdSense(targetDomain = 'mundoereceitas.blogspot.com', blogId = '2609663586053425832') {
  console.log(`\n========================================================`);
  console.log(` INICIANDO FASE 3: Auditoria Google AdSense Management API`);
  console.log(` Domínio Alvo: ${targetDomain}`);
  console.log(`========================================================\n`);

  const client = getAuthenticatedClient();
  const adsense = google.adsense({ version: 'v2', auth: client });

  // 1. Listar contas AdSense vinculadas
  quotaManager.recordCall('adsense', 1);
  console.log('[AdSense] Consultando contas vinculadas ao usuário...');
  let accounts = [];
  try {
    const accountsRes = await adsense.accounts.list();
    accounts = accountsRes.data.accounts || [];
  } catch (err) {
    console.error(`[AdSense] Erro ao listar contas: ${err.message}`);
    return saveErrorReport(blogId, targetDomain, err.message);
  }

  if (accounts.length === 0) {
    console.warn('[AdSense] Nenhuma conta AdSense encontrada para este e-mail.');
    return saveErrorReport(blogId, targetDomain, 'Nenhuma conta AdSense vinculada a esta credencial.');
  }

  const primaryAccount = accounts[0];
  const accountName = primaryAccount.name; // Ex: "accounts/pub-XXXXXXXXXXXXXXXX"
  console.log(`✓ Conta encontrada: ${primaryAccount.displayName || accountName} (${accountName})`);

  // 2. Listar sites vinculados na conta
  quotaManager.recordCall('adsense', 1);
  console.log('[AdSense] Consultando sites cadastrados na conta...');
  let sites = [];
  try {
    const sitesRes = await adsense.accounts.sites.list({ parent: accountName });
    sites = sitesRes.data.sites || [];
    console.log(`✓ Total de sites cadastrados: ${sites.length}`);
    sites.forEach((s) => console.log(` - ${s.domain} [Status: ${s.state || 'N/A'}]`));
  } catch (err) {
    console.warn(`[AdSense] Aviso ao consultar sites: ${err.message}`);
  }

  const matchedSite = sites.find((s) => s.domain && s.domain.toLowerCase().includes(targetDomain.toLowerCase()));

  // 3. Consultar Alertas e Problemas de Políticas (Policy Issues)
  let policyIssues = [];
  try {
    quotaManager.recordCall('adsense', 1);
    console.log('[AdSense] Verificando problemas de políticas e conformidade...');
    if (adsense.accounts.policyIssues) {
      const policyRes = await adsense.accounts.policyIssues.list({ parent: accountName });
      policyIssues = policyRes.data.policyIssues || [];
      console.log(`✓ Problemas de política encontrados: ${policyIssues.length}`);
    }
  } catch (err) {
    console.log(`[AdSense] Política / Alertas: ${err.message}`);
  }

  // 4. Consultar Relatório de Desempenho e Receita (Últimos 28 dias)
  const endDate = new Date().toISOString().split('T')[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 28);
  const startDate = startDateObj.toISOString().split('T')[0];

  let performance = {
    period: { startDate, endDate },
    totals: { earnings: 'R$ 0,00', impressions: 0, clicks: 0, ctr: '0.00%', rpm: 'R$ 0,00' }
  };

  try {
    quotaManager.recordCall('adsense', 1);
    console.log(`[AdSense] Consultando receita e métricas (${startDate} a ${endDate})...`);
    const reportRes = await adsense.accounts.reports.generate({
      account: accountName,
      dateRange: 'LAST_30_DAYS',
      metrics: ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'CLICKS', 'PAGE_VIEWS_CTR', 'PAGE_VIEWS_RPM'],
      dimensions: ['DATE']
    });

    const rows = reportRes.data.rows || [];
    const totals = reportRes.data.totals?.cells || [];

    if (totals.length >= 5) {
      performance.totals = {
        earnings: totals[0].value || '0.00',
        impressions: parseInt(totals[1].value || '0', 10),
        clicks: parseInt(totals[2].value || '0', 10),
        ctr: (parseFloat(totals[3].value || '0') * 100).toFixed(2) + '%',
        rpm: totals[4].value || '0.00'
      };
    }
    console.log(`✓ Receita estimada no período: ${performance.totals.earnings}`);
  } catch (err) {
    console.warn(`[AdSense] Aviso ao gerar relatório de receita: ${err.message}`);
  }

  // 5. Salvar dados estruturados JSON
  const auditResult = {
    auditedAt: new Date().toISOString(),
    blogId,
    targetDomain,
    account: {
      name: accountName,
      displayName: primaryAccount.displayName
    },
    matchedSite: matchedSite || null,
    allSites: sites.map((s) => ({ domain: s.domain, state: s.state })),
    policyIssues,
    performance
  };

  const jsonPath = path.join(CONFIG.rootDir, 'data', `adsense-${blogId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(auditResult, null, 2), 'utf-8');
  console.log(`✓ Dados AdSense salvos em: ${jsonPath}`);

  // 6. Gerar Relatório Markdown
  const mdReport = generateMarkdownReport(auditResult);
  const mdPath = path.join(CONFIG.rootDir, 'data', `relatorio-adsense-${blogId}.md`);
  fs.writeFileSync(mdPath, mdReport, 'utf-8');
  console.log(`✓ Relatório Markdown salvo em: ${mdPath}`);

  return auditResult;
}

function saveErrorReport(blogId, targetDomain, errorMessage) {
  const result = {
    auditedAt: new Date().toISOString(),
    blogId,
    targetDomain,
    error: errorMessage
  };

  const jsonPath = path.join(CONFIG.rootDir, 'data', `adsense-${blogId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

  const mdReport = `# Relatório Google AdSense
**Domínio:** \`${targetDomain}\`  
**Data da Auditoria:** ${result.auditedAt}

---

## Status da Conexão
⚠️ **Não foi possível obter dados do AdSense.**  
**Motivo:** ${errorMessage}
`;

  const mdPath = path.join(CONFIG.rootDir, 'data', `relatorio-adsense-${blogId}.md`);
  fs.writeFileSync(mdPath, mdReport, 'utf-8');
  return result;
}

function generateMarkdownReport(res) {
  const { targetDomain, account, matchedSite, allSites, policyIssues, performance } = res;

  return `# Relatório Google AdSense
**Conta AdSense:** \`${account.name}\` (${account.displayName || 'Padrão'})  
**Domínio Alvo:** \`${targetDomain}\`  
**Status do Site no AdSense:** ${matchedSite ? `\`${matchedSite.state || 'Registrado'}\`` : '⚠️ **Não cadastrado diretamente na lista de sites**'}  
**Data da Auditoria:** ${res.auditedAt}

---

## 1. Status do Domínio e Aprovação
${
  matchedSite
    ? `- **Domínio:** \`${matchedSite.domain}\`\n- **Estado no AdSense:** \`${matchedSite.state}\``
    : `⚠️ O domínio \`${targetDomain}\` não aparece cadastrado na lista de sites do AdSense.  
*Para subdomínios blogspot.com, a monetização é ativada em Blogger → Ganhos.*`
}

---

## 2. Conformidade e Políticas (Policy Issues)
${
  policyIssues.length === 0
    ? '✓ **Nenhum problema de violação de política detectado na conta.**'
    : `⚠️ **Foram identificados ${policyIssues.length} problemas de conformidade:**\n` +
      policyIssues.map((p) => `- ${p.title || p.description || JSON.stringify(p)}`).join('\n')
}

---

## 3. Desempenho e Monetização (Últimos 30 dias)

| Métrica | Valor |
| :--- | :--- |
| **Ganhos Estimados** | ${performance.totals.earnings} |
| **Impressões de Anúncios** | ${performance.totals.impressions} |
| **Cliques** | ${performance.totals.clicks} |
| **CTR de Visualizações de Página** | ${performance.totals.ctr} |
| **RPM (Receita por Mil)** | ${performance.totals.rpm} |

---

## 4. Outros Sites Vinculados na Conta
${
  allSites.length > 0
    ? allSites.map((s) => `- \`${s.domain}\` (Status: \`${s.state || 'N/A'}\`)`).join('\n')
    : '*Nenhum outro site cadastrado.*'
}
`;
}

// Execução direta
const domainArg = process.argv[2] || 'mundoereceitas.blogspot.com';
auditAdSense(domainArg).catch(console.error);
