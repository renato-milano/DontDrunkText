<p align="center">
  <img src="logo.png" alt="DontDrunkText Logo" width="700"/>
</p>

<h1 align="center">DontDrunkText</h1>

<p align="center">
  <strong>Proteggiti dai messaggi inviati in stato alterato</strong>
</p>

<p align="center">
  <a href="#caratteristiche">Caratteristiche</a> •
  <a href="#installazione">Installazione</a> •
  <a href="#utilizzo">Utilizzo</a> •
  <a href="#configurazione">Configurazione</a> •
  <a href="#come-funziona">Come Funziona</a> •
  <a href="#privacy">Privacy</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node Version"/>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux-blue" alt="Platform"/>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License"/>
  <img src="https://img.shields.io/badge/AI-Multi--Provider-purple" alt="Multi-Provider AI"/>
</p>

---

## Il Problema

Hai mai scritto un messaggio di cui ti sei pentito la mattina dopo?

Un messaggio all'ex alle 3 di notte, una dichiarazione d'amore a lei/lui dopo qualche drink, o un'email al capo con opinioni troppo sincere?

**DontDrunkText** monitora i tuoi messaggi WhatsApp e ti avvisa quando rileva che potresti star scrivendo in stato alterato.

## Caratteristiche

- **Multi-Provider AI** - Scegli tra Ollama (locale), OpenAI o Anthropic
- **Privacy First** - Con Ollama nessun dato lascia il tuo dispositivo
- **Contatti Pericolosi** - Configura ex, la persona che ti piace, il capo e altri contatti "a rischio"
- **Buddies** - Amici che ricevono alert quando sei ubriaco (per aiutarti a fermarti!)
- **Fasce Orarie** - Monitoraggio attivo nelle ore critiche (es. 21:00-06:00)
- **AI Intelligente** - Rileva errori di battitura, tono emotivo, pattern sospetti
- **Alert Real-time** - Ricevi un messaggio di avviso prima che sia troppo tardi
- **Facile Setup** - Wizard di configurazione guidato, nessuna competenza tecnica richiesta

## Installazione

### Requisiti

- **macOS** o **Linux** (Windows con WSL2)
- **8GB RAM** minimo (per modelli AI locali)

### One-Line Install

```bash
git clone https://github.com/renato-milano/DontDrunkText.git
cd DontDrunkText
./install.sh
```

Lo script installerà automaticamente:
- Node.js (se necessario)
- Ollama (LLM locale)
- Modello AI (llama3.2:3b)
- Tutte le dipendenze

### Installazione Manuale

```bash
# 1. Installa Ollama (opzionale, solo per AI locale)
brew install ollama  # macOS
# oppure: curl -fsSL https://ollama.com/install.sh | sh

# 2. Avvia Ollama e scarica il modello
ollama serve &
ollama pull llama3.2:3b

# 3. Setup progetto
git clone https://github.com/renato-milano/DontDrunkText.git
cd DontDrunkText
npm install
npm run build

# 4. Configura
npm run setup
```

## Provider AI Supportati

| Provider | Tipo | Pro | Contro |
|----------|------|-----|--------|
| **Ollama** | Locale | Privacy totale, gratuito | Richiede RAM/GPU |
| **OpenAI** | Cloud | Veloce, affidabile | A pagamento |
| **Anthropic** | Cloud | Ottimo per italiano | A pagamento |

### Modelli Consigliati per Ollama

| Modello | RAM | Note |
|---------|-----|------|
| `llama3.2:3b` | 2GB | Consigliato, buon bilanciamento |
| `llama3.2:1b` | 1.3GB | Leggero, per PC meno potenti |
| `qwen3:4b` | 2.6GB | Ottimo per testo |
| `qwen3:8b` | 5GB | Migliore qualita |
| `phi4-mini` | 2.5GB | Veloce e compatto |
| `gemma3:4b` | 3GB | Buona qualita generale |
| `mistral:7b` | 4GB | Eccellente per italiano |

## Utilizzo

### Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `dontdrunktext start` | Avvia il monitoraggio |
| `dontdrunktext setup` | Wizard di configurazione |
| `dontdrunktext status` | Mostra stato del sistema |
| `dontdrunktext stop` | Ferma il monitoraggio |
| `dontdrunktext help` | Mostra aiuto |

### Primo Avvio

```bash
# 1. Configura provider AI e contatti pericolosi
dontdrunktext setup

# 2. Avvia il monitoraggio
dontdrunktext start

# 3. Scansiona il QR code con WhatsApp
#    (Impostazioni > Dispositivi collegati > Collega dispositivo)
```

### Esempio di Alert

Quando scrivi qualcosa di sospetto, riceverai un messaggio come questo:

```
*DontDrunkText Alert*

ATTENZIONE: Stai scrivendo a un contatto 'pericoloso'
e sembri ubriaco. Metti giù il telefono!

*Indicatori rilevati:*
- Errori di battitura
- Linguaggio emotivo
- Orario tarda notte

_Stai scrivendo a: Ex (ex)_
_Ora: 02:34_

_Risk Score: 78%_
```

## Configurazione

### Wizard Guidato (Consigliato)

```bash
dontdrunktext setup
```

Il wizard ti guiderà nella configurazione di:
1. **Provider AI** - Ollama, OpenAI o Anthropic
2. **Modello** - Quale modello utilizzare
3. **Contatti pericolosi** - Ex, la persona che ti piace, il capo...
4. **Buddies** - Amici che ricevono alert quando sei ubriaco
5. **Orari di monitoraggio**
6. **Livello di sensibilità**

### Configurazione Manuale

Modifica `config.json`:

```json
{
  "llm": {
    "provider": "ollama",
    "model": "llama3.2:3b",
    "baseUrl": "http://localhost:11434",
    "timeout": 30000
  },
  "dangerousContacts": [
    {
      "name": "Ex",
      "phone": "+391234567890",
      "category": "ex",
      "riskLevel": 10
    }
  ],
  "monitoring": {
    "startHour": 21,
    "endHour": 6,
    "alwaysMonitorDangerousContacts": true
  },
  "detection": {
    "sensitivity": "medium"
  }
}
```

### Configurazione Provider Cloud

Per usare OpenAI o Anthropic, aggiungi la API key:

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "apiKey": "sk-...",
    "timeout": 30000
  }
}
```

```json
{
  "llm": {
    "provider": "anthropic",
    "model": "claude-3-5-haiku-latest",
    "apiKey": "sk-ant-...",
    "timeout": 30000
  }
}
```

### Categorie Contatti

| Categoria | Descrizione |
|-----------|-------------|
| `ex` | Ex partner |
| `crush` | Lei/lui che ti piace |
| `boss` | Superiore lavorativo |
| `colleague` | Collega |
| `family` | Familiare |
| `friend` | Amico/a |

### Livelli di Sensibilità

| Livello | Descrizione |
|---------|-------------|
| `low` | Pochi alert, solo casi evidenti |
| `medium` | Bilanciato (raccomandato) |
| `high` | Più alert, maggiore cautela |
| `paranoid` | Alert frequenti |

### Buddies (Amici di Supporto)

Puoi configurare degli amici che riceveranno un messaggio WhatsApp quando il sistema rileva che potresti essere ubriaco. Possono aiutarti a fermarti!

```json
{
  "alerts": {
    "buddies": [
      {
        "name": "Marco",
        "phone": "+391234567890",
        "notifyAlways": false
      },
      {
        "name": "Laura",
        "phone": "+390987654321",
        "notifyAlways": true
      }
    ],
    "buddyAlertLevel": "high"
  }
}
```

| Campo | Descrizione |
|-------|-------------|
| `name` | Nome dell'amico/a |
| `phone` | Numero WhatsApp |
| `notifyAlways` | Se `true`, notifica sempre. Se `false`, solo per livelli >= `buddyAlertLevel` |
| `buddyAlertLevel` | Livello minimo per notificare: `medium`, `high`, `critical` |

I buddies riceveranno un messaggio tipo:
```
*DontDrunkText - Avviso Amico* ⚠️

Ciao Marco!

Un tuo amico/a potrebbe star scrivendo messaggi in stato alterato.

*Livello:* Alto
*Risk Score:* 78%

*Segnali rilevati:*
- Errori di battitura
- Linguaggio emotivo
- Orario tarda notte

_Rilevato alle 02:34_

_Potresti voler controllare che lei/lui stia bene!_
```

## Come Funziona

```
┌─────────────────────────────────────────────────────────────┐
│                     IL TUO DISPOSITIVO                       │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   WhatsApp   │───>│   Baileys    │───>│  LLM Provider │   │
│  │  (tu scrivi) │    │ (intercetta) │    │  (analizza)  │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                  │           │
│                      ┌───────────────────────────┘           │
│                      v                                       │
│               ┌──────────────┐                               │
│               │  Se ubriaco: │                               │
│               │   AVVISO!    │───> Messaggio WhatsApp a te   │
│               └──────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### Cosa Analizza

1. **Errori di battitura** - "ti amoooo", "perke", "nn"
2. **Punteggiatura eccessiva** - "!!!!!!", "????"
3. **CAPS LOCK** - "PERCHE NON RISPONDI"
4. **Tono emotivo** - "mi manchi", "ti penso sempre"
5. **Orario** - Messaggi a tarda notte
6. **Destinatario** - Contatti configurati come "pericolosi"

### Sistema di Scoring

```
Score Finale = (LLM x 40%) + (Pattern x 30%) + (Orario x 15%) + (Contatto x 15%)

Moltiplicatori:
  x 1.2 se tarda notte
  x 1.1 se weekend
```

## Privacy

**La tua privacy è la nostra priorità.**

| Aspetto | Ollama (Locale) | Cloud (OpenAI/Anthropic) |
|---------|-----------------|--------------------------|
| **Analisi AI** | 100% locale | Dati inviati al provider |
| **Messaggi** | Mai salvati | Processati dal provider |
| **Credenziali** | Locali | Locali |
| **Rete** | Zero traffico esterno | Solo verso API provider |

### Con Ollama (Consigliato per Privacy)

- Analisi AI 100% locale - nessun server esterno
- Messaggi mai salvati di default
- Credenziali criptate localmente da Baileys
- Zero traffico verso servizi esterni
- Codice completamente open source e verificabile

### Con Provider Cloud

- I messaggi vengono inviati al provider AI per l'analisi
- Soggetti alle privacy policy di OpenAI/Anthropic
- Consigliato solo se la privacy non è una priorità assoluta

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| **Runtime** | Node.js 20+ |
| **Linguaggio** | TypeScript |
| **WhatsApp** | Baileys |
| **AI/LLM** | Ollama / OpenAI / Anthropic |
| **Validation** | Zod |

## Struttura Progetto

```
DontDrunkText/
├── src/
│   ├── index.ts           # Entry point
│   ├── cli/               # CLI e wizard
│   ├── llm/               # Provider LLM (Ollama, OpenAI, Anthropic)
│   ├── whatsapp/          # Integrazione WhatsApp
│   ├── analysis/          # Analisi AI e pattern
│   ├── decision/          # Calcolo rischio
│   └── config/            # Gestione configurazione
├── install.sh             # Installer automatico
├── config.example.json    # Template configurazione
└── bin/dontdrunktext      # CLI globale
```

## Contributing

I contributi sono benvenuti!

1. Fork del repository
2. Crea un branch (`git checkout -b feature/nuova-feature`)
3. Commit (`git commit -m 'Aggiunge nuova feature'`)
4. Push (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## License

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## Disclaimer

Questo software è fornito "così com'è" senza garanzie. L'autore non è responsabile per:
- Messaggi inviati nonostante gli avvisi
- Relazioni rovinate
- Carriere compromesse
- Imbarazzo generale

**La migliore protezione resta sempre: bevi responsabilmente!**

---

<p align="center">
  <strong>Made to save you from yourself</strong>
</p>

<p align="center">
  <a href="https://github.com/renato-milano/DontDrunkText/issues">Segnala Bug</a> •
  <a href="https://github.com/renato-milano/DontDrunkText/issues">Richiedi Feature</a>
</p>
