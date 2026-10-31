/** منصة الرياضة — أنواع محتوى النظام (docs/SPORTS_*.json) ودوال مشتركة. المحتوى كله «افتراض» ؛ لا نضيف عليه تعليمات أداء من عندنا. */

export interface Exercise {
  id: string; number?: number; english_name: string; arabic_name: string; main_muscle_ar: string; category_ar?: string; equipment?: string; equipment_keys?: string[];
  /** v5: تفاصيل تعليمية من المعرفة العامة (ليست نصيحة طبية). أي حقل قد يكون null/غائبًا ولا نملؤه. */
  secondary_muscles_ar?: string[] | null; level?: string | null; instructions_ar?: string[] | null; details_confidence?: string | null;
  /** v6: مراجعة أمان للمبتدئ كتبها النظام (معرفة عامة). beginner_safe: false = ليس للمبتدئ؛ null/غائب = غير مراجَع (لا نفترض). */
  beginner_safe?: boolean | null; safety_note_ar?: string | null; safer_alternative_id?: string | null;
}
/** v6: ملاحظة الأمان على مستوى الملف. recorded_injuries_ar = «لا توجد إصابات مسجلة» تعني غير مسجلة وليس لا توجد. */
export interface SafetyReview {
  reviewed_at?: string; reviewed_for_ar?: string; basis_ar?: string; confidence?: string; disclaimer_ar?: string;
  recorded_injuries_ar?: string; recorded_injuries_note_ar?: string; weight_context_ar?: string;
  counts?: Record<string, number>; beginner_unsafe_ids?: string[]; with_safety_note_ids?: string[];
}
export interface ChangeEntry { version: number; date?: string; change_ar?: string; changes?: { session_id: string; from_exercise_id?: string; to_exercise_id?: string; removed_alternative_exercise_id?: string; reason_ar?: string }[] }
export interface ExercisesDoc {
  version?: number; generated_at?: string; count?: number; confidence?: string; note_ar?: string; safety_note_ar?: string;
  equipment_key_values?: Record<string, string>; details_note_ar?: string; level_values_ar?: string[]; details_confidence_values?: Record<string, string>; safety_review?: SafetyReview; changelog?: ChangeEntry[]; exercises: Exercise[];
}
export interface Range { min: number; max: number }
export interface SessionExercise { exercise_id: string; sets?: Range; reps?: Range; duration_seconds?: Range; per_side?: boolean }
export interface Session {
  id: string; name_ar: string; kind: string; location?: string; exercises?: SessionExercise[];
  duration_minutes?: Range | { weeks_1_4?: Range; weeks_5_plus?: Range }; note_ar?: string; optional?: boolean; confidence?: string;
  /** v6: ملاحظات أمان للجلسة؛ safety_notes_ar[i] تخص safety_exercise_ids[i] */
  safety_notes_ar?: string[]; safety_exercise_ids?: string[];
}
export interface TemplateDay { weekday: string; weekday_ar?: string; sessions: string[] }
export interface Template { id: string; name_ar: string; days_per_week: number; location: string; recommended_from_week?: number; days: TemplateDay[]; confidence?: string }
export interface Phase { id: string; name_ar: string; weeks?: Range; sets?: Range; reps?: Range; rest_seconds?: Range; lowering_seconds?: number; confidence?: string }
export interface PlansDoc {
  version?: number; generated_at?: string; confidence?: string; confidence_ar?: string; note_ar?: string;
  goal?: { current_weight_kg?: number; goal_weight_kg?: number; confidence?: string; note_ar?: string };
  selected_template_id?: string | null; selected_location?: string | null; selection_note_ar?: string;
  weekday_order?: string[]; phases?: Phase[]; general_rules?: { id: string; text_ar: string; confidence?: string }[];
  excluded_exercise_ids?: string[]; sessions: Session[]; templates: Template[];
  disclaimer_ar?: string; recorded_injuries_ar?: string; recorded_injuries_note_ar?: string; weight_context_ar?: string; beginner_unsafe_exercise_ids?: string[]; changelog?: ChangeEntry[];
}
export interface Alternative { id: string; title_ar: string; how_ar: string; basis_ar?: string; confidence?: string }
export interface HabitAlts { id: string; name_ar: string; recorded_by_mohammed?: boolean; habits_json_key?: string; alternatives: Alternative[]; safety_note_ar?: string | null; note_ar?: string }
export interface AltsDoc {
  version?: number; generated_at?: string; confidence?: string; note_ar?: string; selection_note_ar?: string;
  selected_alternatives?: Record<string, unknown>; habits: HabitAlts[]; craving_card?: { title_ar?: string; how_ar?: string; alternatives_per_press?: number };
}

/** يتحقق من الشكل البنيوي لمحتوى الرياضة؛ يُرجع أول مشكلة أو null. */
export function checkContent(name: string, d: unknown): string | null {
  const o = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!o(d)) return 'المحتوى ليس كائنًا';
  const arr = (k: string): string | null => (Array.isArray(d[k]) ? null : `الحقل ${k} يجب أن يكون قائمة`);
  if (name === 'SPORTS_EXERCISES.json') {
    const a = arr('exercises');
    if (a) return a;
    for (const e of d['exercises'] as unknown[]) if (!o(e) || typeof e['id'] !== 'string' || typeof e['english_name'] !== 'string' || typeof e['arabic_name'] !== 'string') return 'exercises[]: كل تمرين يحتاج id و english_name و arabic_name';
  } else if (name === 'GLOSSARY_AR.json') {
    const a = arr('entries');
    if (a) return a;
    for (const e of d['entries'] as unknown[]) if (!o(e) || typeof e['id'] !== 'string' || typeof e['term_ar'] !== 'string' || typeof e['definition_ar'] !== 'string') return 'entries[]: كل مصطلح يحتاج id و term_ar و definition_ar';
  } else if (name === 'SPORTS_PLANS_AR.json') {
    return arr('sessions') ?? arr('templates');
  } else if (name === 'HABITS_ALTERNATIVES_AR.json') {
    const a = arr('habits');
    if (a) return a;
    for (const h of d['habits'] as unknown[]) if (!o(h) || typeof h['id'] !== 'string' || !Array.isArray(h['alternatives'])) return 'habits[]: كل عادة تحتاج id و alternatives';
  }
  return null;
}

/* ───── مناطق الجسم (تصنيف الموقع لعضلات النظام؛ تقريبي ويُعلَن) ───── */
export interface Region { id: string; ar: string; en: string; views: ('front' | 'back')[] }
export const REGIONS: Region[] = [
  { id: 'chest', ar: 'الصدر', en: 'Chest', views: ['front'] },
  { id: 'shoulders', ar: 'الأكتاف', en: 'Shoulders', views: ['front'] },
  { id: 'biceps', ar: 'البايسبس', en: 'Biceps', views: ['front'] },
  { id: 'forearms', ar: 'الساعد', en: 'Forearms', views: ['front', 'back'] },
  { id: 'abs', ar: 'البطن', en: 'Abs', views: ['front'] },
  { id: 'obliques', ar: 'الجوانب', en: 'Obliques', views: ['front'] },
  { id: 'quads', ar: 'الفخذ الأمامي', en: 'Quads', views: ['front'] },
  { id: 'adductors', ar: 'الفخذ الداخلي', en: 'Inner thigh', views: ['front'] },
  { id: 'traps', ar: 'الترابيس', en: 'Traps', views: ['back'] },
  { id: 'rear_delts', ar: 'الكتف الخلفي', en: 'Rear delts', views: ['back'] },
  { id: 'lats', ar: 'الظهر العريض', en: 'Lats', views: ['back'] },
  { id: 'upper_back', ar: 'منتصف وأعلى الظهر', en: 'Upper back', views: ['back'] },
  { id: 'lower_back', ar: 'أسفل الظهر', en: 'Lower back', views: ['back'] },
  { id: 'triceps', ar: 'الترايسبس', en: 'Triceps', views: ['back'] },
  { id: 'glutes', ar: 'الأرداف', en: 'Glutes', views: ['back'] },
  { id: 'hamstrings', ar: 'الفخذ الخلفي', en: 'Hamstrings', views: ['back'] },
  { id: 'calves', ar: 'السمانة', en: 'Calves', views: ['front', 'back'] },
];
export const PSEUDO = [
  { id: 'full', ar: 'كامل الجسم' },
  { id: 'cardio', ar: 'قلب وتحمّل' },
] as const;
export const REGION_AR: Record<string, string> = Object.fromEntries([...REGIONS.map((r) => [r.id, r.ar]), ...PSEUDO.map((r) => [r.id, r.ar])]);

/** يحوّل نص العضلة الرئيسية عندك (main_muscle_ar) إلى مناطق. تصنيف الموقع لا النظام؛ الأمثل أن يطابق الاسم الحرفي. */
export function regionsOf(muscleAr: string): string[] {
  const t = muscleAr;
  const has = (s: string): boolean => t.includes(s);
  const out = new Set<string>();
  if (has('الصدر')) out.add('chest');
  if (has('الترايسبس')) out.add('triceps');
  if (has('البايسبس')) out.add('biceps');
  if (has('الساعد')) out.add('forearms');
  if (has('الكتف الخلفي')) out.add('rear_delts');
  else if (has('الكتف') || has('الأكتاف')) out.add('shoulders');
  if (has('الترابيس')) out.add('traps');
  const lats = has('الظهر العريض');
  const mid = has('منتصف الظهر') || has('أعلى الظهر');
  const low = has('أسفل الظهر');
  if (lats) out.add('lats');
  if (mid) out.add('upper_back');
  if (low) out.add('lower_back');
  if (has('الظهر') && !lats && !mid && !low) {
    out.add('lats');
    out.add('upper_back');
  }
  if (has('البطن')) out.add('abs');
  if (has('الجوانب')) out.add('obliques');
  if (has('الجذع')) {
    out.add('abs');
    out.add('obliques');
  }
  if (has('الأرداف')) out.add('glutes');
  if (has('الفخذ الأمامي')) out.add('quads');
  if (has('الفخذ الخلفي')) out.add('hamstrings');
  if (has('الفخذ الداخلي')) out.add('adductors');
  if (has('الفخذ') && !has('الفخذ الأمامي') && !has('الفخذ الخلفي') && !has('الفخذ الداخلي')) out.add('quads');
  if (has('الأرجل')) ['quads', 'hamstrings', 'glutes', 'calves'].forEach((x) => out.add(x));
  if (has('السمانة')) out.add('calves');
  if (has('كامل الجسم')) out.add('full');
  if (has('القلب')) out.add('cardio');
  return [...out];
}

export interface ExerciseView extends Exercise { regions: string[] }
export const withRegions = (xs: Exercise[]): ExerciseView[] => xs.map((e) => ({ ...e, regions: regionsOf(e.main_muscle_ar) }));

export const fmtRange = (r: Range | undefined, unit = ''): string => (!r ? '' : r.min === r.max ? `${r.min}${unit}` : `${r.min}–${r.max}${unit}`);
export function describeSE(se: SessionExercise): string {
  const parts: string[] = [];
  if (se.sets) parts.push(`${fmtRange(se.sets)} مجموعات`);
  if (se.reps) parts.push(`× ${fmtRange(se.reps)} تكرار`);
  if (se.duration_seconds) parts.push(`${fmtRange(se.duration_seconds)} ثانية`);
  if (se.per_side) parts.push('لكل جهة');
  return parts.join(' ');
}
export const WEEKDAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const WEEKDAY_AR: Record<Weekday, string> = { sat: 'السبت', sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة' };
export const LOCATION_AR: Record<string, string> = { home: 'بيت', gym: 'جيم', any: 'أي مكان' };
export const KIND_AR: Record<string, string> = { strength: 'قوة', cardio: 'كارديو', mobility: 'إطالة وقوام', rest: 'راحة' };

/** اليوم الحالي (Asia/Kuala_Lumpur) بنفس رموز الأسبوع. */
export function weekdayKL(nowMs: number): Weekday {
  const d = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short' }).format(nowMs).slice(0, 3).toLowerCase();
  return (WEEKDAYS as readonly string[]).includes(d) ? (d as Weekday) : 'sat';
}

/* ───── تمريني المحلي (قاعدة الموقع، لا السجل) ───── */
export interface MyItem { id: string; workout_id: string; exercise_id: string; en_name: string; ar_name: string; sets: number | null; reps_min: number | null; reps_max: number | null; duration_s: number | null; per_side: boolean; note: string | null; sort: number }
export interface MyWorkout { id: string; name: string; note: string | null; sort: number; created_at: string; updated_at: string; items: MyItem[] }
export interface MyWeek { workouts: MyWorkout[]; week: Record<string, string | null>; template: string | null; location: string | null }

/* ───── قاموس المصطلحات (docs/GLOSSARY_AR.json) ───── */
export interface GlossaryEntry { id: string; term_ar: string; term_en?: string | null; category: string; definition_ar: string }
export interface GlossaryDoc { version?: number; generated_at?: string; purpose_ar?: string; categories?: Record<string, { name_ar: string }>; count?: number; entries: GlossaryEntry[] }
export const LEVEL_TONE: Record<string, 'ok' | 'warn' | 'danger'> = { 'مبتدئ': 'ok', 'متوسط': 'warn', 'متقدم': 'danger' };
