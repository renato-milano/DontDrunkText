import type {
  AlertLevel,
  EnrichedContext,
  RiskAssessment,
  DrunkIndicator,
  Logger,
  BuddyContact,
} from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { BaileysClient } from './BaileysClient.js';

// Ordine dei livelli di alert per confronto
const ALERT_LEVEL_ORDER: Record<AlertLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

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

    let alertSent = false;

    // Build message for self
    const selfMessage = this.buildAlertMessage(level, assessment, context);

    // Send self-message
    if (cfg.selfAlert) {
      try {
        await this.client.sendSelfMessage(selfMessage);
        this.logger.info(`Alert sent to self: ${level}`, {
          recipient: context.contact?.name || 'unknown',
          score: assessment.overallScore.toFixed(2),
        });
        alertSent = true;
      } catch (error) {
        this.logger.error('Failed to send self alert', { error });
      }
    }

    // Send to buddies if level is high enough
    const buddiesSent = await this.sendBuddyAlerts(level, assessment, context);
    if (buddiesSent > 0) {
      alertSent = true;
    }

    if (alertSent) {
      this.recordCooldown(context.message.recipientJid);
    }

    return alertSent;
  }

  /**
   * Invia alert ai buddies configurati
   */
  private async sendBuddyAlerts(
    level: AlertLevel,
    assessment: RiskAssessment,
    context: EnrichedContext
  ): Promise<number> {
    const cfg = this.config.get().alerts;
    const buddies = this.config.getBuddies();

    if (buddies.length === 0) {
      return 0;
    }

    const minLevel = cfg.buddyAlertLevel || 'high';
    const currentLevelOrder = ALERT_LEVEL_ORDER[level];
    const minLevelOrder = ALERT_LEVEL_ORDER[minLevel];

    let sentCount = 0;

    for (const buddy of buddies) {
      // Verifica se notificare questo buddy
      const shouldNotify = buddy.notifyAlways || currentLevelOrder >= minLevelOrder;

      if (!shouldNotify) {
        this.logger.debug(`Skipping buddy ${buddy.name}: level ${level} < ${minLevel}`);
        continue;
      }

      try {
        const buddyMessage = this.buildBuddyAlertMessage(level, assessment, context, buddy);
        await this.client.sendMessage(buddy.jid, buddyMessage);
        this.logger.info(`Alert sent to buddy: ${buddy.name}`, {
          level,
          score: assessment.overallScore.toFixed(2),
        });
        sentCount++;
      } catch (error) {
        this.logger.error(`Failed to send alert to buddy ${buddy.name}`, { error });
      }
    }

    return sentCount;
  }

  /**
   * Costruisce il messaggio di alert per i buddies
   */
  private buildBuddyAlertMessage(
    level: AlertLevel,
    assessment: RiskAssessment,
    context: EnrichedContext,
    buddy: BuddyContact
  ): string {
    const cfg = this.config.get().alerts;
    const userName = this.client.getMyJid()?.split('@')[0] || 'Il tuo amico';

    // Usa messaggio custom se configurato
    if (cfg.messages.buddyAlert) {
      return cfg.messages.buddyAlert
        .replace('{name}', buddy.name)
        .replace('{level}', level)
        .replace('{score}', Math.round(assessment.overallScore * 100).toString());
    }

    // Messaggio default per buddies
    let message = `*DontDrunkText - Avviso Amico* ${this.getLevelEmoji(level)}\n\n`;
    message += `Ciao ${buddy.name}!\n\n`;
    message += `Un tuo amico potrebbe star scrivendo messaggi in stato alterato.\n\n`;

    // Livello di rischio
    message += `*Livello:* ${this.getLevelText(level)}\n`;
    message += `*Risk Score:* ${Math.round(assessment.overallScore * 100)}%\n\n`;

    // Indicatori (senza rivelare troppi dettagli per privacy)
    if (assessment.indicators.length > 0) {
      message += `*Segnali rilevati:*\n`;
      for (const indicator of assessment.indicators.slice(0, 3)) {
        message += `- ${this.formatIndicator(indicator)}\n`;
      }
      message += '\n';
    }

    // Orario
    const time = context.message.timestamp;
    message += `_Rilevato alle ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}_\n\n`;

    message += `_Potresti voler controllare che stia bene!_`;

    return message;
  }

  private getLevelText(level: AlertLevel): string {
    switch (level) {
      case 'critical':
        return 'CRITICO';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Medio';
      case 'low':
        return 'Basso';
      default:
        return 'Sconosciuto';
    }
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
