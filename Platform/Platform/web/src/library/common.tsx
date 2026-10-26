import '../styles/library.css';
import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { lib } from '../lib/api.js';
import { Icon, type IconName } from '../lib/icons.js';
import { Badge } from '../ui/ui.js';
import { DOCTYPE_LABELS, KIND_LABELS, libraryItemPath, type LibItem, type LibStatus } from '../../../shared/library.js';

export const KIND_ICON: Record<string, IconName> = { pdf: 'file', word: 'file', slides: 'slides', sheet: 'table', text: 'file', code: 'hash', image: 'image', video: 'video', audio: 'music', archive: 'archive', other: 'file', youtube: 'play' };
export const KIND_TINT: Record<string, string> = { pdf: '#F97362', word: '#4CC9F0', slides: '#F2A93B', sheet: '#4ADE80', text: '#8A92B2', code: '#A78BFA', image: '#F472B6', video: '#5B45F0', audio: '#2DD4BF', archive: '#B08968', other: '#8A92B2', youtube: '#FF4D4D' };

export const kindLabel = (k: string): string => (k === 'youtube' ? 'YouTube' : KIND_LABELS[k as keyof typeof KIND_LABELS] ?? k);
export const typeLabel = (t: string | null): string => (t ? DOCTYPE_LABELS[t as keyof typeof DOCTYPE_LABELS] ?? t : '');

export function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}
const df = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' });
export const fmtDate = (ms: number): string => df.format(ms);
const dft = new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', numberingSystem: 'latn' });
export const fmtWhen = (iso: string): string => dft.format(Date.parse(iso));

export function itemPath(it: Pick<LibItem, 'source' | 'id' | 'ref'>): string {
  // استخدم ref إن وُجد؛ وإلا id — وكلاهما يُمرَّر عبر libraryItemPath لإزالة أي بادئة مكررة
  return libraryItemPath(it.source, it.ref || it.id);
}
/** نسبة التقدّم 0..1 (صفحات في PDF، ثوانٍ في الفيديو) */
export function pctOf(it: LibItem): number {
  if (it.done) return 1;
  if (!it.duration || it.duration <= 0) return 0;
  const p = it.kind === 'pdf' ? it.progress / it.duration : it.progress / it.duration;
  return Math.max(0, Math.min(1, p));
}

export function KindTile({ kind, size = 40 }: { kind: string; size?: number }) {
  return (
    <span className="lib-tile" style={{ '--c': KIND_TINT[kind] ?? '#8A92B2', width: size, height: size } as CSSProperties} aria-hidden="true">
      <Icon name={KIND_ICON[kind] ?? 'file'} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function CourseBadge({ it }: { it: LibItem }) {
  if (it.course) {
    return (
      <span className="lib-course" style={{ '--c': it.course.color } as CSSProperties} title={`${it.course.code} — ${it.course.name}`}>
        <i className="dot" style={{ background: it.course.color }} /> <bdi>{it.course.code}</bdi>
      </span>
    );
  }
  if (it.course_code) return <Badge dashed title="رمز مستنتج من اسم المجلد — لا توجد مادة بهذا الرمز في الفصول">{it.course_code}</Badge>;
  return <span className="muted">—</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  if (pct <= 0) return <span className="muted">—</span>;
  return (
    <span className="lib-prog" role="img" aria-label={`التقدّم ${pct}%`}>
      <i style={{ inlineSize: `${pct}%` }} />
      <small className="num">{pct}%</small>
    </span>
  );
}

export function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <span className="lib-tags">
      {tags.slice(0, 4).map((t) => (
        <Link key={t} to={`/library?tag=${encodeURIComponent(t)}`} className="tag-chip" onClick={(e) => e.stopPropagation()}>
          #{t}
        </Link>
      ))}
      {tags.length > 4 && <span className="muted">+{tags.length - 4}</span>}
    </span>
  );
}

/** حالة المكتبة مع إعادة تحميل دورية خفيفة أثناء الفحص */
export function useLibStatus(): { status: LibStatus | null; reload: () => void } {
  const [status, setStatus] = useState<LibStatus | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    void lib.status().then((s) => alive && setStatus(s)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [n]);
  useEffect(() => {
    if (!status?.scanning) return;
    const t = setTimeout(() => setN((x) => x + 1), 1200);
    return () => clearTimeout(t);
  }, [status]);
  return { status, reload: () => setN((x) => x + 1) };
}
