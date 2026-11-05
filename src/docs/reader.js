import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/client.js';

export const AUDIT_PROMPT_DOC_ID = '1WGFspgXb79mpb7rDce3Kv6k665vqDFasNCVU0qWbEwI';

/**
 * Extrai o ID do documento a partir de uma URL completa do Google Docs ou retorna o próprio ID.
 */
export function extractDocId(urlOrId) {
  if (!urlOrId) return AUDIT_PROMPT_DOC_ID;
  const match = urlOrId.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/**
 * Lê o conteúdo do Google Doc diretamente em memória via API ou export stream.
 * Nunca baixa ou salva o arquivo em disco.
 */
export async function readGoogleDocInMemory(docIdOrUrl = AUDIT_PROMPT_DOC_ID) {
  const docId = extractDocId(docIdOrUrl);
  const client = getAuthenticatedClient();

  // 1. Tentar exportar o conteúdo textual via Google Drive API (em memória)
  try {
    const drive = google.drive({ version: 'v3', auth: client });
    const res = await drive.files.export(
      {
        fileId: docId,
        mimeType: 'text/plain'
      },
      { responseType: 'text' }
    );

    if (res.data && typeof res.data === 'string' && res.data.length > 0) {
      return res.data;
    }
  } catch (driveErr) {
    // 2. Fallback: Requisição autenticada direta ao endpoint de exportação de texto
    try {
      const token = await client.getAccessToken();
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      const response = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });

      if (response.ok) {
        const text = await response.text();
        if (text && !text.includes('<!DOCTYPE html>')) {
          return text;
        }
      }
    } catch {
      // Ignora e repassa o erro detalhado
    }

    throw new Error(
      `Não foi possível ler o documento [${docId}] em memória. Detalhes: ${driveErr.message}. ` +
      `Certifique-se de que o documento no Google Docs está compartilhado com o e-mail autenticado ou como "Qualquer pessoa com o link".`
    );
  }
}
