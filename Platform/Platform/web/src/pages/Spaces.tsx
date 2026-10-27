import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { wos, type Space } from '../lib/wos.js';
import { PageHead } from '../ui/page.js';
import { Button, Card, EmptyState, Field, Modal, Skeleton, Switch } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';
import { describeAutomation, FIELD_KIND_LABEL, VIEW_KIND_LABEL, type Automation } from '../../../shared/wos.js';
import type { TemplateInfo } from '../../../shared/templates.js';

/** مساحاتي: كل المساحات التي صنعتها — «الخيال الواسع» */
export default function Spaces() {
  const { spaces, reloadSpaces } = useApp();
  const [archived, setArchived] = useState<Space[] | null>(null);
  const [showArch, setShowArch] = useState(false);
  useEffect(() => void reloadSpaces(), [reloadSpaces]);
  useEffect(() => {
    if (showArch) void wos.spaces(true).then((s) => setArchived(s.filter((x) => x.archived)));
  }, [showArch]);
  const list = showArch ? archived : spaces;
  return (
    <div className="page">
      <PageHead
        title="مساحاتي"
        icon="layers"
        sub="أي شيء لم يُصمَّم له الموقع: قائمة قراءة، طلبات توظيف، مشاريع، أهداف… كل مساحة لها حقولها وحالاتها وعروضها وقواعدها."
        actions={<><Switch checked={showArch} onChange={setShowArch} label="المؤرشفة" /><Button to="/spaces/automations" icon="zap">الأتمتة</Button><Button to="/spaces/templates" variant="primary" icon="plus">مساحة جديدة</Button></>}
      />
      {!list ? <Skeleton h={160} r={20} /> : list.length ? (
        <div className="grid cols-3 space-grid">
          {list.map((s) => {
            const pct = s.item_count ? Math.round(((s.done_count ?? 0) / s.item_count) * 100) : 0;
            return (
              <Link key={s.id} to={`/spaces/${s.id}`} className="space-card" style={{ '--c': s.color } as never}>
                <span className="pc-ico"><Icon name={(s.icon || 'layers') as 'layers'} size={24} /></span>
                <strong><bdi>{s.name}</bdi></strong>
                {s.description && <span className="muted small"><bdi>{s.description}</bdi></span>}
                <span className="small muted">{s.item_count ?? 0} {s.type.name} · {s.type.fields.length} حقل · {s.type.statuses.length} حالات</span>
                <span className="prog" role="img" aria-label={`${pct}% منجز`}><i style={{ width: `${pct}%` }} /><b className="num">{pct}%</b></span>
              </Link>
            );
          })}
          {!showArch && (
            <Link to="/spaces/templates" className="space-card add">
              <span className="pc-ico"><Icon name="plus" size={24} /></span>
              <strong>مساحة جديدة</strong>
              <span className="muted small">من قالب جاهز أو فارغة</span>
            </Link>
          )}
        </div>
      ) : (
        <EmptyState icon="layers" title={showArch ? 'لا مساحات مؤرشفة' : 'لا مساحات بعد'} text="ابدأ من قالب (قائمة قراءة، طلبات توظيف، مشروع، أهداف…) أو من مساحة فارغة تصمّم حقولها بنفسك." action={<Button variant="primary" to="/spaces/templates">اختر قالبًا</Button>} />
      )}
    </div>
  );
}

/** القوالب: جاهزة + محفوظة منك. «استخدم» ينشئ مساحة كاملة (نوع + حقول + حالات + عروض + أتمتة). */
export function SpaceTemplates() {
  const { reloadSpaces, toast, confirm } = useApp();
  const nav = useNavigate();
  const [list, setList] = useState<TemplateInfo[] | null>(null);
  const [pick, setPick] = useState<TemplateInfo | 'blank' | null>(null);
  const load = (): void => void wos.templates().then(setList).catch(() => setList([]));
  useEffect(load, []);
  const create = async (name: string): Promise<void> => {
    try {
      const s = await wos.createSpace(pick === 'blank' ? { name } : { template_id: (pick as TemplateInfo).id, name });
      await reloadSpaces();
      toast(`أُنشئت «${s.name}»`, { kind: 'ok' });
      nav(`/spaces/${s.id}`);
    } catch (e) {
      toast((e as Error).message, { kind: 'error' });
    }
  };
  return (
    <div className="page">
      <PageHead title="القوالب" icon="copy" sub="اختر نقطة بداية. كل شيء قابل للتعديل لاحقًا: الحقول، الحالات، العروض، القواعد." crumbs={[{ to: '/spaces', label: 'مساحاتي' }, { label: 'القوالب' }]} />
      {!list ? <Skeleton h={200} r={20} /> : (
        <div className="grid cols-3 tpl-grid">
          <Card className="stpl-card blank">
            <span className="pc-ico" style={{ '--c': '#596079' } as never}><Icon name="plus" size={24} /></span>
            <h2 className="h3">مساحة فارغة</h2>
            <p className="muted small">صمّم الحقول والحالات بنفسك من الصفر.</p>
            <Button variant="primary" onClick={() => setPick('blank')}>ابدأ</Button>
          </Card>
          {list.map((t) => (
            <Card key={t.id} className="stpl-card">
              <span className="pc-ico" style={{ '--c': t.color } as never}><Icon name={(t.icon || 'layers') as 'layers'} size={24} /></span>
              <h2 className="h3"><bdi>{t.name}</bdi> {!t.builtin && <span className="badge accent">قالبي</span>}</h2>
              <p className="muted small">{t.description}</p>
              <details>
                <summary className="small">ماذا يتضمن؟</summary>
                <ul className="small tpl-detail">
                  <li><b>الحقول:</b> {t.payload.type.fields.map((f) => `${f.name} (${FIELD_KIND_LABEL[f.kind]})`).join('، ') || '—'}</li>
                  <li><b>الحالات:</b> {t.payload.type.statuses.map((s) => s.name).join(' ← ')}</li>
                  <li><b>العروض:</b> {t.payload.views.map((v) => `${v.name} (${VIEW_KIND_LABEL[v.kind]})`).join('، ')}</li>
                  {t.payload.automations.length > 0 && <li><b>الأتمتة:</b> {t.payload.automations.map((a) => describeAutomation(a, t.payload.type)).join(' · ')}</li>}
                </ul>
              </details>
              <div className="row" style={{ gap: 8 }}>
                <Button variant="primary" onClick={() => setPick(t)} aria-label={`استخدم قالب ${t.name}`}>استخدم</Button>
                {!t.builtin && <Button variant="ghost" icon="trash" onClick={async () => { if (await confirm({ title: `حذف القالب «${t.name}»؟`, body: 'المساحات التي أُنشئت منه لا تتأثر.', danger: true, confirmLabel: 'حذف' })) void wos.delTemplate(t.id).then(load); }}>حذف</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      {pick && <NameSpace def={pick === 'blank' ? 'مساحة جديدة' : pick.payload.space.name} onClose={() => setPick(null)} onCreate={create} />}
    </div>
  );
}

function NameSpace({ def, onClose, onCreate }: { def: string; onClose: () => void; onCreate: (n: string) => Promise<void> }) {
  const [n, setN] = useState(def);
  const [busy, setBusy] = useState(false);
  const go = (): void => { if (!n.trim() || busy) return; setBusy(true); void onCreate(n.trim()).finally(() => setBusy(false)); };
  return (
    <Modal title="اسم المساحة" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button variant="primary" disabled={!n.trim() || busy} onClick={go}>إنشاء</Button></>}>
      <Field label="الاسم" htmlFor="ns-n"><input id="ns-n" value={n} onChange={(e) => setN(e.target.value)} maxLength={80} onKeyDown={(e) => e.key === 'Enter' && go()} /></Field>
    </Modal>
  );
}

/** كل قواعد الأتمتة في كل المساحات */
export function AllAutomations() {
  const { spaces } = useApp();
  const [rules, setRules] = useState<Automation[] | null>(null);
  useEffect(() => void wos.automations().then(setRules).catch(() => setRules([])), []);
  const bySpace = new Map((spaces ?? []).map((s) => [s.id, s]));
  return (
    <div className="page">
      <PageHead title="الأتمتة" icon="zap" sub="قواعد «عندما… ثم…» في كل مساحاتك. تعمل محليًا، وتُسجَّل في سجل النشاط، ويمكن التراجع عن أثرها." crumbs={[{ to: '/spaces', label: 'مساحاتي' }, { label: 'الأتمتة' }]} actions={<Button to="/activity" icon="clock">سجل النشاط</Button>} />
      <Card>
        {!rules ? <Skeleton h={60} /> : rules.length ? (
          <ul className="plain auto-list">
            {rules.map((a) => {
              const s = bySpace.get(a.space_id);
              return (
                <li key={a.id} className="auto-row">
                  <span className={`badge ${a.enabled ? 'ok' : ''}`}>{a.enabled ? 'مفعّلة' : 'متوقفة'}</span>
                  <div><b><bdi>{a.name}</bdi></b><small className="muted">{describeAutomation(a, s?.type)} · عملت {a.runs} مرة</small></div>
                  {s && <Link to={`/spaces/${s.id}`}><bdi>{s.name}</bdi></Link>}
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon="zap" title="لا قواعد بعد" text="افتح أي مساحة ← «الأتمتة» ← قاعدة جديدة. مثال: عندما تصبح الحالة «انتهيت» ← اضبط «تاريخ الإنهاء» = اليوم." action={<Button to="/spaces">مساحاتي</Button>} />}
      </Card>
    </div>
  );
}
