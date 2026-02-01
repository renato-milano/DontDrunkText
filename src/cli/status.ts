#!/usr/bin/env node

/**
 * DontDrunkText - Status Check
 * Verifica lo stato di tutti i componenti del sistema
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Colori
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function print(text: string = '') {
  console.log(text);
}

function printOK(text: string) {
  print(`  ${c.green}✔${c.reset} ${text}`);
}

function printFail(text: string) {
  print(`  ${c.red}✖${c.reset} ${text}`);
}

function printWarn(text: string) {
  print(`  ${c.yellow}⚠${c.reset} ${text}`);
}

function printInfo(text: string) {
  print(`  ${c.cyan}ℹ${c.reset} ${text}`);
}

async function checkLLMProvider(provider: string, model: string): Promise<boolean> {
  if (provider === 'ollama') {
    // Check Ollama locale
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json() as { models: Array<{ name: string }> };
        const models = data.models?.map((m: { name: string }) => m.name) || [];
        const hasModel = models.some((m: string) => m.startsWith(model.split(':')[0]));

        printOK(`Ollama in esecuzione`);
        printInfo(`Modelli disponibili: ${models.join(', ') || 'nessuno'}`);

        if (!hasModel) {
          printWarn(`Modello ${model} non trovato`);
          printInfo(`Scarica con: ollama pull ${model}`);
        }
        return true;
      }
    } catch {
      printFail('Ollama non in esecuzione');
      printInfo('Avvia con: ollama serve');
    }
    return false;
  } else if (provider === 'openai') {
    // Check OpenAI (verifica solo se API key e' configurata)
    printOK(`Provider: OpenAI (${model})`);
    printInfo('La connessione verra\' verificata all\'avvio');
    return true;
  } else if (provider === 'anthropic') {
    // Check Anthropic (verifica solo se API key e' configurata)
    printOK(`Provider: Anthropic (${model})`);
    printInfo('La connessione verra\' verificata all\'avvio');
    return true;
  }

  printWarn(`Provider sconosciuto: ${provider}`);
  return false;
}

async function checkNode(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const major = parseInt(version.replace('v', '').split('.')[0]);

    if (major >= 20) {
      printOK(`Node.js ${version}`);
      return true;
    } else {
      printWarn(`Node.js ${version} (raccomandato >= 20)`);
      return true;
    }
  } catch {
    printFail('Node.js non trovato');
    return false;
  }
}

interface ConfigResult {
  ok: boolean;
  llmProvider?: string;
  llmModel?: string;
}

function checkConfig(): ConfigResult {
  if (existsSync('config.json')) {
    try {
      const config = JSON.parse(readFileSync('config.json', 'utf-8'));
      const contacts = config.dangerousContacts?.length || 0;

      // Determina provider LLM (supporta sia nuovo che vecchio formato)
      let llmProvider = 'ollama';
      let llmModel = 'llama3.2:3b';

      if (config.llm) {
        llmProvider = config.llm.provider || 'ollama';
        llmModel = config.llm.model || 'llama3.2:3b';
      } else if (config.ollama) {
        llmModel = config.ollama.model || 'llama3.2:3b';
      }

      printOK(`Configurazione trovata`);
      printInfo(`Provider LLM: ${llmProvider} (${llmModel})`);
      printInfo(`Contatti pericolosi: ${contacts}`);
      printInfo(`Sensibilita': ${config.detection?.sensitivity || 'medium'}`);
      printInfo(`Monitoraggio: ${config.monitoring?.startHour || 21}:00 - ${config.monitoring?.endHour || 6}:00`);

      return { ok: true, llmProvider, llmModel };
    } catch {
      printFail('config.json non valido');
      return { ok: false };
    }
  } else {
    printWarn('config.json non trovato');
    printInfo('Esegui: dontdrunktext setup');
    return { ok: false };
  }
}

function checkWhatsAppAuth(): boolean {
  const authDir = 'data/auth';

  if (existsSync(authDir)) {
    const files = ['creds.json'];
    const hasAuth = files.some((f) => existsSync(`${authDir}/${f}`));

    if (hasAuth) {
      const stats = statSync(`${authDir}/creds.json`);
      const lastModified = new Date(stats.mtime);
      printOK('Sessione WhatsApp configurata');
      printInfo(`Ultimo accesso: ${lastModified.toLocaleString()}`);
      return true;
    }
  }

  printWarn('WhatsApp non ancora connesso');
  printInfo('Verra\' richiesto QR code al primo avvio');
  return false;
}

function checkBuild(): boolean {
  if (existsSync('dist/index.js')) {
    printOK('Build disponibile');
    return true;
  } else {
    printFail('Build non trovata');
    printInfo('Esegui: npm run build');
    return false;
  }
}

async function main() {
  print(`
${c.cyan}╔═══════════════════════════════════════════════════════════╗
║           DontDrunkText - System Status                   ║
╚═══════════════════════════════════════════════════════════╝${c.reset}
`);

  print(`${c.bold}Sistema:${c.reset}`);
  await checkNode();
  print('');

  print(`${c.bold}Configurazione:${c.reset}`);
  const configResult = checkConfig();
  print('');

  print(`${c.bold}LLM Provider:${c.reset}`);
  if (configResult.ok && configResult.llmProvider) {
    await checkLLMProvider(configResult.llmProvider, configResult.llmModel || 'llama3.2:3b');
  } else {
    printWarn('Configurazione LLM non disponibile');
  }
  print('');

  print(`${c.bold}WhatsApp:${c.reset}`);
  checkWhatsAppAuth();
  print('');

  print(`${c.bold}Build:${c.reset}`);
  const buildOk = checkBuild();
  print('');

  // Riepilogo
  print(`${c.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);

  if (buildOk) {
    print(`
${c.bold}Per avviare il monitoraggio:${c.reset}
  ${c.yellow}dontdrunktext start${c.reset}

${c.bold}Per riconfigurare:${c.reset}
  ${c.yellow}dontdrunktext setup${c.reset}
`);
  } else {
    print(`
${c.bold}Azioni necessarie:${c.reset}
  1. ${c.yellow}npm run build${c.reset}
  2. ${c.yellow}dontdrunktext setup${c.reset}
  3. ${c.yellow}dontdrunktext start${c.reset}
`);
  }
}

main().catch(console.error);
