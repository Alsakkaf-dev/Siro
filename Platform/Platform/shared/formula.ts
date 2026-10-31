/** لغة معادلات آمنة للحقول المحسوبة — محلّل نزولي بلا eval.
 *  أمثلة: `{السعر} * {الكمية}` ، `if({الحالة} == "done", 100, {التقدم})` ، `days(today(), {due})`
 *  الأخطاء قيم نصية تبدأ بـ «#خطأ» ولا تُرمى للخارج. */

export type FVal = number | string | boolean | null;
type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'field'; name: string }
  | { t: 'un'; op: string; a: Node }
  | { t: 'bin'; op: string; a: Node; b: Node }
  | { t: 'call'; fn: string; args: Node[] };

interface Tok { k: 'num' | 'str' | 'field' | 'id' | 'op' | '(' | ')' | ','; v: string }

const MAX_LEN = 500;
const MAX_DEPTH = 64;

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j]!)) j++;
      out.push({ k: 'num', v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = '';
      while (j < src.length && src[j] !== c) { if (src[j] === '\\' && j + 1 < src.length) j++; s += src[j]; j++; }
      if (j >= src.length) throw new Error('نص غير مغلق');
      out.push({ k: 'str', v: s });
      i = j + 1;
      continue;
    }
    if (c === '{') {
      const j = src.indexOf('}', i);
      if (j < 0) throw new Error('حقل غير مغلق «{»');
      out.push({ k: 'field', v: src.slice(i + 1, j).trim() });
      i = j + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) { out.push({ k: 'op', v: two }); i += 2; continue; }
    if ('+-*/%<>&!'.includes(c)) { out.push({ k: 'op', v: c }); i++; continue; }
    if (c === '(' || c === ')' || c === ',') { out.push({ k: c, v: c }); i++; continue; }
    if (/[\p{L}_]/u.test(c)) {
      let j = i;
      while (j < src.length && /[\p{L}\p{N}_]/u.test(src[j]!)) j++;
      out.push({ k: 'id', v: src.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`رمز غير متوقع «${c}»`);
  }
  return out;
}

const PREC: Record<string, number> = { '||': 1, or: 1, '&&': 2, and: 2, '==': 3, '!=': 3, '<': 4, '<=': 4, '>': 4, '>=': 4, '&': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7 };

export function parseFormula(src: string): Node {
  if (src.length > MAX_LEN) throw new Error('المعادلة طويلة جدًا');
  const toks = tokenize(src);
  let p = 0;
  let depth = 0;
  const peek = (): Tok | undefined => toks[p];
  const opOf = (t: Tok | undefined): string | null => (t?.k === 'op' ? t.v : t?.k === 'id' && (t.v === 'and' || t.v === 'or') ? t.v : null);
  const primary = (): Node => {
    if (++depth > MAX_DEPTH) throw new Error('المعادلة معقدة جدًا');
    const t = toks[p++];
    if (!t) throw new Error('نهاية غير متوقعة');
    let n: Node;
    if (t.k === 'num') {
      const v = Number(t.v);
      if (!Number.isFinite(v)) throw new Error(`رقم غير صالح ${t.v}`);
      n = { t: 'num', v };
    } else if (t.k === 'str') n = { t: 'str', v: t.v };
    else if (t.k === 'field') n = { t: 'field', name: t.v };
    else if (t.k === '(') {
      n = expr(0);
      if (toks[p++]?.k !== ')') throw new Error('قوس «)» مفقود');
    } else if (t.k === 'op' && (t.v === '-' || t.v === '!')) n = { t: 'un', op: t.v, a: primary() };
    else if (t.k === 'id') {
      if (t.v === 'true' || t.v === 'false') n = { t: 'bool', v: t.v === 'true' };
      else if (t.v === 'not') n = { t: 'un', op: '!', a: primary() };
      else if (peek()?.k === '(') {
        p++;
        const args: Node[] = [];
        if (peek()?.k !== ')') {
          for (;;) {
            args.push(expr(0));
            if (peek()?.k === ',') { p++; continue; }
            break;
          }
        }
        if (toks[p++]?.k !== ')') throw new Error(`قوس «)» مفقود بعد ${t.v}`);
        n = { t: 'call', fn: t.v.toLowerCase(), args };
      } else n = { t: 'field', name: t.v };
    } else throw new Error(`رمز غير متوقع «${t.v}»`);
    depth--;
    return n;
  };
  const expr = (minPrec: number): Node => {
    let left = primary();
    for (;;) {
      const op = opOf(peek());
      if (!op || (PREC[op] ?? 0) < minPrec) break;
      p++;
      const right = expr((PREC[op] ?? 0) + 1);
      left = { t: 'bin', op, a: left, b: right };
    }
    return left;
  };
  const n = expr(0);
  if (p < toks.length) throw new Error(`رمز زائد «${toks[p]!.v}»`);
  return n;
}

const DAY = 86_400_000;
const toNum = (v: FVal): number => (typeof v === 'number' ? v : typeof v === 'boolean' ? Number(v) : v === null || v === '' ? 0 : Number(v));
const toStr = (v: FVal): string => (v === null ? '' : String(v));
const truthy = (v: FVal): boolean => (typeof v === 'string' ? v !== '' : Boolean(v));
const dayMs = (v: FVal): number => {
  const s = toStr(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : Number.NaN;
};

const FUNCS: Record<string, (a: FVal[], now: Date) => FVal> = {
  if: (a) => (truthy(a[0] ?? null) ? (a[1] ?? null) : (a[2] ?? null)),
  round: (a) => { const d = Math.max(0, Math.min(10, toNum(a[1] ?? 0))); const f = 10 ** d; return Math.round(toNum(a[0] ?? 0) * f) / f; },
  abs: (a) => Math.abs(toNum(a[0] ?? 0)),
  min: (a) => (a.length ? Math.min(...a.map(toNum)) : null),
  max: (a) => (a.length ? Math.max(...a.map(toNum)) : null),
  sum: (a) => a.reduce<number>((s, x) => s + toNum(x), 0),
  avg: (a) => (a.length ? a.reduce<number>((s, x) => s + toNum(x), 0) / a.length : null),
  len: (a) => toStr(a[0] ?? null).length,
  lower: (a) => toStr(a[0] ?? null).toLowerCase(),
  upper: (a) => toStr(a[0] ?? null).toUpperCase(),
  concat: (a) => a.map(toStr).join(''),
  contains: (a) => toStr(a[0] ?? null).toLowerCase().includes(toStr(a[1] ?? null).toLowerCase()),
  coalesce: (a) => a.find((x) => x !== null && x !== '') ?? null,
  today: (_a, now) => new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
  days: (a) => { const x = dayMs(a[0] ?? null); const y = dayMs(a[1] ?? null); return Number.isNaN(x) || Number.isNaN(y) ? null : Math.round((y - x) / DAY); },
  year: (a) => { const x = dayMs(a[0] ?? null); return Number.isNaN(x) ? null : new Date(x).getUTCFullYear(); },
  month: (a) => { const x = dayMs(a[0] ?? null); return Number.isNaN(x) ? null : new Date(x).getUTCMonth() + 1; },
};
export const FORMULA_FUNCTIONS = Object.keys(FUNCS);

function evalNode(n: Node, get: (name: string) => FVal, now: Date): FVal {
  switch (n.t) {
    case 'num':
    case 'str':
    case 'bool':
      return n.v;
    case 'field':
      return get(n.name);
    case 'un': {
      const a = evalNode(n.a, get, now);
      return n.op === '-' ? -toNum(a) : !truthy(a);
    }
    case 'bin': {
      if (n.op === '&&' || n.op === 'and') return truthy(evalNode(n.a, get, now)) && truthy(evalNode(n.b, get, now));
      if (n.op === '||' || n.op === 'or') return truthy(evalNode(n.a, get, now)) || truthy(evalNode(n.b, get, now));
      const a = evalNode(n.a, get, now);
      const b = evalNode(n.b, get, now);
      switch (n.op) {
        case '+': return typeof a === 'string' || typeof b === 'string' ? (Number.isNaN(Number(a)) || Number.isNaN(Number(b)) ? toStr(a) + toStr(b) : toNum(a) + toNum(b)) : toNum(a) + toNum(b);
        case '-': return toNum(a) - toNum(b);
        case '*': return toNum(a) * toNum(b);
        case '/': return toNum(b) === 0 ? null : toNum(a) / toNum(b);
        case '%': return toNum(b) === 0 ? null : toNum(a) % toNum(b);
        case '&': return toStr(a) + toStr(b);
        case '==': return toStr(a) === toStr(b);
        case '!=': return toStr(a) !== toStr(b);
        case '<': return typeof a === 'string' && typeof b === 'string' ? a < b : toNum(a) < toNum(b);
        case '<=': return typeof a === 'string' && typeof b === 'string' ? a <= b : toNum(a) <= toNum(b);
        case '>': return typeof a === 'string' && typeof b === 'string' ? a > b : toNum(a) > toNum(b);
        case '>=': return typeof a === 'string' && typeof b === 'string' ? a >= b : toNum(a) >= toNum(b);
      }
      return null;
    }
    case 'call': {
      const f = FUNCS[n.fn];
      if (!f) throw new Error(`دالة غير معروفة: ${n.fn}`);
      return f(n.args.map((x) => evalNode(x, get, now)), now);
    }
  }
}

/** يقيّم المعادلة؛ يعيد قيمة أو نص خطأ يبدأ بـ «#خطأ» */
export function evaluateFormula(src: string, get: (name: string) => FVal, now: Date = new Date()): FVal {
  try {
    const v = evalNode(parseFormula(src), get, now);
    if (typeof v === 'number' && !Number.isFinite(v)) return null;
    return typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v;
  } catch (e) {
    return `#خطأ: ${(e as Error).message}`;
  }
}

/** فحص صحة المعادلة دون تقييم (للنماذج) */
export function checkFormula(src: string): string | null {
  try {
    parseFormula(src);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
