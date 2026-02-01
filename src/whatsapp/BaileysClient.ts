import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  WAMessage,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { rmSync } from 'fs';
import type { Logger, WhatsAppMessage } from '../types/index.js';
import { createSilentLogger } from '../core/Logger.js';

export type MessageHandler = (message: WhatsAppMessage) => void | Promise<void>;

export class BaileysClient {
  private sock: WASocket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private logger: Logger;
  private authDir: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(logger: Logger, authDir: string = './data/auth') {
    this.logger = logger;
    this.authDir = authDir;
  }

  async connect(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

    this.sock = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      logger: createSilentLogger(),
    });

    // Handle connection updates
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Handle QR code - print it for user to scan
      if (qr) {
        console.log('\n');
        this.logger.info('========================================');
        this.logger.info('  Scan this QR code with WhatsApp:');
        this.logger.info('  (Settings > Linked Devices > Link)');
        this.logger.info('========================================');
        console.log('');
        qrcode.generate(qr, { small: true });
        console.log('');
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        this.isConnected = false;

        if (reason === DisconnectReason.loggedOut) {
          // Sessione scaduta/invalidata - cancella auth e riconnetti per nuovo QR
          this.logger.warn('Session expired or logged out. Clearing auth and requesting new QR...');
          try {
            rmSync(this.authDir, { recursive: true, force: true });
          } catch {
            // Ignora errori di cancellazione
          }
          this.reconnectAttempts = 0;
          setTimeout(() => this.connect(), 2000);
        } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.logger.info(`Connection closed (${reason}). Reconnecting... Attempt ${this.reconnectAttempts}`);
          setTimeout(() => this.connect(), 5000);
        } else {
          this.logger.error(`Connection failed after ${this.maxReconnectAttempts} attempts`);
        }
      }

      if (connection === 'open') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        const user = this.sock?.user;
        this.logger.info(`Connected as: ${user?.id || 'unknown'}`);
      }
    });

    // Save credentials on update
    this.sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages (including our own!)
    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      // Only process real-time messages
      if (type !== 'notify') return;

      for (const msg of messages) {
        await this.processMessage(msg);
      }
    });
  }

  private async processMessage(msg: WAMessage): Promise<void> {
    // Skip if no key
    if (!msg.key) return;

    // IMPORTANT: We only care about messages WE sent (fromMe = true)
    if (!msg.key.fromMe) return;

    // Skip status and broadcast
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;
    if (remoteJid.endsWith('@broadcast') || remoteJid.endsWith('@status')) return;

    // Extract text content
    const text = this.extractText(msg);
    if (!text) return; // Skip non-text messages

    const whatsappMessage: WhatsAppMessage = {
      id: msg.key.id || '',
      text,
      recipientJid: remoteJid,
      recipientName: msg.pushName || undefined,
      timestamp: new Date(Number(msg.messageTimestamp) * 1000),
      fromMe: true,
    };

    // Notify all handlers
    for (const handler of this.messageHandlers) {
      try {
        await handler(whatsappMessage);
      } catch (error) {
        this.logger.error('Message handler error', { error });
      }
    }
  }

  private extractText(msg: WAMessage): string | null {
    const message = msg.message;
    if (!message) return null;

    // Try different message types
    if (message.conversation) {
      return message.conversation;
    }
    if (message.extendedTextMessage?.text) {
      return message.extendedTextMessage.text;
    }
    if (message.imageMessage?.caption) {
      return message.imageMessage.caption;
    }
    if (message.videoMessage?.caption) {
      return message.videoMessage.caption;
    }

    return null;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      this.logger.error('Cannot send message: not connected');
      return;
    }

    try {
      await this.sock.sendMessage(jid, { text });
      this.logger.debug('Message sent', { jid: jid.substring(0, 10) + '...' });
    } catch (error) {
      this.logger.error('Failed to send message', { error });
    }
  }

  async sendSelfMessage(text: string): Promise<void> {
    if (!this.sock?.user?.id) {
      this.logger.error('Cannot send self message: user not available');
      return;
    }

    // Send to our own number
    const selfJid = this.sock.user.id.replace(/:.*@/, '@');
    await this.sendMessage(selfJid, text);
  }

  getMyJid(): string | null {
    return this.sock?.user?.id || null;
  }

  isReady(): boolean {
    return this.isConnected && this.sock !== null;
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      // Rimuovi tutti i listener
      this.sock.ev.removeAllListeners('connection.update');
      this.sock.ev.removeAllListeners('creds.update');
      this.sock.ev.removeAllListeners('messages.upsert');
      // Solo chiudi la connessione, NON fare logout (invaliderebbe la sessione)
      this.sock.end(undefined);
      this.sock = null;
      this.isConnected = false;
    }
  }
}
