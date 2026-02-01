/**
 * LLM Module - Export barrel
 */

// Interfaccia
export type { ILLMProvider, LLMProviderInfo } from './ILLMProvider.js';

// Factory e utilities
export {
  createLLMProvider,
  getAvailableProviders,
  providerRequiresApiKey,
  getDefaultModel,
  RECOMMENDED_MODELS,
  PROVIDER_INFO,
} from './LLMProviderFactory.js';

// Prompt
export { DRUNK_ANALYSIS_SYSTEM_PROMPT, buildUserPrompt } from './SystemPrompt.js';

// Provider (per uso diretto se necessario)
export { OllamaProvider } from './providers/OllamaProvider.js';
export { OpenAIProvider } from './providers/OpenAIProvider.js';
export { AnthropicProvider } from './providers/AnthropicProvider.js';
