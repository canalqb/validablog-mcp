import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

const QUOTA_FILE = path.join(CONFIG.rootDir, 'data', 'quota-tracker.json');

// Limites diários recomendados com margem de segurança para garantir R$ 0
const DEFAULT_LIMITS = {
  blogger: { dailyLimit: 10000, safetyMargin: 0.8 }, // 80% de 10.000 = 8.000 max
  searchconsole: { dailyLimit: 2000, safetyMargin: 0.8 },
  adsense: { dailyLimit: 10000, safetyMargin: 0.8 },
  analytics: { dailyLimit: 10000, safetyMargin: 0.8 },
  pagespeed: { dailyLimit: 25000, safetyMargin: 0.8 },
  tagmanager: { dailyLimit: 10000, safetyMargin: 0.8 }
};

export class QuotaManager {
  constructor() {
    this.ensureDataDir();
    this.state = this.loadState();
  }

  ensureDataDir() {
    const dataDir = path.join(CONFIG.rootDir, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  loadState() {
    if (fs.existsSync(QUOTA_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf-8'));
        const today = this.getTodayKey();
        if (data.date === today) {
          return data;
        }
      } catch {
        // Arquivo corrompido ou formato antigo
      }
    }

    return {
      date: this.getTodayKey(),
      usage: {}
    };
  }

  saveState() {
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  checkQuota(serviceName) {
    const today = this.getTodayKey();
    if (this.state.date !== today) {
      this.state = { date: today, usage: {} };
    }

    const config = DEFAULT_LIMITS[serviceName] || { dailyLimit: 1000, safetyMargin: 0.8 };
    const maxSafeCalls = Math.floor(config.dailyLimit * config.safetyMargin);
    const currentCalls = this.state.usage[serviceName] || 0;

    if (currentCalls >= maxSafeCalls) {
      throw new Error(
        `[TRAVA DE CUSTO ZERO] Cota preventiva atingida para o serviço '${serviceName}'. Chamadas hoje: ${currentCalls} / Limite seguro: ${maxSafeCalls}. Operação cancelada para evitar custos.`
      );
    }

    return {
      current: currentCalls,
      maxSafe: maxSafeCalls,
      remaining: maxSafeCalls - currentCalls
    };
  }

  recordCall(serviceName, count = 1) {
    this.checkQuota(serviceName);
    this.state.usage[serviceName] = (this.state.usage[serviceName] || 0) + count;
    this.saveState();
  }
}

export const quotaManager = new QuotaManager();

