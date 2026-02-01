/**
 * OllamaProvider - Provider LLM per Ollama (locale)
 *
 * Utilizza Ollama per eseguire modelli LLM in locale.
 * Privacy totale: nessun dato lascia il dispositivo.
 */

import { Ollama } from 'ollama';
import type { ILLMProvider, LLMProviderInfo } from '../ILLMProvider.js';
import type { LLMAnalysisResult, LLMConfig, Logger } from '../../types/index.js';
import { DRUNK_ANALYSIS_SYSTEM_PROMPT } from '../SystemPrompt.js';

export class OllamaProvider implements ILLMProvider {
  readonly providerName = 'Ollama';

  private client: Ollama;
  private logger: Logger;
  private config: LLMConfig;

  constructor(logger: Logger, config: LLMConfig) {
    this.logger = logger;
    this.config = config;

    this.client = new Ollama({
      host: config.baseUrl || 'http://localhost:11434',
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const models = await this.client.list();
      const modelBase = this.config.model.split(':')[0];
      const hasModel = models.models.some((m) =>
        m.name.startsWith(modelBase)
      );

      if (!hasModel) {
        this.logger.warn(`Model ${this.config.model} not found in Ollama`, {
          available: models.models.map((m) => m.name),
        });
      }

      return hasModel;
    } catch (error) {
      this.logger.error('Ollama not available', { error });
      return false;
    }
  }

  async analyze(prompt: string): Promise<LLMAnalysisResult> {
    const timeout = this.config.timeout || 30000;

    try {
      const response = await Promise.race([
        this.client.chat({
          model: this.config.model,
          messages: [
            { role: 'system', content: DRUNK_ANALYSIS_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          format: 'json',
          options: {
            temperature: this.config.temperature ?? 0.3,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Ollama timeout')), timeout)
        ),
      ]);

      const content = response.message.content;
      return this.parseResponse(content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Ollama analysis failed', { error: errorMessage });
      return this.getDefaultResult();
    }
  }

  async getInfo(): Promise<LLMProviderInfo | null> {
    try {
      const models = await this.client.list();
      const modelBase = this.config.model.split(':')[0];
      const model = models.models.find((m) => m.name.startsWith(modelBase));

      if (model) {
        const sizeGB = (model.size / 1024 / 1024 / 1024).toFixed(1);
        return {
          providerName: this.providerName,
          model: model.name,
          isLocal: true,
          size: `${sizeGB}GB`,
        };
      }
      return null;
    } catch {
      return null;
    }
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
      this.logger.warn('Failed to parse Ollama response', { content });
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
