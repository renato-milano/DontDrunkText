/**
 * System Prompt centralizzato per l'analisi dei messaggi
 *
 * Questo prompt viene utilizzato da tutti i provider LLM
 * per garantire consistenza nell'analisi.
 */

export const DRUNK_ANALYSIS_SYSTEM_PROMPT = `Sei un analizzatore di messaggi specializzato nel rilevare segni di comunicazione in stato alterato (ubriachezza).

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

/**
 * Crea il prompt utente con il contesto del messaggio
 */
export function buildUserPrompt(
  messageText: string,
  context: {
    hour: number;
    minute: number;
    dayOfWeek: number;
    contactName?: string;
    contactCategory?: string;
    isLateNight: boolean;
    recentMessages?: string[];
  }
): string {
  const dayNames = [
    'Domenica',
    'Lunedi',
    'Martedi',
    'Mercoledi',
    'Giovedi',
    'Venerdi',
    'Sabato',
  ];

  let prompt = `MESSAGGIO DA ANALIZZARE:
"${messageText}"

CONTESTO:
- Ora invio: ${context.hour.toString().padStart(2, '0')}:${context.minute.toString().padStart(2, '0')}
- Giorno: ${dayNames[context.dayOfWeek] || 'Sconosciuto'}`;

  if (context.contactName) {
    prompt += `
- Destinatario: ${context.contactName}`;
  }

  if (context.contactCategory) {
    prompt += `
- Categoria contatto: ${context.contactCategory}`;
  }

  if (context.recentMessages && context.recentMessages.length > 0) {
    prompt += `\n\nULTIMI MESSAGGI INVIATI (per contesto):`;
    for (let i = 0; i < Math.min(3, context.recentMessages.length); i++) {
      const msg = context.recentMessages[i];
      const truncated = msg.length > 80 ? msg.substring(0, 80) + '...' : msg;
      prompt += `\n${i + 1}. "${truncated}"`;
    }
  }

  if (context.isLateNight) {
    prompt += `\n\nNOTA: Il messaggio e' stato inviato in tarda notte/prima mattina.`;
  }

  return prompt;
}
