import type {
  WhatsAppMessage,
  NormalizedMessage,
  EnrichedContext,
  Logger,
  DangerousContact,
} from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';

export class MessageInterceptor {
  private logger: Logger;
  private config: ConfigManager;
  private recentMessages: Map<string, NormalizedMessage[]> = new Map();
  private maxRecentMessages = 5;

  constructor(logger: Logger, config: ConfigManager) {
    this.logger = logger;
    this.config = config;
  }

  normalize(message: WhatsAppMessage): NormalizedMessage {
    const timestamp = message.timestamp;
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();

    return {
      id: message.id,
      text: message.text,
      recipientJid: message.recipientJid,
      recipientName: message.recipientName || null,
      timestamp,
      hour,
      minute,
      isLateNight: this.isLateNight(hour),
      dayOfWeek: timestamp.getDay(),
    };
  }

  enrich(normalized: NormalizedMessage): EnrichedContext {
    const contact = this.config.getContact(normalized.recipientJid);
    const isDangerous = contact !== null;

    // Get recent messages to this recipient
    const recent = this.getRecentMessages(normalized.recipientJid);

    // Check if monitoring is active
    const isMonitoringActive = this.isMonitoringActive(
      normalized.hour,
      isDangerous
    );

    // Store this message in recent history
    this.addToRecentMessages(normalized);

    return {
      message: normalized,
      contact,
      recentMessages: recent,
      isMonitoringActive,
      isDangerousContact: isDangerous,
    };
  }

  private isLateNight(hour: number): boolean {
    const cfg = this.config.get().monitoring;
    // Handle overnight range (e.g., 21-6)
    if (cfg.startHour > cfg.endHour) {
      return hour >= cfg.startHour || hour < cfg.endHour;
    }
    return hour >= cfg.startHour && hour < cfg.endHour;
  }

  private isMonitoringActive(hour: number, isDangerousContact: boolean): boolean {
    const cfg = this.config.get().monitoring;

    if (!cfg.enabled) return false;

    // Always monitor dangerous contacts if configured
    if (isDangerousContact && cfg.alwaysMonitorDangerousContacts) {
      return true;
    }

    // Check time window
    return this.isLateNight(hour);
  }

  private getRecentMessages(recipientJid: string): NormalizedMessage[] {
    return this.recentMessages.get(recipientJid) || [];
  }

  private addToRecentMessages(message: NormalizedMessage): void {
    const jid = message.recipientJid;
    const recent = this.recentMessages.get(jid) || [];

    recent.push(message);

    // Keep only last N messages
    if (recent.length > this.maxRecentMessages) {
      recent.shift();
    }

    this.recentMessages.set(jid, recent);
  }

  // Clean old messages (call periodically)
  cleanOldMessages(maxAgeMinutes: number = 60): void {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;

    for (const [jid, messages] of this.recentMessages) {
      const filtered = messages.filter(
        (m) => m.timestamp.getTime() > cutoff
      );
      if (filtered.length === 0) {
        this.recentMessages.delete(jid);
      } else {
        this.recentMessages.set(jid, filtered);
      }
    }
  }
}
