import { EventEmitter } from 'events';
import type { AppEvent, MessageEvent, AnalysisEvent, AlertEvent } from '../types/index.js';

type EventHandler<T> = (event: T) => void | Promise<void>;

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Increase max listeners for multiple subscribers
    this.emitter.setMaxListeners(20);
  }

  onMessage(handler: EventHandler<MessageEvent>): void {
    this.emitter.on('message', handler);
  }

  onAnalysis(handler: EventHandler<AnalysisEvent>): void {
    this.emitter.on('analysis', handler);
  }

  onAlert(handler: EventHandler<AlertEvent>): void {
    this.emitter.on('alert', handler);
  }

  emitMessage(event: MessageEvent): void {
    this.emitter.emit('message', event);
  }

  emitAnalysis(event: AnalysisEvent): void {
    this.emitter.emit('analysis', event);
  }

  emitAlert(event: AlertEvent): void {
    this.emitter.emit('alert', event);
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

// Singleton
export const eventBus = new TypedEventBus();
