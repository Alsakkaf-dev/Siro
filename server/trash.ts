import { newId } from './repo.js';
import type { ParsedImport } from './exportImport.js';

interface Entry {
  data: ParsedImport;
  label: string;
  expires: number;
  makeActive?: string;
}

/** سلة مؤقتة في الذاكرة لدعم «تراجع» بعد الحذف (10 دقائق). */
export class Trash {
  private items = new Map<string, Entry>();
  constructor(private ttlMs = 10 * 60_000) {}

  put(data: ParsedImport, label: string, makeActive?: string): string {
    this.sweep();
    const token = newId();
    this.items.set(token, { data, label, expires: Date.now() + this.ttlMs, ...(makeActive ? { makeActive } : {}) });
    return token;
  }

  take(token: string): Entry | undefined {
    this.sweep();
    const e = this.items.get(token);
    if (e) this.items.delete(token);
    return e;
  }

  private sweep(): void {
    const t = Date.now();
    for (const [k, v] of this.items) if (v.expires < t) this.items.delete(k);
  }
}
