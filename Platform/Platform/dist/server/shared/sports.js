/** منصة الرياضة — أنواع محتوى راشد (docs/SPORTS_*.json) ودوال مشتركة. المحتوى كله «افتراض» من راشد؛ لا نضيف عليه تعليمات أداء من عندنا. */
/** يتحقق من الشكل البنيوي لمحتوى الرياضة؛ يُرجع أول مشكلة أو null. */
export function checkContent(name, d) {
    const o = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
    if (!o(d))
        return 'المحتوى ليس كائنًا';
    const arr = (k) => (Array.isArray(d[k]) ? null : `الحقل ${k} يجب أن يكون قائمة`);
    if (name === 'SPORTS_EXERCISES.json') {
        const a = arr('exercises');
        if (a)
            return a;
        for (const e of d['exercises'])
            if (!o(e) || typeof e['id'] !== 'string' || typeof e['english_name'] !== 'string' || typeof e['arabic_name'] !== 'string')
                return 'exercises[]: كل تمرين يحتاج id و english_name و arabic_name';
    }
    else if (name === 'GLOSSARY_AR.json') {
        const a = arr('entries');
        if (a)
            return a;
        for (const e of d['entries'])
            if (!o(e) || typeof e['id'] !== 'string' || typeof e['term_ar'] !== 'string' || typeof e['definition_ar'] !== 'string')
                return 'entries[]: كل مصطلح يحتاج id و term_ar و definition_ar';
    }
    else if (name === 'SPORTS_PLANS_AR.json') {
        return arr('sessions') ?? arr('templates');
    }
    else if (name === 'HABITS_ALTERNATIVES_AR.json') {
        const a = arr('habits');
        if (a)
            return a;
        for (const h of d['habits'])
            if (!o(h) || typeof h['id'] !== 'string' || !Array.isArray(h['alternatives']))
                return 'habits[]: كل عادة تحتاج id و alternatives';
    }
    return null;
}
export const REGIONS = [
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
];
export const REGION_AR = Object.fromEntries([...REGIONS.map((r) => [r.id, r.ar]), ...PSEUDO.map((r) => [r.id, r.ar])]);
/** يحوّل نص العضلة الرئيسية عند راشد (main_muscle_ar) إلى مناطق. تصنيف الموقع لا راشد؛ الأمثل أن يطابق الاسم الحرفي. */
export function regionsOf(muscleAr) {
    const t = muscleAr;
    const has = (s) => t.includes(s);
    const out = new Set();
    if (has('الصدر'))
        out.add('chest');
    if (has('الترايسبس'))
        out.add('triceps');
    if (has('البايسبس'))
        out.add('biceps');
    if (has('الساعد'))
        out.add('forearms');
    if (has('الكتف الخلفي'))
        out.add('rear_delts');
    else if (has('الكتف') || has('الأكتاف'))
        out.add('shoulders');
    if (has('الترابيس'))
        out.add('traps');
    const lats = has('الظهر العريض');
    const mid = has('منتصف الظهر') || has('أعلى الظهر');
    const low = has('أسفل الظهر');
    if (lats)
        out.add('lats');
    if (mid)
        out.add('upper_back');
    if (low)
        out.add('lower_back');
    if (has('الظهر') && !lats && !mid && !low) {
        out.add('lats');
        out.add('upper_back');
    }
    if (has('البطن'))
        out.add('abs');
    if (has('الجوانب'))
        out.add('obliques');
    if (has('الجذع')) {
        out.add('abs');
        out.add('obliques');
    }
    if (has('الأرداف'))
        out.add('glutes');
    if (has('الفخذ الأمامي'))
        out.add('quads');
    if (has('الفخذ الخلفي'))
        out.add('hamstrings');
    if (has('الفخذ الداخلي'))
        out.add('adductors');
    if (has('الفخذ') && !has('الفخذ الأمامي') && !has('الفخذ الخلفي') && !has('الفخذ الداخلي'))
        out.add('quads');
    if (has('الأرجل'))
        ['quads', 'hamstrings', 'glutes', 'calves'].forEach((x) => out.add(x));
    if (has('السمانة'))
        out.add('calves');
    if (has('كامل الجسم'))
        out.add('full');
    if (has('القلب'))
        out.add('cardio');
    return [...out];
}
export const withRegions = (xs) => xs.map((e) => ({ ...e, regions: regionsOf(e.main_muscle_ar) }));
export const fmtRange = (r, unit = '') => (!r ? '' : r.min === r.max ? `${r.min}${unit}` : `${r.min}–${r.max}${unit}`);
export function describeSE(se) {
    const parts = [];
    if (se.sets)
        parts.push(`${fmtRange(se.sets)} مجموعات`);
    if (se.reps)
        parts.push(`× ${fmtRange(se.reps)} تكرار`);
    if (se.duration_seconds)
        parts.push(`${fmtRange(se.duration_seconds)} ثانية`);
    if (se.per_side)
        parts.push('لكل جهة');
    return parts.join(' ');
}
export const WEEKDAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
export const WEEKDAY_AR = { sat: 'السبت', sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة' };
export const LOCATION_AR = { home: 'بيت', gym: 'جيم', any: 'أي مكان' };
export const KIND_AR = { strength: 'قوة', cardio: 'كارديو', mobility: 'إطالة وقوام', rest: 'راحة' };
/** اليوم الحالي (Asia/Kuala_Lumpur) بنفس رموز الأسبوع. */
export function weekdayKL(nowMs) {
    const d = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short' }).format(nowMs).slice(0, 3).toLowerCase();
    return WEEKDAYS.includes(d) ? d : 'sat';
}
export const LEVEL_TONE = { 'مبتدئ': 'ok', 'متوسط': 'warn', 'متقدم': 'danger' };
