import { Link } from 'react-router-dom';
import { PLUGINS } from '../core/plugins.config.js';
import { stationsOf } from '../core/metro.js';
import { usePluginCtx } from '../shell/Shell.js';
import { PageHead } from '../ui/page.js';
import { Card } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';

const INTERCHANGES: { from: string; to: string; what: string; href: string }[] = [
  { from: 'الرئيسية', to: 'كل الخطوط', what: 'اليوم وهذا الأسبوع يجمعان المواعيد والتمارين والحياة والقراءة', href: '/' },
  { from: 'الدراسة', to: 'المكتبة', what: 'صفحة المادة تعرض ملفاتها؛ والملف يعرض مادته', href: '/academic' },
  { from: 'الرياضة', to: 'الحياة', what: 'بدائل العادات والوزن والجسم', href: '/sports' },
  { from: 'المراجعة', to: 'الحياة + الرياضة', what: 'مراجعة الأسبوع تقرأ الصلاة والعادات والوزن والمال', href: '/review' },
  { from: 'مساحاتي', to: 'أي خط', what: '«مرتبط بـ»: اربط أي عنصر بتقييم أو ملف أو تمرين أو مادة', href: '/spaces' },
];

/** خريطة الموقع: الخطوط ومحطاتها كخريطة مترو — «أين أنا؟ أين يمكن أن أذهب؟» */
export default function SiteMap() {
  const ctx = usePluginCtx();
  return (
    <div className="page">
      <PageHead title="خريطة الموقع" icon="pin" sub="كل خط له لون، وكل محطة صفحة. الخطوط تتقاطع حيث تترابط البيانات." />
      <div className="stack" style={{ gap: 'var(--s-4)' }}>
        {PLUGINS.map((p) => {
          const st = stationsOf(p, ctx).filter((s) => !s.interchange);
          return (
            <Card key={p.id} className="map-line" style={{ '--lc': p.color } as never}>
              <Link to={p.basePath} className="map-terminus"><i className="lc-dot" aria-hidden="true" /><Icon name={p.icon} size={18} /> <strong>{p.name.ar}</strong></Link>
              <p className="muted small" style={{ margin: '4px 0 var(--s-3)' }}>{p.tagline}</p>
              <ol className="map-track" aria-label={`محطات ${p.name.ar}`}>
                {st.map((s) => (
                  <li key={s.to}><Link to={s.to}><span className="stop" aria-hidden="true" /><span>{s.label}</span>{s.group && s.group !== p.name.ar ? <small>{s.group}</small> : null}</Link></li>
                ))}
              </ol>
            </Card>
          );
        })}
        <Card>
          <h2 className="h3" style={{ marginBlockEnd: 'var(--s-3)' }}><Icon name="link" size={18} /> التقاطعات</h2>
          <ul className="plain map-x">
            {INTERCHANGES.map((x) => (
              <li key={x.from + x.to}><Link to={x.href}><b>{x.from}</b> ⇄ <b>{x.to}</b></Link> — <span className="muted">{x.what}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="h3" style={{ marginBlockEnd: 'var(--s-3)' }}><Icon name="sliders" size={18} /> عام (في كل مكان)</h2>
          <ul className="plain map-x">
            <li><b>البحث / الأوامر</b> — <span className="kbd" dir="ltr">/</span> أو <span className="kbd" dir="ltr">Ctrl+K</span>: كل صفحة وكل عنصر وكل فعل</li>
            <li><b>إنشاء (+)</b> — <span className="kbd" dir="ltr">n</span>: أي نوع من أي مكان</li>
            <li><Link to="/inbox"><b>الوارد</b></Link> · <Link to="/settings"><b>الإعدادات والبيانات</b></Link> · <Link to="/trash"><b>سلة المحذوفات</b></Link> · <Link to="/activity"><b>سجل النشاط</b></Link></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
