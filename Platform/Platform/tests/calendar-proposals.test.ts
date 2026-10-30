// فحص CAL-43 وقالب الوصف CAL-44 وصياغة الغرام DEF-10/CAL-45 والفرق والتصدير (نقي).
import { describe, expect, it } from 'vitest';
import { buildExportJson, buildExportText, fixGramsText, gramsIssues, lineDiff, lintProposal, validateMealBody, type CalEvent, type EventFields, type ProposalDraft } from '../shared/calendar/index.js';
import { ORIGINAL_RECIPES, outlookBody, nutritionOf } from '../shared/kitchen/index.js';

const D = '2026-11-02';
const ev = (id: string, title: string, start: string, end: string, over: Partial<CalEvent> = {}): CalEvent => ({ id, source: 'import', calendar: 'روتين وصحة', title, start: `${D}T${start}`, end: `${D}T${end}`, show_as: 'busy', categories: [], description: '', series: null, ...over });
const f = (e: CalEvent, over: Partial<EventFields> = {}): EventFields => ({ title: e.title, start: e.start, end: e.end, description: e.description, categories: e.categories, ...over });
const FULL = [ev('s', '😴 نوم', '00:00', '06:00'), ev('m', 'فطور', '06:00', '07:00'), ev('x', 'عمل', '07:00', '24:00'.replace('24:00', '23:59'))];
// يوم مغطّى إلى 23:59: نكمله بحدث نهاية اليوم كي لا تظهر فجوة
const DAY: CalEvent[] = [...FULL.slice(0, 2), ev('x', 'عمل', '07:00', '12:00'), ev('l', 'غداء', '12:00', '13:00'), ev('r', 'راحة', '13:00', '23:00'), { ...ev('z', '😴 جاري النوم', '23:00', '23:59'), end: `2026-11-03T00:00` }];
const bk = ORIGINAL_RECIPES.find((r) => r.slug === 'bk-03')!;
const BODY = outlookBody(bk.title_ar, ['اسلق 100 غرام من البيض.', 'حمّص 80 غراماً من التوست.'], nutritionOf(bk.lines).total);
const upd = (e: CalEvent, after: Partial<EventFields>, over: Partial<ProposalDraft> = {}): ProposalDraft => ({ kind: 'update', calendar: e.calendar, event_id: e.id, series: e.series, before: f(e), after: f(e, after), reason: 'اختبار', ...over });

describe('قالب وصف الوجبة CAL-44', () => {
  it('القالب الحرفي يمرّ، وأي انحراف يُبلَّغ بسببه', () => {
    expect(validateMealBody(BODY)).toEqual([]);
    expect(validateMealBody(BODY.replace('السعرات الحرارية', 'Calories')).length).toBeGreaterThan(0);
    expect(validateMealBody(BODY.replace('1: ', '١: ')).length).toBeGreaterThan(0);
    expect(validateMealBody('اسم فقط').map((x) => x.msg).join()).toContain('القيمة الغذائية');
    expect(validateMealBody(BODY.replace(/ غرام$/m, ' غراما')).length).toBeGreaterThan(0);
  });
});

describe('صياغة الغرام DEF-10/CAL-45 (قواعد S6)', () => {
  it('«100 غراماً» خطأ والصحيح «100 غرام»؛ 40 غراماً/5 غرامات/غرام واحد/غرامان صحيحة', () => {
    expect(gramsIssues('اسلق 100 غراماً من البيض و40 غراماً من الجبنة')).toEqual([{ from: '100 غراماً', to: '100 غرام' }]);
    expect(gramsIssues('5 غرامات من أ و1 غرام من ب و2 غرامات من ج و200 غراماً من د')).toEqual([{ from: '1 غرام', to: 'غرام واحد' }, { from: '2 غرامات', to: 'غرامان' }, { from: '200 غراماً', to: '200 غرام' }]);
    expect(gramsIssues('80 غراماً من التوست و100 غرام من البيض و5 غرامات من الزيت')).toEqual([]);
    expect(gramsIssues('البروتين: 29 غرام\nالدهون: 12 غرام')).toEqual([]); // قالب القيم الغذائية ثابت;
    const fx = fixGramsText('اسلق 100 غراماً من البيض و3 غرام من الزيت');
    expect(fx.text).toBe('اسلق 100 غرام من البيض و3 غرامات من الزيت');
    expect(fx.changes).toHaveLength(2);
    expect(gramsIssues(fx.text)).toEqual([]);
  });
});

describe('فحص الاقتراح CAL-43', () => {
  const meal = DAY.find((e) => e.id === 'm')!;
  it('تحديث وصف وجبة بالقالب الصحيح يمرّ بلا أخطاء ولا مخالفات جديدة', () => {
    const r = lintProposal(upd(meal, { description: BODY }), DAY);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.after).toEqual(r.before);
  });
  it('تقويم افتراضي ممنوع (CAL-14) وتقويم غير مستعمل ممنوع', () => {
    const e = ev('d', 'فطور', '06:00', '07:00', { calendar: 'التقويم الافتراضي' });
    expect(lintProposal(upd(e, { description: BODY }), [e]).errors.map((x) => x.code)).toContain('CAL-14');
    expect(lintProposal({ kind: 'create', calendar: 'مخصص', event_id: null, series: null, before: null, after: { title: 'x', start: `${D}T07:00`, end: `${D}T08:00`, description: '', categories: [] }, reason: 'ت' }, DAY).errors.map((x) => x.code)).toContain('CAL-14');
  });
  it('لا يُمسّ صلاة أو محاضرة أو امتحان إلا بطلب صريح (CAL-47)', () => {
    const pr = ev('p', '🕌 صلاة الظهر', '12:56', '13:16', { calendar: 'صلاة' });
    const lec = ev('c', 'SCSE3203', '08:00', '09:50', { calendar: 'دراسة', categories: ['محاضرة'] });
    const exam = ev('e', 'امتحان نهائي', '14:00', '16:00', { calendar: 'دراسة' });
    for (const e of [pr, lec, exam]) {
      expect(lintProposal(upd(e, { description: 'وصف' }), [e]).errors.map((x) => x.code)).toContain('CAL-47');
      expect(lintProposal(upd(e, { description: 'وصف' }, { explicit: true }), [e]).errors.map((x) => x.code)).not.toContain('CAL-47');
    }
  });
  it('أقصر من 20 دقيقة (CAL-12) وتداخل جديد (CAL-13) وفجوة جديدة (CAL-11) تُرفض', () => {
    const short = lintProposal(upd(meal, { end: `${D}T06:15` }), DAY);
    expect(short.errors.map((x) => x.code)).toContain('CAL-12');
    expect(short.errors.map((x) => x.code)).toContain('CAL-11'); // يترك 45 دقيقة فجوة
    const over = lintProposal(upd(meal, { end: `${D}T07:30` }), DAY);
    expect(over.errors.map((x) => x.code)).toContain('CAL-13');
    expect(over.after.overlaps).toBe(over.before.overlaps + 1);
  });
  it('مخالفات قائمة في Outlook تُعرض تحذيرًا ولا تحجب اقتراحًا لا يزيدها', () => {
    const broken = [...DAY.filter((e) => e.id !== 'r'), ev('r', 'راحة', '13:00', '22:00')]; // فجوة 22:00–23:00 قائمة
    const r = lintProposal(upd(broken.find((e) => e.id === 'm')!, { description: BODY }), broken);
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w) => w.code)).toContain('CAL-18');
  });
  it('الوصف عربي فقط وأرقام 0-9 (CAL-16/N-13) وصياغة الغرام (CAL-45)', () => {
    expect(lintProposal(upd(meal, { description: BODY + '\nnote' }), DAY).errors.map((x) => x.code)).toContain('CAL-16');
    expect(lintProposal(upd(meal, { description: BODY.replace('532', '٥٣٢') }), DAY).errors.map((x) => x.code)).toContain('N-13');
    expect(lintProposal(upd(meal, { description: BODY.replace('100 غرام من', '100 غراماً من') }), DAY).errors.map((x) => x.code)).toContain('CAL-45');
  });
  it('تعديل وقت سلسلة بلا استثناءات مرفقة غير مكتمل (CAL-48)', () => {
    const ser = ev('sr', 'تمرين', '17:00', '18:00', { series: 'S1' });
    const base = [...DAY.filter((e) => !['r'].includes(e.id)), ev('r1', 'راحة', '13:00', '17:00'), ser, ev('r2', 'راحة', '18:00', '23:00')];
    const d = upd(ser, { start: `${D}T17:30`, end: `${D}T18:30` });
    expect(lintProposal(d, base).errors.map((x) => x.code)).toContain('CAL-48');
    expect(lintProposal({ ...d, exceptions: [{ date: '2026-11-09', note: 'محذوف' }] }, base).errors.map((x) => x.code)).not.toContain('CAL-48');
    expect(lintProposal({ ...d, no_exceptions: true }, base).errors.map((x) => x.code)).not.toContain('CAL-48');
  });
  it('الحذف يحتاج معرّفًا وقبلًا، والإنشاء يحتاج بعدًا', () => {
    expect(lintProposal({ kind: 'delete', calendar: 'عام', event_id: null, series: null, before: null, after: null, reason: 'ت' }, DAY).ok).toBe(false);
  });
});

describe('الفرق والتصدير (CAL-41/42)', () => {
  it('lineDiff يميّز المحذوف والمضاف والثابت', () => {
    expect(lineDiff('أ\nب\nج', 'أ\nد\nج')).toEqual([{ op: 'same', text: 'أ' }, { op: 'del', text: 'ب' }, { op: 'add', text: 'د' }, { op: 'same', text: 'ج' }]);
    expect(lineDiff('', 'س')).toEqual([{ op: 'add', text: 'س' }]);
  });
  it('JSON بنية صريحة (يستهلكها راشد) والنص العربي بالترتيب، وكلاهما يصرّح أنه لم يُطبَّق شيء', () => {
    const e = DAY.find((x) => x.id === 'm')!;
    const item = { id: 'p1', kind: 'update' as const, calendar: e.calendar, event_id: e.id, series: null, before: f(e), after: f(e, { description: BODY }), reason: 'تحديث الوصف', exceptions: [], lint_warnings: [], created_at: '2026-10-30T00:00:00Z' };
    const j = buildExportJson([item], new Date('2026-10-30T00:00:00Z')) as any;
    expect(j).toMatchObject({ kind: 'siro.calendar.proposals', version: 1, writer: 'rashed', requires_separate_run: true, timezone: 'Asia/Kuala_Lumpur', count: 1 });
    expect(j.proposals[0]).toMatchObject({ order: 1, id: 'p1', kind: 'update', event_id: 'm' });
    expect(j.instructions_ar).toContain('لا شيء منها طُبّق');
    const t = buildExportText([item, { ...item, id: 'p2', kind: 'create', event_id: null, before: null }]);
    expect(t).toContain('لم يُطبَّق شيء');
    expect(t.indexOf('1. تعديل')).toBeLessThan(t.indexOf('2. إنشاء'));
    expect(t).toContain('القيمة الغذائية الإجمالية للوجبة:');
    expect(/[٠-٩A-Za-z]/.test(t.replace(/Outlook|JSON/g, ''))).toBe(false);
  });
});
