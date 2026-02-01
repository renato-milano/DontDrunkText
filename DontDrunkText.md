# DontDrunkText - Specifica Tecnica Completa

> **Sistema di Monitoraggio Intelligente per Prevenire Messaggi Inviati in Stato Alterato**
> Versione: 1.0.0
> Data: Febbraio 2026

---

## Indice

1. [Overview e Obiettivi](#1-overview-e-obiettivi)
2. [Architettura di Sistema](#2-architettura-di-sistema)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Struttura Directory](#4-struttura-directory)
5. [Flusso Dati Completo](#5-flusso-dati-completo)
6. [Moduli e Componenti](#6-moduli-e-componenti)
7. [Schema Configurazione](#7-schema-configurazione)
8. [Integrazione Ollama](#8-integrazione-ollama)
9. [Algoritmo di Rilevamento](#9-algoritmo-di-rilevamento)
10. [Sistema di Avvisi](#10-sistema-di-avvisi)
11. [Setup e Utilizzo](#11-setup-e-utilizzo)
12. [Sicurezza e Privacy](#12-sicurezza-e-privacy)
13. [Interfacce TypeScript](#13-interfacce-typescript)
14. [Testing Strategy](#14-testing-strategy)

---

## 1. Overview e Obiettivi

### 1.1 Executive Summary

**DontDrunkText** e' un'applicazione di monitoraggio intelligente progettata per proteggere gli utenti da comunicazioni potenzialmente imbarazzanti o dannose inviate in stato di alterazione. Il sistema intercetta i messaggi WhatsApp in uscita dell'utente, li analizza tramite un Large Language Model (LLM) eseguito **localmente con Ollama**, e fornisce avvisi in tempo reale quando rileva pattern comportamentali riconducibili a uno stato di ebbrezza.

### 1.2 Problem Statement

Le comunicazioni digitali inviate in stato di alterazione rappresentano una fonte significativa di:

- **Danni relazionali**: messaggi inappropriati a ex-partner, interessi romantici, familiari
- **Rischi professionali**: comunicazioni improprie verso superiori o colleghi
- **Imbarazzo sociale**: condivisione eccessiva di emozioni o informazioni personali

La natura istantanea e permanente della messaggistica moderna amplifica questi rischi.

### 1.3 Obiettivi di Progetto

| ID | Obiettivo | Priorita | Metrica di Successo |
|----|-----------|----------|---------------------|
| O1 | **Privacy totale dei dati** | CRITICA | Zero dati trasmessi a servizi esterni |
| O2 | Rilevamento accurato | ALTA | Precision >= 85%, Recall >= 75% |
| O3 | Latenza minima | ALTA | Analisi completata in < 3 secondi |
| O4 | Facilita di configurazione | MEDIA | Setup iniziale < 10 minuti |
| O5 | Basso consumo risorse | MEDIA | RAM < 500MB (escluso modello LLM) |
| O6 | Affidabilita 24/7 | ALTA | Uptime >= 99% in orari monitorati |

### 1.4 Principi Architetturali

1. **Privacy by Design**: Ogni decisione architettuale privilegia la privacy. Nessun dato lascia il dispositivo dell'utente.

2. **Fail-Safe**: In caso di errore del sistema, il comportamento predefinito e' NON bloccare i messaggi (l'utente mantiene sempre il controllo).

3. **Separation of Concerns**: Ogni componente ha una responsabilita unica e ben definita.

4. **Configurabilita**: L'utente ha controllo totale su cosa monitorare, quando, e con quale sensibilita.

5. **Local-First**: LLM locale con Ollama, nessuna dipendenza da servizi cloud.

---

## 2. Architettura di Sistema

### 2.1 Diagramma Architetturale di Alto Livello

```
+------------------------------------------------------------------+
|                     DONT DRUNK TEXT SYSTEM                        |
|                        (100% LOCALE)                              |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------+     +-----------------------------+   |
|  |                        |     |                             |   |
|  |   WHATSAPP GATEWAY     |     |      ANALYSIS ENGINE        |   |
|  |   (Baileys Client)     |     |                             |   |
|  |                        |     |  +----------------------+   |   |
|  |  +------------------+  |     |  |                      |   |   |
|  |  | Connection Mgr   |  |     |  |   Ollama LLM Client  |   |   |
|  |  +------------------+  |     |  |   (Local Inference)  |   |   |
|  |  | Message          |  |     |  |   localhost:11434    |   |   |
|  |  | Interceptor      |------->|  +----------------------+   |   |
|  |  +------------------+  |     |            |                |   |
|  |  | QR Auth Handler  |  |     |            v                |   |
|  |  +------------------+  |     |  +----------------------+   |   |
|  |                        |     |  |                      |   |   |
|  +------------------------+     |  |  Drunk Detector      |   |   |
|            ^                    |  |  (Pattern Analyzer)  |   |   |
|            |                    |  |                      |   |   |
|            |                    |  +----------------------+   |   |
|            |                    |            |                |   |
|            |                    +-----------------------------+   |
|            |                                 |                    |
|            |                                 v                    |
|  +------------------------+     +-----------------------------+   |
|  |                        |     |                             |   |
|  |   NOTIFICATION         |<----|      DECISION ENGINE        |   |
|  |   SERVICE              |     |                             |   |
|  |                        |     |  +----------------------+   |   |
|  |  +------------------+  |     |  | Risk Calculator      |   |   |
|  |  | WhatsApp Self-   |  |     |  +----------------------+   |   |
|  |  | Message Sender   |  |     |  | Time Window Checker  |   |   |
|  |  +------------------+  |     |  +----------------------+   |   |
|  |  | Alert Formatter  |  |     |  | Contact Risk Mapper  |   |   |
|  |  +------------------+  |     |  +----------------------+   |   |
|  |                        |     |  | Threshold Evaluator  |   |   |
|  +------------------------+     |  +----------------------+   |   |
|                                 |                             |   |
|                                 +-----------------------------+   |
|                                              |                    |
|                                              v                    |
|                                 +-----------------------------+   |
|                                 |    CONFIGURATION LAYER      |   |
|                                 |  - Config Manager           |   |
|                                 |  - Contact Registry         |   |
|                                 |  - Schedule Manager         |   |
|                                 +-----------------------------+   |
+------------------------------------------------------------------+
```

### 2.2 Diagramma di Sequenza - Flusso Principale

```
    Utente          WhatsApp         Baileys          Analyzer          Decision          Notifier
      |                |                |                 |                 |                |
      |  Invia msg     |                |                 |                 |                |
      |--------------->|                |                 |                 |                |
      |                |  WebSocket     |                 |                 |                |
      |                |--------------->|                 |                 |                |
      |                |                |  messages.upsert|                 |                |
      |                |                |  (fromMe=true)  |                 |                |
      |                |                |---------------->|                 |                |
      |                |                |                 |                 |                |
      |                |                |                 | Chiama Ollama   |                |
      |                |                |                 | (localhost)     |                |
      |                |                |                 |---------------->|                |
      |                |                |                 |<----------------|                |
      |                |                |                 |                 |                |
      |                |                |                 | Calcola Risk    |                |
      |                |                |                 |---------------->|                |
      |                |                |                 |                 |                |
      |                |                |                 |                 | [Se >= soglia] |
      |                |                |                 |                 |--------------->|
      |                |                |                 |                 |                |
      |<---------------|-----------------|-----------------|-----------------|----------------|
      |   Self-message "Attenzione!"    |                 |                 |                |
      |                |                |                 |                 |                |
```

### 2.3 Architettura delle Dipendenze

```
                            +------------------+
                            |     App.ts       |
                            |  (Composition    |
                            |     Root)        |
                            +--------+---------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+------------------+       +------------------+       +------------------+
| WhatsAppService  |       | AnalysisService  |       | DecisionService  |
+--------+---------+       +--------+---------+       +--------+---------+
         |                          |                          |
         v                          v                          v
+------------------+       +------------------+       +------------------+
| IBaileysClient   |       | IOllamaClient    |       | IConfigProvider  |
| (interface)      |       | (interface)      |       | (interface)      |
+--------+---------+       +--------+---------+       +--------+---------+
         |                          |                          |
         v                          v                          v
+------------------+       +------------------+       +------------------+
| BaileysClient    |       | OllamaClient     |       | ConfigManager    |
| (concrete)       |       | (concrete)       |       | (concrete)       |
+------------------+       +------------------+       +------------------+
```

---

## 3. Stack Tecnologico

### 3.1 Runtime e Linguaggio

| Componente | Tecnologia | Versione | Motivazione |
|------------|------------|----------|-------------|
| Runtime | Node.js | >= 20.x LTS | ES modules nativi, performance |
| Linguaggio | TypeScript | >= 5.3 | Type safety, refactoring sicuro |
| Package Manager | pnpm | >= 8.x | Velocita, efficienza disco |

### 3.2 Dipendenze Core

| Layer | Package | Versione | Funzione |
|-------|---------|----------|----------|
| **WhatsApp** | @whiskeysockets/baileys | ^6.7.x | Client WhatsApp Web |
| **WhatsApp** | qrcode-terminal | ^0.12 | QR code display CLI |
| **LLM** | ollama | ^0.5.x | Client Ollama ufficiale |
| **Persistence** | better-sqlite3 | ^11.x | SQLite driver |
| **Validation** | zod | ^3.23 | Schema validation |
| **Logging** | pino | ^9.x | Logging strutturato |
| **Date** | date-fns | ^3.x | Date manipulation |

### 3.3 Dev Dependencies

| Tool | Versione | Funzione |
|------|----------|----------|
| typescript | ^5.3 | Compilatore |
| tsx | ^4.x | TS executor (dev) |
| vitest | ^1.x | Test runner |
| eslint | ^8.x | Linting |
| prettier | ^3.x | Formatting |

### 3.4 Modelli LLM Raccomandati

| Modello | RAM | Latenza | Qualita | Use Case |
|---------|-----|---------|---------|----------|
| **llama3.2:3b** | ~4GB | 0.5-2s | Eccellente | Raccomandato |
| mistral:7b | ~8GB | 1-3s | Ottima | Alte performance |
| phi3:mini | ~2.5GB | 0.3-1s | Buona | Risorse limitate |
| gemma2:2b | ~3GB | 0.5-1.5s | Buona | Alternativa leggera |

---

## 4. Struttura Directory

```
dontdrunktext/
|
+-- src/
|   +-- index.ts                      # Entry point
|   |
|   +-- core/
|   |   +-- App.ts                    # Application orchestrator
|   |   +-- EventBus.ts               # Internal pub/sub
|   |   +-- Logger.ts                 # Pino wrapper
|   |
|   +-- whatsapp/
|   |   +-- BaileysClient.ts          # Baileys wrapper
|   |   +-- MessageInterceptor.ts     # Filtro messaggi outbound
|   |   +-- NotificationSender.ts     # Invio self-messages
|   |   +-- SessionManager.ts         # Gestione auth/session
|   |
|   +-- analysis/
|   |   +-- OllamaClient.ts           # Client HTTP per Ollama
|   |   +-- DrunkAnalyzer.ts          # Coordinatore analisi
|   |   +-- PatternDetector.ts        # Analisi pattern locali
|   |   +-- prompts/
|   |       +-- drunk-detection.ts    # Template prompt LLM
|   |
|   +-- decision/
|   |   +-- RiskCalculator.ts         # Calcolo score finale
|   |   +-- TimeWindowChecker.ts      # Verifica fasce orarie
|   |   +-- ContactRiskMapper.ts      # Mappatura rischio contatti
|   |
|   +-- config/
|   |   +-- ConfigManager.ts          # Gestione configurazione
|   |   +-- schema.ts                 # Zod schemas
|   |   +-- defaults.ts               # Valori default
|   |
|   +-- types/
|       +-- index.ts                  # Type definitions
|       +-- messages.ts               # Message types
|       +-- analysis.ts               # Analysis types
|       +-- config.ts                 # Config types
|
+-- data/                             # Runtime data (gitignored)
|   +-- auth/                         # WhatsApp session
|   +-- database.sqlite               # SQLite database
|   +-- logs/                         # Log files
|
+-- config.json                       # Configurazione utente
+-- package.json
+-- tsconfig.json
+-- README.md
```

---

## 5. Flusso Dati Completo

### 5.1 Message Ingestion

```typescript
// Evento Baileys: messages.upsert
{
  key: {
    remoteJid: "39xxx@s.whatsapp.net",
    fromMe: true,        // <-- FILTRO CHIAVE
    id: "ABCD1234"
  },
  message: {
    conversation: "testo messaggio"
  },
  messageTimestamp: 1706745600
}
```

### 5.2 Message Normalization

```typescript
interface NormalizedMessage {
  id: string;
  text: string;
  recipientJid: string;
  recipientName: string | null;
  timestamp: Date;
  hour: number;           // 0-23
  isLateNight: boolean;   // 21:00-06:00
}
```

### 5.3 Context Enrichment

```typescript
interface EnrichedContext {
  message: NormalizedMessage;
  contact: {
    jid: string;
    name: string;
    category: 'ex' | 'crush' | 'boss' | 'family' | 'custom';
    riskLevel: number;    // 1-10
  } | null;
  recentMessages: Message[];  // ultimi 5
  isMonitoringActive: boolean;
}
```

### 5.4 LLM Analysis Result

```typescript
interface LLMAnalysisResult {
  drunkScore: number;      // 0.0 - 1.0
  confidence: number;      // 0.0 - 1.0
  indicators: DrunkIndicator[];
  reasoning: string;
}

type DrunkIndicator =
  | 'typos_detected'
  | 'emotional_language'
  | 'repetitive_content'
  | 'excessive_punctuation'
  | 'caps_lock_abuse'
  | 'incoherent_flow'
  | 'late_night_timing'
  | 'dangerous_recipient';
```

### 5.5 Risk Assessment

```typescript
interface RiskAssessment {
  overallScore: number;
  breakdown: {
    llmScore: number;       // peso 40%
    patternScore: number;   // peso 30%
    timeScore: number;      // peso 15%
    contactScore: number;   // peso 15%
  };
  shouldAlert: boolean;
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## 6. Moduli e Componenti

### 6.1 WhatsApp Module

**BaileysClient.ts** - Wrapper per la connessione WhatsApp

Responsabilita:
- Gestione connessione WebSocket
- Autenticazione QR code
- Reconnection automatica
- Emissione eventi messaggi

**MessageInterceptor.ts** - Filtro messaggi outbound

Responsabilita:
- Filtrare solo messaggi con `fromMe === true`
- Estrarre testo e metadata
- Normalizzare struttura messaggio
- Emettere eventi per analisi

**NotificationSender.ts** - Invio avvisi

Responsabilita:
- Inviare self-message all'utente
- Formattare messaggi di alert
- Gestire throttling

### 6.2 Analysis Module

**OllamaClient.ts** - Client LLM locale

Responsabilita:
- Comunicazione HTTP con Ollama (localhost:11434)
- Gestione prompt
- Parsing risposta JSON
- Retry e error handling

**DrunkAnalyzer.ts** - Coordinatore analisi

Responsabilita:
- Orchestrare analisi LLM + pattern
- Aggregare risultati
- Calcolare score combinato

**PatternDetector.ts** - Analisi pattern locali

Responsabilita:
- Rilevamento errori battitura
- Analisi ripetizioni
- Conteggio CAPS
- Anomalie punteggiatura

### 6.3 Decision Module

**RiskCalculator.ts** - Calcolo rischio finale

Responsabilita:
- Weighted scoring dei fattori
- Applicazione soglie
- Determinazione livello alert

**TimeWindowChecker.ts** - Verifica fasce orarie

Responsabilita:
- Verificare se ora corrente e' in fascia monitorata
- Gestione timezone
- Moltiplicatori notturni

**ContactRiskMapper.ts** - Rischio contatti

Responsabilita:
- Mappare JID -> livello rischio
- Gestire categorie contatti
- Lookup configurazione

---

## 7. Schema Configurazione

### 7.1 File config.json Completo

```json
{
  "ollama": {
    "model": "llama3.2:3b",
    "baseUrl": "http://localhost:11434",
    "timeout": 30000,
    "retries": 2
  },

  "monitoring": {
    "enabled": true,
    "startHour": 21,
    "endHour": 6,
    "timezone": "Europe/Rome",
    "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
    "alwaysMonitorDangerousContacts": true
  },

  "dangerousContacts": [
    {
      "name": "Ex",
      "phone": "+391234567890",
      "category": "ex",
      "riskLevel": 10
    },
    {
      "name": "Crush",
      "phone": "+390987654321",
      "category": "crush",
      "riskLevel": 8
    },
    {
      "name": "Boss",
      "phone": "+391122334455",
      "category": "boss",
      "riskLevel": 7
    }
  ],

  "detection": {
    "sensitivity": "medium",
    "minScore": 0.6,
    "weights": {
      "llm": 0.40,
      "pattern": 0.30,
      "time": 0.15,
      "contact": 0.15
    },
    "patterns": {
      "typoThreshold": 0.15,
      "repeatMessageThreshold": 3,
      "capsThreshold": 0.3,
      "emotionalKeywords": [
        "ti amo", "mi manchi", "perche non rispondi",
        "dobbiamo parlare", "sei sveglio", "ti odio",
        "non mi importa", "ti penso", "ho bisogno di te"
      ]
    }
  },

  "alerts": {
    "enabled": true,
    "cooldownMinutes": 30,
    "levels": {
      "low": { "threshold": 0.4, "action": "log" },
      "medium": { "threshold": 0.6, "action": "notify" },
      "high": { "threshold": 0.75, "action": "notify" },
      "critical": { "threshold": 0.9, "action": "notify" }
    },
    "messages": {
      "warning": "Hey, sembra che tu stia scrivendo in uno stato alterato. Forse e' meglio aspettare domani?",
      "danger": "ATTENZIONE: Stai scrivendo a un contatto 'pericoloso' e sembri ubriaco. Metti giu' il telefono!",
      "critical": "STOP! Pattern molto preoccupante rilevato. Ti consiglio fortemente di non continuare."
    }
  },

  "logging": {
    "level": "info",
    "saveHistory": true,
    "historyRetentionDays": 30
  },

  "privacy": {
    "saveMessageContent": false,
    "anonymizeContacts": true
  }
}
```

### 7.2 Sensitivity Levels

| Livello | minScore | Descrizione |
|---------|----------|-------------|
| `low` | 0.75 | Meno alert, solo casi evidenti |
| `medium` | 0.60 | Bilanciato (default) |
| `high` | 0.45 | Piu' alert, maggiore cautela |
| `paranoid` | 0.30 | Alert frequenti |

---

## 8. Integrazione Ollama

### 8.1 System Prompt

```typescript
const SYSTEM_PROMPT = `Sei un analizzatore di messaggi specializzato nel rilevare segni di comunicazione in stato alterato (ubriachezza).

Analizza il messaggio fornito e valuta questi indicatori:
1. Errori di battitura e grammaticali
2. Uso eccessivo di punteggiatura (!!!, ???, ...)
3. CAPS LOCK inappropriato
4. Linguaggio emotivo esagerato
5. Ripetizioni di concetti
6. Incoerenza del flusso di pensiero
7. Contenuto inappropriato per l'ora

Rispondi SOLO con un oggetto JSON valido, senza altro testo:
{
  "drunkScore": <numero da 0.0 a 1.0>,
  "confidence": <numero da 0.0 a 1.0>,
  "indicators": [<lista di indicatori rilevati>],
  "reasoning": "<breve spiegazione>"
}

Indicatori validi: "typos_detected", "emotional_language", "repetitive_content", "excessive_punctuation", "caps_lock_abuse", "incoherent_flow", "late_night_timing"`;
```

### 8.2 Analysis Prompt Builder

```typescript
function buildAnalysisPrompt(context: EnrichedContext): string {
  const { message, contact, recentMessages } = context;

  let prompt = `MESSAGGIO DA ANALIZZARE:
"${message.text}"

CONTESTO:
- Ora invio: ${message.hour}:${new Date().getMinutes().toString().padStart(2, '0')}
- Giorno: ${getDayName(new Date().getDay())}
- Destinatario: ${contact?.name || 'Sconosciuto'}
- Categoria contatto: ${contact?.category || 'normale'}`;

  if (recentMessages.length > 0) {
    prompt += `\n\nULTIMI MESSAGGI INVIATI (per contesto):`;
    recentMessages.forEach((msg, i) => {
      prompt += `\n${i + 1}. "${msg.text.substring(0, 100)}..."`;
    });
  }

  if (message.isLateNight) {
    prompt += `\n\nNOTA: Il messaggio e' stato inviato in tarda notte/prima mattina.`;
  }

  return prompt;
}
```

### 8.3 Formato Risposta Atteso

```json
{
  "drunkScore": 0.75,
  "confidence": 0.85,
  "indicators": [
    "typos_detected",
    "emotional_language",
    "late_night_timing"
  ],
  "reasoning": "Il messaggio presenta diversi errori di battitura, un tono emotivo elevato con espressioni come 'mi manchi tantissimo', ed e' stato inviato alle 2:34 di notte. La combinazione di questi fattori suggerisce uno stato alterato."
}
```

### 8.4 Gestione Errori Ollama

```typescript
async function analyzeWithRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<LLMAnalysisResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ollama.chat({
        model: config.ollama.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        format: 'json',
        options: { temperature: 0.3 }
      });

      return JSON.parse(response.message.content);
    } catch (error) {
      if (attempt === maxRetries) {
        // Fallback: usa solo pattern analysis
        return getDefaultAnalysis();
      }
      await sleep(1000 * (attempt + 1));
    }
  }
}
```

---

## 9. Algoritmo di Rilevamento

### 9.1 Pseudocodice Flusso Principale

```
FUNCTION analyzeMessage(message):
    // 1. Verifica se monitoraggio attivo
    IF NOT isMonitoringActive(currentTime):
        IF NOT isDangerousContact(message.recipient):
            RETURN skip

    // 2. Normalizza messaggio
    normalized = normalizeMessage(message)

    // 3. Arricchisci contesto
    context = enrichContext(normalized)

    // 4. Analisi parallela
    PARALLEL:
        llmResult = analyzeWithOllama(context)
        patternResult = analyzePatterns(context)

    // 5. Calcola score finale
    finalScore = calculateWeightedScore(
        llmResult,
        patternResult,
        context.contact,
        context.timestamp
    )

    // 6. Valuta soglie
    alertLevel = evaluateThresholds(finalScore)

    // 7. Invia alert se necessario
    IF alertLevel >= config.minAlertLevel:
        IF NOT inCooldown():
            sendAlert(alertLevel, context)
            setCooldown()

    // 8. Log analisi
    logAnalysis(context, finalScore, alertLevel)
```

### 9.2 Calcolo Score Pesato

```typescript
function calculateWeightedScore(
  llmResult: LLMAnalysisResult,
  patternResult: PatternAnalysis,
  contact: DangerousContact | null,
  timestamp: Date
): number {
  const weights = config.detection.weights;

  // Score base
  let score = 0;

  // LLM Score (40%)
  score += llmResult.drunkScore * weights.llm;

  // Pattern Score (30%)
  const patternScore = calculatePatternScore(patternResult);
  score += patternScore * weights.pattern;

  // Time Score (15%)
  const timeScore = calculateTimeScore(timestamp);
  score += timeScore * weights.time;

  // Contact Score (15%)
  const contactScore = contact ? (contact.riskLevel / 10) : 0;
  score += contactScore * weights.contact;

  // Moltiplicatori
  if (isLateNight(timestamp)) {
    score *= 1.2;  // +20% di notte
  }

  if (isWeekend(timestamp)) {
    score *= 1.1;  // +10% weekend
  }

  // Clamp 0-1
  return Math.min(1, Math.max(0, score));
}
```

### 9.3 Pattern Detection

```typescript
function analyzePatterns(text: string): PatternAnalysis {
  const words = text.split(/\s+/);
  const chars = text.length;

  return {
    // Ratio errori battitura (semplificato)
    typoRatio: detectTypos(text) / words.length,

    // Ripetizioni di parole
    repetitionScore: detectRepetitions(words),

    // Uso CAPS
    capsRatio: (text.match(/[A-Z]/g) || []).length / chars,

    // Punteggiatura anomala
    punctuationAnomaly: /[!?]{3,}|\.{4,}/.test(text),

    // Lunghezza messaggio
    messageLength: chars > 500 ? 'excessive' : chars > 200 ? 'long' : 'normal'
  };
}
```

---

## 10. Sistema di Avvisi

### 10.1 Livelli di Alert

| Livello | Soglia | Azione | Messaggio |
|---------|--------|--------|-----------|
| `none` | < 0.4 | Nessuna | - |
| `low` | 0.4-0.6 | Solo log | - |
| `medium` | 0.6-0.75 | Notifica | Warning gentile |
| `high` | 0.75-0.9 | Notifica | Avviso forte |
| `critical` | > 0.9 | Notifica | STOP immediato |

### 10.2 Cooldown Manager

```typescript
class CooldownManager {
  private lastAlert: Map<string, number> = new Map();

  canSendAlert(recipientJid: string): boolean {
    const lastTime = this.lastAlert.get(recipientJid) || 0;
    const cooldownMs = config.alerts.cooldownMinutes * 60 * 1000;

    return Date.now() - lastTime > cooldownMs;
  }

  recordAlert(recipientJid: string): void {
    this.lastAlert.set(recipientJid, Date.now());
  }
}
```

### 10.3 Message Builder

```typescript
function buildAlertMessage(
  level: AlertLevel,
  context: EnrichedContext,
  analysis: RiskAssessment
): string {
  const template = config.alerts.messages[level];

  let message = `*DontDrunkText Alert*\n\n`;
  message += template + '\n\n';

  message += `*Indicatori rilevati:*\n`;
  analysis.indicators.forEach(ind => {
    message += `- ${formatIndicator(ind)}\n`;
  });

  if (context.contact) {
    message += `\n_Stai scrivendo a: ${context.contact.name} (${context.contact.category})_`;
  }

  message += `\n\n_Score: ${(analysis.overallScore * 100).toFixed(0)}%_`;

  return message;
}
```

---

## 11. Setup e Utilizzo

### 11.1 Prerequisiti

| Requisito | Versione | Note |
|-----------|----------|------|
| Node.js | >= 20.x | LTS raccomandato |
| Ollama | >= 0.1.x | Con modello scaricato |
| RAM | >= 8GB | Per llama3.2:3b |
| OS | macOS/Linux/Windows | WSL2 per Windows |

### 11.2 Installazione Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Avvia servizio
ollama serve

# Scarica modello (in altro terminale)
ollama pull llama3.2:3b
```

### 11.3 Installazione DontDrunkText

```bash
# Clona/crea progetto
cd dontdrunktext

# Installa dipendenze
pnpm install

# Copia e configura
cp config.example.json config.json
# Modifica config.json con i tuoi contatti

# Build
pnpm build

# Avvia
pnpm start
```

### 11.4 Primo Avvio - Pairing WhatsApp

```
$ pnpm start

DontDrunkText v1.0.0
====================

[INFO] Connessione a Ollama... OK (llama3.2:3b)
[INFO] Inizializzazione WhatsApp...

Scansiona questo QR code con WhatsApp:

  [QR CODE VISUALIZZATO]

[INFO] In attesa di scansione...
[INFO] Connesso come: +39 xxx xxx xxxx
[INFO] Monitoraggio attivo (21:00 - 06:00)
[INFO] Contatti pericolosi configurati: 3

Premi Ctrl+C per terminare.
```

### 11.5 Comandi CLI

```bash
# Avvia monitoraggio
pnpm start

# Avvia in dev mode (hot reload)
pnpm dev

# Mostra stato
pnpm status

# Aggiungi contatto pericoloso
pnpm contacts add "+391234567890" "Ex" --category ex --risk 10

# Lista contatti
pnpm contacts list

# Test connessione Ollama
pnpm test:ollama
```

---

## 12. Sicurezza e Privacy

### 12.1 Perche' Ollama Locale

| Aspetto | Cloud LLM | Ollama Locale |
|---------|-----------|---------------|
| **Privacy** | Messaggi inviati a terzi | Nessun dato esce |
| **Costo** | Pay-per-use | Gratuito |
| **Latenza** | Variabile (rete) | Costante (~1s) |
| **Dipendenza** | Richiede internet | Funziona offline |
| **Controllo** | Nessuno | Totale |

### 12.2 Gestione Credenziali WhatsApp

Le credenziali WhatsApp (session) sono salvate in `data/auth/`:

```bash
# Permessi restrittivi
chmod 700 data/auth/
chmod 600 data/auth/*

# Aggiungi a .gitignore
echo "data/auth/" >> .gitignore
```

### 12.3 Cosa Viene Salvato

| Dato | Salvato | Note |
|------|---------|------|
| Contenuto messaggi | **NO** (default) | Configurabile |
| JID destinatari | Hash (anonimizzato) | Per cooldown |
| Score analisi | Si | Per statistiche |
| Timestamp | Si | Per pattern temporali |
| Credenziali WhatsApp | Si (locale) | Criptate da Baileys |

### 12.4 Configurazione Privacy Raccomandata

```json
{
  "privacy": {
    "saveMessageContent": false,
    "anonymizeContacts": true,
    "logLevel": "warn",
    "historyRetentionDays": 7
  }
}
```

### 12.5 Threat Model

| Minaccia | Mitigazione |
|----------|-------------|
| Accesso fisico al device | Cifratura disco, logout WhatsApp |
| Malware che legge DB | Permessi restrittivi, no contenuto salvato |
| Leak credenziali WhatsApp | .gitignore, non condividere data/ |
| Analisi traffico rete | Tutto locale, nessun traffico esterno |

---

## 13. Interfacce TypeScript

### 13.1 Core Interfaces

```typescript
// === WHATSAPP MODULE ===

interface IWhatsAppClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onMessage(handler: MessageHandler): void;
  sendMessage(jid: string, content: string): Promise<void>;
  isConnected(): boolean;
}

type MessageHandler = (message: WhatsAppMessage) => void;

interface WhatsAppMessage {
  id: string;
  text: string;
  recipientJid: string;
  timestamp: Date;
  fromMe: boolean;
}

// === ANALYSIS MODULE ===

interface IOllamaClient {
  analyze(prompt: string): Promise<LLMAnalysisResult>;
  isAvailable(): Promise<boolean>;
  getModelInfo(): Promise<ModelInfo>;
}

interface IDrunkDetector {
  analyze(context: EnrichedContext): Promise<AnalysisResult>;
}

interface AnalysisResult {
  llmResult: LLMAnalysisResult;
  patternResult: PatternAnalysis;
  combinedScore: number;
}

// === DECISION MODULE ===

interface IRiskCalculator {
  calculate(analysis: AnalysisResult, context: EnrichedContext): RiskAssessment;
}

interface ITimeChecker {
  isMonitoringActive(date: Date): boolean;
  getTimeMultiplier(date: Date): number;
}

interface IContactMapper {
  getContact(jid: string): DangerousContact | null;
  isDangerous(jid: string): boolean;
  getRiskLevel(jid: string): number;
}

// === ALERT MODULE ===

interface IAlertManager {
  shouldAlert(assessment: RiskAssessment, recipientJid: string): boolean;
  sendAlert(level: AlertLevel, context: EnrichedContext): Promise<void>;
}

interface ICooldownManager {
  canSendAlert(recipientJid: string): boolean;
  recordAlert(recipientJid: string): void;
  getRemainingCooldown(recipientJid: string): number;
}

// === CONFIG MODULE ===

interface IConfigProvider {
  get<T>(key: string): T;
  getAll(): Config;
  reload(): void;
}
```

### 13.2 Data Types

```typescript
// === CONTACTS ===

interface DangerousContact {
  jid: string;
  phone: string;
  name: string;
  category: ContactCategory;
  riskLevel: number;  // 1-10
  notes?: string;
}

type ContactCategory =
  | 'ex'
  | 'crush'
  | 'boss'
  | 'colleague'
  | 'family'
  | 'friend'
  | 'custom';

// === ANALYSIS ===

interface LLMAnalysisResult {
  drunkScore: number;
  confidence: number;
  indicators: DrunkIndicator[];
  reasoning: string;
}

type DrunkIndicator =
  | 'typos_detected'
  | 'emotional_language'
  | 'repetitive_content'
  | 'excessive_punctuation'
  | 'caps_lock_abuse'
  | 'incoherent_flow'
  | 'late_night_timing'
  | 'dangerous_recipient';

interface PatternAnalysis {
  typoRatio: number;
  repetitionScore: number;
  capsRatio: number;
  punctuationAnomaly: boolean;
  messageLength: 'short' | 'normal' | 'long' | 'excessive';
}

// === RISK ===

interface RiskAssessment {
  overallScore: number;
  breakdown: ScoreBreakdown;
  shouldAlert: boolean;
  alertLevel: AlertLevel;
  indicators: DrunkIndicator[];
}

interface ScoreBreakdown {
  llmScore: number;
  patternScore: number;
  timeScore: number;
  contactScore: number;
}

type AlertLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

// === EVENTS ===

interface MessageEvent {
  type: 'outbound_message';
  message: WhatsAppMessage;
  timestamp: Date;
}

interface AnalysisEvent {
  type: 'analysis_complete';
  messageId: string;
  assessment: RiskAssessment;
  timestamp: Date;
}

interface AlertEvent {
  type: 'alert_sent';
  level: AlertLevel;
  recipientJid: string;
  timestamp: Date;
}
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

```typescript
// tests/unit/analysis/PatternDetector.test.ts

import { describe, it, expect } from 'vitest';
import { PatternDetector } from '../../../src/analysis/PatternDetector';

describe('PatternDetector', () => {
  const detector = new PatternDetector();

  describe('typo detection', () => {
    it('should detect high typo ratio', () => {
      const text = 'ciao cme stai? tt bene?';
      const result = detector.analyze(text);
      expect(result.typoRatio).toBeGreaterThan(0.1);
    });

    it('should return low ratio for clean text', () => {
      const text = 'Ciao, come stai? Tutto bene?';
      const result = detector.analyze(text);
      expect(result.typoRatio).toBeLessThan(0.05);
    });
  });

  describe('caps detection', () => {
    it('should detect excessive caps', () => {
      const text = 'PERCHE NON MI RISPONDI???';
      const result = detector.analyze(text);
      expect(result.capsRatio).toBeGreaterThan(0.5);
    });
  });

  describe('punctuation anomaly', () => {
    it('should detect excessive punctuation', () => {
      const text = 'Mi manchi tantissimo!!!!!!!';
      const result = detector.analyze(text);
      expect(result.punctuationAnomaly).toBe(true);
    });
  });
});
```

### 14.2 Integration Tests

```typescript
// tests/integration/ollama-client.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { OllamaClient } from '../../src/analysis/OllamaClient';

describe('OllamaClient Integration', () => {
  let client: OllamaClient;

  beforeAll(async () => {
    client = new OllamaClient({
      model: 'llama3.2:3b',
      baseUrl: 'http://localhost:11434'
    });
  });

  it('should connect to Ollama', async () => {
    const available = await client.isAvailable();
    expect(available).toBe(true);
  });

  it('should analyze drunk message', async () => {
    const result = await client.analyze(
      'ti amoooo tantissimooo!!! mi manchiii'
    );

    expect(result.drunkScore).toBeGreaterThan(0.5);
    expect(result.indicators).toContain('emotional_language');
  });

  it('should analyze sober message', async () => {
    const result = await client.analyze(
      'Ciao, ci vediamo domani alle 10?'
    );

    expect(result.drunkScore).toBeLessThan(0.3);
  });
});
```

### 14.3 Test Fixtures

```typescript
// tests/fixtures/messages.ts

export const drunkMessages = [
  {
    text: 'ti amoooo tantissimoooo!!!',
    expectedScore: { min: 0.7, max: 1.0 },
    expectedIndicators: ['emotional_language', 'excessive_punctuation']
  },
  {
    text: 'PERCHE NON MI RISPONDI???? HO BISOGNOO DI TE',
    expectedScore: { min: 0.8, max: 1.0 },
    expectedIndicators: ['caps_lock_abuse', 'emotional_language']
  },
  {
    text: 'ciao cme stai? sn un po trsite stasrea',
    expectedScore: { min: 0.6, max: 0.9 },
    expectedIndicators: ['typos_detected']
  }
];

export const soberMessages = [
  {
    text: 'Ciao, ci vediamo domani alle 10?',
    expectedScore: { min: 0, max: 0.2 },
    expectedIndicators: []
  },
  {
    text: 'Grazie per la cena, e stato molto piacevole.',
    expectedScore: { min: 0, max: 0.2 },
    expectedIndicators: []
  }
];
```

---

## Appendice A: Esempio Flusso End-to-End

```
[02:34] Utente scrive su WhatsApp a "Ex":
"ti pensooo sempreee... perche nn mi rispondi?? mi manchiii"

[02:34.100] Baileys intercetta messaggio (fromMe: true)

[02:34.150] MessageInterceptor normalizza:
{
  id: "ABC123",
  text: "ti pensooo sempreee... perche nn mi rispondi?? mi manchiii",
  recipientJid: "39123456789@s.whatsapp.net",
  timestamp: "2026-02-01T02:34:00.000Z",
  hour: 2,
  isLateNight: true
}

[02:34.200] Context enrichment:
{
  contact: { name: "Ex", category: "ex", riskLevel: 10 },
  isMonitoringActive: true
}

[02:34.250] Chiamata Ollama (locale):
POST http://localhost:11434/api/chat
{
  model: "llama3.2:3b",
  messages: [{ role: "user", content: "Analizza: ti pensooo..." }]
}

[02:35.100] Risposta Ollama:
{
  drunkScore: 0.85,
  confidence: 0.90,
  indicators: ["typos_detected", "emotional_language", "repetitive_content"],
  reasoning: "Errori battitura, tono emotivo, ripetizioni"
}

[02:35.150] Pattern Analysis:
{
  typoRatio: 0.18,
  repetitionScore: 0.4,
  capsRatio: 0.0,
  punctuationAnomaly: true
}

[02:35.200] Risk Calculation:
- LLM: 0.85 * 0.40 = 0.34
- Pattern: 0.65 * 0.30 = 0.195
- Time: 1.0 * 0.15 = 0.15
- Contact: 1.0 * 0.15 = 0.15
- Base: 0.835
- Multiplier notte: 1.2
- Final: 0.835 * 1.2 = 1.0 (capped)

[02:35.250] Alert Level: CRITICAL

[02:35.300] Cooldown check: OK (nessun alert recente)

[02:35.350] Invio self-message:
"*DontDrunkText Alert*

STOP! Pattern molto preoccupante rilevato.

*Indicatori:*
- Errori di battitura
- Linguaggio emotivo
- Contenuto ripetitivo

_Stai scrivendo a: Ex_
_Score: 100%_

Ti consiglio fortemente di mettere giu' il telefono."

[02:35.400] Log salvato (senza contenuto messaggio)

[02:35.450] Cooldown impostato: 30 minuti per questo contatto
```

---

## Appendice B: Troubleshooting

### Ollama non risponde

```bash
# Verifica che Ollama sia in esecuzione
curl http://localhost:11434/api/tags

# Se non risponde, avvia il servizio
ollama serve

# Verifica modello installato
ollama list
```

### WhatsApp si disconnette

```bash
# Elimina sessione e riconnetti
rm -rf data/auth/*
pnpm start
# Scansiona nuovo QR code
```

### Troppi falsi positivi

Modifica `config.json`:
```json
{
  "detection": {
    "sensitivity": "low",
    "minScore": 0.75
  }
}
```

### Alert non arrivano

1. Verifica `alerts.enabled: true`
2. Controlla cooldown attivo
3. Verifica soglie in `alerts.levels`

---

*Documento di specifica tecnica per DontDrunkText*
*Versione 1.0.0 - Febbraio 2026*
