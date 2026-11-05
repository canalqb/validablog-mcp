import http from 'http';
import url from 'url';
import { CONFIG } from '../config.js';
import { getOAuth2Client, saveTokens } from './client.js';

async function startOAuthFlow() {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Necessário para receber o refresh_token
    prompt: 'consent',     // Força consentimento para garantir o envio do refresh_token
    scope: CONFIG.scopes
  });

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);

      if (parsedUrl.pathname === '/') {
        res.writeHead(302, { Location: authUrl });
        res.end();
        return;
      }

      if (parsedUrl.pathname === '/callback') {
        const { code, error } = parsedUrl.query;

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>Erro na autenticação</h1><p>${error}</p>`);
          console.error('[OAuth] Erro retornado pelo Google:', error);
          server.close();
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>Código de autorização não encontrado</h1>');
          return;
        }

        console.log('[OAuth] Código recebido com sucesso. Trocando por tokens...');
        const { tokens } = await oauth2Client.getToken(code);
        saveTokens(tokens);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Autenticação Concluída</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f7fafc; color: #1a202c; }
                .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
                .success-icon { font-size: 3rem; color: #38a169; margin-bottom: 1rem; }
                h1 { margin-bottom: 0.5rem; font-size: 1.5rem; }
                p { color: #4a5568; line-height: 1.5; }
                .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #ebf8ff; color: #2b6cb0; border-radius: 9999px; font-size: 0.875rem; margin-top: 1rem; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="success-icon">✓</div>
                <h1>Autenticação Google Realizada!</h1>
                <p>O arquivo <strong>token.json</strong> foi gerado e salvo com sucesso com o <code>refresh_token</code> para renovação automática.</p>
                <div class="badge">Pode fechar esta janela agora</div>
              </div>
            </body>
          </html>
        `);

        console.log('[OAuth] Autenticação concluída e token.json salvo!');
        console.log('[OAuth] Você pode fechar o navegador e voltar ao terminal.');

        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1500);
      }
    } catch (err) {
      console.error('[OAuth] Falha ao processar callback:', err);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>Erro interno ao trocar tokens</h1><pre>${err.message}</pre>`);
      server.close();
    }
  });

  server.listen(CONFIG.port, () => {
    console.log(`\n======================================================`);
    console.log(` Servidor OAuth iniciado na porta ${CONFIG.port}`);
    console.log(` Abra a URL abaixo no seu navegador para fazer login:`);
    console.log(`------------------------------------------------------`);
    console.log(authUrl);
    console.log(`------------------------------------------------------`);
    console.log(` Ou acesse diretamente: http://localhost:${CONFIG.port}`);
    console.log(`======================================================\n`);
  });
}

startOAuthFlow().catch(console.error);

