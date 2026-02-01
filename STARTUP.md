# DontDrunkText - Guida di Avvio

> Guida completa per installare, configurare e avviare DontDrunkText

---

## Indice

1. [Prerequisiti](#1-prerequisiti)
2. [Installazione Ollama](#2-installazione-ollama)
3. [Setup Progetto](#3-setup-progetto)
4. [Configurazione](#4-configurazione)
5. [Primo Avvio](#5-primo-avvio)
6. [Pairing WhatsApp](#6-pairing-whatsapp)
7. [Verifica Funzionamento](#7-verifica-funzionamento)
8. [Comandi Utili](#8-comandi-utili)
9. [Esecuzione in Background](#9-esecuzione-in-background)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisiti

### Software Richiesto

| Requisito | Versione Minima | Verifica |
|-----------|-----------------|----------|
| **Node.js** | >= 20.0.0 | `node --version` |
| **npm** | >= 10.0.0 | `npm --version` |
| **Ollama** | >= 0.1.0 | `ollama --version` |

### Requisiti Hardware

| Componente | Minimo | Raccomandato |
|------------|--------|--------------|
| **RAM** | 8 GB | 16 GB |
| **Spazio Disco** | 5 GB | 10 GB |
| **CPU** | 4 core | 8 core |

### Sistema Operativo

- **macOS**: 12.0+ (Monterey o successivo)
- **Linux**: Ubuntu 20.04+, Debian 11+, Fedora 35+
- **Windows**: Windows 10/11 con WSL2

---

## 2. Installazione Ollama

### macOS

```bash
# Metodo 1: Homebrew (raccomandato)
brew install ollama

# Metodo 2: Download diretto
curl -fsSL https://ollama.com/install.sh | sh
```

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows (WSL2)

```bash
# Da WSL2 Ubuntu
curl -fsSL https://ollama.com/install.sh | sh
```

### Avvio Servizio Ollama

```bash
# Avvia il servizio Ollama (mantieni questo terminale aperto)
ollama serve
```

**Output atteso:**
```
Couldn't find '/Users/xxx/.ollama/id_ed25519'. Generating new private key.
Your new public key is: ssh-ed25519 AAAA...
2024/02/01 10:00:00 llama.cpp server listening on 127.0.0.1:11434
```

### Download Modello LLM

In un **nuovo terminale**:

```bash
# Modello raccomandato (4GB RAM)
ollama pull llama3.2:3b

# Alternativa leggera (2.5GB RAM)
ollama pull phi3:mini

# Alternativa potente (8GB RAM)
ollama pull mistral:7b
```

**Output atteso:**
```
pulling manifest
pulling 8eeb52dfb3bb... 100% ▕████████████████▏ 2.0 GB
pulling 948af2743fc7... 100% ▕████████████████▏ 1.5 KB
...
success
```

### Verifica Ollama

```bash
# Testa che Ollama risponda
curl http://localhost:11434/api/tags

# Oppure
ollama list
```

---

## 3. Setup Progetto

### 3.1 Naviga nella Directory

```bash
cd /Users/renatomilano/Desktop/Lavori/DontDrunkText
```

### 3.2 Installa Dipendenze

```bash
# Con npm
npm install

# Oppure con pnpm (piu' veloce)
pnpm install
```

**Output atteso:**
```
added 150 packages in 15s
```

### 3.3 Crea File di Configurazione

```bash
# Copia il template
cp config.example.json config.json
```

### 3.4 Compila il Progetto

```bash
npm run build
```

**Output atteso:**
```
> dontdrunktext@1.0.0 build
> tsc
```

Se non ci sono errori, la compilazione e' riuscita.

---

## 4. Configurazione

### 4.1 Apri config.json

```bash
# Con VS Code
code config.json

# Oppure con nano
nano config.json

# Oppure con vim
vim config.json
```

### 4.2 Configura Contatti Pericolosi

Modifica la sezione `dangerousContacts`:

```json
"dangerousContacts": [
  {
    "name": "Ex Nome",
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
    "name": "Capo",
    "phone": "+391122334455",
    "category": "boss",
    "riskLevel": 7
  }
]
```

**Categorie disponibili:**
- `ex` - Ex partner
- `crush` - Interesse romantico
- `boss` - Superiore lavorativo
- `colleague` - Collega
- `family` - Familiare
- `friend` - Amico
- `custom` - Personalizzato

**Risk Level:** Da 1 (basso) a 10 (massimo)

### 4.3 Configura Orari di Monitoraggio

```json
"monitoring": {
  "enabled": true,
  "startHour": 21,        // Inizio monitoraggio: 21:00
  "endHour": 6,           // Fine monitoraggio: 06:00
  "timezone": "Europe/Rome",
  "alwaysMonitorDangerousContacts": true  // Monitora sempre i contatti pericolosi
}
```

### 4.4 Configura Sensibilita'

```json
"detection": {
  "sensitivity": "medium",  // low, medium, high, paranoid
  "minScore": 0.6           // Soglia minima per alert (0.0 - 1.0)
}
```

| Sensibilita' | Soglia | Comportamento |
|--------------|--------|---------------|
| `low` | 0.75 | Pochi alert, solo casi evidenti |
| `medium` | 0.60 | Bilanciato (default) |
| `high` | 0.45 | Piu' alert, maggiore cautela |
| `paranoid` | 0.30 | Alert frequenti |

### 4.5 Configura Modello Ollama (opzionale)

```json
"ollama": {
  "model": "llama3.2:3b",           // Modello da usare
  "baseUrl": "http://localhost:11434",
  "timeout": 30000                   // Timeout in ms
}
```

### 4.6 Esempio config.json Completo

```json
{
  "ollama": {
    "model": "llama3.2:3b",
    "baseUrl": "http://localhost:11434",
    "timeout": 30000
  },
  "monitoring": {
    "enabled": true,
    "startHour": 21,
    "endHour": 6,
    "timezone": "Europe/Rome",
    "alwaysMonitorDangerousContacts": true
  },
  "dangerousContacts": [
    {
      "name": "Maria Ex",
      "phone": "+391234567890",
      "category": "ex",
      "riskLevel": 10
    },
    {
      "name": "Giulia Crush",
      "phone": "+390987654321",
      "category": "crush",
      "riskLevel": 8
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
    "emotionalKeywords": [
      "ti amo", "mi manchi", "perche non rispondi",
      "dobbiamo parlare", "sei sveglio", "ti odio",
      "non mi importa", "ti penso", "ho bisogno di te"
    ]
  },
  "alerts": {
    "enabled": true,
    "cooldownMinutes": 30,
    "selfAlert": true,
    "messages": {
      "warning": "Hey, sembra che tu stia scrivendo in uno stato alterato. Forse e' meglio aspettare domani?",
      "danger": "ATTENZIONE: Stai scrivendo a un contatto 'pericoloso' e sembri ubriaco. Metti giu' il telefono!",
      "critical": "STOP! Pattern molto preoccupante rilevato. Ti consiglio fortemente di non continuare."
    }
  },
  "privacy": {
    "saveMessageContent": false,
    "logLevel": "info"
  }
}
```

---

## 5. Primo Avvio

### 5.1 Verifica Ollama in Esecuzione

```bash
# In un terminale separato, assicurati che Ollama sia attivo
curl http://localhost:11434/api/tags
```

### 5.2 Testa Connessione Ollama

```bash
npm run test:ollama
```

**Output atteso:**
```
🧪 Testing Ollama Connection

1. Testing connection...
   ✅ Connected to Ollama
   📦 Available models: llama3.2:3b

2. Testing model: llama3.2:3b
   ✅ Model response: OK

3. Testing drunk detection analysis:
   ...

✅ All tests completed!
```

### 5.3 Avvia DontDrunkText

```bash
npm start
```

**Output atteso:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ____              _   ____                  _         ║
║    |  _ \  ___  _ __ | |_|  _ \ _ __ _   _ _ __ | | __    ║
║    | | | |/ _ \| '_ \| __| | | | '__| | | | '_ \| |/ /    ║
║    | |_| | (_) | | | | |_| |_| | |  | |_| | | | |   <     ║
║    |____/ \___/|_| |_|\__|____/|_|   \__,_|_| |_|_|\_\    ║
║                                                           ║
║              T E X T   M O N I T O R   v1.0               ║
║                                                           ║
║          🍺 Protecting you from drunk texting 🍺          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

[10:00:00] INFO: Starting DontDrunkText...
[10:00:00] INFO: Checking Ollama connection...
[10:00:01] INFO: Ollama ready: llama3.2:3b (2.0GB)
[10:00:01] INFO: Connecting to WhatsApp...
```

---

## 6. Pairing WhatsApp

### 6.1 QR Code

Dopo l'avvio, apparira' un QR code nel terminale:

```
[10:00:02] INFO: Scan QR code with WhatsApp:

  █▀▀▀▀▀█ ▄▄▄▄▄ █▀▀▀▀▀█
  █ ███ █ █▄▄▄█ █ ███ █
  █ ▀▀▀ █ ▀▀▀▀▀ █ ▀▀▀ █
  ▀▀▀▀▀▀▀ █ ▀ █ ▀▀▀▀▀▀▀
  ...
```

### 6.2 Scansiona con WhatsApp

1. Apri **WhatsApp** sul telefono
2. Vai in **Impostazioni** (o Menu ⋮)
3. Seleziona **Dispositivi collegati**
4. Tocca **Collega un dispositivo**
5. **Scansiona il QR code** mostrato nel terminale

### 6.3 Connessione Riuscita

```
[10:00:15] INFO: Connected as: +39 XXX XXX XXXX
[10:00:15] INFO: Monitoring configuration:
[10:00:15] INFO:   - Time window: 21:00 - 06:00
[10:00:15] INFO:   - Dangerous contacts: 2
[10:00:15] INFO:   - Sensitivity: medium
[10:00:15] INFO:   - Alert cooldown: 30 minutes
[10:00:15] INFO: Dangerous contacts configured:
[10:00:15] INFO:   - Maria Ex (ex) - Risk: 10/10
[10:00:15] INFO:   - Giulia Crush (crush) - Risk: 8/10
[10:00:15] INFO:
[10:00:15] INFO: DontDrunkText is now active. Press Ctrl+C to stop.
```

---

## 7. Verifica Funzionamento

### 7.1 Test Manuale

1. Durante l'orario di monitoraggio (o scrivi a un contatto pericoloso)
2. Invia un messaggio "sospetto" via WhatsApp, es:
   ```
   ti pensooo sempreee!!! mi manchiii
   ```
3. Dovresti ricevere un messaggio di alert da te stesso

### 7.2 Log di Analisi

Nel terminale vedrai:

```
[02:34:00] DEBUG: Outbound message intercepted
[02:34:00] DEBUG: Analyzing message...
[02:34:02] WARN: Drunk pattern detected! { score: '0.78', level: 'high', indicators: ['typos_detected', 'emotional_language'] }
[02:34:02] INFO: Alert sent: high { recipient: 'Maria Ex', score: '0.78' }
```

### 7.3 Messaggio di Alert

Riceverai un messaggio WhatsApp da te stesso:

```
*DontDrunkText Alert* ⚠️

ATTENZIONE: Stai scrivendo a un contatto 'pericoloso' e sembri ubriaco. Metti giu' il telefono!

*Indicatori rilevati:*
- Errori di battitura
- Linguaggio emotivo
- Orario tarda notte

_Stai scrivendo a: Maria Ex (ex)_
_Ora: 02:34_

_Risk Score: 78%_
```

---

## 8. Comandi Utili

### Comandi npm

| Comando | Descrizione |
|---------|-------------|
| `npm run build` | Compila TypeScript in JavaScript |
| `npm start` | Avvia il monitoraggio |
| `npm run dev` | Avvia in modalita' sviluppo (hot reload) |
| `npm run test:ollama` | Testa connessione e modello Ollama |
| `npm run clean` | Rimuove la cartella dist/ |

### Comandi Ollama

| Comando | Descrizione |
|---------|-------------|
| `ollama serve` | Avvia il server Ollama |
| `ollama list` | Lista modelli installati |
| `ollama pull <model>` | Scarica un modello |
| `ollama rm <model>` | Rimuove un modello |
| `ollama run <model>` | Testa un modello interattivamente |

### Gestione Processo

| Azione | Comando |
|--------|---------|
| Avvia | `npm start` |
| Ferma | `Ctrl+C` |
| Riavvia | `Ctrl+C` poi `npm start` |

---

## 9. Esecuzione in Background

### macOS - Con launchd

Crea file `~/Library/LaunchAgents/com.dontdrunktext.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dontdrunktext</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/renatomilano/Desktop/Lavori/DontDrunkText/dist/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/renatomilano/Desktop/Lavori/DontDrunkText</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/dontdrunktext.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/dontdrunktext.error.log</string>
</dict>
</plist>
```

Attiva:
```bash
launchctl load ~/Library/LaunchAgents/com.dontdrunktext.plist
```

### Linux - Con systemd

Crea file `~/.config/systemd/user/dontdrunktext.service`:

```ini
[Unit]
Description=DontDrunkText Monitor
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/user/DontDrunkText
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

Attiva:
```bash
systemctl --user enable dontdrunktext
systemctl --user start dontdrunktext
```

### Con PM2 (Cross-platform)

```bash
# Installa PM2
npm install -g pm2

# Avvia
pm2 start dist/index.js --name dontdrunktext

# Salva configurazione
pm2 save

# Avvio automatico al boot
pm2 startup
```

---

## 10. Troubleshooting

### Problema: "Ollama not available"

**Causa:** Ollama non e' in esecuzione

**Soluzione:**
```bash
# Avvia Ollama in un terminale separato
ollama serve
```

### Problema: "Model not found"

**Causa:** Il modello non e' stato scaricato

**Soluzione:**
```bash
# Scarica il modello
ollama pull llama3.2:3b
```

### Problema: QR Code non appare

**Causa:** Sessione precedente ancora attiva

**Soluzione:**
```bash
# Rimuovi sessione precedente
rm -rf data/auth/*

# Riavvia
npm start
```

### Problema: "Cannot connect to WhatsApp"

**Causa:** Problemi di rete o sessione scaduta

**Soluzione:**
```bash
# Rimuovi sessione e riconnetti
rm -rf data/auth/*
npm start
# Scansiona nuovo QR code
```

### Problema: Troppi falsi positivi

**Causa:** Sensibilita' troppo alta

**Soluzione:** Modifica `config.json`:
```json
{
  "detection": {
    "sensitivity": "low",
    "minScore": 0.75
  }
}
```

### Problema: Alert non arrivano

**Verifica:**
1. `alerts.enabled` e' `true`?
2. `alerts.selfAlert` e' `true`?
3. Sei dentro la finestra di monitoraggio?
4. C'e' un cooldown attivo? (default 30 minuti)

### Problema: Memoria insufficiente

**Causa:** Modello troppo grande

**Soluzione:** Usa un modello piu' leggero:
```bash
ollama pull phi3:mini
```

Poi modifica `config.json`:
```json
{
  "ollama": {
    "model": "phi3:mini"
  }
}
```

### Visualizza Log

```bash
# Log in tempo reale (se usi PM2)
pm2 logs dontdrunktext

# Log launchd (macOS)
tail -f /tmp/dontdrunktext.log

# Log systemd (Linux)
journalctl --user -u dontdrunktext -f
```

---

## Checklist Avvio Rapido

```
[ ] 1. Node.js >= 20 installato
[ ] 2. Ollama installato
[ ] 3. Ollama in esecuzione (ollama serve)
[ ] 4. Modello scaricato (ollama pull llama3.2:3b)
[ ] 5. npm install completato
[ ] 6. config.json configurato con contatti
[ ] 7. npm run build completato
[ ] 8. npm start avviato
[ ] 9. QR code scansionato con WhatsApp
[ ] 10. "DontDrunkText is now active" visualizzato
```

---

## Supporto

Se riscontri problemi non elencati qui:

1. Controlla i log per messaggi di errore
2. Verifica che tutti i prerequisiti siano soddisfatti
3. Prova a rimuovere `node_modules/` e reinstallare
4. Verifica la connessione internet

---

*DontDrunkText v1.0.0*
*Proteggiti dai messaggi inviati in stato alterato*
