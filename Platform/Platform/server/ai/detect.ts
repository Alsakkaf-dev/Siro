/** كشف الجهاز: الذاكرة والمعالجات وموديلات Ollama المثبّتة → التوصية وحلّ «auto». */
import os from 'node:os';
import { pickInstalled, recommendModel } from '../../shared/ai.js';

export interface OllamaProbe { reachable: boolean; models: { name: string; size_gb: number }[] }

const cache = new Map<string, { at: number; v: OllamaProbe }>();

export const memoryGb = (): number => Math.round((os.totalmem() / 1024 ** 3) * 10) / 10;
export const cpuCount = (): number => os.cpus().length;

export async function probeOllama(base: string, fetchImpl: typeof fetch = fetch): Promise<OllamaProbe> {
  const hit = cache.get(base);
  if (hit && Date.now() - hit.at < 15_000) return hit.v;
  let v: OllamaProbe = { reachable: false, models: [] };
  try {
    const r = await fetchImpl(`${base.replace(/\/+$/, '')}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (r.ok) {
      const j = (await r.json()) as { models?: { name?: string; model?: string; size?: number }[] };
      v = { reachable: true, models: (j.models ?? []).map((m) => ({ name: m.name ?? m.model ?? '', size_gb: Math.round(((m.size ?? 0) / 1024 ** 3) * 10) / 10 })).filter((m) => m.name) };
    }
  } catch {
    /* غير متاح */
  }
  cache.set(base, { at: Date.now(), v });
  return v;
}

export function clearProbeCache(): void {
  cache.clear();
}

/** «auto» → أفضل مثبّت؛ وإلا الموصى به حسب الذاكرة (سيطلب Ollama تنزيله) */
export function resolveAuto(probe: OllamaProbe, mem = memoryGb()): { model: string; installed: boolean } {
  const best = pickInstalled(probe.models, mem);
  return best ? { model: best, installed: true } : { model: recommendModel(mem), installed: false };
}
