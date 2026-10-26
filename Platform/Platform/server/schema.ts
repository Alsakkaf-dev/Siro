import type { Db } from './db.js';

/** كل منصة تملك جداولها بالبادئة: core_ للنواة، acad_ للأكاديمية. */
const MIGRATIONS: { id: number; name: string; sql: string }[] = [
  {
    id: 1,
    name: 'core + academic',
    sql: `
CREATE TABLE core_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE core_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  at TEXT NOT NULL,
  source TEXT NOT NULL,
  payload TEXT
);
CREATE INDEX core_events_type ON core_events(type, at);

CREATE TABLE acad_semesters (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT NOT NULL,
  year_no INTEGER,
  sem_no INTEGER,
  start_date TEXT NOT NULL,
  weeks INTEGER NOT NULL DEFAULT 16,
  break_weeks TEXT NOT NULL DEFAULT '[]',
  exam_start TEXT,
  exam_end TEXT,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE acad_courses (
  id TEXT PRIMARY KEY,
  semester_id TEXT NOT NULL REFERENCES acad_semesters(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  credits REAL,
  section TEXT,
  lecturer TEXT,
  coordinator TEXT,
  room TEXT,
  schedule TEXT,
  color TEXT NOT NULL DEFAULT '#4CC9F0',
  slt INTEGER,
  source_file TEXT,
  min_final REAL,
  clos TEXT NOT NULL DEFAULT '[]',
  note TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX acad_courses_unique ON acad_courses(semester_id, code, COALESCE(section, ''));
CREATE INDEX acad_courses_sem ON acad_courses(semester_id);

CREATE TABLE acad_assessments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES acad_courses(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  weight REAL NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  timing TEXT NOT NULL DEFAULT 'unknown',
  week_no INTEGER,
  week_from INTEGER,
  due_date TEXT,
  due_time TEXT,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  score REAL,
  max_score REAL NOT NULL DEFAULT 100,
  weight_assumed INTEGER NOT NULL DEFAULT 0,
  crowd INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX acad_assessments_course ON acad_assessments(course_id);

CREATE TABLE acad_notes (
  id TEXT PRIMARY KEY,
  semester_id TEXT NOT NULL REFERENCES acad_semesters(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES acad_courses(id) ON DELETE SET NULL,
  tag TEXT NOT NULL DEFAULT 'note',
  text TEXT NOT NULL,
  detail TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX acad_notes_sem ON acad_notes(semester_id);
`,
  },
  {
    id: 2,
    name: 'library',
    sql: `
CREATE TABLE lib_files (
  id TEXT PRIMARY KEY,
  rel_path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ext TEXT NOT NULL,
  kind TEXT NOT NULL,
  size INTEGER NOT NULL,
  mtime INTEGER NOT NULL,
  folder TEXT NOT NULL,
  sem_hint TEXT,
  course_hint TEXT,
  type_hint TEXT,
  missing INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);
CREATE INDEX lib_files_folder ON lib_files(folder);
CREATE INDEX lib_files_kind ON lib_files(kind);
CREATE TABLE lib_tags (
  ref TEXT NOT NULL,
  tag TEXT NOT NULL COLLATE NOCASE,
  PRIMARY KEY (ref, tag)
);
CREATE INDEX lib_tags_tag ON lib_tags(tag);
CREATE TABLE lib_meta (
  ref TEXT PRIMARY KEY,
  note TEXT,
  progress REAL NOT NULL DEFAULT 0,
  duration REAL,
  done INTEGER NOT NULL DEFAULT 0,
  opened_at TEXT,
  opened_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX lib_meta_opened ON lib_meta(opened_at);
CREATE TABLE lib_youtube (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  course_hint TEXT,
  added_at TEXT NOT NULL
);
CREATE TABLE lib_bookmarks (
  id TEXT PRIMARY KEY,
  ref TEXT NOT NULL,
  pos REAL NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX lib_bookmarks_ref ON lib_bookmarks(ref, pos);
`,
  },
  {
    id: 3,
    name: 'sports (local workouts) + life alternatives picks',
    sql: `
CREATE TABLE spt_workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE spt_items (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES spt_workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  en_name TEXT NOT NULL,
  ar_name TEXT NOT NULL,
  sets INTEGER,
  reps_min INTEGER,
  reps_max INTEGER,
  duration_s INTEGER,
  per_side INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX spt_items_workout ON spt_items(workout_id, sort);
CREATE TABLE spt_week (
  day TEXT PRIMARY KEY,
  workout_id TEXT REFERENCES spt_workouts(id) ON DELETE SET NULL
);
CREATE TABLE life_alt_picks (
  alt_id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  picked_at TEXT NOT NULL
);
`,
  },
  {
    id: 4,
    name: 'semester packages (drive files, official results, import log)',
    sql: `
ALTER TABLE lib_files ADD COLUMN origin TEXT NOT NULL DEFAULT 'local';
ALTER TABLE lib_files ADD COLUMN remote_id TEXT;
ALTER TABLE lib_files ADD COLUMN pkg TEXT;
CREATE INDEX lib_files_pkg ON lib_files(pkg);
CREATE TABLE acad_results (
  course_id TEXT PRIMARY KEY REFERENCES acad_courses(id) ON DELETE CASCADE,
  grade TEXT,
  points REAL,
  credits REAL,
  status TEXT,
  source TEXT NOT NULL
);
CREATE TABLE pkg_imports (
  pkg TEXT PRIMARY KEY,
  semester_id TEXT,
  origin TEXT NOT NULL,
  location TEXT NOT NULL,
  files INTEGER NOT NULL,
  imported_at TEXT NOT NULL
);
`,
  },
  {
    id: 5,
    name: 'work-os core (spaces, types, items, views, relations, history, trash, automations, inbox, shares, templates)',
    sql: `
CREATE TABLE wos_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
INSERT INTO wos_workspaces (id, name, created_at) VALUES ('default', 'مساحة العمل', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
-- اسم المالك كان مثبتًا في الواجهة؛ صار إعدادًا قابلًا للتغيير (لإعطاء الموقع لصديق)
INSERT OR IGNORE INTO core_settings (key, value) VALUES ('profile.name', 'محمد');
CREATE TABLE wos_types (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default' REFERENCES wos_workspaces(id),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'layers',
  color TEXT NOT NULL DEFAULT '#5B45F0',
  fields TEXT NOT NULL DEFAULT '[]',
  statuses TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE wos_spaces (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default' REFERENCES wos_workspaces(id),
  type_id TEXT NOT NULL REFERENCES wos_types(id),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'layers',
  color TEXT NOT NULL DEFAULT '#5B45F0',
  description TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX wos_spaces_ws ON wos_spaces(workspace_id, sort);
CREATE TABLE wos_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default' REFERENCES wos_workspaces(id),
  space_id TEXT NOT NULL REFERENCES wos_spaces(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES wos_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT,
  data TEXT NOT NULL DEFAULT '{}',
  start TEXT,
  due TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  done_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX wos_items_space ON wos_items(space_id, sort);
CREATE INDEX wos_items_parent ON wos_items(parent_id);
CREATE INDEX wos_items_due ON wos_items(workspace_id, due);
CREATE TABLE wos_views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default' REFERENCES wos_workspaces(id),
  scope TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX wos_views_scope ON wos_views(workspace_id, scope, sort);
CREATE TABLE wos_relations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default' REFERENCES wos_workspaces(id),
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'relates',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX wos_relations_u ON wos_relations(workspace_id, src, dst, kind);
CREATE INDEX wos_relations_dst ON wos_relations(workspace_id, dst);
CREATE TABLE wos_history (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  ref TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  before TEXT,
  after TEXT,
  actor TEXT NOT NULL DEFAULT 'user',
  reverted INTEGER NOT NULL DEFAULT 0,
  at TEXT NOT NULL
);
CREATE INDEX wos_history_ref ON wos_history(workspace_id, ref, at);
CREATE INDEX wos_history_at ON wos_history(workspace_id, at);
CREATE TABLE wos_trash (
  token TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  make_active TEXT,
  deleted_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  restored_at TEXT
);
CREATE INDEX wos_trash_at ON wos_trash(workspace_id, deleted_at);
CREATE TABLE wos_automations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  space_id TEXT NOT NULL REFERENCES wos_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  trigger TEXT NOT NULL,
  action TEXT NOT NULL,
  runs INTEGER NOT NULL DEFAULT 0,
  last_run TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE wos_auto_fired (
  automation_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  key TEXT NOT NULL,
  at TEXT NOT NULL,
  PRIMARY KEY (automation_id, item_id, key)
);
CREATE TABLE wos_inbox (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  ref TEXT,
  title TEXT NOT NULL,
  body TEXT,
  source TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  at TEXT NOT NULL
);
CREATE INDEX wos_inbox_at ON wos_inbox(workspace_id, read, at);
CREATE TABLE wos_shares (
  token TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  scope TEXT NOT NULL,
  view_id TEXT,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE wos_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'layers',
  color TEXT NOT NULL DEFAULT '#5B45F0',
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`,
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]!.id;

export function migrate(db: Db): void {
  db.exec('CREATE TABLE IF NOT EXISTS core_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)');
  const done = new Set(db.all<{ id: number }>('SELECT id FROM core_migrations').map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    db.tx(() => {
      db.exec(m.sql);
      db.run('INSERT INTO core_migrations (id, name, applied_at) VALUES (?, ?, ?)', m.id, m.name, new Date().toISOString());
    });
  }
}
