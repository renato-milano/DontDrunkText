import type {
  AnalysisResult,
  EnrichedContext,
  RiskAssessment,
  AlertLevel,
  DrunkIndicator,
  Logger,
} from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';

export class RiskCalculator {
  private logger: Logger;
  private config: ConfigManager;

  constructor(logger: Logger, config: ConfigManager) {
    this.logger = logger;
    this.config = config;
  }

  calculate(
    analysis: AnalysisResult,
    context: EnrichedContext
  ): RiskAssessment {
    const { llmResult, patternResult, combinedScore } = analysis;
    const weights = this.config.get().detection.weights;

    // Calculate breakdown
    const breakdown = {
      llmScore: llmResult.drunkScore * weights.llm,
      patternScore:
        this.patternToScore(patternResult) * weights.pattern,
      timeScore: (context.message.isLateNight ? 1 : 0) * weights.time,
      contactScore:
        (context.contact?.riskLevel || 0) / 10 * weights.contact,
    };

    // Collect all indicators
    const indicators = this.collectIndicators(analysis, context);

    // Determine alert level
    const alertLevel = this.determineAlertLevel(combinedScore);

    // Should we alert?
    const minScore = this.config.getMinScoreForSensitivity();
    const shouldAlert = combinedScore >= minScore && alertLevel !== 'none';

    return {
      overallScore: combinedScore,
      breakdown,
      shouldAlert,
      alertLevel,
      indicators,
    };
  }

  private patternToScore(pattern: AnalysisResult['patternResult']): number {
    let score = 0;
    score += pattern.typoRatio * 0.3;
    score += pattern.repetitionScore * 0.2;
    score += pattern.capsRatio > 0.5 ? 0.2 : 0;
    score += pattern.punctuationAnomaly ? 0.15 : 0;
    score += pattern.emotionalScore * 0.15;
    return Math.min(1, score);
  }

  private collectIndicators(
    analysis: AnalysisResult,
    context: EnrichedContext
  ): DrunkIndicator[] {
    const indicators: DrunkIndicator[] = [];

    // From LLM
    indicators.push(...analysis.llmResult.indicators);

    // From pattern analysis
    const pattern = analysis.patternResult;

    if (pattern.typoRatio > 0.1 && !indicators.includes('typos_detected')) {
      indicators.push('typos_detected');
    }

    if (pattern.punctuationAnomaly && !indicators.includes('excessive_punctuation')) {
      indicators.push('excessive_punctuation');
    }

    if (pattern.capsRatio > 0.5 && !indicators.includes('caps_lock_abuse')) {
      indicators.push('caps_lock_abuse');
    }

    if (pattern.emotionalScore > 0.3 && !indicators.includes('emotional_language')) {
      indicators.push('emotional_language');
    }

    if (pattern.repetitionScore > 0.2 && !indicators.includes('repetitive_content')) {
      indicators.push('repetitive_content');
    }

    // From context
    if (context.message.isLateNight && !indicators.includes('late_night_timing')) {
      indicators.push('late_night_timing');
    }

    if (context.isDangerousContact && !indicators.includes('dangerous_recipient')) {
      indicators.push('dangerous_recipient');
    }

    // Remove duplicates
    return [...new Set(indicators)];
  }

  private determineAlertLevel(score: number): AlertLevel {
    if (score >= 0.9) return 'critical';
    if (score >= 0.75) return 'high';
    if (score >= 0.6) return 'medium';
    if (score >= 0.4) return 'low';
    return 'none';
  }
}
