import type { PlatformPlugin } from './plugin.js';

/** الخطوط السبعة (docs/design/IA_METRO_MAP.md). تضيف خطًا = تضيف عنصرًا هنا؛ يظهر تلقائيًا في القائمة والمبدّل والخريطة والأوامر. */
export const home: PlatformPlugin = {
  id: 'home',
  name: { ar: 'الرئيسية', en: 'Home' },
  tagline: 'المحطة المركزية: اليوم، هذا الأسبوع، كل شيء، والوارد',
  color: 'var(--core)',
  version: '2.0.0',
  basePath: '/',
  owns: ['/week', '/everything', '/inbox', '/map'],
  icon: 'home',
  status: 'active',
  key: 'h',
  nav: () => [
    {
      items: [
        { to: '/', label: 'اليوم', icon: 'home', end: true, hint: 'g h', kw: 'today home الرئيسية' },
        { to: '/week', label: 'هذا الأسبوع', icon: 'calendar', hint: 'g j', kw: 'week agenda أسبوع مواعيد' },
        { to: '/everything', label: 'كل شيء', icon: 'list', hint: 'g e', kw: 'everything all كل المهام' },
        { to: '/inbox', label: 'الوارد', icon: 'bell', hint: 'g i', kw: 'inbox notifications تنبيهات' },
        { to: '/map', label: 'خريطة الموقع', icon: 'pin', kw: 'map sitemap خريطة أين' },
      ],
    },
  ],
};

export const academic: PlatformPlugin = {
  id: 'academic',
  name: { ar: 'الدراسة', en: 'Study' },
  tagline: 'الفصول والمواد والتقييمات وحاسبة الدرجات وحزم الفصول',
  color: 'var(--acad)',
  version: '2.0.0',
  basePath: '/academic',
  icon: 'calendar',
  status: 'active',
  key: 's',
  nav: (c) => {
    const sid = c.currentSemesterId;
    const base = sid ? `/academic/s/${sid}` : '/academic';
    const sem = sid
      ? [
          { to: base, label: 'لوحة الفصل', icon: 'grid' as const, end: true, hint: 'g d', kw: 'semester dashboard' },
          { to: `${base}/courses`, label: 'المواد', icon: 'book' as const, hint: 'g c', kw: 'courses subjects' },
          { to: `${base}/timeline`, label: 'الجدول الزمني', icon: 'clock' as const, hint: 'g t', kw: 'timeline heatmap gantt' },
          { to: `${base}/calculator`, label: 'حاسبة الدرجات', icon: 'calc' as const, hint: 'g k', kw: 'calculator grades' },
          { to: `${base}/weights`, label: 'خريطة الأوزان', icon: 'pie' as const, hint: 'g w', kw: 'weights' },
          { to: `${base}/unknowns`, label: 'غير المعروف', icon: 'help' as const, badge: c.unknownCount || undefined, hint: 'g u', kw: 'unknowns' },
          { to: `${base}/print`, label: 'ملخص للطباعة', icon: 'print' as const, kw: 'print summary طباعة' },
        ]
      : [];
    return [
      ...(sem.length ? [{ title: 'الفصل الحالي', items: sem }] : []),
      {
        title: 'الفصول',
        items: [
          {
            to: '/academic',
            label: 'الفصول',
            icon: 'layers' as const,
            end: true,
            hint: 'g s',
            kw: 'semesters manager مدير الفصول',
            children: c.semesters.map((s) => ({ to: `/academic/s/${s.id}`, label: s.code, icon: 'calendar' as const })),
          },
          { to: '/academic/import', label: 'استيراد وتصدير الحزم', icon: 'upload' as const, kw: 'import export package drive حزمة' },
        ],
      },
    ];
  },
  create: [
    { id: 'assessment', label: 'تقييم', icon: 'target', sub: 'اختبار، واجب، مشروع…', command: 'quick-assessment' },
    { id: 'note', label: 'ملاحظة أو سؤال مفتوح', icon: 'help', sub: 'في الفصل الحالي', command: 'quick-note' },
    { id: 'course', label: 'مادة', icon: 'book', to: (c) => (c.activeSemesterId ? `/academic/s/${c.activeSemesterId}/courses?new=1` : null) },
    { id: 'semester', label: 'فصل دراسي', icon: 'layers', to: () => '/academic?new=1' },
    { id: 'package', label: 'استيراد حزمة فصل', icon: 'upload', to: () => '/academic/import' },
  ],
};

export const library: PlatformPlugin = {
  id: 'library',
  name: { ar: 'المكتبة', en: 'Library' },
  tagline: 'ملفاتك ومحاضراتك وفيديوهاتك في مكان واحد',
  color: 'var(--library)',
  version: '2.0.0',
  basePath: '/library',
  icon: 'library',
  status: 'active',
  key: 'l',
  nav: () => [
    {
      items: [
        { to: '/library', label: 'الملفات', icon: 'library' as const, end: true, kw: 'library files pdf' },
        { to: '/library/folders', label: 'المجلدات', icon: 'folder' as const, kw: 'folders tree' },
        { to: '/library/youtube', label: 'YouTube', icon: 'play' as const, kw: 'youtube videos' },
        { to: '/library/settings', label: 'إعدادات المكتبة', icon: 'sliders' as const, kw: 'library settings folder scan' },
      ],
    },
  ],
  create: [{ id: 'youtube', label: 'فيديو YouTube', icon: 'play', to: () => '/library/youtube?new=1' }],
};

export const life: PlatformPlugin = {
  id: 'life',
  name: { ar: 'الحياة', en: 'Life' },
  tagline: 'المال والروتين والعادات والصلاة — لوحات قراءة من صادرات راشد',
  color: 'var(--life)',
  version: '2.0.0',
  basePath: '/life',
  icon: 'heart',
  status: 'active',
  key: 'f',
  nav: () => [
    {
      title: 'اليوم',
      items: [
        { to: '/life', label: 'نظرة عامة', icon: 'heart' as const, end: true, kw: 'life overview' },
        { to: '/life/routine', label: 'الروتين', icon: 'timer' as const, kw: 'routine schedule' },
        { to: '/life/routine-map', label: 'خريطة الأسبوع', icon: 'calendar' as const, kw: 'routine map كتل' },
      ],
    },
    {
      title: 'المال',
      items: [
        { to: '/life/finance', label: 'المال', icon: 'database' as const, kw: 'finance money مصروف فلوس' },
        { to: '/life/insights', label: 'مؤشرات المال', icon: 'chart' as const, kw: 'insights مؤشرات' },
        { to: '/life/ledger', label: 'السجل الكامل', icon: 'list' as const, kw: 'ledger سجل' },
      ],
    },
    {
      title: 'العبادة',
      items: [
        { to: '/life/prayers', label: 'الصلاة', icon: 'clock' as const, kw: 'prayers' },
        { to: '/life/qada-plan', label: 'خطة القضاء', icon: 'target' as const, kw: 'qada plan قضاء' },
      ],
    },
    {
      title: 'العادات والجسم',
      items: [
        { to: '/life/habits', label: 'العادات', icon: 'check' as const, kw: 'habits' },
        { to: '/life/alternatives', label: 'بدائل العادات', icon: 'zap' as const, kw: 'alternatives ماذا أسوي' },
        { to: '/life/body', label: 'الجسم', icon: 'target' as const, kw: 'body weight وزن' },
      ],
    },
    {
      title: 'أدوات',
      items: [
        { to: '/life/commands', label: 'مسودات الأوامر', icon: 'mail' as const, kw: 'commands drafts rashed راشد' },
        { to: '/life/glossary', label: 'قاموس المصطلحات', icon: 'book' as const, kw: 'glossary terms' },
        { to: '/life/settings', label: 'إعدادات الحياة', icon: 'sliders' as const, kw: 'life settings rashed folder' },
      ],
    },
  ],
  create: [{ id: 'command', label: 'مسودة أمر لراشد', icon: 'mail', to: () => '/life/commands' }],
};

export const sports: PlatformPlugin = {
  id: 'sports',
  name: { ar: 'الرياضة', en: 'Sports' },
  tagline: 'مكتبة التمارين حسب العضلة، قوالب أسبوعية، وتماريني',
  color: 'var(--sports)',
  version: '2.0.0',
  basePath: '/sports',
  icon: 'dumbbell',
  status: 'active',
  key: 'p',
  nav: () => [
    {
      items: [
        { to: '/sports', label: 'مكتبة التمارين', icon: 'dumbbell' as const, end: true, kw: 'exercises muscles عضلات' },
        { to: '/sports/templates', label: 'القوالب الأسبوعية', icon: 'calendar' as const, kw: 'templates plans' },
        { to: '/sports/mine', label: 'تماريني', icon: 'check' as const, kw: 'my workouts تمريني' },
      ],
    },
    { title: 'تقاطعات', interchange: true, items: [{ to: '/life/alternatives', label: 'بدائل العادات', icon: 'zap' as const }, { to: '/life/body', label: 'الوزن والجسم', icon: 'target' as const }, { to: '/life/glossary', label: 'قاموس المصطلحات', icon: 'book' as const }] },
  ],
  create: [{ id: 'workout', label: 'تمرين', icon: 'dumbbell', to: () => '/sports/mine?new=1' }],
};

export const spaces: PlatformPlugin = {
  id: 'spaces',
  name: { ar: 'مساحاتي', en: 'My Spaces' },
  tagline: 'أي شيء آخر: قوائم قراءة، طلبات توظيف، مشاريع، أهداف — بحقول وحالات وعروض وأتمتة من صنعك',
  color: 'var(--spaces)',
  version: '1.0.0',
  basePath: '/spaces',
  icon: 'layers',
  status: 'active',
  key: 'm',
  nav: (c) => [
    {
      items: [
        { to: '/spaces', label: 'كل المساحات', icon: 'layers' as const, end: true, kw: 'spaces مساحات' },
        { to: '/spaces/templates', label: 'القوالب', icon: 'copy' as const, kw: 'templates قوالب جاهزة' },
        { to: '/spaces/automations', label: 'الأتمتة', icon: 'zap' as const, kw: 'automations rules قواعد' },
      ],
    },
    ...(c.spaces.length ? [{ title: 'مساحاتي', items: c.spaces.map((s) => ({ to: `/spaces/${s.id}`, label: s.name, icon: (s.icon || 'layers') as 'layers' })) }] : []),
  ],
  create: [
    { id: 'item', label: 'عنصر في مساحة', icon: 'check', sub: 'مهمة، كتاب، طلب…', command: 'quick-item' },
    { id: 'space', label: 'مساحة جديدة', icon: 'layers', sub: 'من قالب أو فارغة', to: () => '/spaces/templates' },
  ],
};

export const review: PlatformPlugin = {
  id: 'review',
  name: { ar: 'المراجعة', en: 'Review' },
  tagline: 'مراجعة الأسبوع، لوحة التقدّم، وسجل كل ما تغيّر',
  color: 'var(--review)',
  version: '2.0.0',
  basePath: '/review',
  owns: ['/activity'],
  icon: 'sparkle',
  status: 'active',
  key: 'r',
  nav: () => [
    {
      items: [
        { to: '/review', label: 'مراجعة الأسبوع', icon: 'sparkle' as const, end: true, hint: 'g r', kw: 'weekly review' },
        { to: '/review/progress', label: 'لوحة التقدّم', icon: 'chart' as const, kw: 'progress dashboard تقدم' },
        { to: '/activity', label: 'سجل النشاط', icon: 'clock' as const, kw: 'activity history سجل تغييرات' },
      ],
    },
  ],
};

export const PLUGINS: PlatformPlugin[] = [home, academic, library, life, sports, spaces, review];
/** الخطوط المعروضة كمنصات (بطاقات الرئيسية) — بدون المحطة المركزية */
export const DOMAIN_LINES = PLUGINS.filter((p) => p.id !== 'home');
