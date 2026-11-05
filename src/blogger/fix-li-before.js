import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/client.js';
import { quotaManager } from '../quota/manager.js';

/**
 * CSS override injetado em cada post que usa .post_steps
 * Garante que o ::before fique posicionado À ESQUERDA do <li>,
 * nunca sobreposto ao texto.
 */
const CSS_OVERRIDE = `
<style>
/* Fix: ::before posicionado fora do texto */
.post_steps ol, .post_steps ul {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
  counter-reset: steps-counter;
}
.post_steps li {
  position: relative !important;
  padding: 14px 16px 14px 70px !important;
  margin-bottom: 12px !important;
  box-sizing: border-box !important;
  display: block !important;
  min-height: 54px !important;
  counter-increment: steps-counter;
}
.post_steps li::before {
  content: counter(steps-counter) !important;
  position: absolute !important;
  left: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 38px !important;
  height: 38px !important;
  line-height: 38px !important;
  text-align: center !important;
  border-radius: 50% !important;
  font-weight: bold !important;
  font-size: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
}
</style>
`.trim();

const FIX_MARKER = '/* Fix: ::before posicionado fora do texto */';

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
    maxResults: 500,
    fetchBodies: true
  });

  const posts = postsRes.data.items || [];
  let updatedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    if (!post.content || !post.content.includes('post_steps')) {
      continue;
    }

    console.log(`\n[Analisando] Post: "${post.title}" (ID: ${post.id})`);

    let newContent = post.content;

    // --- Remover qualquer CSS override anterior do nosso script ---
    // Para evitar duplicações em re-runs
    if (newContent.includes(FIX_MARKER)) {
      // Remove o bloco <style>...</style> que contém nosso marker
      newContent = newContent.replace(/<style>[^<]*\/\* Fix: ::before posicionado fora do texto \*\/[\s\S]*?<\/style>\s*/gi, '');
      console.log(`  → Override CSS anterior removido (re-aplicando versão atualizada)`);
    }

    // --- Corrigir CSS existente do .post_steps no post (se houver <style> inline) ---
    // Estratégia 1: Se houver regra .post_steps li::before, garantir position:absolute + left correto
    if (newContent.match(/\.post_steps\s*li\s*::before/i)) {
      newContent = newContent.replace(
        /\.post_steps\s*li\s*::before\s*\{([^}]*?)\}/gi,
        (match, inner) => {
          let cleaned = inner
            .replace(/left\s*:[^;]+;?\s*/gi, '')
            .replace(/top\s*:[^;]+;?\s*/gi, '')
            .replace(/position\s*:[^;]+;?\s*/gi, '')
            .replace(/transform\s*:[^;]+;?\s*/gi, '')
            .replace(/display\s*:[^;]+;?\s*/gi, '');

          return `.post_steps li::before{position:absolute !important;left:12px !important;top:50% !important;transform:translateY(-50%) !important;${cleaned.trim()}}`;
        }
      );

      // Garantir que .post_steps li tenha position:relative e padding-left suficiente
      newContent = newContent.replace(
        /\.post_steps\s*li\s*\{([^}]*?)\}/gi,
        (match, inner) => {
          let cleaned = inner
            .replace(/position\s*:[^;]+;?\s*/gi, '')
            .replace(/padding(?:-left)?\s*:[^;]+;?\s*/gi, '');

          return `.post_steps li{position:relative !important;padding:14px 16px 14px 70px !important;box-sizing:border-box !important;${cleaned.trim()}}`;
        }
      );
    }

    // --- Estratégia 2 (sempre aplicada): Injetar CSS override no início do post ---
    // Isso garante que mesmo se o CSS do template sobrescrever, o fix funciona
    newContent = CSS_OVERRIDE + '\n' + newContent;

    // Verificar se houve mudança real
    if (newContent !== post.content) {
      quotaManager.recordCall('blogger', 1);
      console.log(`  → Atualizando post via Blogger API...`);
      try {
        await blogger.posts.patch({
          blogId,
          postId: post.id,
          requestBody: {
            content: newContent
          }
        });
        console.log(`  ✓ Post "${post.title}" atualizado com sucesso!`);
        updatedCount++;
      } catch (err) {
        console.error(`  ✗ Erro ao atualizar "${post.title}": ${err.message}`);
      }
    } else {
      console.log(`  - Post já está em conformidade.`);
      skippedCount++;
    }
  }

  console.log(`\n========================================================`);
  console.log(` ✓ Concluído!`);
  console.log(`   Posts corrigidos:  ${updatedCount}`);
  console.log(`   Posts sem mudança: ${skippedCount}`);
  console.log(`========================================================\n`);
  return updatedCount;
}

// Execução direta se chamado via CLI
if (process.argv[1] && process.argv[1].endsWith('fix-li-before.js')) {
  const blogId = process.argv[2] || '2609663586053425832';
  fixLiBeforeInPosts(blogId).catch(console.error);
}
