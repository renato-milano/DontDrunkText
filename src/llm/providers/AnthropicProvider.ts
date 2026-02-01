/**
 * AnthropicProvider - Provider LLM per Anthropic API (Claude)
 *
 * Supporta Claude 3.5 Sonnet, Claude 3 Haiku e altri modelli Anthropic.
 * Ottimo per analisi in italiano.
 * Richiede API key.
 */

import type { ILLMProvider, LLMProviderInfo } from '../ILLMProvider.js';
import type { LLMAnalysisResult, LLMConfig, Logger } from '../../types/index.js';
import { DRUNK_ANALYSIS_SYSTEM_PROMPT } from '../SystemPrompt.js';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider implements ILLMProvider {
  readonly providerName = 'Anthropic';

  private logger: Logger;
  private config: LLMConfig;
  private baseUrl: string;

  constructor(logger: Logger, config: LLMConfig) {
    this.logger = logger;
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      this.logger.warn('Anthropic API key not configured');
      return false;
    }

    // Anthropic non ha un endpoint /models pubblico, verifichiamo con una richiesta minimale
    try {
      // Facciamo un check base verificando che l'API key abbia un formato valido
      if (!this.config.apiKey.startsWith('sk-ant-')) {
        this.logger.warn('Anthropic API key format appears invalid');
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error('Anthropic availability check failed', { error });
      return false;
    }
  }

  async analyze(prompt: string): Promise<LLMAnalysisResult> {
    if (!this.config.apiKey) {
      this.logger.error('Anthropic API key not configured');
      return this.getDefaultResult();
    }

    const timeout = this.config.timeout || 30000;

    try {
      const messages: AnthropicMessage[] = [
        { role: 'user', content: prompt },
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 1024,
          system: DRUNK_ANALYSIS_SYSTEM_PROMPT + '\n\nRispondi SOLO con JSON valido.',
          messages,
          temperature: this.config.temperature ?? 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Anthropic API error', { status: response.status, error });
        return this.getDefaultResult();
      }

      const data = (await response.json()) as AnthropicResponse;
      const content = data.content[0]?.text;

      if (!content) {
        this.logger.warn('Anthropic returned empty response');
        return this.getDefaultResult();
      }

      return this.parseResponse(content);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('Anthropic request timeout');
      } else {
        this.logger.error('Anthropic analysis failed', { error });
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
      // Claude potrebbe aggiungere testo prima/dopo il JSON, estraiamolo
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON found in Anthropic response', { content });
        return this.getDefaultResult();
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        drunkScore: this.clamp(parsed.drunkScore || 0, 0, 1),
        confidence: this.clamp(parsed.confidence || 0.5, 0, 1),
        indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
        reasoning: parsed.reasoning || 'Nessuna spiegazione disponibile',
      };
    } catch (error) {
      this.logger.warn('Failed to parse Anthropic response', { content });
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
