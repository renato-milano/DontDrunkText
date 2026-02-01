// ============================================
// DontDrunkText - Type Definitions
// ============================================

// === LLM PROVIDER TYPES ===

export type LLMProviderType = 'ollama' | 'openai' | 'anthropic';

export interface LLMConfig {
  /** Provider LLM da utilizzare */
  provider: LLMProviderType;
  /** Nome del modello */
  model: string;
  /** API key (richiesta per provider cloud) */
  apiKey?: string;
  /** URL base del servizio (default dipende dal provider) */
  baseUrl?: string;
  /** Timeout in millisecondi */
  timeout: number;
  /** Temperatura per la generazione (0.0-1.0, default 0.3) */
  temperature?: number;
}

// === CONFIGURATION TYPES ===

export interface Config {
  /** Configurazione LLM (nuovo formato) */
  llm: LLMConfig;
  /** @deprecated Usa 'llm' invece. Mantenuto per retrocompatibilita' */
  ollama?: OllamaConfig;
  monitoring: MonitoringConfig;
  dangerousContacts: DangerousContact[];
  detection: DetectionConfig;
  alerts: AlertsConfig;
  privacy: PrivacyConfig;
}

/** @deprecated Usa LLMConfig invece */
export interface OllamaConfig {
  model: string;
  baseUrl: string;
  timeout: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  startHour: number;
  endHour: number;
  timezone: string;
  alwaysMonitorDangerousContacts: boolean;
}

export interface DetectionConfig {
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid';
  minScore: number;
  weights: ScoreWeights;
  emotionalKeywords: string[];
}

export interface ScoreWeights {
  llm: number;
  pattern: number;
  time: number;
  contact: number;
}

export interface AlertsConfig {
  enabled: boolean;
  cooldownMinutes: number;
  selfAlert: boolean;
  messages: AlertMessages;
}

export interface AlertMessages {
  warning: string;
  danger: string;
  critical: string;
}

export interface PrivacyConfig {
  saveMessageContent: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// === CONTACT TYPES ===

export interface DangerousContact {
  name: string;
  phone: string;
  category: ContactCategory;
  riskLevel: number;
  jid?: string;
}

export type ContactCategory =
  | 'ex'
  | 'crush'
  | 'boss'
  | 'colleague'
  | 'family'
  | 'friend'
  | 'custom';

// === MESSAGE TYPES ===

export interface WhatsAppMessage {
  id: string;
  text: string;
  recipientJid: string;
  recipientName?: string;
  timestamp: Date;
  fromMe: boolean;
}

export interface NormalizedMessage {
  id: string;
  text: string;
  recipientJid: string;
  recipientName: string | null;
  timestamp: Date;
  hour: number;
  minute: number;
  isLateNight: boolean;
  dayOfWeek: number;
}

export interface EnrichedContext {
  message: NormalizedMessage;
  contact: DangerousContact | null;
  recentMessages: NormalizedMessage[];
  isMonitoringActive: boolean;
  isDangerousContact: boolean;
}

// === ANALYSIS TYPES ===

export interface LLMAnalysisResult {
  drunkScore: number;
  confidence: number;
  indicators: DrunkIndicator[];
  reasoning: string;
}

export type DrunkIndicator =
  | 'typos_detected'
  | 'emotional_language'
  | 'repetitive_content'
  | 'excessive_punctuation'
  | 'caps_lock_abuse'
  | 'incoherent_flow'
  | 'late_night_timing'
  | 'dangerous_recipient';

export interface PatternAnalysis {
  typoRatio: number;
  repetitionScore: number;
  capsRatio: number;
  punctuationAnomaly: boolean;
  emotionalScore: number;
  messageLength: 'short' | 'normal' | 'long' | 'excessive';
}

export interface AnalysisResult {
  llmResult: LLMAnalysisResult;
  patternResult: PatternAnalysis;
  combinedScore: number;
}

// === RISK TYPES ===

export interface RiskAssessment {
  overallScore: number;
  breakdown: ScoreBreakdown;
  shouldAlert: boolean;
  alertLevel: AlertLevel;
  indicators: DrunkIndicator[];
}

export interface ScoreBreakdown {
  llmScore: number;
  patternScore: number;
  timeScore: number;
  contactScore: number;
}

export type AlertLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

// === EVENT TYPES ===

export interface MessageEvent {
  type: 'outbound_message';
  message: WhatsAppMessage;
  timestamp: Date;
}

export interface AnalysisEvent {
  type: 'analysis_complete';
  messageId: string;
  assessment: RiskAssessment;
  context: EnrichedContext;
  timestamp: Date;
}

export interface AlertEvent {
  type: 'alert_sent';
  level: AlertLevel;
  recipientJid: string;
  timestamp: Date;
}

export type AppEvent = MessageEvent | AnalysisEvent | AlertEvent;

// === UTILITY TYPES ===

export interface Logger {
  debug: (msg: string, data?: object) => void;
  info: (msg: string, data?: object) => void;
  warn: (msg: string, data?: object) => void;
  error: (msg: string, data?: object) => void;
}
