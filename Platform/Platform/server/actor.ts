/** من صاحب الطلب؟ «user» أو «ai» (رأس x-actor من نواة الذكاء في الواجهة) — يُقرأ في record() لوسم السجل. */
import { AsyncLocalStorage } from 'node:async_hooks';

const store = new AsyncLocalStorage<string>();
export const runAs = <T>(actor: string, fn: () => T): T => store.run(actor, fn);
export const currentActor = (): string => store.getStore() ?? 'user';
