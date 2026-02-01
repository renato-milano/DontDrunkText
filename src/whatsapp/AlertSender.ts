import type {
  AlertLevel,
  EnrichedContext,
  RiskAssessment,
  DrunkIndicator,
  Logger,
} from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { BaileysClient } from './BaileysClient.js';

export class AlertSender {
  private logger: Logger;
  private config: ConfigManager;
  private client: BaileysClient;
  private cooldowns: Map<string, number> = new Map();

  constructor(logger: Logger, config: ConfigManager, client: BaileysClient) {
    this.logger = logger;
    this.config = config;
    this.client = client;
  }

  async sendAlert(
    level: AlertLevel,
    assessment: RiskAssessment,
    context: EnrichedContext
  ): Promise<boolean> {
    const cfg = this.config.get().alerts;

    if (!cfg.enabled) {
      this.logger.debug('Alerts disabled, skipping');
      return false;
    }

    // Check cooldown
    if (!this.canSendAlert(context.message.recipientJid)) {
      this.logger.debug('Alert in cooldown, skipping');
      return false;
    }

    // Build message
    const message = this.buildAlertMessage(level, assessment, context);

    // Send self-message
    if (cfg.selfAlert) {
      try {
        await this.client.sendSelfMessage(message);
        this.recordCooldown(context.message.recipientJid);
        this.logger.info(`Alert sent: ${level}`, {
          recipient: context.contact?.name || 'unknown',
          score: assessment.overallScore.toFixed(2),
        });
        return true;
      } catch (error) {
        this.logger.error('Failed to send alert', { error });
        return false;
      }
    }

    return false;
  }

  private buildAlertMessage(
    level: AlertLevel,
    assessment: RiskAssessment,
    context: EnrichedContext
  ): string {
    const cfg = this.config.get().alerts;

    // Get template based on level
    let template: string;
    switch (level) {
      case 'critical':
        template = cfg.messages.critical;
        break;
      case 'high':
        template = cfg.messages.danger;
        break;
      default:
        template = cfg.messages.warning;
    }

    // Build formatted message
    let message = `*DontDrunkText Alert* ${this.getLevelEmoji(level)}\n\n`;
    message += `${template}\n\n`;

    // Add indicators
    if (assessment.indicators.length > 0) {
      message += `*Indicatori rilevati:*\n`;
      for (const indicator of assessment.indicators) {
        message += `- ${this.formatIndicator(indicator)}\n`;
      }
      message += '\n';
    }

    // Add contact info
    if (context.contact) {
      message += `_Stai scrivendo a: ${context.contact.name} (${context.contact.category})_\n`;
    }

    // Add time info
    const time = context.message.timestamp;
    message += `_Ora: ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}_\n`;

    // Add score
    message += `\n_Risk Score: ${Math.round(assessment.overallScore * 100)}%_`;

    return message;
  }

  private getLevelEmoji(level: AlertLevel): string {
    switch (level) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      default:
        return '💡';
    }
  }

  private formatIndicator(indicator: DrunkIndicator): string {
    const map: Record<DrunkIndicator, string> = {
      typos_detected: 'Errori di battitura',
      emotional_language: 'Linguaggio emotivo',
      repetitive_content: 'Contenuto ripetitivo',
      excessive_punctuation: 'Punteggiatura eccessiva',
      caps_lock_abuse: 'Uso eccessivo di MAIUSCOLE',
      incoherent_flow: 'Flusso incoerente',
      late_night_timing: 'Orario tarda notte',
      dangerous_recipient: 'Destinatario a rischio',
    };
    return map[indicator] || indicator;
  }

  private canSendAlert(recipientJid: string): boolean {
    const lastAlert = this.cooldowns.get(recipientJid);
    if (!lastAlert) return true;

    const cooldownMs = this.config.get().alerts.cooldownMinutes * 60 * 1000;
    return Date.now() - lastAlert > cooldownMs;
  }

  private recordCooldown(recipientJid: string): void {
    this.cooldowns.set(recipientJid, Date.now());
  }

  getRemainingCooldown(recipientJid: string): number {
    const lastAlert = this.cooldowns.get(recipientJid);
    if (!lastAlert) return 0;

    const cooldownMs = this.config.get().alerts.cooldownMinutes * 60 * 1000;
    const remaining = cooldownMs - (Date.now() - lastAlert);
    return Math.max(0, remaining);
  }
}
