import { readFileSync, existsSync, copyFileSync } from 'fs';
import { z } from 'zod';
import type { Config, DangerousContact, LLMProviderType, BuddyContact } from '../types/index.js';

// Schema per LLM config (nuovo formato)
const llmConfigSchema = z.object({
  provider: z.enum(['ollama', 'openai', 'anthropic']).default('ollama'),
  model: z.string().default('llama3.2:3b'),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  timeout: z.number().positive().default(30000),
  temperature: z.number().min(0).max(1).optional(),
});

// Schema legacy per Ollama (retrocompatibilita')
const ollamaLegacySchema = z.object({
  model: z.string().default('llama3.2:3b'),
  baseUrl: z.string().url().default('http://localhost:11434'),
  timeout: z.number().positive().default(30000),
});

// Zod schema for validation
const configSchema = z.object({
  // Nuovo formato LLM (preferito)
  llm: llmConfigSchema.optional(),
  // Legacy Ollama (retrocompatibilita')
  ollama: ollamaLegacySchema.optional(),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    startHour: z.number().min(0).max(23).default(21),
    endHour: z.number().min(0).max(23).default(6),
    timezone: z.string().default('Europe/Rome'),
    alwaysMonitorDangerousContacts: z.boolean().default(true),
  }),
  dangerousContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    category: z.enum(['ex', 'crush', 'boss', 'colleague', 'family', 'friend', 'custom']),
    riskLevel: z.number().min(1).max(10),
  })).default([]),
  detection: z.object({
    sensitivity: z.enum(['low', 'medium', 'high', 'paranoid']).default('medium'),
    minScore: z.number().min(0).max(1).default(0.6),
    weights: z.object({
      llm: z.number().default(0.4),
      pattern: z.number().default(0.3),
      time: z.number().default(0.15),
      contact: z.number().default(0.15),
    }),
    emotionalKeywords: z.array(z.string()).default([]),
  }),
  alerts: z.object({
    enabled: z.boolean().default(true),
    cooldownMinutes: z.number().positive().default(30),
    selfAlert: z.boolean().default(true),
    buddies: z.array(z.object({
      name: z.string(),
      phone: z.string(),
      notifyAlways: z.boolean().optional().default(false),
    })).optional().default([]),
    buddyAlertLevel: z.enum(['none', 'low', 'medium', 'high', 'critical']).optional().default('high'),
    messages: z.object({
      warning: z.string(),
      danger: z.string(),
      critical: z.string(),
      buddyAlert: z.string().optional(),
    }),
  }),
  privacy: z.object({
    saveMessageContent: z.boolean().default(false),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

export class ConfigManager {
  private config: Config;
  private configPath: string;
  private contactMap: Map<string, DangerousContact> = new Map();

  constructor(configPath: string = 'config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.buildContactMap();
  }

  private loadConfig(): Config {
    // Check if config exists, if not copy from example
    if (!existsSync(this.configPath)) {
      const examplePath = 'config.example.json';
      if (existsSync(examplePath)) {
        copyFileSync(examplePath, this.configPath);
        console.log(`Created ${this.configPath} from example. Please edit it with your contacts.`);
      } else {
        throw new Error(`Config file not found: ${this.configPath}`);
      }
    }

    const rawConfig = JSON.parse(readFileSync(this.configPath, 'utf-8'));
    const result = configSchema.safeParse(rawConfig);

    if (!result.success) {
      console.error('Config validation errors:', result.error.format());
      throw new Error('Invalid configuration file');
    }

    const parsedConfig = result.data;

    // Retrocompatibilita': converti vecchio formato 'ollama' in nuovo 'llm'
    if (!parsedConfig.llm && parsedConfig.ollama) {
      parsedConfig.llm = {
        provider: 'ollama' as const,
        model: parsedConfig.ollama.model,
        baseUrl: parsedConfig.ollama.baseUrl,
        timeout: parsedConfig.ollama.timeout,
      };
      console.log('Note: Config migrated from "ollama" to "llm" format. Consider updating config.json');
    }

    // Se non c'e' ne' llm ne' ollama, usa default
    if (!parsedConfig.llm) {
      parsedConfig.llm = {
        provider: 'ollama' as const,
        model: 'llama3.2:3b',
        baseUrl: 'http://localhost:11434',
        timeout: 30000,
      };
    }

    return parsedConfig as Config;
  }

  private buildContactMap(): void {
    this.contactMap.clear();
    for (const contact of this.config.dangerousContacts) {
      // Normalize phone to JID format
      const jid = this.phoneToJid(contact.phone);
      contact.jid = jid;
      this.contactMap.set(jid, contact);
    }
  }

  private phoneToJid(phone: string): string {
    // Remove + and any spaces/dashes
    const cleaned = phone.replace(/[\s\-\+]/g, '');
    return `${cleaned}@s.whatsapp.net`;
  }

  get(): Config {
    return this.config;
  }

  /**
   * Ottiene la configurazione LLM
   */
  getLLMConfig() {
    return this.config.llm;
  }

  /**
   * Verifica se il provider corrente richiede API key
   */
  requiresApiKey(): boolean {
    return this.config.llm.provider !== 'ollama';
  }

  /**
   * Verifica se il provider corrente e' locale
   */
  isLocalProvider(): boolean {
    return this.config.llm.provider === 'ollama';
  }

  getContact(jid: string): DangerousContact | null {
    return this.contactMap.get(jid) || null;
  }

  isDangerousContact(jid: string): boolean {
    return this.contactMap.has(jid);
  }

  getContactRiskLevel(jid: string): number {
    const contact = this.contactMap.get(jid);
    return contact?.riskLevel || 0;
  }

  reload(): void {
    this.config = this.loadConfig();
    this.buildContactMap();
  }

  // Sensitivity presets
  getMinScoreForSensitivity(): number {
    const presets: Record<string, number> = {
      low: 0.75,
      medium: 0.60,
      high: 0.45,
      paranoid: 0.30,
    };
    return presets[this.config.detection.sensitivity] || 0.60;
  }

  /**
   * Ottiene i buddies con i loro JID
   */
  getBuddies(): Array<BuddyContact & { jid: string }> {
    const buddies = this.config.alerts.buddies || [];
    return buddies.map(buddy => ({
      ...buddy,
      jid: this.phoneToJid(buddy.phone),
    }));
  }

  /**
   * Verifica se ci sono buddies configurati
   */
  hasBuddies(): boolean {
    return (this.config.alerts.buddies?.length || 0) > 0;
  }
}

// Singleton instance
let instance: ConfigManager | null = null;

export function getConfig(configPath?: string): ConfigManager {
  if (!instance) {
    instance = new ConfigManager(configPath);
  }
  return instance;
}
