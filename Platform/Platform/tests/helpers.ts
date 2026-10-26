import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Assessment, Course, Semester } from '../shared/types.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface SeedFile {
  semester: Semester;
  courses: (Course & { id: string })[];
  assessments: (Omit<Assessment, 'weight_assumed' | 'crowd'> & { weight_assumed: number; crowd: number })[];
  notes: { id: string; course_id: string | null; tag: string; text: string; resolved?: number }[];
}

export function loadSeed(): SeedFile {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'seed', 'sem5-dashboard.json'), 'utf8')) as SeedFile;
}

export function asAssessment(a: SeedFile['assessments'][number]): Assessment {
  return { ...a, weight_assumed: !!a.weight_assumed, crowd: !!a.crowd } as Assessment;
}

export function tmpDir(prefix = 'platform-test-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function mk(over: Partial<Assessment> & { weight: number }): Assessment {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    course_id: 'c',
    kind: 'test',
    title: 't',
    count: 1,
    timing: 'unknown',
    week_no: null,
    week_from: null,
    due_date: null,
    due_time: null,
    venue: null,
    status: 'pending',
    score: null,
    max_score: over.weight,
    weight_assumed: false,
    crowd: true,
    note: null,
    sort: 0,
    source: 'test',
    ...over,
  };
}
