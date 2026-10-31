import type { Db } from './db.js';
import { getDoc, readStatic } from './lifeStore.js';
import {
  type ContentStatus, type LifeContentName, LIFE_DATA_FILES, LIFE_FILE_LABEL, checkShape,
  type LifeData, type LifeFile, type LifeFileResult, type LifeFileStatus, type LifeStatus,
} from '../shared/life.js';
import { checkContent } from '../shared/sports.js';
import { checkInsights, checkLedger, checkQadaPlan, checkFieldLabels, checkRoutineBlocks } from '../shared/v8.js';

/** منصة الحياة: البيانات داخل قاعدة التطبيق نفسها (life_docs)، والمحتوى الثابت من seed/content. */

export function lifeStatus(db: Db, nowMs = Date.now()): LifeStatus {
  const files: LifeFileStatus[] = LIFE_DATA_FILES.map((name) => {
    const { data, updated_at } = getDoc(db, name);
    const bad = data ? checkShape(name, data) : 'البيانات غير موجودة';
    return {
      name,
      label: LIFE_FILE_LABEL[name],
      state: bad ? 'unavailable' : 'fresh',
      generated_at: updated_at,
      age_hours: null,
      stale_after_hours: null,
      mtime: updated_at,
      error: bad,
    };
  });
  return {
    files,
    worst: files.some((f) => f.error) ? 'unavailable' : 'fresh',
    now: new Date(nowMs).toISOString(),
  };
}

export function readLifeFile<K extends LifeFile>(db: Db, name: K, nowMs = Date.now()): LifeFileResult<K> {
  const status = lifeStatus(db, nowMs).files.find((f) => f.name === name)!;
  const { data } = getDoc<LifeData[K]>(db, name);
  return { name, data: (status.error ? null : data) as LifeData[K], status };
}

const checkers: Record<string, (d: unknown) => string | null> = {
  'ledger_full.json': checkLedger,
  'ROUTINE_BLOCKS_AR.json': checkRoutineBlocks,
  'FINANCE_INSIGHTS_AR.json': checkInsights,
  'PRAYER_QADA_PLAN_AR.json': checkQadaPlan,
  'FIELD_LABELS_AR.json': checkFieldLabels,
};

/** محتوى ثابت (تمارين / قوالب / قاموس / بدائل...) أو الدفتر الكامل الحي. */
export function readContent(db: Db, name: LifeContentName): { name: string; data: unknown; status: ContentStatus } {
  let data: unknown = name === 'ledger_full.json' ? getDoc(db, 'ledger_full').data : readStatic(name);
  let error: string | null = data ? null : 'المحتوى غير متاح';
  if (data) {
    const bad = checkContent(name, data) ?? checkers[name]?.(data) ?? null;
    if (bad) {
      error = `تغيّر تنسيق الملف: ${bad}`;
      data = null;
    }
  }
  return { name, data, status: { state: error ? 'unavailable' : 'fresh', generated_at: (data as { generated_at?: string } | null)?.generated_at ?? null, age_hours: null, stale_after_hours: null, error } };
}
