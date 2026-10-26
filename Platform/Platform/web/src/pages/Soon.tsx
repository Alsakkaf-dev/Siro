import { PageHead } from '../ui/page.js';
import { Badge, Card } from '../ui/ui.js';
import { Icon, type IconName } from '../lib/icons.js';

export default function Soon() {
  {
    const mods: { t: string; i: IconName; d: string }[] = [
      { t: 'الروتين والعادات', i: 'check', d: 'عادات يومية وسلاسل التزام' },
      { t: 'الصلاة', i: 'clock', d: 'مواقيت وتتبّع بسيط' },
      { t: 'المال', i: 'database', d: 'مصروفات وميزانية — مشفّرة ومعزولة' },
      { t: 'الرياضة', i: 'zap', d: 'تمارين ومتابعة التقدّم' },
    ];
    return (
      <div className="page">
        <PageHead title="الحياة" icon="heart" badge={<Badge dashed>قريبًا</Badge>} sub="منصة الحياة اليومية — ضمن المرحلة القادمة من المشروع." />
        <div className="grid cols-2 stagger">
          {mods.map((m) => (
            <Card key={m.t} className="soon-card"><span className="pc-ico" style={{ '--c': 'var(--life)' } as never}><Icon name={m.i} size={24} /></span><h3>{m.t}</h3><p className="muted">{m.d}</p><Badge dashed>قريبًا</Badge></Card>
          ))}
        </div>
        <p className="muted" style={{ marginBlockStart: 'var(--s-5)' }}>لا بيانات صحية أو مالية في هذه المرحلة. عند إضافتها ستُحفظ محليًا فقط.</p>
      </div>
    );
  }
}
