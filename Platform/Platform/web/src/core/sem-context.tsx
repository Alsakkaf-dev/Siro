import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useApp } from './app-context.js';
import type { AcademicNote, Assessment, Course, Semester } from '../../../shared/types.js';
import { phaseOf, todayMs, upcomingDeadlines, weekLoads, weightSum, type Phase, type WeekLoad } from '../../../shared/semester.js';
import { calcCourse, type CourseCalc } from '../../../shared/calc.js';
import { Skeleton } from '../ui/ui.js';
import { EmptyState } from '../ui/ui.js';

export interface SemData {
  sem: Semester;
  isActive: boolean;
  courses: Course[];
  assessments: Assessment[];
  notes: AcademicNote[];
  now: number;
  phase: Phase;
  loads: WeekLoad[];
  courseById: Map<string, Course>;
  byCourse: Map<string, Assessment[]>;
  calcs: Map<string, CourseCalc>;
  totalCount: number;
  credits: number;
  creditsUnknown: boolean;
  unknownAssessments: Assessment[];
  weightIssues: Course[];
  upcoming: Assessment[];
  reload: () => Promise<void>;
}

const C = createContext<SemData | null>(null);
export function useSem(): SemData {
  const c = useContext(C);
  if (!c) throw new Error('SemesterLayout مفقود');
  return c;
}

export function SemesterLayout(): ReactNode {
  const { semId = '' } = useParams();
  const { reloadSemesters, setUnknownCount } = useApp();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.bundle>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async (refreshList = true) => {
    try {
      const b = await api.bundle(semId);
      setData(b);
      setErr(null);
      // يُعلِم الجرس (وغيره) بأحدث بيانات الفصل بدل أن يطلبها ثانية
      window.dispatchEvent(new CustomEvent('platform:bundle', { detail: b }));
    } catch (e) {
      setErr((e as Error).message);
    }
    // أول تحميل لا يحتاج إعادة جلب قائمة الفصول (AppProvider جلبها للتو)
    if (refreshList) void reloadSemesters();
  }, [semId, reloadSemesters]);

  useEffect(() => {
    setData(null);
    void reload(false);
  }, [reload]);
  // إنشاء سريع من أي مكان (قائمة +) يُعلِم الصفحة لتحدّث بياناتها
  useEffect(() => {
    const on = (): void => void reload(false);
    window.addEventListener('platform:sem-changed', on);
    return () => window.removeEventListener('platform:sem-changed', on);
  }, [reload]);

  const value = useMemo<SemData | null>(() => {
    if (!data) return null;
    const { semester: sem, courses, assessments, notes } = data;
    const now = todayMs();
    const byCourse = new Map<string, Assessment[]>();
    for (const c of courses) byCourse.set(c.id, []);
    for (const a of assessments) byCourse.get(a.course_id)?.push(a);
    const calcs = new Map<string, CourseCalc>();
    for (const c of courses) calcs.set(c.id, calcCourse(byCourse.get(c.id) ?? [], { minFinal: c.min_final }));
    const known = courses.filter((c) => c.credits !== null);
    return {
      sem,
      isActive: data.is_active,
      courses,
      assessments,
      notes,
      now,
      phase: phaseOf(now, sem),
      loads: weekLoads(assessments, sem),
      courseById: new Map(courses.map((c) => [c.id, c])),
      byCourse,
      calcs,
      totalCount: assessments.reduce((s, a) => s + a.count, 0),
      credits: known.reduce((s, c) => s + (c.credits ?? 0), 0),
      creditsUnknown: known.length < courses.length,
      unknownAssessments: assessments.filter((a) => a.timing === 'unknown' || a.status === 'unknown'),
      weightIssues: courses.filter((c) => (byCourse.get(c.id)?.length ?? 0) > 0 && Math.abs(weightSum(byCourse.get(c.id) ?? []) - 100) > 0.005),
      upcoming: upcomingDeadlines(assessments, sem, now),
      reload: () => reload(true),
    };
  }, [data, reload]);

  useEffect(() => {
    if (value) setUnknownCount(value.unknownAssessments.length + value.notes.filter((n) => n.tag === 'unk' && !n.resolved).length + value.courses.filter((c) => c.credits === null).length);
  }, [value, setUnknownCount]);

  if (err) {
    return (
      <div className="page">
        <EmptyState icon="warn" title="تعذّر فتح الفصل" text={err} />
      </div>
    );
  }
  if (!value) return <PageSkeleton />;
  return (
    <C.Provider value={value}>
      <Outlet />
    </C.Provider>
  );
}

export function PageSkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="جارٍ التحميل">
      <Skeleton h={44} w="40%" />
      <div className="grid stats" style={{ marginBlock: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} h={112} r={20} />
        ))}
      </div>
      <div className="grid cols-2">
        <Skeleton h={300} r={20} />
        <Skeleton h={300} r={20} />
      </div>
    </div>
  );
}
