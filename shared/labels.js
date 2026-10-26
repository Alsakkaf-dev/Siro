export function checkFieldLabels(d) {
    if (!d || typeof d !== 'object')
        return 'المحتوى ليس كائنًا';
    const l = d['labels'];
    if (!l || typeof l !== 'object' || Array.isArray(l))
        return 'labels يجب أن يكون كائنًا';
    for (const v of Object.values(l))
        if (!v || typeof v.label_ar !== 'string')
            return 'labels: كل مفتاح يحتاج label_ar';
    return null;
}
/** اسم عربي لمفتاح تقني: بطاقات البيانات الناقصة أولًا، ثم labels؛ وإلا null (لا نعرض المفتاح الإنجليزي). */
export function fieldLabel(doc, key) {
    return doc?.missing_data_cards?.find((c) => c.key === key)?.label_ar ?? doc?.labels?.[key]?.label_ar ?? null;
}
