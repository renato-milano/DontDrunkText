/**
 * OpenAIProvider - Provider LLM per OpenAI API
 *
 * Supporta GPT-4o-mini, GPT-4o, GPT-4-turbo e altri modelli OpenAI.
 * Richiede API key.
 */

import type { ILLMProvider, LLMProviderInfo } from '../ILLMProvider.js';
import type { LLMAnalysisResult, LLMConfig, Logger } from '../../types/index.js';
import { DRUNK_ANALYSIS_SYSTEM_PROMPT } from '../SystemPrompt.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
  usage?: {
    total_tokens: number;
  };
}

export class OpenAIProvider implements ILLMProvider {
  readonly providerName = 'OpenAI';

  private logger: Logger;
  private config: LLMConfig;
  private baseUrl: string;

  constructor(logger: Logger, config: LLMConfig) {
    this.logger = logger;
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      this.logger.warn('OpenAI API key not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        this.logger.warn('OpenAI API not accessible', {
          status: response.status,
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('OpenAI availability check failed', { error });
      return false;
    }
  }

  async analyze(prompt: string): Promise<LLMAnalysisResult> {
    if (!this.config.apiKey) {
      this.logger.error('OpenAI API key not configured');
      return this.getDefaultResult();
    }

    const timeout = this.config.timeout || 30000;

    try {
      const messages: OpenAIMessage[] = [
        { role: 'system', content: DRUNK_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature ?? 0.3,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('OpenAI API error', { status: response.status, error });
        return this.getDefaultResult();
      }

      const data = (await response.json()) as OpenAIResponse;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        this.logger.warn('OpenAI returned empty response');
        return this.getDefaultResult();
      }

      return this.parseResponse(content);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('OpenAI request timeout');
      } else {
        this.logger.error('OpenAI analysis failed', { error });
      }
      return this.getDefaultResult();
    }
  }

  async getInfo(): Promise<LLMProviderInfo | null> {
    return {
      providerName: this.providerName,
      model: this.config.model,
      isLocal: false,
    };
  }

  private parseResponse(content: string): LLMAnalysisResult {
    try {
      const parsed = JSON.parse(content);

      return {
        drunkScore: this.clamp(parsed.drunkScore || 0, 0, 1),
        confidence: this.clamp(parsed.confidence || 0.5, 0, 1),
        indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
        reasoning: parsed.reasoning || 'Nessuna spiegazione disponibile',
      };
    } catch (error) {
      this.logger.warn('Failed to parse OpenAI response', { content });
      return this.getDefaultResult();
    }
  }

  private getDefaultResult(): LLMAnalysisResult {
    return {
      drunkScore: 0,
      confidence: 0,
      indicators: [],
      reasoning: 'Analisi non disponibile',
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
