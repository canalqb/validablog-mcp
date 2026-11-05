import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';

export async function fixLiBeforeInPosts(blogId = '2609663586053425832') {
  console.log(`\n========================================================`);
  console.log(` CORREÇÃO DO BEFORE DO <li> NAS ETAPAS DAS RECEITAS`);
  console.log(` Blog ID: ${blogId}`);
  console.log(`========================================================\n`);

  const client = getAuthenticatedClient();
  const blogger = google.blogger({ version: 'v3', auth: client });

  quotaManager.recordCall('blogger', 1);
  console.log('[Blogger] Buscando publicações com .post_steps...');
  const postsRes = await blogger.posts.list({
    blogId,
    maxResults: 100,
    fetchBodies: true
  });

  const posts = postsRes.data.items || [];
  let updatedCount = 0;

  for (const post of posts) {
    if (!post.content || !post.content.includes('post_steps')) {
      continue;
    }

    console.log(`[Analisando] Post: "${post.title}" (ID: ${post.id})`);

    let newContent = post.content;

    // 1. Substituir padding insuficiente em .post_steps li por padding com !important e espaço seguro
    newContent = newContent.replace(
      /\.post_steps\s*li\{([^}]*?)padding:[^;}]+;?([^}]*?)\}/gi,
      (match, before, after) => {
        return `.post_steps li{${before}padding:16px 20px 16px 68px !important;${after}}`;
      }
    );

    // Se não tiver padding explícito dentro da regra, injeta
    if (!newContent.includes('padding:16px 20px 16px 68px !important;')) {
      newContent = newContent.replace(
        /\.post_steps\s*li\{/gi,
        '.post_steps li{padding:16px 20px 16px 68px !important;position:relative !important;box-sizing:border-box !important;'
      );
    }

    // 2. Garantir posicionamento à esquerda e tamanho do ::before
    newContent = newContent.replace(
      /\.post_steps\s*li::before\{([^}]*?)\}/gi,
      (match, inner) => {
        // Remove posições antigas se houverem
        let cleaned = inner
          .replace(/left:[^;]+;?/gi, '')
          .replace(/top:[^;]+;?/gi, '')
          .replace(/position:[^;]+;?/gi, '')
          .replace(/width:[^;]+;?/gi, '')
          .replace(/height:[^;]+;?/gi, '');

        return `.post_steps li::before{position:absolute !important;left:18px !important;top:16px !important;width:34px !important;height:34px !important;${cleaned}}`;
      }
    );

    // Se houve alteração no HTML
    if (newContent !== post.content) {
      quotaManager.recordCall('blogger', 1);
      console.log(`  -> Atualizando post via Blogger API...`);
      await blogger.posts.patch({
        blogId,
        postId: post.id,
        requestBody: {
          content: newContent
        }
      });
      console.log(`  ✓ Post "${post.title}" atualizado com sucesso!`);
      updatedCount++;
    } else {
      console.log(`  - Post já está em conformidade.`);
    }
  }

  console.log(`\n✓ Concluído! Total de posts corrigidos: ${updatedCount}`);
  return updatedCount;
}

// Execução direta se chamado via CLI
if (process.argv[1] && process.argv[1].endsWith('fix-li-before.js')) {
  fixLiBeforeInPosts().catch(console.error);
}
