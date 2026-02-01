import type {
  EnrichedContext,
  AnalysisResult,
  LLMAnalysisResult,
  Logger,
} from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';
import type { ILLMProvider } from '../llm/ILLMProvider.js';
import { PatternDetector } from './PatternDetector.js';

export class DrunkAnalyzer {
  private logger: Logger;
  private config: ConfigManager;
  private llmProvider: ILLMProvider;
  private patternDetector: PatternDetector;

  constructor(
    logger: Logger,
    config: ConfigManager,
    llmProvider: ILLMProvider,
    patternDetector: PatternDetector
  ) {
    this.logger = logger;
    this.config = config;
    this.llmProvider = llmProvider;
    this.patternDetector = patternDetector;
  }

  async analyze(context: EnrichedContext): Promise<AnalysisResult> {
    const { message } = context;

    // Run pattern analysis (local, fast)
    const patternResult = this.patternDetector.analyze(message.text);
    const patternScore = this.patternDetector.toScore(patternResult);

    // Build prompt for LLM
    const prompt = this.buildPrompt(context);

    // Run LLM analysis
    const llmResult = await this.llmProvider.analyze(prompt);

    // Log LLM result
    if (llmResult.confidence > 0) {
      this.logger.info('LLM analysis completed', {
        message: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
        drunkScore: llmResult.drunkScore.toFixed(2),
        confidence: llmResult.confidence.toFixed(2),
        indicators: llmResult.indicators,
        reasoning: llmResult.reasoning,
      });
    } else {
      this.logger.warn('LLM analysis unavailable, using pattern-only');
    }

    // Calculate combined score
    const combinedScore = this.calculateCombinedScore(
      llmResult,
      patternScore,
      context
    );

    this.logger.debug('Analysis complete', {
      llmScore: llmResult.drunkScore.toFixed(2),
      patternScore: patternScore.toFixed(2),
      combinedScore: combinedScore.toFixed(2),
    });

    return {
      llmResult,
      patternResult,
      combinedScore,
    };
  }

  private buildPrompt(context: EnrichedContext): string {
    const { message, contact, recentMessages } = context;

    let prompt = `MESSAGGIO DA ANALIZZARE:
"${message.text}"

CONTESTO:
- Ora invio: ${message.hour.toString().padStart(2, '0')}:${message.minute.toString().padStart(2, '0')}
- Giorno: ${this.getDayName(message.dayOfWeek)}`;

    if (contact) {
      prompt += `
- Destinatario: ${contact.name}
- Categoria contatto: ${contact.category}`;
    }

    if (recentMessages.length > 0) {
      prompt += `\n\nULTIMI MESSAGGI INVIATI (per contesto):`;
      for (let i = 0; i < Math.min(3, recentMessages.length); i++) {
        const msg = recentMessages[i];
        const truncated =
          msg.text.length > 80 ? msg.text.substring(0, 80) + '...' : msg.text;
        prompt += `\n${i + 1}. "${truncated}"`;
      }
    }

    if (message.isLateNight) {
      prompt += `\n\nNOTA: Il messaggio e' stato inviato in tarda notte/prima mattina.`;
    }

    return prompt;
  }

  private getDayName(day: number): string {
    const days = [
      'Domenica',
      'Lunedi',
      'Martedi',
      'Mercoledi',
      'Giovedi',
      'Venerdi',
      'Sabato',
    ];
    return days[day] || 'Sconosciuto';
  }

  private calculateCombinedScore(
    llmResult: LLMAnalysisResult,
    patternScore: number,
    context: EnrichedContext
  ): number {
    const weights = this.config.get().detection.weights;
    const { message, contact } = context;

    // Base scores
    let score = 0;

    // LLM Score (40%)
    score += llmResult.drunkScore * weights.llm;

    // Pattern Score (30%)
    score += patternScore * weights.pattern;

    // Time Score (15%)
    const timeScore = message.isLateNight ? 1.0 : 0.0;
    score += timeScore * weights.time;

    // Contact Score (15%)
    const contactScore = contact ? contact.riskLevel / 10 : 0;
    score += contactScore * weights.contact;

    // Apply multipliers
    if (message.isLateNight) {
      score *= 1.2; // +20% at night
    }

    // Weekend multiplier (Fri-Sat night)
    if (
      message.isLateNight &&
      (message.dayOfWeek === 5 || message.dayOfWeek === 6)
    ) {
      score *= 1.1; // +10% on weekend nights
    }

    // Confidence adjustment
    if (llmResult.confidence < 0.5) {
      // Low confidence: rely more on pattern analysis
      score = score * 0.7 + patternScore * 0.3;
    }

    // Clamp to 0-1
    return Math.min(1, Math.max(0, score));
  }
}
