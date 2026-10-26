export type Kind = 'quiz' | 'test' | 'lab' | 'assignment' | 'project' | 'oral' | 'final' | 'other';
export type Timing = 'unknown' | 'week' | 'date' | 'exam';
export type AssessmentStatus = 'unknown' | 'pending' | 'submitted' | 'graded';
export type NoteTag = 'unk' | 'note';

export interface Semester {
  id: string;
  code: string;
  name: string;
  year_no: number | null;
  sem_no: number | null;
  start_date: string;
  weeks: number;
  break_weeks: number[];
  exam_start: string | null;
  exam_end: string | null;
  note: string | null;
  source: string;
}

export interface Course {
  id: string;
  semester_id: string;
  code: string;
  name: string;
  name_ar: string | null;
  credits: number | null;
  section: string | null;
  lecturer: string | null;
  coordinator: string | null;
  room: string | null;
  schedule: string | null;
  color: string;
  slt: number | null;
  source_file: string | null;
  min_final: number | null;
  clos: string[];
  note: string | null;
  sort: number;
  source: string;
}

export interface Assessment {
  id: string;
  course_id: string;
  kind: Kind;
  title: string;
  weight: number;
  count: number;
  timing: Timing;
  week_no: number | null;
  week_from: number | null;
  due_date: string | null;
  due_time: string | null;
  venue: string | null;
  status: AssessmentStatus;
  score: number | null;
  max_score: number;
  weight_assumed: boolean;
  crowd: boolean;
  note: string | null;
  sort: number;
  source: string;
}

export interface AcademicNote {
  id: string;
  semester_id: string;
  course_id: string | null;
  tag: NoteTag;
  text: string;
  detail: string | null;
  resolved: boolean;
}

export interface SemesterSummary extends Semester {
  course_count: number;
  assessment_rows: number;
  assessment_count: number;
  is_active: boolean;
}

export interface SemesterBundle {
  semester: Semester;
  courses: Course[];
  assessments: Assessment[];
  notes: AcademicNote[];
  is_active: boolean;
}

export interface SearchHit {
  type: 'course' | 'assessment';
  id: string;
  semester_id: string;
  semester_code: string;
  course_id: string;
  title: string;
  subtitle: string;
  color: string;
}

/** نتيجة البحث الموحّد خارج الفصول (المكتبة، الحياة، الرياضة، المصطلحات). */
export interface MoreHit { kind: 'library' | 'youtube' | 'life' | 'sports' | 'workout' | 'glossary'; id: string; title: string; subtitle: string; to: string }
