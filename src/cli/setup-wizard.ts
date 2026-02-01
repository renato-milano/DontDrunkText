#!/usr/bin/env node

/**
 * DontDrunkText - Setup Wizard
 * Configurazione guidata interattiva per utenti non tecnici
 */

import * as readline from 'readline';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import type { Config, DangerousContact, ContactCategory } from '../types/index.js';

// Colori ANSI
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
};

const c = colors;

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function clear() {
  console.clear();
}

function print(text: string = '') {
  console.log(text);
}

function printBanner() {
  print(`
${c.purple}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║${c.cyan}     ____              _   ____                  _         ${c.purple}║
║${c.cyan}    |  _ \\  ___  _ __ | |_|  _ \\ _ __ _   _ _ __ | | __    ${c.purple}║
║${c.cyan}    | | | |/ _ \\| '_ \\| __| | | | '__| | | | '_ \\| |/ /    ${c.purple}║
║${c.cyan}    | |_| | (_) | | | | |_| |_| | |  | |_| | | | |   <     ${c.purple}║
║${c.cyan}    |____/ \\___/|_| |_|\\__|____/|_|   \\__,_|_| |_|_|\\_\\    ${c.purple}║
║                                                           ║
║${c.yellow}            S E T U P   W I Z A R D                         ${c.purple}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${c.reset}
`);
}

function printSection(title: string) {
  print(`\n${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  print(`${c.bold}${c.cyan}${title}${c.reset}`);
  print(`${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);
}

function printSuccess(text: string) {
  print(`${c.green}✔ ${text}${c.reset}`);
}

function printInfo(text: string) {
  print(`${c.cyan}ℹ ${text}${c.reset}`);
}

function printWarning(text: string) {
  print(`${c.yellow}⚠ ${text}${c.reset}`);
}

// Carica configurazione esistente o default
function loadConfig(): Config {
  const configPath = 'config.json';
  const examplePath = 'config.example.json';

  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } else if (existsSync(examplePath)) {
    return JSON.parse(readFileSync(examplePath, 'utf-8'));
  } else {
    // Config minimale
    return {
      ollama: {
        model: 'llama3.2:3b',
        baseUrl: 'http://localhost:11434',
        timeout: 30000,
      },
      monitoring: {
        enabled: true,
        startHour: 21,
        endHour: 6,
        timezone: 'Europe/Rome',
        alwaysMonitorDangerousContacts: true,
      },
      dangerousContacts: [],
      detection: {
        sensitivity: 'medium',
        minScore: 0.6,
        weights: { llm: 0.4, pattern: 0.3, time: 0.15, contact: 0.15 },
        emotionalKeywords: [
          'ti amo', 'mi manchi', 'perche non rispondi',
          'dobbiamo parlare', 'sei sveglio', 'ti odio',
        ],
      },
      alerts: {
        enabled: true,
        cooldownMinutes: 30,
        selfAlert: true,
        messages: {
          warning: 'Hey, sembra che tu stia scrivendo in uno stato alterato. Forse e\' meglio aspettare domani?',
          danger: 'ATTENZIONE: Stai scrivendo a un contatto \'pericoloso\' e sembri ubriaco. Metti giu\' il telefono!',
          critical: 'STOP! Pattern molto preoccupante rilevato. Ti consiglio fortemente di non continuare.',
        },
      },
      privacy: {
        saveMessageContent: false,
        logLevel: 'info',
      },
    };
  }
}

function saveConfig(config: Config) {
  writeFileSync('config.json', JSON.stringify(config, null, 2));
}

// Validazione numero di telefono
function validatePhone(phone: string): string | null {
  // Rimuovi spazi e trattini
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Aggiungi + se manca
  if (!cleaned.startsWith('+')) {
    // Se inizia con 00, sostituisci con +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    } else if (cleaned.startsWith('39')) {
      cleaned = '+' + cleaned;
    } else if (/^\d{10}$/.test(cleaned)) {
      // Numero italiano senza prefisso
      cleaned = '+39' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  // Verifica formato base
  if (!/^\+\d{10,15}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

// Step 1: Benvenuto
async function stepWelcome(): Promise<boolean> {
  clear();
  printBanner();

  print(`${c.bold}Benvenuto nel wizard di configurazione di DontDrunkText!${c.reset}\n`);
  print('Questo wizard ti guidera\' nella configurazione del sistema per');
  print('proteggerti dai messaggi inviati in stato alterato.\n');

  print(`${c.bold}Cosa faremo:${c.reset}`);
  print('  1. Configureremo i contatti "pericolosi" (ex, crush, capo...)');
  print('  2. Imposteremo gli orari di monitoraggio');
  print('  3. Sceglieremo il livello di sensibilita\'');
  print('');

  const answer = await question(`${c.cyan}Pronto per iniziare? [S/n]: ${c.reset}`);
  return answer.toLowerCase() !== 'n';
}

// Step 2: Contatti pericolosi
async function stepContacts(config: Config): Promise<void> {
  printSection('CONTATTI PERICOLOSI');

  print('I "contatti pericolosi" sono persone a cui NON dovresti scrivere');
  print('quando sei in stato alterato (ex, crush, capo, ecc.).\n');

  const contacts: DangerousContact[] = [];

  const categories: { key: ContactCategory; label: string; desc: string }[] = [
    { key: 'ex', label: 'Ex partner', desc: 'Il/la tuo/a ex' },
    { key: 'crush', label: 'Crush/Interesse', desc: 'Qualcuno che ti piace' },
    { key: 'boss', label: 'Capo/Superiore', desc: 'Il tuo capo al lavoro' },
    { key: 'colleague', label: 'Collega', desc: 'Colleghi di lavoro' },
    { key: 'family', label: 'Familiare', desc: 'Genitori, parenti...' },
    { key: 'friend', label: 'Amico', desc: 'Amici stretti' },
  ];

  let addMore = true;

  while (addMore) {
    print(`\n${c.bold}Aggiungi un contatto pericoloso:${c.reset}\n`);

    // Nome
    const name = await question(`  ${c.cyan}Nome${c.reset} (es. "Maria Ex"): `);
    if (!name) {
      printWarning('Nome non valido, riprova');
      continue;
    }

    // Telefono
    let phone = '';
    let validPhone = false;
    while (!validPhone) {
      const phoneInput = await question(`  ${c.cyan}Numero di telefono${c.reset} (es. +39 123 456 7890): `);
      const validated = validatePhone(phoneInput);
      if (validated) {
        phone = validated;
        validPhone = true;
      } else {
        printWarning('Numero non valido. Usa formato internazionale (es. +39...)');
      }
    }

    // Categoria
    print(`\n  ${c.cyan}Categoria:${c.reset}`);
    categories.forEach((cat, i) => {
      print(`    ${i + 1}. ${cat.label} - ${c.yellow}${cat.desc}${c.reset}`);
    });

    let category: ContactCategory = 'custom';
    const catAnswer = await question(`\n  Scegli (1-${categories.length}): `);
    const catIndex = parseInt(catAnswer) - 1;
    if (catIndex >= 0 && catIndex < categories.length) {
      category = categories[catIndex].key;
    }

    // Risk level
    print(`\n  ${c.cyan}Livello di rischio${c.reset} (1-10):`);
    print(`    1-3: Basso (meglio evitare ma non grave)`);
    print(`    4-6: Medio (potrebbe essere imbarazzante)`);
    print(`    7-9: Alto (conseguenze serie)`);
    print(`    10:  Massimo (assolutamente da evitare)`);

    let riskLevel = 7;
    const riskAnswer = await question(`\n  Livello [1-10, default 7]: `);
    if (riskAnswer) {
      const parsed = parseInt(riskAnswer);
      if (parsed >= 1 && parsed <= 10) {
        riskLevel = parsed;
      }
    }

    // Aggiungi contatto
    contacts.push({
      name,
      phone,
      category,
      riskLevel,
    });

    printSuccess(`Contatto "${name}" aggiunto (${category}, rischio: ${riskLevel}/10)`);

    // Altro contatto?
    print('');
    const moreAnswer = await question(`${c.cyan}Aggiungere un altro contatto? [s/N]: ${c.reset}`);
    addMore = moreAnswer.toLowerCase() === 's';
  }

  config.dangerousContacts = contacts;

  if (contacts.length > 0) {
    print(`\n${c.green}Contatti configurati: ${contacts.length}${c.reset}`);
    contacts.forEach((ct) => {
      print(`  • ${ct.name} (${ct.category}) - Rischio: ${ct.riskLevel}/10`);
    });
  } else {
    printWarning('Nessun contatto configurato. Puoi aggiungerli dopo modificando config.json');
  }
}

// Step 3: Orari di monitoraggio
async function stepSchedule(config: Config): Promise<void> {
  printSection('ORARI DI MONITORAGGIO');

  print('Quando vuoi che il sistema ti monitori?');
  print('Di solito i messaggi "pericolosi" vengono inviati di notte...\n');

  // Ora inizio
  print(`${c.cyan}Ora di INIZIO monitoraggio${c.reset} (quando inizia la "zona pericolosa")`);
  const startAnswer = await question(`  Ora [0-23, default 21 (9 PM)]: `);
  let startHour = 21;
  if (startAnswer) {
    const parsed = parseInt(startAnswer);
    if (parsed >= 0 && parsed <= 23) {
      startHour = parsed;
    }
  }

  // Ora fine
  print(`\n${c.cyan}Ora di FINE monitoraggio${c.reset} (quando finisce la "zona pericolosa")`);
  const endAnswer = await question(`  Ora [0-23, default 6 (6 AM)]: `);
  let endHour = 6;
  if (endAnswer) {
    const parsed = parseInt(endAnswer);
    if (parsed >= 0 && parsed <= 23) {
      endHour = parsed;
    }
  }

  config.monitoring.startHour = startHour;
  config.monitoring.endHour = endHour;

  // Monitoraggio sempre per contatti pericolosi
  print(`\n${c.cyan}Monitorare SEMPRE i contatti pericolosi?${c.reset}`);
  print('  Se attivo, i contatti pericolosi vengono monitorati 24/7');
  const alwaysAnswer = await question(`  Attivare? [S/n]: `);
  config.monitoring.alwaysMonitorDangerousContacts = alwaysAnswer.toLowerCase() !== 'n';

  printSuccess(`Monitoraggio: ${startHour}:00 - ${endHour}:00`);
  if (config.monitoring.alwaysMonitorDangerousContacts) {
    printInfo('Contatti pericolosi monitorati 24/7');
  }
}

// Step 4: Sensibilita'
async function stepSensitivity(config: Config): Promise<void> {
  printSection('SENSIBILITA\' RILEVAMENTO');

  print('Quanto deve essere sensibile il sistema nel rilevare');
  print('messaggi potenzialmente "ubriachi"?\n');

  print(`${c.bold}Livelli disponibili:${c.reset}\n`);
  print(`  ${c.green}1. Bassa${c.reset}     - Pochi alert, solo casi evidenti`);
  print(`               Ideale se non vuoi troppi falsi allarmi`);
  print('');
  print(`  ${c.yellow}2. Media${c.reset}    - Bilanciato (raccomandato)`);
  print(`               Buon compromesso tra precisione e copertura`);
  print('');
  print(`  ${c.red}3. Alta${c.reset}     - Piu' alert, maggiore cautela`);
  print(`               Se vuoi essere sicuro di non sbagliare`);
  print('');
  print(`  ${c.purple}4. Paranoica${c.reset} - Alert frequenti`);
  print(`               Massima protezione, possibili falsi positivi`);
  print('');

  const sensAnswer = await question(`Scegli [1-4, default 2]: `);
  const sensMap: Record<string, 'low' | 'medium' | 'high' | 'paranoid'> = {
    '1': 'low',
    '2': 'medium',
    '3': 'high',
    '4': 'paranoid',
  };

  config.detection.sensitivity = sensMap[sensAnswer] || 'medium';
  printSuccess(`Sensibilita' impostata: ${config.detection.sensitivity}`);
}

// Step 5: Riepilogo
async function stepSummary(config: Config): Promise<boolean> {
  printSection('RIEPILOGO CONFIGURAZIONE');

  print(`${c.bold}Contatti pericolosi:${c.reset}`);
  if (config.dangerousContacts.length === 0) {
    print('  Nessuno configurato');
  } else {
    config.dangerousContacts.forEach((ct) => {
      print(`  • ${ct.name} (${ct.category}) - ${ct.phone} - Rischio: ${ct.riskLevel}/10`);
    });
  }

  print(`\n${c.bold}Monitoraggio:${c.reset}`);
  print(`  • Orari: ${config.monitoring.startHour}:00 - ${config.monitoring.endHour}:00`);
  print(`  • Sempre per contatti pericolosi: ${config.monitoring.alwaysMonitorDangerousContacts ? 'Si' : 'No'}`);

  print(`\n${c.bold}Rilevamento:${c.reset}`);
  print(`  • Sensibilita': ${config.detection.sensitivity}`);

  print(`\n${c.bold}Alert:${c.reset}`);
  print(`  • Cooldown: ${config.alerts.cooldownMinutes} minuti`);

  print('');
  const confirm = await question(`${c.cyan}Salvare questa configurazione? [S/n]: ${c.reset}`);
  return confirm.toLowerCase() !== 'n';
}

// Step 6: Completamento
function stepComplete() {
  print(`
${c.green}═══════════════════════════════════════════════════════════════${c.reset}
${c.green}              CONFIGURAZIONE COMPLETATA!                        ${c.reset}
${c.green}═══════════════════════════════════════════════════════════════${c.reset}

${c.bold}Per avviare il monitoraggio:${c.reset}

  ${c.yellow}dontdrunktext start${c.reset}

${c.bold}Al primo avvio:${c.reset}
  • Apparira' un QR code
  • Scansionalo con WhatsApp (Impostazioni > Dispositivi collegati)
  • Il sistema iniziera' a monitorare i tuoi messaggi

${c.bold}Altri comandi utili:${c.reset}
  ${c.cyan}dontdrunktext setup${c.reset}   - Riconfigura
  ${c.cyan}dontdrunktext status${c.reset}  - Mostra stato
  ${c.cyan}dontdrunktext help${c.reset}    - Aiuto

${c.purple}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.bold}Buona protezione! 🍺➡️🚫📱${c.reset}
`);
}

// Main
async function main() {
  try {
    // Step 1: Benvenuto
    const proceed = await stepWelcome();
    if (!proceed) {
      print('\nConfigurazione annullata.');
      rl.close();
      return;
    }

    // Carica config
    const config = loadConfig();

    // Step 2: Contatti
    await stepContacts(config);

    // Step 3: Orari
    await stepSchedule(config);

    // Step 4: Sensibilita'
    await stepSensitivity(config);

    // Step 5: Riepilogo
    const save = await stepSummary(config);

    if (save) {
      saveConfig(config);
      printSuccess('Configurazione salvata in config.json');
      stepComplete();
    } else {
      printWarning('Configurazione NON salvata');
    }
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    rl.close();
  }
}

main();
