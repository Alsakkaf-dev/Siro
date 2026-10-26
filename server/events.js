import { newId } from './repo.js';
/** ناقل الأحداث (Event Bus) — في هذه المرحلة يسجّل الأحداث فقط، والقواعد تأتي لاحقًا. */
export class EventBus {
    getDb;
    handlers = new Map();
    constructor(getDb) {
        this.getDb = getDb;
    }
    on(type, h) {
        const arr = this.handlers.get(type) ?? [];
        arr.push(h);
        this.handlers.set(type, arr);
    }
    publish(type, source, payload) {
        const e = { id: newId(), type, at: new Date().toISOString(), source, payload };
        try {
            this.getDb().run('INSERT INTO core_events (id, type, at, source, payload) VALUES (?, ?, ?, ?, ?)', e.id, e.type, e.at, e.source, JSON.stringify(payload ?? null));
        }
        catch (err) {
            console.warn('[events] تعذّر تسجيل الحدث', err);
        }
        for (const h of this.handlers.get(type) ?? []) {
            try {
                h(e);
            }
            catch (err) {
                console.warn('[events] خطأ في معالج', type, err);
            }
        }
        return e;
    }
}
