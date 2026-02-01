import { Ollama } from 'ollama';
import type { LLMAnalysisResult, Logger } from '../types/index.js';
import { ConfigManager } from '../config/ConfigManager.js';

const SYSTEM_PROMPT = `Sei un analizzatore di messaggi specializzato nel rilevare segni di comunicazione in stato alterato (ubriachezza).

Analizza il messaggio fornito e valuta questi indicatori:
1. Errori di battitura e grammaticali
2. Uso eccessivo di punteggiatura (!!!, ???, ...)
3. CAPS LOCK inappropriato
4. Linguaggio emotivo esagerato
5. Ripetizioni di concetti o parole
6. Incoerenza del flusso di pensiero
7. Contenuto inappropriato per l'ora

Rispondi SOLO con un oggetto JSON valido, senza altro testo:
{
  "drunkScore": <numero da 0.0 a 1.0>,
  "confidence": <numero da 0.0 a 1.0>,
  "indicators": [<lista di indicatori rilevati>],
  "reasoning": "<breve spiegazione in italiano>"
}

Indicatori validi: "typos_detected", "emotional_language", "repetitive_content", "excessive_punctuation", "caps_lock_abuse", "incoherent_flow", "late_night_timing"`;

export class OllamaClient {
  private client: Ollama;
  private logger: Logger;
  private config: ConfigManager;
  private model: string;

  constructor(logger: Logger, config: ConfigManager) {
    this.logger = logger;
    this.config = config;

    const cfg = config.get().ollama;
    this.model = cfg.model;

    this.client = new Ollama({
      host: cfg.baseUrl,
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const models = await this.client.list();
      const hasModel = models.models.some((m) => m.name.startsWith(this.model.split(':')[0]));

      if (!hasModel) {
        this.logger.warn(`Model ${this.model} not found. Available models:`, {
          models: models.models.map((m) => m.name),
        });
      }

      return hasModel;
    } catch (error) {
      this.logger.error('Ollama not available', { error });
      return false;
    }
  }

  async analyze(prompt: string): Promise<LLMAnalysisResult> {
    const timeout = this.config.get().ollama.timeout;

    try {
      const response = await Promise.race([
        this.client.chat({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          format: 'json',
          options: {
            temperature: 0.3, // Low temperature for consistent results
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Ollama timeout')), timeout)
        ),
      ]);

      const content = response.message.content;
      return this.parseResponse(content);
    } catch (error) {
      this.logger.error('Ollama analysis failed', { error });
      return this.getDefaultResult();
    }
  }

  private parseResponse(content: string): LLMAnalysisResult {
    try {
      const parsed = JSON.parse(content);

      // Validate and sanitize
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

  async getModelInfo(): Promise<{ name: string; size: string } | null> {
    try {
      const models = await this.client.list();
      const model = models.models.find((m) => m.name.startsWith(this.model.split(':')[0]));

      if (model) {
        const sizeGB = (model.size / 1024 / 1024 / 1024).toFixed(1);
        return { name: model.name, size: `${sizeGB}GB` };
      }
      return null;
    } catch {
      return null;
    }
  }
}
