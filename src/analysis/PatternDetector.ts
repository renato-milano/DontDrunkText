import type { PatternAnalysis, Logger } from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';

// Common Italian typos and misspellings patterns
const TYPO_PATTERNS = [
  /(.)\1{3,}/g, // Same letter repeated 4+ times (ciaoooo)
  /\b(nn|xke|xche|cmq|cn|sn|tt|qnd|qst|anke|ke)\b/gi, // SMS abbreviations
  /[bcdfghjklmnpqrstvwxz]{4,}/gi, // 4+ consonants in a row (unusual)
];

export class PatternDetector {
  private logger: Logger;
  private config: ConfigManager;

  constructor(logger: Logger, config: ConfigManager) {
    this.logger = logger;
    this.config = config;
  }

  analyze(text: string): PatternAnalysis {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const chars = text.length;

    if (chars === 0) {
      return this.getEmptyResult();
    }

    return {
      typoRatio: this.calculateTypoRatio(text, words),
      repetitionScore: this.calculateRepetitionScore(words),
      capsRatio: this.calculateCapsRatio(text),
      punctuationAnomaly: this.detectPunctuationAnomaly(text),
      emotionalScore: this.calculateEmotionalScore(text),
      messageLength: this.categorizeLength(chars),
    };
  }

  private calculateTypoRatio(text: string, words: string[]): number {
    if (words.length === 0) return 0;

    let typoCount = 0;

    // Check each pattern
    for (const pattern of TYPO_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        typoCount += matches.length;
      }
    }

    // Check for letter repetitions in words (e.g., "amoreeee")
    for (const word of words) {
      if (/(.)\1{2,}/.test(word)) {
        typoCount++;
      }
    }

    return Math.min(1, typoCount / words.length);
  }

  private calculateRepetitionScore(words: string[]): number {
    if (words.length < 3) return 0;

    const wordCounts = new Map<string, number>();
    const lowerWords = words.map((w) => w.toLowerCase());

    for (const word of lowerWords) {
      if (word.length > 2) {
        // Ignore short words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Count words that appear more than once
    let repeatedWords = 0;
    for (const count of wordCounts.values()) {
      if (count > 1) {
        repeatedWords += count - 1;
      }
    }

    return Math.min(1, repeatedWords / words.length);
  }

  private calculateCapsRatio(text: string): number {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return 0;

    const capsCount = (text.match(/[A-Z]/g) || []).length;
    return capsCount / letters.length;
  }

  private detectPunctuationAnomaly(text: string): boolean {
    // Multiple exclamation/question marks
    if (/[!?]{3,}/.test(text)) return true;

    // Excessive dots
    if (/\.{4,}/.test(text)) return true;

    // Mixed punctuation abuse
    if (/[!?]{2,}[!?]{2,}/.test(text)) return true;

    return false;
  }

  private calculateEmotionalScore(text: string): number {
    const keywords = this.config.get().detection.emotionalKeywords;
    const lowerText = text.toLowerCase();

    let matchCount = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // Normalize: 3+ keywords = max score
    return Math.min(1, matchCount / 3);
  }

  private categorizeLength(chars: number): 'short' | 'normal' | 'long' | 'excessive' {
    if (chars < 20) return 'short';
    if (chars < 150) return 'normal';
    if (chars < 500) return 'long';
    return 'excessive';
  }

  private getEmptyResult(): PatternAnalysis {
    return {
      typoRatio: 0,
      repetitionScore: 0,
      capsRatio: 0,
      punctuationAnomaly: false,
      emotionalScore: 0,
      messageLength: 'short',
    };
  }

  // Convert pattern analysis to a single score (0-1)
  toScore(analysis: PatternAnalysis): number {
    let score = 0;

    // Typos: high weight
    score += analysis.typoRatio * 0.3;

    // Repetitions
    score += analysis.repetitionScore * 0.15;

    // Caps (only if > 50% is concerning)
    if (analysis.capsRatio > 0.5) {
      score += (analysis.capsRatio - 0.5) * 0.4;
    }

    // Punctuation anomaly
    if (analysis.punctuationAnomaly) {
      score += 0.15;
    }

    // Emotional keywords
    score += analysis.emotionalScore * 0.25;

    // Long messages at night are suspicious
    if (analysis.messageLength === 'excessive') {
      score += 0.1;
    }

    return Math.min(1, score);
  }
}
