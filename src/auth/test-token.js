import { google } from 'googleapis';
import { getAuthenticatedClient } from './client.js';

async function testConnection() {
  console.log('[Test] Carregando cliente autenticado com auto-refresh...');
  const client = getAuthenticatedClient();

  // Testando chamada à API de informações do usuário (OAuth2 v2)
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const userInfo = await oauth2.userinfo.get();

  console.log('\n=============================================');
  console.log(' Conexão com Google validada com sucesso!');
  console.log('=============================================');
  console.log(` Usuário:  ${userInfo.data.name}`);
  console.log(` Email:    ${userInfo.data.email}`);
  console.log(` ID:       ${userInfo.data.id}`);
  console.log('=============================================\n');

  // Testando chamada à Blogger API v3 (Listar blogs do usuário)
  try {
    console.log('[Test] Consultando blogs associados na Blogger API v3...');
    const blogger = google.blogger({ version: 'v3', auth: client });
    const blogsRes = await blogger.blogs.listByUser({ userId: 'self' });

    if (blogsRes.data.items && blogsRes.data.items.length > 0) {
      console.log(`\nBlogs encontrados (${blogsRes.data.items.length}):`);
      blogsRes.data.items.forEach((blog) => {
        console.log(` - [${blog.id}] ${blog.name} (${blog.url})`);
      });
    } else {
      console.log('\nNenhum blog encontrado para este usuário.');
    }
  } catch (err) {
    console.warn('[Test] Aviso na consulta ao Blogger:', err.message);
  }
}

testConnection().catch((err) => {
  console.error('[Test] Erro ao testar token:', err.message);
});

