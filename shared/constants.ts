import type { AssessmentStatus, Kind, NoteTag, Timing } from './types.js';

export const KINDS: readonly Kind[] = ['final', 'test', 'project', 'assignment', 'oral', 'quiz', 'lab', 'other'];

export const KIND_LABEL: Record<Kind, string> = {
  final: 'امتحان نهائي',
  test: 'اختبار / ميد-تيرم',
  project: 'مشروع / تقرير',
  assignment: 'واجب',
  oral: 'نقاش / عرض',
  quiz: 'اختبار قصير',
  lab: 'مختبر',
  other: 'أخرى',
};

export const KIND_COLOR: Record<Kind, string> = {
  final: '#F97362',
  test: '#F2A93B',
  project: '#A78BFA',
  assignment: '#4CC9F0',
  oral: '#F472B6',
  quiz: '#4ADE80',
  lab: '#94A3B8',
  other: '#64748B',
};

export const TIMING_LABEL: Record<Timing, string> = {
  unknown: 'غير معروف',
  week: 'أسبوع محدد',
  date: 'تاريخ محدد',
  exam: 'فترة الامتحانات',
};

export const STATUS_LABEL: Record<AssessmentStatus, string> = {
  unknown: 'غير معروف',
  pending: 'قادم',
  submitted: 'تم التسليم',
  graded: 'تم التصحيح',
};

export const NOTE_TAG_LABEL: Record<NoteTag, string> = {
  unk: 'غير معروف',
  note: 'ملاحظة',
};

export const DAY_AR: Record<string, string> = {
  Mon: 'الاثنين',
  Tue: 'الثلاثاء',
  Wed: 'الأربعاء',
  Thu: 'الخميس',
  Fri: 'الجمعة',
  Sat: 'السبت',
  Sun: 'الأحد',
};

export const COURSE_COLORS = ['#4CC9F0', '#A78BFA', '#4ADE80', '#F2A93B', '#F97362', '#F472B6', '#2DD4BF', '#94A3B8'];

export const GRADE_TARGETS = [50, 60, 70, 80] as const;

export const APP_NAME = 'المنصة الشخصية';
export const DEFAULT_PORT = 4310;

/** مرادفات للبحث (عامية/إنجليزية) لكل نوع تقييم. */
export const KIND_ALIASES: Record<Kind, string[]> = {
  final: ['final', 'فاينل', 'نهائي', 'امتحان نهائي', 'exam'],
  test: ['test', 'midterm', 'mid-term', 'mid term', 'ميدتيرم', 'ميد تيرم', 'ميد-تيرم', 'اختبار', 'تست'],
  project: ['project', 'report', 'بروجكت', 'مشروع', 'تقرير'],
  assignment: ['assignment', 'homework', 'اسايمنت', 'أسايمنت', 'واجب', 'تكليف'],
  oral: ['oral', 'presentation', 'discussion', 'عرض', 'نقاش', 'بريزنتيشن'],
  quiz: ['quiz', 'كويز', 'كويزات', 'اختبار قصير', 'امتحان قصير'],
  lab: ['lab', 'laboratory', 'لاب', 'معمل', 'مختبر', 'مخبر'],
  other: ['other', 'اخرى', 'أخرى'],
};
