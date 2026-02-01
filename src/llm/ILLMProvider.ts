/**
 * ILLMProvider - Interfaccia astratta per provider LLM
 *
 * Permette di utilizzare diversi provider (Ollama, OpenAI, Anthropic)
 * in modo intercambiabile senza modificare la logica di business.
 */

import type { LLMAnalysisResult } from '../types/index.js';

/**
 * Informazioni sul provider e modello in uso
 */
export interface LLMProviderInfo {
  /** Nome del provider (es. "Ollama", "OpenAI") */
  providerName: string;
  /** Nome del modello in uso */
  model: string;
  /** Se il provider esegue in locale */
  isLocal: boolean;
  /** Dimensione del modello (se disponibile) */
  size?: string;
}

/**
 * Interfaccia che tutti i provider LLM devono implementare
 */
export interface ILLMProvider {
  /**
   * Analizza un messaggio e restituisce il risultato
   * @param prompt - Il prompt completo da inviare al modello
   * @returns Risultato dell'analisi con score e indicatori
   */
  analyze(prompt: string): Promise<LLMAnalysisResult>;

  /**
   * Verifica se il provider e' disponibile e correttamente configurato
   * @returns true se il provider e' pronto per l'uso
   */
  isAvailable(): Promise<boolean>;

  /**
   * Ottiene informazioni sul provider e modello in uso
   * @returns Info sul provider o null se non disponibile
   */
  getInfo(): Promise<LLMProviderInfo | null>;

  /**
   * Nome identificativo del provider per logging
   */
  readonly providerName: string;
}
