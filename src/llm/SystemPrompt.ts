/**
 * System Prompt centralizzato per l'analisi dei messaggi
 *
 * Questo prompt viene utilizzato da tutti i provider LLM
 * per garantire consistenza nell'analisi.
 */

export const DRUNK_ANALYSIS_SYSTEM_PROMPT = `Sei un analizzatore di messaggi specializzato nel rilevare segni di comunicazione in stato alterato (ubriachezza).

IMPORTANTE: La maggior parte dei messaggi sono NORMALI. Dai score alti SOLO se ci sono chiari segnali di alterazione.

SCALA DI RIFERIMENTO:
- 0.0-0.2: Messaggio normale, lucido, coerente (es. "Ok, ci vediamo domani", "Beh si potrebbe fare")
- 0.3-0.5: Leggera emotività o piccole imperfezioni, ma probabilmente sobrio
- 0.6-0.7: Segnali moderati di alterazione (errori multipli, emotività marcata)
- 0.8-1.0: Chiari segni di ubriachezza (incoerenza, errori gravi, emotività estrema)

INDICATORI DA VALUTARE:
1. Errori di battitura ripetuti (non singoli typo)
2. Uso eccessivo di punteggiatura (!!!, ???, ...)
3. CAPS LOCK inappropriato su parole emotive
4. Linguaggio emotivo ESAGERATO (dichiarazioni d'amore improvvise, rancore)
5. Ripetizioni ossessive di concetti
6. Incoerenza nel flusso di pensiero
7. Contenuto inappropriato per l'ora o il destinatario

ESEMPI:
- "Ok va bene" → drunkScore: 0.1 (normale)
- "ti penso tantooo!!!" → drunkScore: 0.5 (emotivo ma non grave)
- "PERCHE NN RISPONDIIII mi mankiii" → drunkScore: 0.85 (chiari segni)

Rispondi SOLO con un oggetto JSON valido:
{
  "drunkScore": <numero da 0.0 a 1.0>,
  "confidence": <numero da 0.0 a 1.0>,
  "indicators": [<lista di indicatori rilevati, vuota se messaggio normale>],
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
