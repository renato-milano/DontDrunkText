#!/usr/bin/env node

// Silence noisy libsignal debug logs
const originalConsoleInfo = console.info;
console.info = (...args: unknown[]) => {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('Closing session')) return;
  originalConsoleInfo.apply(console, args);
};

import { createLogger } from './core/Logger.js';
import { eventBus } from './core/EventBus.js';
import { getConfig } from './config/ConfigManager.js';
import { BaileysClient } from './whatsapp/BaileysClient.js';
import { MessageInterceptor } from './whatsapp/MessageInterceptor.js';
import { AlertSender } from './whatsapp/AlertSender.js';
import { createLLMProvider, PROVIDER_INFO } from './llm/index.js';
import { PatternDetector } from './analysis/PatternDetector.js';
import { DrunkAnalyzer } from './analysis/DrunkAnalyzer.js';
import { RiskCalculator } from './decision/RiskCalculator.js';
import type { WhatsAppMessage } from './types/index.js';

// ASCII Art Banner
const BANNER = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ____              _   ____                  _         ║
║    |  _ \\  ___  _ __ | |_|  _ \\ _ __ _   _ _ __ | | __    ║
║    | | | |/ _ \\| '_ \\| __| | | | '__| | | | '_ \\| |/ /    ║
║    | |_| | (_) | | | | |_| |_| | |  | |_| | | | |   <     ║
║    |____/ \\___/|_| |_|\\__|____/|_|   \\__,_|_| |_|_|\\_\\    ║
║                                                           ║
║              T E X T   M O N I T O R   v1.0               ║
║                                                           ║
║          🍺 Protecting you from drunk texting 🍺          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

async function main() {
  console.log(BANNER);

  // Initialize config
  const config = getConfig();
  const cfg = config.get();

  // Initialize logger
  const logger = createLogger(cfg.privacy.logLevel);

  logger.info('Starting DontDrunkText...');

  // Create LLM provider based on configuration
  const llmConfig = config.getLLMConfig();
  const providerInfo = PROVIDER_INFO[llmConfig.provider];
  logger.info(`Initializing LLM provider: ${providerInfo.name} (${llmConfig.model})`);

  const llmProvider = createLLMProvider(logger, llmConfig);

  // Check provider availability
  const providerAvailable = await llmProvider.isAvailable();
  if (!providerAvailable) {
    logger.error(`LLM provider "${llmConfig.provider}" not available.`);

    if (llmConfig.provider === 'ollama') {
      logger.error('Please ensure Ollama is running:');
      logger.error('  1. Install: https://ollama.com');
      logger.error('  2. Run: ollama serve');
      logger.error(`  3. Pull model: ollama pull ${llmConfig.model}`);
    } else {
      logger.error('Please check:');
      logger.error('  1. API key is configured correctly in config.json');
      logger.error('  2. You have access to the selected model');
      logger.error('  3. Network connectivity to the API');
    }
    process.exit(1);
  }

  const modelInfo = await llmProvider.getInfo();
  if (modelInfo) {
    const sizeInfo = modelInfo.size ? ` (${modelInfo.size})` : '';
    const localInfo = modelInfo.isLocal ? ' [local]' : ' [cloud]';
    logger.info(`LLM ready: ${modelInfo.model}${sizeInfo}${localInfo}`);
  }

  // Initialize components
  const patternDetector = new PatternDetector(logger, config);
  const analyzer = new DrunkAnalyzer(logger, config, llmProvider, patternDetector);
  const riskCalculator = new RiskCalculator(logger, config);
  const interceptor = new MessageInterceptor(logger, config);

  // Initialize WhatsApp client
  logger.info('Connecting to WhatsApp...');
  const whatsapp = new BaileysClient(logger, './data/auth');

  // Initialize alert sender (needs whatsapp client)
  const alertSender = new AlertSender(logger, config, whatsapp);

  // Set up message handler
  whatsapp.onMessage(async (message: WhatsAppMessage) => {
    logger.debug('Outbound message intercepted', {
      to: message.recipientJid.substring(0, 15) + '...',
      length: message.text.length,
    });

    // Normalize and enrich
    const normalized = interceptor.normalize(message);
    const context = interceptor.enrich(normalized);

    // Check if we should analyze
    if (!context.isMonitoringActive) {
      logger.debug('Monitoring not active, skipping analysis');
      return;
    }

    // Emit message event
    eventBus.emitMessage({
      type: 'outbound_message',
      message,
      timestamp: new Date(),
    });

    // Analyze
    logger.debug('Analyzing message...');
    const analysis = await analyzer.analyze(context);

    // Calculate risk
    const assessment = riskCalculator.calculate(analysis, context);

    // Emit analysis event
    eventBus.emitAnalysis({
      type: 'analysis_complete',
      messageId: message.id,
      assessment,
      context,
      timestamp: new Date(),
    });

    // Log result
    const logData = {
      score: assessment.overallScore.toFixed(2),
      level: assessment.alertLevel,
      indicators: assessment.indicators,
    };

    if (assessment.shouldAlert) {
      logger.warn('Drunk pattern detected!', logData);

      // Send alert
      const sent = await alertSender.sendAlert(
        assessment.alertLevel,
        assessment,
        context
      );

      if (sent) {
        eventBus.emitAlert({
          type: 'alert_sent',
          level: assessment.alertLevel,
          recipientJid: message.recipientJid,
          timestamp: new Date(),
        });
      }
    } else {
      logger.debug('Message OK', logData);
    }
  });

  // Connect to WhatsApp
  await whatsapp.connect();

  // Print status
  const monitoringConfig = cfg.monitoring;
  logger.info('Monitoring configuration:');
  logger.info(`  - LLM: ${llmConfig.provider} / ${llmConfig.model}`);
  logger.info(`  - Time window: ${monitoringConfig.startHour}:00 - ${monitoringConfig.endHour}:00`);
  logger.info(`  - Dangerous contacts: ${cfg.dangerousContacts.length}`);
  logger.info(`  - Sensitivity: ${cfg.detection.sensitivity}`);
  logger.info(`  - Alert cooldown: ${cfg.alerts.cooldownMinutes} minutes`);

  if (cfg.dangerousContacts.length > 0) {
    logger.info('Dangerous contacts configured:');
    for (const contact of cfg.dangerousContacts) {
      logger.info(`  - ${contact.name} (${contact.category}) - Risk: ${contact.riskLevel}/10`);
    }
  }

  logger.info('');
  logger.info('DontDrunkText is now active. Press Ctrl+C to stop.');
  logger.info('');

  // Clean up old messages periodically
  setInterval(() => {
    interceptor.cleanOldMessages(60);
  }, 5 * 60 * 1000); // Every 5 minutes

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('\nShutting down...');
    await whatsapp.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\nShutting down...');
    await whatsapp.disconnect();
    process.exit(0);
  });
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
