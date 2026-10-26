import { newId } from './repo.js';
/** سلة مؤقتة في الذاكرة لدعم «تراجع» بعد الحذف (10 دقائق). */
export class Trash {
    ttlMs;
    items = new Map();
    constructor(ttlMs = 10 * 60_000) {
        this.ttlMs = ttlMs;
    }
    put(data, label, makeActive) {
        this.sweep();
        const token = newId();
        this.items.set(token, { data, label, expires: Date.now() + this.ttlMs, ...(makeActive ? { makeActive } : {}) });
        return token;
    }
    take(token) {
        this.sweep();
        const e = this.items.get(token);
        if (e)
            this.items.delete(token);
        return e;
    }
    sweep() {
        const t = Date.now();
        for (const [k, v] of this.items)
            if (v.expires < t)
                this.items.delete(k);
    }
}
