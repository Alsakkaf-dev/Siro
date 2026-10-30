import { Link } from 'react-router-dom';
import { useApp } from '../core/app-context.js';
import { flagEnabled } from '../core/flags.js';
import { AREAS, PAGES, hrefFor } from '../core/registry.js';
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

/** خريطة الموقع: الأقسام وصفحاتها من السجل الموحّد — «أين أنا؟ أين يمكن أن أذهب؟» */
export default function SiteMap() {
  const { activeId } = useApp();
  return (
    <div className="page">
      <PageHead title="خريطة الموقع" icon="pin" sub="كل قسم له صفحاته. الأقسام تتقاطع حيث تترابط البيانات." />
      <div className="stack" style={{ gap: 'var(--s-4)' }}>
        {AREAS.filter((a) => !a.flag || flagEnabled(a.flag)).map((a) => {
          const st = PAGES.filter((p) => p.area === a.id && p.surface !== 'hidden' && (!p.flag || flagEnabled(p.flag)));
          return (
            <Card key={a.id} className="map-line">
              <Link to={hrefFor(a.entry, activeId)} className="map-terminus"><i className="lc-dot" aria-hidden="true" /><Icon name={a.icon} size={18} /> <strong>{a.label}</strong></Link>
              <ol className="map-track" aria-label={`صفحات ${a.label}`}>
                {st.map((p) => (
                  <li key={p.id}><Link to={hrefFor(p.id, activeId)}><span className="stop" aria-hidden="true" /><span>{p.label}</span></Link></li>
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
            <li><b>إنشاء (+)</b> — <span className="kbd" dir="ltr">c</span>: أي نوع من أي مكان · <b>المساعد</b> — <span className="kbd" dir="ltr">Ctrl+J</span></li>
            <li><Link to="/inbox"><b>الوارد</b></Link> · <Link to="/settings"><b>الإعدادات والبيانات</b></Link> · <Link to="/trash"><b>سلة المحذوفات</b></Link> · <Link to="/activity"><b>سجل النشاط</b></Link></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
