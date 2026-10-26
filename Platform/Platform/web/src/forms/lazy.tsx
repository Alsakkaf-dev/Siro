// النماذج (وفيها zod) تُحمَّل عند أول فتح فقط كي لا تُثقل تحميل الصفحات.
import { lazy, Suspense, type ComponentProps } from 'react';

const C = lazy(() => import('./forms.js').then((m) => ({ default: m.CourseForm })));
const A = lazy(() => import('./forms.js').then((m) => ({ default: m.AssessmentForm })));
const N = lazy(() => import('./forms.js').then((m) => ({ default: m.NoteForm })));
const S = lazy(() => import('./forms.js').then((m) => ({ default: m.SemesterForm })));

export const preloadForms = (): void => void import('./forms.js');

export function CourseForm(p: ComponentProps<typeof C>) {
  return <Suspense fallback={null}><C {...p} /></Suspense>;
}
export function AssessmentForm(p: ComponentProps<typeof A>) {
  return <Suspense fallback={null}><A {...p} /></Suspense>;
}
export function NoteForm(p: ComponentProps<typeof N>) {
  return <Suspense fallback={null}><N {...p} /></Suspense>;
}
export function SemesterForm(p: ComponentProps<typeof S>) {
  return <Suspense fallback={null}><S {...p} /></Suspense>;
}
