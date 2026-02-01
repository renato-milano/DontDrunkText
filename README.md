<p align="center">
  <img src="logo.png" alt="DontDrunkText Logo" width="400"/>
</p>

<h1 align="center">DontDrunkText</h1>

<p align="center">
  <strong>🍺 Proteggiti dai messaggi inviati in stato alterato 📱</strong>
</p>

<p align="center">
  <a href="#-caratteristiche">Caratteristiche</a> •
  <a href="#-installazione">Installazione</a> •
  <a href="#-utilizzo">Utilizzo</a> •
  <a href="#%EF%B8%8F-configurazione">Configurazione</a> •
  <a href="#-come-funziona">Come Funziona</a> •
  <a href="#-privacy">Privacy</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node Version"/>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux-blue" alt="Platform"/>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License"/>
  <img src="https://img.shields.io/badge/AI-100%25%20Local-purple" alt="Local AI"/>
</p>

---

## 🎯 Il Problema

Hai mai scritto un messaggio di cui ti sei pentito la mattina dopo?

Un messaggio all'ex alle 3 di notte, una dichiarazione d'amore al crush dopo qualche drink, o un'email al capo con opinioni troppo sincere?

**DontDrunkText** monitora i tuoi messaggi WhatsApp e ti avvisa quando rileva che potresti star scrivendo in stato alterato.

## ✨ Caratteristiche

- 🔒 **100% Locale** - Nessun dato lascia il tuo dispositivo. L'AI gira localmente con Ollama
- 🎯 **Contatti Pericolosi** - Configura ex, crush, capo e altri contatti "a rischio"
- ⏰ **Fasce Orarie** - Monitoraggio attivo nelle ore critiche (es. 21:00-06:00)
- 🧠 **AI Intelligente** - Rileva errori di battitura, tono emotivo, pattern sospetti
- ⚡ **Alert Real-time** - Ricevi un messaggio di avviso prima che sia troppo tardi
- 🛠️ **Facile Setup** - Wizard di configurazione guidato, nessuna competenza tecnica richiesta

## 📦 Installazione

### Requisiti

- **macOS** o **Linux** (Windows con WSL2)
- **8GB RAM** minimo (per il modello AI locale)

### One-Line Install

```bash
git clone https://github.com/renato-milano/DontDrunkText.git
cd DontDrunkText
./install.sh
```

Lo script installerà automaticamente:
- ✅ Node.js (se necessario)
- ✅ Ollama (LLM locale)
- ✅ Modello AI (llama3.2:3b)
- ✅ Tutte le dipendenze

### Installazione Manuale

```bash
# 1. Installa Ollama
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

## 🚀 Utilizzo

### Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `dontdrunktext start` | 🟢 Avvia il monitoraggio |
| `dontdrunktext setup` | ⚙️ Wizard di configurazione |
| `dontdrunktext status` | 📊 Mostra stato del sistema |
| `dontdrunktext stop` | 🔴 Ferma il monitoraggio |
| `dontdrunktext help` | ❓ Mostra aiuto |

### Primo Avvio

```bash
# 1. Configura i tuoi contatti pericolosi
dontdrunktext setup

# 2. Avvia il monitoraggio
dontdrunktext start

# 3. Scansiona il QR code con WhatsApp
#    (Impostazioni > Dispositivi collegati > Collega dispositivo)
```

### Esempio di Alert

Quando scrivi qualcosa di sospetto, riceverai un messaggio come questo:

```
*DontDrunkText Alert* ⚠️

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

## ⚙️ Configurazione

### Wizard Guidato (Consigliato)

```bash
dontdrunktext setup
```

Il wizard ti guiderà nella configurazione di:
- 👥 Contatti pericolosi (ex, crush, capo...)
- ⏰ Orari di monitoraggio
- 🎚️ Livello di sensibilità

### Configurazione Manuale

Modifica `config.json`:

```json
{
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

### Categorie Contatti

| Categoria | Descrizione |
|-----------|-------------|
| `ex` | Ex partner |
| `crush` | Interesse romantico |
| `boss` | Superiore lavorativo |
| `colleague` | Collega |
| `family` | Familiare |
| `friend` | Amico |

### Livelli di Sensibilità

| Livello | Descrizione |
|---------|-------------|
| `low` | Pochi alert, solo casi evidenti |
| `medium` | Bilanciato (raccomandato) |
| `high` | Più alert, maggiore cautela |
| `paranoid` | Alert frequenti |

## 🧠 Come Funziona

```
┌─────────────────────────────────────────────────────────────┐
│                     IL TUO DISPOSITIVO                       │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   WhatsApp   │───▶│   Baileys    │───▶│   Ollama     │   │
│  │  (tu scrivi) │    │ (intercetta) │    │  (analizza)  │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                  │           │
│                      ┌───────────────────────────┘           │
│                      ▼                                       │
│               ┌──────────────┐                               │
│               │  Se ubriaco: │                               │
│               │  AVVISO! ⚠️  │──▶ Messaggio WhatsApp a te    │
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
Score Finale = (LLM × 40%) + (Pattern × 30%) + (Orario × 15%) + (Contatto × 15%)

Moltiplicatori:
  × 1.2 se tarda notte
  × 1.1 se weekend
```

## 🔒 Privacy

**La tua privacy è la nostra priorità.**

| Aspetto | Garanzia |
|---------|----------|
| **Analisi AI** | 100% locale con Ollama - nessun server esterno |
| **Messaggi** | Mai salvati di default |
| **Credenziali** | Criptate localmente da Baileys |
| **Rete** | Zero traffico verso servizi esterni |
| **Open Source** | Codice completamente verificabile |

### Cosa NON viene mai fatto

- ❌ Invio messaggi a server esterni
- ❌ Salvataggio del contenuto dei messaggi
- ❌ Condivisione di dati con terze parti
- ❌ Analisi in cloud

## 🛠️ Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| **Runtime** | Node.js 20+ |
| **Linguaggio** | TypeScript |
| **WhatsApp** | Baileys |
| **AI/LLM** | Ollama (locale) |
| **Modello** | Llama 3.2 3B |

## 📁 Struttura Progetto

```
DontDrunkText/
├── src/
│   ├── index.ts           # Entry point
│   ├── cli/               # CLI e wizard
│   ├── whatsapp/          # Integrazione WhatsApp
│   ├── analysis/          # Analisi AI e pattern
│   ├── decision/          # Calcolo rischio
│   └── config/            # Gestione configurazione
├── install.sh             # Installer automatico
├── config.example.json    # Template configurazione
└── bin/dontdrunktext      # CLI globale
```

## 🤝 Contributing

I contributi sono benvenuti!

1. Fork del repository
2. Crea un branch (`git checkout -b feature/nuova-feature`)
3. Commit (`git commit -m 'Aggiunge nuova feature'`)
4. Push (`git push origin feature/nuova-feature`)
5. Apri una Pull Request

## 📄 License

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## ⚠️ Disclaimer

Questo software è fornito "così com'è" senza garanzie. L'autore non è responsabile per:
- Messaggi inviati nonostante gli avvisi
- Relazioni rovinate
- Carriere compromesse
- Imbarazzo generale

**La migliore protezione resta sempre: bevi responsabilmente! 🍺**

---

<p align="center">
  <strong>Made with 🍺 and ❤️ to save you from yourself</strong>
</p>

<p align="center">
  <a href="https://github.com/renato-milano/DontDrunkText/issues">Segnala Bug</a> •
  <a href="https://github.com/renato-milano/DontDrunkText/issues">Richiedi Feature</a>
</p>
