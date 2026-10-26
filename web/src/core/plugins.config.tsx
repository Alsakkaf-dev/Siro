import type { PlatformPlugin } from './plugin.js';

/** المنصات المسجّلة. تضيف منصة = تضيف عنصرًا هنا؛ تظهر تلقائيًا في القائمة والمبدّل والرئيسية. */
export const academic: PlatformPlugin = {
  id: 'academic',
  name: { ar: 'الفصول', en: 'Academic' },
  tagline: 'الفصول الدراسية والمواد والتقييمات وحاسبة الدرجات',
  color: 'var(--accent)',
  version: '0.1.0',
  basePath: '/academic',
  icon: 'calendar',
  status: 'active',
  nav: (c) => {
    const sid = c.currentSemesterId;
    const base = sid ? `/academic/s/${sid}` : '/academic';
    const sem = sid
      ? [
          { to: base, label: 'لوحة الفصل', icon: 'grid' as const, end: true, hint: 'g d' },
          { to: `${base}/courses`, label: 'المواد', icon: 'book' as const, hint: 'g c' },
          { to: `${base}/timeline`, label: 'الجدول الزمني', icon: 'clock' as const, hint: 'g t' },
          { to: `${base}/calculator`, label: 'حاسبة الدرجات', icon: 'calc' as const, hint: 'g k' },
          { to: `${base}/weights`, label: 'خريطة الأوزان', icon: 'pie' as const, hint: 'g w' },
          { to: `${base}/unknowns`, label: 'غير المعروف', icon: 'help' as const, badge: c.unknownCount || undefined, hint: 'g u' },
        ]
      : [];
    return [
      ...(sem.length ? [{ title: 'الفصل الحالي', items: sem }] : []),
      {
        title: 'الفصول',
        items: [
          {
            to: '/academic',
            label: 'مدير الفصول',
            icon: 'layers' as const,
            end: true,
            hint: 'g s',
            children: c.semesters.map((s) => ({ to: `/academic/s/${s.id}`, label: s.code, icon: 'calendar' as const })),
          },
        ],
      },
    ];
  },
};

export const library: PlatformPlugin = {
  id: 'library',
  name: { ar: 'المكتبة', en: 'Library' },
  tagline: 'ملفاتك ومحاضراتك وفيديوهاتك في مكان واحد',
  color: 'var(--library)',
  version: '1.0.0',
  basePath: '/library',
  icon: 'library',
  status: 'active',
  nav: () => [
    {
      items: [
        { to: '/library', label: 'المكتبة', icon: 'library' as const, end: true },
        { to: '/library/folders', label: 'المجلدات', icon: 'folder' as const },
        { to: '/library/youtube', label: 'YouTube', icon: 'play' as const },
        { to: '/library/settings', label: 'إعدادات المكتبة', icon: 'sliders' as const },
      ],
    },
  ],
};

export const life: PlatformPlugin = {
  id: 'life',
  name: { ar: 'الحياة', en: 'Life' },
  tagline: 'المال والروتين والعادات والصلاة — لوحات قراءة من صادرات راشد',
  color: 'var(--life)',
  version: '1.0.0',
  basePath: '/life',
  icon: 'heart',
  status: 'active',
  nav: () => [
    {
      items: [
        { to: '/life', label: 'نظرة عامة', icon: 'heart' as const, end: true },
        { to: '/life/finance', label: 'المال', icon: 'database' as const },
        { to: '/life/insights', label: 'مؤشرات المال', icon: 'chart' as const },
        { to: '/life/ledger', label: 'السجل الكامل', icon: 'list' as const },
        { to: '/life/prayers', label: 'الصلاة', icon: 'clock' as const },
        { to: '/life/qada-plan', label: 'خطة القضاء', icon: 'target' as const },
        { to: '/life/habits', label: 'العادات', icon: 'check' as const },
        { to: '/life/routine', label: 'الروتين', icon: 'timer' as const },
        { to: '/life/routine-map', label: 'خريطة الأسبوع', icon: 'calendar' as const },
        { to: '/life/body', label: 'الجسم', icon: 'target' as const },
        { to: '/life/alternatives', label: 'بدائل العادات', icon: 'zap' as const },
        { to: '/life/glossary', label: 'قاموس المصطلحات', icon: 'book' as const },
      ],
    },
    {
      title: 'أدوات',
      items: [
        { to: '/life/commands', label: 'الأوامر (مسودات)', icon: 'mail' as const },
        { to: '/life/settings', label: 'إعدادات الحياة', icon: 'sliders' as const },
      ],
    },
  ],
};

export const sports: PlatformPlugin = {
  id: 'sports',
  name: { ar: 'الرياضة', en: 'Sports' },
  tagline: 'مكتبة التمارين حسب العضلة، قوالب أسبوعية، وتمريني الخاص',
  color: 'var(--sports)',
  version: '1.0.0',
  basePath: '/sports',
  icon: 'dumbbell',
  status: 'active',
  nav: () => [
    {
      items: [
        { to: '/sports', label: 'مكتبة التمارين', icon: 'dumbbell' as const, end: true },
        { to: '/sports/templates', label: 'القوالب الأسبوعية', icon: 'calendar' as const },
        { to: '/sports/mine', label: 'تمريني', icon: 'check' as const },
      ],
    },
    { title: 'روابط', items: [{ to: '/life/alternatives', label: 'بدائل العادات', icon: 'zap' as const }, { to: '/life/body', label: 'الوزن والجسم', icon: 'target' as const }, { to: '/life/glossary', label: 'قاموس المصطلحات', icon: 'book' as const }] },
  ],
};

export const PLUGINS: PlatformPlugin[] = [academic, library, life, sports];
