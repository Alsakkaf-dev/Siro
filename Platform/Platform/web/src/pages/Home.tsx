import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { PLUGINS } from '../core/plugins.config.js';
import { PageHead } from '../ui/page.js';
import { Badge, Card, CardHead, Skeleton } from '../ui/ui.js';
import { Hero, StatTile } from '../widgets/tiles.js';
import { Icon } from '../lib/icons.js';
import { phaseOf, todayMs } from '../../../shared/semester.js';
import { fmtDateFull } from '../lib/format.js';

export default function Home() {
  const { semesters, activeId } = useApp();
  const now = todayMs();
  const act = semesters?.find((s) => s.id === activeId);
  const ph = act ? phaseOf(now, act) : null;
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'ليلة هادئة' : hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء النور' : 'مساء الخير';

  return (
    <div className="page">
      <PageHead title={`${greet}، محمد`} icon="home" sub={fmtDateFull(now)} />
      <div className="stack stagger" style={{ gap: 'var(--s-5)' }}>
        {!semesters ? (
          <Skeleton h={190} r={26} />
        ) : act ? (
          <Hero
            eyebrow={<><Icon name="calendar" size={14} /> الفصل النشط</>}
            title={<><bdi>{act.code}</bdi>{ph?.week ? ` — الأسبوع ${ph.week}` : ph?.kind === 'exam' ? ' — الامتحانات' : ''}</>}
            text={<><bdi>{act.name}</bdi> · {act.course_count} مواد · {act.assessment_count} تقييم</>}
          >
            <Link to={`/academic/s/${act.id}`} className="btn sm ink">افتح اللوحة</Link>
            <Link to={`/academic/s/${act.id}/timeline`} className="btn sm">الجدول الزمني</Link>
            <Link to="/academic" className="btn sm">كل الفصول</Link>
          </Hero>
        ) : (
          <Hero title="ابدأ بإضافة فصلك الأول" text="لا توجد فصول بعد." >
            <Link to="/academic" className="btn sm ink">مدير الفصول</Link>
          </Hero>
        )}

        <div className="grid cols-3 plugin-grid">
          {PLUGINS.map((p) => (
            <Link key={p.id} to={p.basePath} className={`plugin-card ${p.status}`} style={{ '--c': p.color } as never}>
              <span className="pc-ico"><Icon name={p.icon} size={26} /></span>
              <strong>{p.name.ar}</strong>
              <span className="muted">{p.tagline}</span>
              {p.status === 'soon' ? <Badge dashed>قريبًا</Badge> : <Badge tone="ok">جاهزة</Badge>}
            </Link>
          ))}
        </div>

        <div className="grid cols-3">
          <StatTile tone="purple" icon="layers" label="الفصول" value={semesters?.length ?? '…'} to="/academic" />
          <StatTile tone="green" icon="database" label="بياناتك" value="محلية" sub="على هذا الجهاز فقط" to="/settings" />
          <StatTile tone="orange" icon="hash" label="اختصارات" value="؟" sub="اضغط ؟ للقائمة" />
        </div>

        <Card>
          <CardHead title="ابدأ بسرعة" icon="zap" />
          <div className="quick">
            <Link to="/academic" className="btn"><Icon name="plus" size={16} /> إضافة فصل جديد</Link>
            {act && <Link to={`/academic/s/${act.id}/courses?new=1`} className="btn"><Icon name="book" size={16} /> إضافة مادة</Link>}
            {act && <Link to={`/academic/s/${act.id}/calculator`} className="btn"><Icon name="calc" size={16} /> الحاسبة</Link>}
            <Link to="/settings" className="btn"><Icon name="download" size={16} /> نسخة احتياطية</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
