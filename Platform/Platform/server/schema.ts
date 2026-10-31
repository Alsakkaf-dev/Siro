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
    name: 'kitchen (prices, audit, cart, purchases, pantry, wallet, requests)',
    sql: `
CREATE TABLE kitchen_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE kitchen_prices (
  ingredient TEXT NOT NULL,
  store TEXT NOT NULL,
  price_rm REAL NOT NULL CHECK (price_rm > 0),
  price_min REAL NOT NULL,
  price_max REAL NOT NULL,
  source TEXT NOT NULL,
  confidence TEXT NOT NULL,
  unverified INTEGER NOT NULL DEFAULT 0,
  observed_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ingredient, store)
);
CREATE TABLE kitchen_price_audit (
  id TEXT PRIMARY KEY,
  ingredient TEXT NOT NULL,
  store TEXT NOT NULL,
  old_price REAL,
  new_price REAL NOT NULL,
  old_source TEXT,
  new_source TEXT NOT NULL,
  kind TEXT NOT NULL,
  reason TEXT,
  reverted_of TEXT,
  price_version INTEGER NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX kitchen_price_audit_at ON kitchen_price_audit(at);
CREATE TABLE kitchen_cart (
  ingredient TEXT PRIMARY KEY,
  qty REAL NOT NULL CHECK (qty > 0),
  unit TEXT NOT NULL,
  store TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE kitchen_wallet (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  budget_rm REAL NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'week',
  period_start TEXT,
  hard_limit INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE TABLE kitchen_wallet_tx (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  amount_rm REAL NOT NULL,
  ref TEXT,
  note TEXT,
  at TEXT NOT NULL
);
CREATE INDEX kitchen_wallet_tx_at ON kitchen_wallet_tx(at);
CREATE TABLE kitchen_purchases (
  id TEXT PRIMARY KEY,
  store TEXT NOT NULL,
  total_rm REAL NOT NULL,
  price_version INTEGER NOT NULL,
  at TEXT NOT NULL
);
CREATE TABLE kitchen_purchase_lines (
  purchase_id TEXT NOT NULL REFERENCES kitchen_purchases(id) ON DELETE CASCADE,
  ingredient TEXT NOT NULL,
  qty REAL NOT NULL,
  unit TEXT NOT NULL,
  store TEXT NOT NULL,
  grams REAL NOT NULL,
  unit_price_rm REAL NOT NULL,
  line_rm REAL NOT NULL,
  source TEXT NOT NULL,
  confidence TEXT NOT NULL
);
CREATE INDEX kitchen_purchase_lines_p ON kitchen_purchase_lines(purchase_id);
CREATE TABLE kitchen_pantry (
  ingredient TEXT PRIMARY KEY,
  grams REAL NOT NULL DEFAULT 0 CHECK (grams >= 0),
  cost_rm REAL NOT NULL DEFAULT 0,
  bought_at TEXT,
  min_g REAL,
  note TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE kitchen_pantry_moves (
  id TEXT PRIMARY KEY,
  ingredient TEXT NOT NULL,
  delta_g REAL NOT NULL,
  kind TEXT NOT NULL,
  reason TEXT,
  ref TEXT,
  at TEXT NOT NULL
);
CREATE INDEX kitchen_pantry_moves_at ON kitchen_pantry_moves(at);
CREATE TABLE kitchen_ingredient_requests (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  decided_at TEXT
);
`,
  },
  {
    id: 5,
    name: 'kitchen cards + cook sessions + plan days',
    sql: `
CREATE TABLE kitchen_cards (
  slug TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  parent_slug TEXT,
  name_ar TEXT NOT NULL,
  meal_types TEXT NOT NULL,
  lines TEXT NOT NULL,
  steps TEXT NOT NULL,
  nutrition TEXT NOT NULL,
  cost_rm REAL,
  price_version INTEGER NOT NULL,
  stats TEXT NOT NULL,
  rarity TEXT NOT NULL,
  origin TEXT NOT NULL,
  flags TEXT NOT NULL,
  image TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE kitchen_cook_sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  seed INTEGER NOT NULL,
  ops TEXT NOT NULL,
  card_slug TEXT,
  taken TEXT NOT NULL,
  waste TEXT NOT NULL,
  waste_cost_rm REAL,
  created_at TEXT NOT NULL
);
CREATE TABLE kitchen_plan_days (
  date TEXT PRIMARY KEY,
  slots TEXT NOT NULL,
  total_kcal REAL NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
  },
  {
    id: 6,
    name: 'semester package imports (online deploy)',
    sql: `
CREATE TABLE IF NOT EXISTS pkg_imports (
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
    id: 7,
    name: 'calendar: events snapshot + sync meta (additive only)',
    sql: `
CREATE TABLE calendar_events (
  source TEXT NOT NULL,
  id TEXT NOT NULL,
  calendar TEXT NOT NULL,
  title TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  show_as TEXT NOT NULL,
  categories TEXT NOT NULL,
  description TEXT NOT NULL,
  series TEXT,
  imported_at TEXT NOT NULL,
  PRIMARY KEY (source, id)
);
CREATE INDEX idx_calendar_events_start ON calendar_events (start);
CREATE INDEX idx_calendar_events_cal ON calendar_events (calendar);
CREATE TABLE calendar_sync (
  source TEXT PRIMARY KEY,
  last_sync TEXT NOT NULL,
  from_d TEXT,
  to_d TEXT,
  count INTEGER NOT NULL,
  note TEXT
);
`,
  },
  {
    id: 8,
    name: 'calendar: proposals queue + audit (additive only)',
    sql: `
CREATE TABLE calendar_proposals (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  calendar TEXT NOT NULL,
  event_id TEXT,
  series TEXT,
  date TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  reason TEXT NOT NULL,
  exceptions TEXT NOT NULL,
  explicit INTEGER NOT NULL DEFAULT 0,
  lint TEXT NOT NULL,
  status TEXT NOT NULL,
  batch TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  decided_at TEXT,
  exported_at TEXT
);
CREATE INDEX idx_calendar_proposals_status ON calendar_proposals (status, date);
CREATE TABLE calendar_audit (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  proposal_id TEXT,
  detail TEXT NOT NULL
);
`,
  },
  {
    id: 9,
    name: 'enrichment BFF: api_cache + api_usage (additive only)',
    sql: `
CREATE TABLE api_cache (
  key TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  body TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE api_usage (
  day TEXT NOT NULL,
  service TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, service)
);
`,
  },
  {
    id: 10,
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
CREATE TABLE IF NOT EXISTS pkg_imports (
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
    id: 11,
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
  {
    // نواة الذكاء (ADR-0009): محادثات محفوظة + سجل أفعال الذكاء مع طريقة التراجع عن كلٍّ منها. إضافة فقط.
    id: 12,
    name: 'ai_core',
    sql: `
CREATE TABLE ai_threads (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  context_ref TEXT,
  messages TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX ai_threads_updated ON ai_threads (workspace_id, updated_at);
CREATE TABLE ai_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  thread_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  args TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL,
  undo TEXT,
  at TEXT NOT NULL
);
CREATE INDEX ai_runs_thread ON ai_runs (thread_id, at);
`,
  },
  {
    id: 13,
    name: 'life native store (docs + events)',
    sql: `
CREATE TABLE IF NOT EXISTS life_docs (
  name TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS life_events (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  summary TEXT NOT NULL,
  undo TEXT NOT NULL,
  undone INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS life_events_at ON life_events (at);
`,
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]!.id;

/**
 * خطّان تطوّرا من أصل واحد وأعطيا الأرقام 4–6 لترحيلات مختلفة:
 * خط «نظام العمل + الذكاء» (حزم الفصول=4، work-os=5، ai_core=6) وخط المطبخ (kitchen=4، cards=5، pkg_imports=6).
 * قاعدة بيانات طُبّق عليها الخط الأول تُنقل صفوفها إلى 10–12 (جداولها موجودة فعلًا) فتُطبَّق ترحيلات المطبخ ٤–٦ عليها كالمعتاد.
 */
const LEGACY: { id: number; to: number; prefix: string }[] = [
  { id: 6, to: 12, prefix: 'ai_core' },
  { id: 5, to: 11, prefix: 'work-os core' },
  { id: 4, to: 10, prefix: 'semester packages (drive files' },
];

function reconcileLegacy(db: Db): void {
  for (const l of LEGACY) {
    const row = db.all<{ id: number; name: string }>('SELECT id, name FROM core_migrations WHERE id = ?', l.id)[0];
    if (!row || !row.name.startsWith(l.prefix)) continue;
    db.run('UPDATE core_migrations SET id = ? WHERE id = ?', l.to, l.id);
  }
}

export function migrate(db: Db): void {
  db.exec('CREATE TABLE IF NOT EXISTS core_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)');
  reconcileLegacy(db);
  const done = new Set(db.all<{ id: number }>('SELECT id FROM core_migrations').map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    db.tx(() => {
      db.exec(m.sql);
      db.run('INSERT INTO core_migrations (id, name, applied_at) VALUES (?, ?, ?)', m.id, m.name, new Date().toISOString());
    });
  }
}
