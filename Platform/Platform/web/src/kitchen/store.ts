/**
 * مخزن المطبخ على العميل: مصدر واحد لأسعار المتجر والسلة والمخزن والمحفظة تقرؤه كل صفحات المطبخ (A1/C/P/W/B1/A2).
 * الانتشار اللحظي (ARC-05): نفس التبويب فورًا (اشتراك مباشر + تحديث متفائل)، تبويبات أخرى بـBroadcastChannel، أجهزة أخرى بـSSE.
 * بلا اتصال: القراءة من آخر لقطة محفوظة ثم من البذرة؛ الكتابة تُمنع برسالة واضحة (لا outbox في هذه المرحلة).
 */
import { useSyncExternalStore } from 'react';
import { DEFAULT_STORE, SEED_PRICES, indexPrices, type CartLine, type PriceIndex, type PricePoint, type SaleUnit } from '../../../shared/kitchen/index.js';

export interface PantryRow { ingredient: string; grams: number; cost_rm: number; bought_at: string | null; min_g: number | null; note: string | null; updated_at: string }
export interface WalletTx { id: string; kind: string; amount_rm: number; ref: string | null; note: string | null; at: string }
export interface WalletView { configured: boolean; budget_rm: number; period: string; period_start: string | null; hard_limit: boolean; balance_rm: number; spent_rm: number; ratio: number | null; level: 'none' | 'ok' | 'warn' | 'full'; txs: WalletTx[] }
export interface ReqRow { id: string; name_ar: string; note: string | null; status: 'pending' | 'approved' | 'rejected'; created_at: string; decided_at: string | null }
export interface AuditRow { id: string; ingredient: string; store: string; old_price: number | null; new_price: number; old_source: string | null; new_source: string; kind: string; reason: string | null; reverted_of: string | null; price_version: number; at: string }
export interface PurchaseOut { id: string; store: string; total_rm: number; balance_after_rm: number; budget_raised_by: number; lines: { ingredient: string; qty: number; unit: string; store: string; grams: number; unit_price_rm: number; line_rm: number }[] }

export interface KState {
  ready: boolean;
  offline: boolean;
  version: number;
  prices: PricePoint[];
  idx: PriceIndex;
  cart: CartLine[];
  pantry: PantryRow[];
  wallet: WalletView | null;
  requests: ReqRow[];
  /** المتجر المختار (A1-10) */
  store: string;
  /** آخر تغيير سعر محلي لعرض «ماذا تغيّر» (B1-03) */
  lastChange: { ingredient: string; store: string; from: number | null; to: number; at: number } | null;
}

export class KitchenApiError extends Error {
  constructor(public status: number, message: string, public code: string = '', public data: Record<string, unknown> = {}) {
    super(message);
  }
}

const CLIENT_ID = (() => {
  try {
    const k = 'kitchen.client';
    let v = sessionStorage.getItem(k);
    if (!v) sessionStorage.setItem(k, (v = `c${Math.random().toString(36).slice(2, 10)}`));
    return v;
  } catch {
    return `c${Math.random().toString(36).slice(2, 10)}`;
  }
})();
const LS_CACHE = 'kitchen.cache.v1';
const LS_STORE = 'kitchen.store';

const lsGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const lsSet = (k: string, v: string): void => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ممنوع/ممتلئ */
  }
};

const seedState = (): KState => ({ ready: false, offline: false, version: 0, prices: [...SEED_PRICES], idx: indexPrices(SEED_PRICES), cart: [], pantry: [], wallet: null, requests: [], store: lsGet(LS_STORE) ?? DEFAULT_STORE, lastChange: null });
let state: KState = seedState();
const listeners = new Set<() => void>();
const emit = (): void => listeners.forEach((l) => l());
function set(patch: Partial<KState>): void {
  const prices = patch.prices ?? state.prices;
  state = { ...state, ...patch, ...(patch.prices ? { idx: indexPrices(prices) } : {}) };
  emit();
}

/* ───── الشبكة ───── */
async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/kitchen${url}`, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-Kitchen-Client': CLIENT_ID } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    set({ offline: true });
    throw new KitchenApiError(0, 'لا اتصال بالخادم — الكتابة غير متاحة الآن.', 'offline');
  }
  const text = await res.text();
  let j: Record<string, unknown> = {};
  try {
    j = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    /* نص */
  }
  if (state.offline) set({ offline: false });
  if (!res.ok) throw new KitchenApiError(res.status, String(j['error'] ?? `خطأ ${res.status}`), String(j['code'] ?? ''), j);
  return j as T;
}

interface StateResp { version: number; prices: PricePoint[]; cart: { ingredient: string; qty: number; unit: SaleUnit; store: string | null }[]; pantry: PantryRow[]; wallet: WalletView; requests: ReqRow[] }
let loading: Promise<void> | null = null;
let again = false;
export function load(): Promise<void> {
  if (loading) {
    again = true; // طلب أثناء التحميل: نعيد بعد انتهائه كي لا نفوّت تغييرًا أحدث
    return loading;
  }
  loading = api<StateResp>('GET', '/state')
    .then((s) => {
      set({ ready: true, offline: false, version: s.version, prices: s.prices, cart: s.cart.map((l) => ({ ...l })), pantry: s.pantry, wallet: s.wallet, requests: s.requests });
      lsSet(LS_CACHE, JSON.stringify({ v: s.version, prices: s.prices, cart: s.cart, pantry: s.pantry, wallet: s.wallet }));
    })
    .catch(() => {
      const c = lsGet(LS_CACHE);
      if (c && !state.ready) {
        try {
          const j = JSON.parse(c) as { v: number; prices: PricePoint[]; cart: CartLine[]; pantry: PantryRow[]; wallet: WalletView };
          set({ ready: true, offline: true, version: j.v, prices: j.prices, cart: j.cart, pantry: j.pantry, wallet: j.wallet });
          return;
        } catch {
          /* لقطة تالفة */
        }
      }
      set({ ready: true, offline: true });
    })
    .finally(() => {
      loading = null;
      if (again) {
        again = false;
        void load();
      }
    });
  return loading;
}

/* ───── الانتشار ───── */
let bc: BroadcastChannel | null = null;
let es: EventSource | null = null;
let refs = 0;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const refresh = (): void => {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void load();
  }, 20);
};
function announce(type: string): void {
  try {
    bc?.postMessage({ type, by: CLIENT_ID, version: state.version });
  } catch {
    /* القناة مغلقة */
  }
}
function connect(): void {
  if (!bc && typeof BroadcastChannel !== 'undefined') {
    bc = new BroadcastChannel('siro-kitchen');
    bc.onmessage = (e: MessageEvent<{ by?: string }>) => {
      if (e.data?.by !== CLIENT_ID) refresh();
    };
  }
  if (!es && typeof EventSource !== 'undefined') {
    es = new EventSource('/api/kitchen/stream');
    es.addEventListener('kitchen', (e) => {
      try {
        const ev = JSON.parse((e as MessageEvent<string>).data) as { by?: string };
        if (ev.by !== CLIENT_ID) refresh();
      } catch {
        /* حدث تالف */
      }
    });
    // بعد انقطاع وعودة: لقطة جديدة تعوّض ما فات
    es.addEventListener('hello', (e) => {
      try {
        const v = (JSON.parse((e as MessageEvent<string>).data) as { version: number }).version;
        if (v !== state.version && state.ready) refresh();
      } catch {
        /* تجاهل */
      }
    });
  }
}
function disconnect(): void {
  bc?.close();
  bc = null;
  es?.close();
  es = null;
}
const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  if (refs++ === 0) {
    connect();
    if (!state.ready) void load();
  }
  return () => {
    listeners.delete(l);
    if (--refs === 0) setTimeout(() => refs === 0 && disconnect(), 5000);
  };
};
export const useKitchen = (): KState => useSyncExternalStore(subscribe, () => state, () => state);
export const getKitchen = (): KState => state;

/* ───── الإجراءات ───── */
export function selectStore(slug: string): void {
  lsSet(LS_STORE, slug);
  set({ store: slug });
}

/** تحديث متفائل فوري (نفس التبويب ≤ 300ms) ثم تأكيد الخادم؛ الفشل يعيد اللقطة الصحيحة. */
export async function setPrice(ingredient: string, store: string, price_rm: number, o: { confirm?: boolean; reason?: string } = {}): Promise<{ warnings: string[] }> {
  const old = state.prices.find((p) => p.ingredient === ingredient && p.store === store);
  const prev = state.prices;
  const point: PricePoint = { ...(old ?? { ingredient, store, price_min: price_rm, price_max: price_rm, confidence: 'medium' as const }), price_rm, price_min: price_rm, price_max: price_rm, source: 'manual', confidence: 'medium', observed_at: new Date().toISOString() };
  delete (point as { unverified?: boolean }).unverified;
  set({ prices: prev.map((p) => (p.ingredient === ingredient && p.store === store ? point : p)), lastChange: { ingredient, store, from: old?.price_rm ?? null, to: price_rm, at: Date.now() } });
  try {
    const r = await api<{ version: number; warnings: string[]; point: PricePoint }>('PUT', `/prices/${ingredient}/${store}`, { price_rm, confirm: !!o.confirm, ...(o.reason ? { reason: o.reason } : {}) });
    set({ version: r.version, prices: state.prices.map((p) => (p.ingredient === ingredient && p.store === store ? r.point : p)) });
    announce('prices');
    return { warnings: r.warnings };
  } catch (e) {
    set({ prices: prev, lastChange: null });
    throw e;
  }
}
async function afterPriceWrite(r: { version: number }): Promise<void> {
  set({ version: r.version });
  announce('prices');
  await load();
}
export async function bulkPercent(store: string, percent: number, o: { category?: string; confirm?: boolean } = {}): Promise<number> {
  const r = await api<{ version: number; changed: number }>('POST', '/prices/bulk', { store, percent, ...(o.category ? { category: o.category } : {}), confirm: !!o.confirm });
  await afterPriceWrite(r);
  return r.changed;
}
export async function copyPrices(from: string, to: string, confirm = false): Promise<number> {
  const r = await api<{ version: number; changed: number }>('POST', '/prices/copy', { from, to, confirm });
  await afterPriceWrite(r);
  return r.changed;
}
export const fetchAudit = (limit = 100): Promise<{ audit: AuditRow[] }> => api('GET', `/prices/audit?limit=${limit}`);
export async function revertAudit(id: string): Promise<void> {
  const r = await api<{ version: number }>('POST', `/prices/audit/${id}/revert`);
  await afterPriceWrite(r);
}

export async function setCartLine(ingredient: string, qty: number, unit: SaleUnit, storeSlug: string | null = null): Promise<void> {
  const prev = state.cart;
  const next = qty <= 0 ? prev.filter((l) => l.ingredient !== ingredient) : prev.some((l) => l.ingredient === ingredient) ? prev.map((l) => (l.ingredient === ingredient ? { ingredient, qty, unit, store: storeSlug } : l)) : [...prev, { ingredient, qty, unit, store: storeSlug }];
  set({ cart: next });
  try {
    const r = await api<{ cart: CartLine[] }>('PUT', `/cart/${ingredient}`, { qty, unit, store: storeSlug });
    set({ cart: r.cart.map((l) => ({ ...l })) });
    announce('cart');
  } catch (e) {
    set({ cart: prev });
    throw e;
  }
}
export const removeCartLine = (ingredient: string): Promise<void> => setCartLine(ingredient, 0, 'g');
export async function clearCart(): Promise<void> {
  const prev = state.cart;
  set({ cart: [] });
  try {
    await api('DELETE', '/cart');
    announce('cart');
  } catch (e) {
    set({ cart: prev });
    throw e;
  }
}
export async function checkout(store: string, increaseBudgetBy?: number): Promise<PurchaseOut> {
  const r = await api<PurchaseOut>('POST', '/checkout', { store, ...(increaseBudgetBy ? { increase_budget_by: increaseBudgetBy } : {}) });
  await load();
  announce('purchase');
  return r;
}
export async function quickBuy(ingredient: string, qty: number, unit: SaleUnit, store: string): Promise<PurchaseOut> {
  const r = await api<PurchaseOut>('POST', '/quick-buy', { ingredient, qty, unit, store });
  await load();
  announce('purchase');
  return r;
}
export async function adjustPantry(ingredient: string, delta_g: number, reason: string): Promise<void> {
  await api('POST', '/pantry/adjust', { ingredient, delta_g, kind: 'adjust', reason });
  await load();
  announce('pantry');
}
export async function setPantryMin(ingredient: string, min_g: number | null): Promise<void> {
  await api('PUT', `/pantry/${ingredient}/min`, { min_g });
  await load();
  announce('pantry');
}
export const fetchPantryMoves = (): Promise<{ moves: { id: string; ingredient: string; delta_g: number; kind: string; reason: string | null; ref: string | null; at: string }[] }> => api('GET', '/pantry');
export async function saveWallet(budget_rm: number, period: 'week' | 'month' | 'custom', hard_limit: boolean): Promise<void> {
  await api('PUT', '/wallet', { budget_rm, period, hard_limit });
  await load();
  announce('wallet');
}
export async function walletAdjust(amount_rm: number, kind: 'adjust' | 'refund', note?: string): Promise<void> {
  await api('POST', '/wallet/adjust', { amount_rm, kind, ...(note ? { note } : {}) });
  await load();
  announce('wallet');
}
export async function requestIngredient(name_ar: string, note?: string): Promise<void> {
  await api('POST', '/ingredient-requests', { name_ar, ...(note ? { note } : {}) });
  await load();
  announce('requests');
}
export async function decideRequest(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  await api('PATCH', `/ingredient-requests/${id}`, { status });
  await load();
  announce('requests');
}
