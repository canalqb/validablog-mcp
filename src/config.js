import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

export const CONFIG = {
  rootDir,
  tokenPath: path.join(rootDir, 'token.json'),
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/callback',
  port: parseInt(process.env.PORT || '3000', 10),
  apiKey: process.env.GOOGLE_API_KEY,

  // Escopos requeridos para o sistema de auditoria e diagnóstico
  scopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    // 1. Blogger
    'https://www.googleapis.com/auth/blogger',
    // 2. Google Search Console
    'https://www.googleapis.com/auth/webmasters.readonly',
    // 3. Google AdSense
    'https://www.googleapis.com/auth/adsense.readonly',
    // 4. Google Analytics (Data API)
    'https://www.googleapis.com/auth/analytics.readonly',
    // 5. Google Tag Manager
    'https://www.googleapis.com/auth/tagmanager.readonly',
    // 6. Google Drive (Condicional / Opcional para salvar relatórios)
    'https://www.googleapis.com/auth/drive.file'
  ]
};

