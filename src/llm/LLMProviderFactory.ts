/**
 * LLMProviderFactory - Factory per creare il provider LLM appropriato
 *
 * Istanzia il provider corretto in base alla configurazione.
 */

import type { ILLMProvider } from './ILLMProvider.js';
import type { LLMConfig, LLMProviderType, Logger } from '../types/index.js';
import { OllamaProvider } from './providers/OllamaProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js';

/**
 * Modelli consigliati per ogni provider
 */
export const RECOMMENDED_MODELS: Record<LLMProviderType, Array<{ id: string; name: string; size: string; recommended?: boolean }>> = {
  ollama: [
    { id: 'llama3.2:3b', name: 'Llama 3.2 3B', size: '2GB', recommended: true },
    { id: 'llama3.2:1b', name: 'Llama 3.2 1B', size: '1.3GB' },
    { id: 'qwen3:4b', name: 'Qwen 3 4B', size: '2.6GB' },
    { id: 'qwen3:8b', name: 'Qwen 3 8B', size: '5GB' },
    { id: 'phi4-mini', name: 'Phi-4 Mini', size: '2.5GB' },
    { id: 'gemma3:4b', name: 'Gemma 3 4B', size: '3GB' },
    { id: 'functionary:7b', name: 'Functionary 7B (function calling)', size: '4GB' },
    { id: 'mistral:7b', name: 'Mistral 7B', size: '4GB' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', size: 'cloud', recommended: true },
    { id: 'gpt-4o', name: 'GPT-4o', size: 'cloud' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', size: 'cloud' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', size: 'cloud' },
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', size: 'cloud', recommended: true },
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', size: 'cloud' },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', size: 'cloud' },
  ],
};

/**
 * Informazioni sui provider disponibili
 */
export const PROVIDER_INFO: Record<LLMProviderType, { name: string; description: string; isLocal: boolean; requiresApiKey: boolean }> = {
  ollama: {
    name: 'Ollama',
    description: 'LLM locale - Privacy totale, gratuito',
    isLocal: true,
    requiresApiKey: false,
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-4 e altri - Veloce e affidabile',
    isLocal: false,
    requiresApiKey: true,
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude - Ottimo per italiano',
    isLocal: false,
    requiresApiKey: true,
  },
};

/**
 * Crea un'istanza del provider LLM appropriato
 *
 * @param logger - Logger per il provider
 * @param config - Configurazione LLM
 * @returns Istanza del provider
 * @throws Error se il provider non e' supportato
 */
export function createLLMProvider(logger: Logger, config: LLMConfig): ILLMProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(logger, config);

    case 'openai':
      return new OpenAIProvider(logger, config);

    case 'anthropic':
      return new AnthropicProvider(logger, config);

    default:
      throw new Error(`Provider LLM non supportato: ${config.provider}`);
  }
}

/**
 * Ottiene la lista dei provider disponibili
 */
export function getAvailableProviders(): LLMProviderType[] {
  return ['ollama', 'openai', 'anthropic'];
}

/**
 * Verifica se un provider richiede API key
 */
export function providerRequiresApiKey(provider: LLMProviderType): boolean {
  return PROVIDER_INFO[provider]?.requiresApiKey ?? false;
}

/**
 * Ottiene il modello di default per un provider
 */
export function getDefaultModel(provider: LLMProviderType): string {
  const models = RECOMMENDED_MODELS[provider];
  const recommended = models?.find((m) => m.recommended);
  return recommended?.id || models?.[0]?.id || 'unknown';
}
