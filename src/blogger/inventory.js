import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';
import { CONFIG } from '../config.js';

function extractImageStats(content = '') {
  const imgRegex = /<img\b([^>]*)>/gi;
  let totalImages = 0;
  let missingAlt = 0;
  const images = [];

  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    totalImages++;
    const attrs = match[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : '';
    const alt = altMatch ? altMatch[1].trim() : '';

    if (!alt) {
      missingAlt++;
    }

    images.push({ src, alt, hasAlt: Boolean(alt) });
  }

  return { totalImages, missingAlt, images };
}

function countWords(content = '') {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export async function fetchBlogInventory(blogId = '2609663586053425832') {
  console.log(`\n========================================================`);
  console.log(` INICIANDO FASE 1: Inventário do Blog [${blogId}]`);
  console.log(`========================================================\n`);

  const client = getAuthenticatedClient();
  const blogger = google.blogger({ version: 'v3', auth: client });

  // 1. Obter informações básicas do blog
  quotaManager.recordCall('blogger', 1);
  console.log('[Blogger] Obtendo dados gerais do blog...');
  const blogRes = await blogger.blogs.get({ blogId });
  const blogInfo = blogRes.data;

  console.log(`✓ Blog: "${blogInfo.name}" (${blogInfo.url})`);
  console.log(`  Total informado no painel: ${blogInfo.posts.totalItems} posts, ${blogInfo.pages.totalItems} páginas.\n`);

  // 2. Importar todos os posts com paginação
  const posts = [];
  let pageToken = null;
  let pageCount = 1;

  console.log('[Blogger] Importando artigos (posts)...');
  do {
    quotaManager.recordCall('blogger', 1);
    const postsRes = await blogger.posts.list({
      blogId,
      maxResults: 100, // Máximo por requisição para economizar cotas
      pageToken: pageToken || undefined,
      fetchBodies: true
    });

    const items = postsRes.data.items || [];
    for (const post of items) {
      const imgStats = extractImageStats(post.content);
      const wordCount = countWords(post.content);

      posts.push({
        id: post.id,
        title: post.title,
        url: post.url,
        published: post.published,
        updated: post.updated,
        labels: post.labels || [],
        wordCount,
        imagesCount: imgStats.totalImages,
        imagesMissingAlt: imgStats.missingAlt,
        status: post.status
      });
    }

    console.log(`  Página ${pageCount}: +${items.length} posts coletados (Total até agora: ${posts.length})`);
    pageToken = postsRes.data.nextPageToken;
    pageCount++;
  } while (pageToken);

  // 3. Importar todas as páginas estáticas
  console.log('\n[Blogger] Importando páginas estáticas...');
  const pages = [];
  quotaManager.recordCall('blogger', 1);
  const pagesRes = await blogger.pages.list({
    blogId,
    fetchBodies: true
  });

  const pageItems = pagesRes.data.items || [];
  for (const page of pageItems) {
    const imgStats = extractImageStats(page.content);
    const wordCount = countWords(page.content);

    pages.push({
      id: page.id,
      title: page.title,
      url: page.url,
      published: page.published,
      updated: page.updated,
      wordCount,
      imagesCount: imgStats.totalImages,
      imagesMissingAlt: imgStats.missingAlt,
      status: page.status
    });
  }
  console.log(`✓ Total de páginas encontradas: ${pages.length}\n`);

  // 4. Salvar inventário estruturado JSON
  const inventory = {
    generatedAt: new Date().toISOString(),
    blog: {
      id: blogInfo.id,
      name: blogInfo.name,
      description: blogInfo.description,
      url: blogInfo.url,
      published: blogInfo.published,
      updated: blogInfo.updated
    },
    metrics: {
      totalPosts: posts.length,
      totalPages: pages.length,
      postsWithoutImages: posts.filter((p) => p.imagesCount === 0).length,
      postsWithMissingAlt: posts.filter((p) => p.imagesMissingAlt > 0).length,
      thinContentPosts: posts.filter((p) => p.wordCount < 300).length // < 300 palavras
    },
    pages,
    posts
  };

  const jsonPath = path.join(CONFIG.rootDir, 'data', `inventory-${blogId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2), 'utf-8');
  console.log(`✓ Inventário JSON salvo em: ${jsonPath}`);

  // 5. Gerar Relatório Resumido em Markdown
  const mdReport = generateMarkdownReport(inventory);
  const mdPath = path.join(CONFIG.rootDir, 'data', `relatorio-inventario-${blogId}.md`);
  fs.writeFileSync(mdPath, mdReport, 'utf-8');
  console.log(`✓ Relatório Markdown salvo em: ${mdPath}`);

  return inventory;
}

function generateMarkdownReport(inv) {
  const { blog, metrics, posts, pages } = inv;

  const topRecent = posts.slice(0, 10);
  const thinPosts = posts.filter((p) => p.wordCount < 300);

  return `# Relatório de Inventário do Blog
**Blog:** ${blog.name}  
**URL:** [${blog.url}](${blog.url})  
**ID:** \`${blog.id}\`  
**Data da Análise:** ${inv.generatedAt}

---

## 1. Visão Geral do Conteúdo

| Métrica | Quantidade |
| :--- | :--- |
| **Total de Artigos (Posts)** | ${metrics.totalPosts} |
| **Total de Páginas Estáticas** | ${metrics.totalPages} |
| **Artigos com Conteúdo Curto (< 300 palavras)** | ${metrics.thinContentPosts} |
| **Artigos com Imagens sem ALT** | ${metrics.postsWithMissingAlt} |
| **Artigos sem Nenhuma Imagem** | ${metrics.postsWithoutImages} |

---

## 2. Páginas Estáticas (Conformidade AdSense & Navegação)
${
  pages.length > 0
    ? pages
        .map(
          (p) => `- **[${p.title}](${p.url})** — ${p.wordCount} palavras | ${p.imagesCount} imagens`
        )
        .join('\n')
    : '*Nenhuma página estática encontrada.* (Atenção: AdSense exige páginas de Política de Privacidade, Contato e Sobre).'
}

---

## 3. Últimos 10 Artigos Publicados
| Título | Data | Palavras | Imagens | Alts Ausentes |
| :--- | :--- | :--- | :--- | :--- |
${topRecent
  .map(
    (p) =>
      `| [${p.title.replace(/\|/g, '-')}](${p.url}) | ${p.published.substring(0, 10)} | ${p.wordCount} | ${p.imagesCount} | ${p.imagesMissingAlt} |`
  )
  .join('\n')}

---

## 4. Artigos com Conteúdo Superficial (< 300 palavras)
*Artigos muito curtos podem ser classificados pelo Google como "Thin Content" e impactar o AdSense e o SEO.*

${
  thinPosts.length > 0
    ? thinPosts
        .slice(0, 15)
        .map((p) => `- [${p.title}](${p.url}) (${p.wordCount} palavras)`)
        .join('\n')
    : '✓ Nenhum artigo com menos de 300 palavras encontrado.'
}
${thinPosts.length > 15 ? `\n*(... e mais ${thinPosts.length - 15} artigos adicionais no inventário completo)*` : ''}
`;
}

// Execução via linha de comando
const blogIdArg = process.argv[2] || '2609663586053425832';
fetchBlogInventory(blogIdArg).catch(console.error);

