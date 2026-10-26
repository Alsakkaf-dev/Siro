import type { Db } from './db.js';
import { newId } from './repo.js';

export interface PlatformEvent {
  id: string;
  type: string;
  at: string;
  source: string;
  payload: unknown;
}
type Handler = (e: PlatformEvent) => void;

/** ناقل الأحداث (Event Bus) — في هذه المرحلة يسجّل الأحداث فقط، والقواعد تأتي لاحقًا. */
export class EventBus {
  private handlers = new Map<string, Handler[]>();
  constructor(private getDb: () => Db) {}

  on(type: string, h: Handler): void {
    const arr = this.handlers.get(type) ?? [];
    arr.push(h);
    this.handlers.set(type, arr);
  }

  publish(type: string, source: string, payload: unknown): PlatformEvent {
    const e: PlatformEvent = { id: newId(), type, at: new Date().toISOString(), source, payload };
    try {
      this.getDb().run('INSERT INTO core_events (id, type, at, source, payload) VALUES (?, ?, ?, ?, ?)', e.id, e.type, e.at, e.source, JSON.stringify(payload ?? null));
    } catch (err) {
      console.warn('[events] تعذّر تسجيل الحدث', err);
    }
    for (const h of this.handlers.get(type) ?? []) {
      try {
        h(e);
      } catch (err) {
        console.warn('[events] خطأ في معالج', type, err);
      }
    }
    return e;
  }
}
