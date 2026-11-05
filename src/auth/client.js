import fs from 'fs';
import { google } from 'googleapis';
import { CONFIG } from '../config.js';

/**
 * Cria e configura uma instância de OAuth2Client com suporte a auto-refresh do token.
 */
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    CONFIG.clientId,
    CONFIG.clientSecret,
    CONFIG.redirectUri
  );

  // Escuta atualizações de token (auto-refresh) e persiste no token.json
  oauth2Client.on('tokens', (tokens) => {
    saveTokens(tokens);
  });

  return oauth2Client;
}

/**
 * Salva ou atualiza os tokens em token.json mantendo o refresh_token anterior caso não venha um novo.
 */
export function saveTokens(newTokens) {
  let existingTokens = {};
  if (fs.existsSync(CONFIG.tokenPath)) {
    try {
      existingTokens = JSON.parse(fs.readFileSync(CONFIG.tokenPath, 'utf-8'));
    } catch {
      existingTokens = {};
    }
  }

  const merged = {
    ...existingTokens,
    ...newTokens,
    // Garante que o refresh_token nunca seja perdido se a renovação vier só com access_token
    refresh_token: newTokens.refresh_token || existingTokens.refresh_token,
    updated_at: new Date().toISOString()
  };

  fs.writeFileSync(CONFIG.tokenPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`[TokenManager] Tokens salvos com sucesso em: ${CONFIG.tokenPath}`);
  return merged;
}

/**
 * Carrega o cliente autenticado a partir de token.json.
 */
export function getAuthenticatedClient() {
  if (!fs.existsSync(CONFIG.tokenPath)) {
    throw new Error(`Arquivo ${CONFIG.tokenPath} não encontrado. Execute 'npm run auth' primeiro.`);
  }

  const tokens = JSON.parse(fs.readFileSync(CONFIG.tokenPath, 'utf-8'));
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  return client;
}

