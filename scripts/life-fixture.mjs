// مولّد صادرات «راشد» وهمية (FIXTURE) تطابق قاموس البيانات، للاختبارات فقط. كل القيم مصطنعة وتحمل writer: "FIXTURE (synthetic)".
import fs from 'node:fs';
import path from 'node:path';

const KL = (d) => new Date(d.getTime() + 8 * 3600e3).toISOString().slice(0, 19) + '+08:00';

export function buildLifeFixture(dir, opts = {}) {
  const now = opts.now ?? new Date();
  const generatedAt = opts.generatedAt ?? KL(now);
  const w = (rel, data) => {
    const p = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(p, text, 'utf8');
    return Buffer.byteLength(text, 'utf8');
  };
  const day = (n) => new Date(now.getTime() + (8 + 24 * n) * 3600e3).toISOString().slice(0, 10);
  const items = (t, m, d) => [
    { key: 'treasury', label_ar: 'الخزينة', amount: t, currency: 'RM', confidence: 'محسوب' },
    { key: 'monthly', label_ar: 'الشهري', amount: m, currency: 'RM', confidence: 'محسوب' },
    { key: 'daily', label_ar: 'اليومية', amount: d, currency: 'RM', confidence: 'محسوب' },
    { key: 'total', label_ar: 'المجموع', amount: t + m + d, currency: 'RM', confidence: 'محسوب' },
  ];
  const tx = [];
  const cats = ['طعام وبقالة', 'اشتراكات', 'ترفيه وألعاب', 'نقل ووقود', null];
  for (let i = 0; i < 24; i++) {
    tx.push({ id: `FIX-${i}`, order: i + 1, date: day(-(24 - i) / 3 | 0), type: i % 6 === 5 ? 'transfer' : 'expense', type_ar: i % 6 === 5 ? 'تحويل' : 'مصروف', amount: 3 + (i % 7) * 1.5, currency: 'RM', wallet: i % 3 === 0 ? 'يومية' : 'خزينة', label_ar: `بند ${i}`, confidence: 'مثبت', cash_delta: i % 6 === 5 ? 0 : -(3 + (i % 7) * 1.5), category_ar: i % 6 === 5 ? undefined : cats[i % cats.length], category_confidence: 'افتراض' });
  }
  const finance = {
    balances_block: { title: 'الأرصدة اليوم:', as_of: generatedAt, items: items(1000, 50, 20) },
    accounts: [{ key: 'rhb', label_ar: 'RHB', amount: 1050, currency: 'RM', confidence: 'مثبت', stated_at: generatedAt }, { key: 'tng', label_ar: 'TNG', amount: 20, currency: 'RM', confidence: 'مثبت', stated_at: generatedAt }],
    open_items: [{ id: 'F-1', status: 'open', title_ar: 'بند مفتوح وهمي', detail_ar: 'للاختبار فقط', amount: 10, confidence: 'محسوب', applied_to_boxes: false }],
    computed_notes: [{ text_ar: 'ملاحظة محسوبة وهمية', math: '50 - 5×14 = -20', confidence: 'محسوب' }],
    receivables: [{ person_ar: 'فلان', amount: null, last_recorded_amount: 12.5, confidence: 'افتراض', note_ar: 'مبلغ غير مؤكد' }],
    schedule: { title_ar: 'تحويل تلقائي', from_account: 'RHB', to_account: 'TNG', time_ar: '12:00', time_confidence: 'مثبت', periods: [{ from: day(0), to: day(5), per_day: 14, currency: 'RM', status: 'active', confidence: 'مثبت' }, { from: day(6), to: null, per_day: 16, currency: 'RM', status: 'open', confidence: 'افتراض' }] },
    rules_summary: [{ text_ar: 'قاعدة وهمية', confidence: 'مثبت' }],
    verification: { method_ar: 'تحقق وهمي', ledger_based: { treasury: 1000, monthly: 50, daily: 20, total: 1070 }, confidence: 'محسوب' },
    recent_transactions: tx,
    recent_transactions_note_ar: 'آخر حركات وهمية',
    planning_inputs_title_ar: 'حقول جاهزة للتعبئة (وهمي)',
    planning_inputs: {
      monthly_income: { value: null, unit: 'RM', note_ar: 'لم يسجّل الدخل (وهمي). لا تكتب رقمًا قبل تأكيده.', confidence: 'غير مسجل', needed_for_ar: 'عرض الدخل المتوقع', related: 'R-025' },
      weekly_food_budget: { value: null, unit: 'RM/أسبوع', note_ar: 'مقترح فقط (وهمي).', confidence: 'غير مسجل', needed_for_ar: 'ميزانية الأكل', related: 'D-R-010' },
    },
  };
  if (opts.balanceHistory === 'items') {
    finance.balance_history = [-6, -3, 0].map((n, i) => ({ as_of: `${day(n)}T12:00:00+08:00`, items: items(900 + i * 50, 80 - i * 15, 30 - i * 5) }));
  } else if (opts.balanceHistory === 'flat') {
    finance.balance_history = [-6, -3, 0].map((n, i) => ({ date: day(n), treasury: 900 + i * 50, monthly: 80 - i * 15, daily: 30 - i * 5, total: 1010 + i * 30 }));
  } else if (opts.balanceHistory === 'v4') {
    const pt = (date, as_of, t, m, d, event) => ({ date, as_of, treasury: t, monthly: m, daily: d, total: Math.round((t + m + d) * 100) / 100, confidence: 'محسوب', source_row: as_of ? 'ROW-1' : null, source_row_order: null, source_rows_all: [], source_ref: 'FIXTURE', event_ar: event, ...(as_of ? {} : { note_ar: 'أقدم حالة (وهمي)' }) });
    finance.balance_history_title_ar = 'تطور أرصدة الصناديق (وهمي)';
    finance.balance_history_method = 'طريقة وهمية للاختبار';
    finance.balance_history = [pt(day(-6), null, 900, 80, 30, 'بداية'), pt(day(-5), `${day(-5)}T14:00:00+08:00`, 900, 80, -10, 'حدث 1'), pt(day(-5), `${day(-5)}T14:00:00+08:00`, 850, 80, -10, 'حدث 2 بنفس اللحظة'), pt(day(0), `${day(0)}T09:00:00+08:00`, 850, 60, 20, 'الآن')];
    finance.balance_history_omitted = [{ rows: '1-38', dates: `${day(-12)} إلى ${day(-7)}`, reason_ar: 'تسمية قديمة (وهمي)' }, { rows: '53,54', reason_ar: 'بلا صندوق معروف (وهمي)' }];
  } else if (opts.balanceHistory === 'one') {
    finance.balance_history = [{ date: day(0), treasury: 1000, monthly: 50, daily: 20, total: 1070 }];
  } else if (opts.balanceHistory === 'garbage') {
    finance.balance_history = [{ foo: 1 }, 'x', { date: 'not-a-date', treasury: 1 }];
  }
  const st = (a) => Object.fromEntries(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k, i) => [k, a[i]]));
  const prayers = {
    attendance: {
      title_ar: 'حضور', statuses_ar: { in_time: 'في وقتها', late: 'متأخرة', missed: 'فاتت', unknown: 'غير معروف' },
      days: [
        { date: day(-2), status: st(['missed', 'missed', 'missed', 'missed', 'missed']), counts: { in_time: 0, late: 0, missed: 5, unknown: 0 }, confidence: 'مثبت' },
        { date: day(-1), status: st(['in_time', 'late', 'missed', 'unknown', 'unknown']), counts: { in_time: 1, late: 1, missed: 1, unknown: 2 }, confidence: 'مثبت', note_ar: 'وهمي' },
      ],
      totals: { in_time: 1, late: 1, missed: 6, unknown: 2 }, totals_confidence: 'محسوب', coverage_note_ar: 'السجل وهمي',
    },
    qada: {
      title_ar: 'القضاء', as_of: generatedAt, remaining: { fajr: { count: 10, name_ar: 'الفجر' }, dhuhr: { count: 20, name_ar: 'الظهر' }, asr: { count: 30, name_ar: 'العصر' }, maghrib: { count: 40, name_ar: 'المغرب' }, isha: { count: 50, name_ar: 'العشاء' } },
      total_remaining: 150, done_total: 0, done_today: 0, confidence: 'محسوب', done_confidence: 'مثبت', baseline: { date: day(-2), total: 140, confidence: 'مثبت' },
      history: [{ date: day(-2), fajr: 8, dhuhr: 18, asr: 28, maghrib: 38, isha: 48, total: 140, note_ar: 'أساس' }, { date: day(-1), fajr: 10, dhuhr: 20, asr: 30, maghrib: 40, isha: 50, total: 150 }],
      pending_ar: 'معلّق وهمي', rule_ar: 'قاعدة وهمية',
    },
  };
  const targets = (k) => Array.from({ length: 14 }, (_, i) => ({ date: day(i - 8), plan_day: i + 1, [k]: k === 'reduction_min' ? 20 * (i + 1) : 67 - 3 * i }));
  const counters = { days_logged: 3, days_kept: 1, days_not_kept: 1, days_unknown: 1, current_streak_days: 0, best_streak_days: 1, relapses: [], confidence: 'محسوب' };
  const habits = {
    status: { started: false, started_confidence: 'مثبت', note_ar: 'لم تبدأ (وهمي)' },
    habits: [
      { key: 'vape', name_ar: 'تقليل الفيب', kind: 'taper', unit: 'minutes', priority: 3, rule_ar: 'قاعدة', start_date: day(-8), step_per_day: 20, baseline_daily_minutes: null, targets: targets('reduction_min'), today: { date: day(0), plan_day: 9, reduction_min: 180, confidence: 'محسوب' }, no_vape_windows_ar: 'نافذة وهمية', log: [{ date: day(-1), kept_limit: 'no', confidence: 'مثبت' }, { date: day(-2), kept_limit: 'yes', confidence: 'مثبت' }], counters },
      { key: 'tea_sugar', name_ar: 'سكر الشاي', kind: 'taper', unit: 'grams', rule_ar: 'قاعدة', start_date: day(-8), step_per_day: -3, targets: targets('sugar_limit_g'), today: { date: day(0), plan_day: 9, sugar_limit_g: 43, confidence: 'محسوب' }, zero_from: day(15), log: [], counters },
      { key: 'water', name_ar: 'الماء', kind: 'daily_target', unit: 'liters', target: 3, log: [], counters: { days_logged: 0, days_on_target: 0, current_streak_days: 0, best_streak_days: 0 } },
      { key: 'sleep', name_ar: 'النوم', kind: 'daily_target', target_bedtime: '22:30', log: [], counters: { days_logged: 0 } },
      { key: 'food', name_ar: 'الأكل', kind: 'daily_target', target_kcal: 1500, target_protein_g: 120, log: [], counters: { days_logged: 0 } },
      { key: 'workout', name_ar: 'التمرين', kind: 'schedule', unit: 'sessions', time_slot: { start: '06:15', end: '07:15', confidence: 'افتراض' }, week_plan: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'].map((d, i) => ({ day: d, day_ar: d, type: i % 2 ? 'walk' : 'strength_A', type_ar: i % 2 ? 'مشي' : 'قوة A' })), today: { date: day(0), type_ar: 'مشي', confidence: 'افتراض' }, log: [{ date: day(-1), done: 'no', confidence: 'مثبت' }], counters: { days_logged: 1, days_done: 0, current_streak_days: 0, best_streak_days: 0 } },
    ],
    daily_summary: [{ date: day(-1), vape_kept: 'no', trained: 'no', confidence: 'مثبت' }],
    unrecorded_inputs_title_ar: 'غير مسجل (وهمي)',
    unrecorded_inputs: { workout_location: { value: null, unit: 'home/gym', note_ar: 'لم يقرر محمد (وهمي).', confidence: 'غير مسجل', needed_for_ar: 'اختيار القالب', related: null } },
  };
  const blk = (name, start, end, days, kind, extra = {}) => ({ name, start, end, days, days_ar: days, calendar: 'روتين وصحة', kind, moves_with_prayer_time: false, source_id: 'FIX', confidence: 'مثبت', ...extra });
  const all7 = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const routine = {
    timezone: 'Asia/Kuala_Lumpur', as_of_note_ar: 'وهمي',
    prayer_times_reference: { date: day(-12), zone: 'JHR02', fajr: '05:32', dhuhr: '12:56', asr: '16:09', maghrib: '18:55', isha: '20:05', confidence: 'مثبت' },
    daily_blocks: [blk('نوم', '00:00', '05:00', all7, 'sleep'), blk('الظهر', '12:56', '13:16', all7, 'prayer', { moves_with_prayer_time: true, calendar: 'صلاة' }), blk('تمرين', '06:15', '07:15', all7, 'routine')],
    weekly_study_blocks: [blk('ProfComm', '08:00', '10:00', ['mon'], 'lecture', { calendar: 'دراسة' })],
    local_routines: [{ name: 'سؤال المصروف', time: '21:45', flex_min: 15, days: all7, days_ar: all7, calendar: null, in_outlook: false, confidence: 'مثبت' }],
    known_conflicts: [{ id: 'RC-1', text_ar: 'تعارض وهمي' }],
    holidays: [{ name_ar: 'عطلة وهمية', from: day(13), to: day(14), confidence: 'مثبت' }],
  };
  const body = {
    date: day(-5),
    items: [{ key: 'height', label_ar: 'الطول', value: 170, unit: 'cm', confidence: 'مثبت' }, { key: 'weight', label_ar: 'الوزن', value: 80, unit: 'kg', confidence: 'مثبت', date: day(-5) }, { key: 'body_fat', label_ar: 'الدهون', value: 30, unit: '%', approx: true, confidence: 'مثبت' }, { key: 'goal_weight', label_ar: 'الهدف', value: 70, unit: 'kg', confidence: 'مثبت' }],
    goal_kg: 70, latest_recorded_weight: { date: day(-1), value_kg: 79, confidence: 'مثبت' },
    weight_history_note_ar: 'تعارض وهمي',
    unrecorded_inputs: { next_weight_reading: { value: null, unit: 'kg', note_ar: 'قراءة جديدة لم تُسجل (وهمي).', confidence: 'غير مسجل', needed_for_ar: 'مخطط الوزن' } },
    weight_history: [{ date: day(-12), value_kg: 81, confidence: 'افتراض', status_ar: 'مبدئي' }, { date: day(-5), value_kg: 80, confidence: 'مثبت', status_ar: 'خط الأساس' }, { date: day(-1), value_kg: 79, confidence: 'مثبت', status_ar: 'آخر قراءة' }],
  };
  const summary = {
    generated_at: generatedAt, read_only: true, balances_block: finance.balances_block, balances_source: 'وهمي',
    qada: { ...prayers.qada, source: 'وهمي' },
    habits: { title_ar: 'عدادات', started: false, started_confidence: 'مثبت', note_ar: 'لم تبدأ', items: habits.habits.slice(0, 2).map((h) => ({ key: h.key, name_ar: h.name_ar, today_plan_day: 9, today_target_ar: 'هدف', today_target: 180, unit: h.unit, current_streak_days: 0, days_kept: 1, days_not_kept: 1, confidence: 'محسوب' })) },
    open_finance_items: { title_ar: 'بنود مفتوحة', items: finance.open_items },
    open_loops_count: { title_ar: 'بنود', open_or_waiting: 3, open: 2, waiting: 1, partially_closed: 0, closed: 4, total_rows: 7, confidence: 'محسوب' },
  };
  const data = { finance, prayers, habits, routine, body, dashboard_summary: summary };
  const files = [];
  for (const [name, d] of Object.entries(data)) {
    const bytes = w(`${name}.json`, d);
    const hours = { finance: 24, prayers: 12, habits: 24, routine: 168, body: 168, dashboard_summary: 24 }[name];
    files.push({ name: `${name}.json`, type: 'json', description_ar: 'وهمي', bytes, generated_at: opts.fileGeneratedAt?.[name] ?? generatedAt, stale_after_hours: hours, stale_after_confidence: 'افتراض' });
  }
  if (opts.badBytes) files.find((f) => f.name === opts.badBytes + '.json').bytes += 7;
  w('docs/SPORTS_CONTENT_AR.md', '# وهمي\n');
  const exs = [
    ['push_up', 'Push-Up', 'ضغط أرضي', 'الصدر', 'الصدر', 'وزن الجسم', ['bodyweight']],
    ['goblet_squat', 'Goblet Squat', 'سكوات بدمبل', 'الفخذ الأمامي والأرداف', 'الأرجل', 'دمبل', ['dumbbell']],
    ['lat_pulldown', 'Lat Pulldown', 'سحب علوي', 'الظهر العريض', 'الظهر', 'آلة', ['machine']],
    ['dumbbell_curl', 'Dumbbell Curl', 'بايسبس بدمبل', 'البايسبس', 'البايسبس', 'دمبل', ['dumbbell']],
    ['plank', 'Plank', 'بلانك', 'البطن والجذع كله', 'البطن والجذع', 'وزن الجسم', ['bodyweight']],
    ['brisk_walking', 'Brisk Walking', 'مشي سريع', 'الأرجل والقلب', 'كامل الجسم وكارديو', 'بدون معدات', ['none']],
  ].map(([id, en, ar, m, c, eq, k], i) => ({ id, number: i + 1, english_name: en, arabic_name: ar, main_muscle_ar: m, category_ar: c, equipment: eq, equipment_keys: k, ...(id === 'plank' ? { secondary_muscles_ar: null, level: null, instructions_ar: null, beginner_safe: null, safety_note_ar: null, safer_alternative_id: null } : { secondary_muscles_ar: ['الترايسبس', 'البطن'], level: i % 2 ? 'متوسط' : 'مبتدئ', instructions_ar: ['خطوة أولى (وهمي).', 'خطوة ثانية (وهمي).', 'خطوة ثالثة (وهمي).'], details_confidence: 'general_knowledge', beginner_safe: id !== 'dumbbell_curl', safety_note_ar: id === 'dumbbell_curl' ? 'يحمّل المرفق (وهمي).' : 'ظهر مستقيم (وهمي).', safer_alternative_id: id === 'dumbbell_curl' ? 'goblet_squat' : id === 'push_up' ? 'goblet_squat' : null }) }));
  const exDoc = { version: 1, generated_at: generatedAt, count: exs.length, confidence: 'assumption', note_ar: 'وهمي', details_note_ar: 'تفاصيل تعليمية من المعرفة العامة (وهمي)', level_values_ar: ['مبتدئ', 'متوسط', 'متقدم'], safety_note_ar: 'توقف عند أي ألم حاد (وهمي)', equipment_key_values: { bodyweight: 'وزن الجسم', dumbbell: 'دمبل', machine: 'آلة', none: 'بدون معدات' }, safety_review: { reviewed_at: generatedAt, reviewed_for_ar: 'مبتدئ (وهمي)', basis_ar: 'مراجعة وهمية', confidence: 'general_knowledge', disclaimer_ar: 'معلومات تعليمية وليست نصيحة طبية (وهمي).', recorded_injuries_ar: 'لا توجد إصابات مسجلة', recorded_injuries_note_ar: 'هذا يعني غير مسجلة وليس غير موجودة (وهمي).', weight_context_ar: 'وهمي', counts: { total: 6, beginner_safe_false: 1 }, beginner_unsafe_ids: ['dumbbell_curl'] }, changelog: [{ version: 3, change_ar: 'وهمي' }], exercises: exs };
  const rg = (a, b) => ({ min: a, max: b });
  const plans = {
    version: 1, generated_at: generatedAt, confidence: 'assumption', confidence_ar: 'افتراض', note_ar: 'وهمي', selected_template_id: null, selected_location: null, selection_note_ar: 'لم يُختر (وهمي)', disclaimer_ar: 'معلومات تعليمية وليست نصيحة طبية (وهمي).', recorded_injuries_ar: 'لا توجد إصابات مسجلة', recorded_injuries_note_ar: 'هذا يعني غير مسجلة وليس غير موجودة (وهمي).', weight_context_ar: 'وهمي', beginner_unsafe_exercise_ids: ['dumbbell_curl'],
    changelog: [{ version: 2, change_ar: 'استُبدل تمرين (وهمي)', changes: [{ session_id: 'home_A', from_exercise_id: 'dumbbell_curl', to_exercise_id: 'goblet_squat', reason_ar: 'سبب وهمي' }] }],
    weekday_order: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'],
    phases: [{ id: 'phase_1', name_ar: 'الأسابيع 1 إلى 6', weeks: rg(1, 6), sets: rg(2, 3), reps: rg(10, 15), rest_seconds: rg(60, 90), lowering_seconds: 3 }],
    general_rules: [{ id: 'stop_if_pain', text_ar: 'إذا ظهر ألم حاد توقف (وهمي).' }], excluded_exercise_ids: ['burpee'],
    sessions: [
      { id: 'home_A', name_ar: 'بيت A', kind: 'strength', location: 'home', safety_exercise_ids: ['goblet_squat'], safety_notes_ar: ['ظهر مستقيم ونزول مريح (وهمي).'], exercises: [{ exercise_id: 'goblet_squat', sets: rg(3, 3), reps: rg(10, 15) }, { exercise_id: 'push_up', sets: rg(3, 3), reps: rg(8, 12) }, { exercise_id: 'plank', sets: rg(3, 3), duration_seconds: rg(20, 45) }] },
      { id: 'walk', name_ar: 'مشي', kind: 'cardio', location: 'any', exercises: [{ exercise_id: 'brisk_walking' }], duration_minutes: { weeks_1_4: rg(20, 30), weeks_5_plus: rg(30, 40) } },
      { id: 'rest', name_ar: 'راحة', kind: 'rest', location: 'any', exercises: [] },
    ],
    templates: [
      { id: 'home_3day', name_ar: '3 أيام (بيت)', days_per_week: 3, location: 'home', recommended_from_week: 1, days: [['sat', 'السبت', ['home_A']], ['sun', 'الأحد', ['walk']], ['mon', 'الإثنين', ['home_A']], ['tue', 'الثلاثاء', ['walk']], ['wed', 'الأربعاء', ['home_A']], ['thu', 'الخميس', ['walk']], ['fri', 'الجمعة', ['rest']]].map(([weekday, weekday_ar, sessions]) => ({ weekday, weekday_ar, sessions })) },
      { id: 'gym_3day', name_ar: '3 أيام (جيم)', days_per_week: 3, location: 'gym', days: [{ weekday: 'sat', weekday_ar: 'السبت', sessions: ['rest'] }] },
    ],
  };
  const alts = {
    version: 1, generated_at: generatedAt, confidence: 'assumption', note_ar: 'وهمي', selected_alternatives: {}, selection_note_ar: 'فارغ',
    habits: [
      { id: 'vape', name_ar: 'الفيب', recorded_by_mohammed: true, habits_json_key: 'vape', safety_note_ar: 'استشر الصيدلي (وهمي)', alternatives: ['water', 'breathing', 'walk', 'gum'].map((k) => ({ id: `vape_${k}`, title_ar: `بديل ${k}`, how_ar: `كيف ${k} (وهمي)`, basis_ar: 'اقتراح عام', confidence: 'assumption' })) },
      { id: 'tea_sugar', name_ar: 'سكر الشاي', recorded_by_mohammed: true, alternatives: [{ id: 'tea_smaller_cup', title_ar: 'كوب أصغر', how_ar: 'وهمي', basis_ar: 'اقتراح عام' }] },
    ],
    craving_card: { id: 'craving_card', title_ar: 'ماذا أسوي الحين؟', how_ar: 'يعرض 3 بدائل', alternatives_per_press: 3 },
  };
  const gl = { version: 1, generated_at: generatedAt, language: 'ar', purpose_ar: 'وهمي', categories: { exercise: { name_ar: 'مصطلحات التمارين' }, money: { name_ar: 'مصطلحات المال' }, habit: { name_ar: 'مصطلحات العادات' }, confidence: { name_ar: 'وسوم الثقة' } }, count: 8, entries: [
    { id: 'set', term_ar: 'مجموعة', term_en: 'Set', category: 'exercise', definition_ar: 'عدد مرات تكرار الحركة بشكل متصل (وهمي).' },
    { id: 'rep', term_ar: 'تكرار', term_en: 'Rep', category: 'exercise', definition_ar: 'مرة واحدة من الحركة (وهمي).' },
    { id: 'per_side', term_ar: 'لكل جهة', term_en: null, category: 'exercise', definition_ar: 'تسوي التمرين لليمين ثم لليسار (وهمي).' },
    { id: 'treasury', term_ar: 'الخزينة', term_en: null, category: 'money', definition_ar: 'صندوق احتياط (وهمي).' },
    { id: 'streak', term_ar: 'سلسلة', term_en: 'Streak', category: 'habit', definition_ar: 'أيام متتالية (وهمي).' },
    { id: 'conf_confirmed', term_ar: 'مثبت', term_en: 'Confirmed', category: 'confidence', definition_ar: 'قاله محمد (وهمي).' },
    { id: 'conf_computed', term_ar: 'محسوب', term_en: 'Computed', category: 'confidence', definition_ar: 'ناتج حساب (وهمي).' },
    { id: 'conf_assumption', term_ar: 'افتراض', term_en: 'Assumption', category: 'confidence', definition_ar: 'تقدير (وهمي).' },
  ] };
  const ledger = {
    file: 'ledger_full.json', version: 1, generated_at: generatedAt, read_only: true, title_ar: 'السجل المالي الكامل (وهمي)', total_rows: 3, currency: 'RM',
    note_ar: 'وهمي', redaction_note_ar: 'استُبدل اسم خدمة بعبارة «أداة ذكاء اصطناعي» (وهمي).', redacted_row_count: 1, redacted_row_ids: ['L-3'],
    rows: [
      { order: 1, event_id: 'L-1', occurred_at: day(-3), date: day(-3), type: 'expense', amount: 12.5, currency: 'RM', wallet: 'يومية', cash_delta: -12.5, receivable_delta: 0, source: 'وهمي', notes: 'غداء (وهمي)', text_redacted: false },
      { order: 2, event_id: 'L-2', occurred_at: day(-2), date: day(-2), type: 'transfer', amount: 14, currency: 'RM', wallet: 'تحويل', cash_delta: 0, receivable_delta: 0, source: 'وهمي', notes: 'تحويل تلقائي (وهمي)', text_redacted: false },
      { order: 3, event_id: 'L-3', occurred_at: day(-1), date: day(-1), type: 'expense', amount: 9.29, currency: 'RM', wallet: 'غير محدد', cash_delta: 0, receivable_delta: 0, source: 'وهمي', notes: 'أداة ذكاء اصطناعي (وهمي)', text_redacted: true },
    ],
  };
  const rblocks = {
    version: 1, generated_at: generatedAt, read_only: true, readme_ar: 'وهمي', overlap_note_ar: 'ارسم المحاضرة فوق الفراغ (وهمي)', week_start: 'sun', week_start_confidence: 'افتراض',
    days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((k, i) => ({ key: k, name_ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][i] })),
    legend: [{ type: 'free', type_ar: 'وقت فراغ', description_ar: 'وهمي', count: 1 }, { type: 'lecture', type_ar: 'محاضرة', description_ar: 'وهمي', count: 1 }, { type: 'sleep', type_ar: 'نوم', description_ar: 'وهمي', count: 1 }],
    block_count: 3, point_count: 1,
    blocks: [
      { id: 'RB-1', day: 'mon', day_ar: 'الإثنين', start: '00:00', end: '05:00', start_min: 0, end_min: 300, duration_min: 300, type: 'sleep', type_ar: 'نوم', label_ar: 'نوم', confidence: 'مثبت', moves_with_prayer_time: false, overlaps_with: [] },
      { id: 'RB-2', day: 'mon', day_ar: 'الإثنين', start: '06:00', end: '12:56', start_min: 360, end_min: 776, duration_min: 416, type: 'free', type_ar: 'وقت فراغ', label_ar: 'وقت فراغ', confidence: 'مثبت', moves_with_prayer_time: true, overlaps_with: ['RB-3'] },
      { id: 'RB-3', day: 'mon', day_ar: 'الإثنين', start: '08:00', end: '10:00', start_min: 480, end_min: 600, duration_min: 120, type: 'lecture', type_ar: 'محاضرة', label_ar: 'محاضرة وهمية', confidence: 'مثبت', moves_with_prayer_time: false, overlaps_with: ['RB-2'] },
    ],
    points: [{ id: 'RP-1', day: 'mon', day_ar: 'الإثنين', recurrence: 'weekly', time: '21:45', time_min: 1305, flex_min: 15, type: 'local_routine', type_ar: 'روتين محلي', label_ar: 'سؤال المصروف', confidence: 'مثبت', in_outlook: false }],
    known_conflicts: [{ id: 'RC-1', text_ar: 'تعارض وهمي' }], holidays: [],
  };
  const insights = {
    version: 2, generated_at: generatedAt, read_only: true, title_ar: 'مؤشرات وهمية', purpose_ar: 'وهمي', limitations_ar: ['الفترة قصيرة (وهمي)'],
    data_period: { from: day(-10), to: day(0), days: 11, basis_ar: 'وهمي', confidence: 'افتراض' }, spend_definition_ar: 'الصرف = صفوف expense (وهمي)',
    indicators: [
      { id: 'avg_daily_spend', order: 1, name_ar: 'متوسط الصرف اليومي', unit: 'RM لكل يوم', formula_ar: 'المجموع ÷ الأيام (وهمي)', arithmetic: '22 ÷ 11 = 2', confidence: 'محسوب', confidence_note_ar: 'وهمي', current_value: 2, value_text_ar: 'حوالي 2.00 رنجت في اليوم' },
      { id: 'receivables_owed_to_me', order: 2, name_ar: 'ديون لي', unit: 'RM', formula_ar: 'وهمي', confidence: 'افتراض', current_value: null, value_text_ar: null, missing_text_ar: 'غير مسجل: المبلغ غير مؤكد (وهمي).' },
    ],
  };
  const qplan = {
    version: 1, generated_at: generatedAt, read_only: true, title_ar: 'خطة قضاء (وهمي)', tone_ar: 'للتوضيح فقط', status_ar: 'مقترح، لم يبدأ', start_date: null, start_date_missing_text_ar: 'غير مسجل: لم تبدأ.',
    selected_scenario: null, selected_scenario_missing_text_ar: 'غير مسجل: لم يُختر سيناريو.', confidence: 'افتراض', confidence_note_ar: 'وهمي', as_of: generatedAt,
    counts: { total: 10, done_total: 0, confidence: 'محسوب' }, method_ar: { rounding_ar: 'تقريب لأعلى', assumptions_ar: ['ثابتة'] },
    scenarios: [1, 2, 3].map((n) => ({ id: `s${n}`, qada_per_day: n, label_ar: `${n} قضاء في اليوم`, total_days_if_counts_stay_fixed: { days: Math.ceil(10 / n), months_approx: 0.3, years_approx: 0, arithmetic_ar: `10 ÷ ${n}` } })),
    growth_note_ar: { text_ar: 'المجموع ممكن يزيد (وهمي)' }, educational_disclaimer_ar: 'معلومات تعليمية فقط (وهمي)',
  };
  const flabels = { version: 1, generated_at: generatedAt, read_only: true, title_ar: 'أسماء (وهمي)', labels: { monthly_income: { label_ar: 'الدخل الشهري', where_used: ['finance.json'] } }, missing_data_cards: [{ key: 'monthly_income', label_ar: 'الدخل الشهري', file: 'finance.json', path: 'planning_inputs.monthly_income' }] };
  const docBytes = { 'docs/GLOSSARY_AR.json': w('docs/GLOSSARY_AR.json', gl), 'docs/SPORTS_EXERCISES.json': w('docs/SPORTS_EXERCISES.json', exDoc), 'docs/SPORTS_PLANS_AR.json': w('docs/SPORTS_PLANS_AR.json', plans), 'docs/HABITS_ALTERNATIVES_AR.json': w('docs/HABITS_ALTERNATIVES_AR.json', alts), 'docs/ROUTINE_BLOCKS_AR.json': w('docs/ROUTINE_BLOCKS_AR.json', rblocks), 'docs/FINANCE_INSIGHTS_AR.json': w('docs/FINANCE_INSIGHTS_AR.json', insights), 'docs/PRAYER_QADA_PLAN_AR.json': w('docs/PRAYER_QADA_PLAN_AR.json', qplan), 'ledger_full.json': w('ledger_full.json', ledger), 'docs/FIELD_LABELS_AR.json': w('docs/FIELD_LABELS_AR.json', flabels) };
  for (const [name, bytes] of Object.entries(docBytes)) files.push({ name, type: 'json', description_ar: 'وهمي', bytes, generated_at: opts.fileGeneratedAt?.[name] ?? generatedAt, stale_after_hours: name === 'ledger_full.json' ? 24 : 720, stale_after_confidence: 'افتراض' });
  w('commands/README_AR.md', 'وهمي');
  w('commands/examples/log_expense.example.json', { id: 'EXAMPLE-LOG_EXPENSE', status: 'example', type: 'log_expense', created_at: generatedAt, payload: {} });
  if (!opts.noMeta) w('exports_meta.json', { version: 4, generated_at: generatedAt, timezone: 'Asia/Kuala_Lumpur', writer: 'FIXTURE (synthetic)', read_only: true, files });
  return dir;
}
