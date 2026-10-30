// ميزانيات الحزم (PERF-01/02، TST-09): تُفحص على dist/web المبني (gzip الجاهز من precompress). تُتخطّى إن لم يُبنَ المشروع.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const assets = path.join(__dirname, '..', 'dist', 'web', 'assets');
const built = fs.existsSync(assets) && fs.readdirSync(assets).some((f) => f.endsWith('.js.gz'));
const gz = (f: string): number => fs.statSync(path.join(assets, `${f}.gz`)).size;
const find = (re: RegExp): string[] => fs.readdirSync(assets).filter((f) => re.test(f));
const KB = 1024;

describe.skipIf(!built)('ميزانيات الحزم', () => {
  it('PERF-01: الحزمة الأولية للمسار (دخول + مكتبة الواجهة + صفحة المسار) ≤ 250 KB مضغوطة بلا 3D — للجدول والوجبات والاقتراحات واليوم', () => {
    const core = [...find(/^index-.*\.js$/), ...find(/^ui-.*\.js$/), ...find(/^forms-.*\.js$/), ...find(/^kitchen-.*\.js$/)].reduce((s, f) => s + gz(f), 0);
    for (const page of ['Calendar', 'CalendarMeals', 'CalendarProposals', 'Today']) {
      const f = find(new RegExp(`^${page}-.*\\.js$`));
      expect(f.length, page).toBe(1);
      expect(core + gz(f[0]!), `${page}: ${Math.round((core + gz(f[0]!)) / KB)}KB`).toBeLessThanOrEqual(250 * KB);
    }
  });
  it('PERF-02: صفحات الجدول لا تستورد three ولا مشهد المطبخ ولا Worker المحاكاة (كلها في مقاطع كسولة منفصلة)', () => {
    for (const page of ['Calendar', 'CalendarMeals', 'CalendarProposals', 'Today']) {
      const src = fs.readFileSync(path.join(assets, find(new RegExp(`^${page}-.*\\.js$`))[0]!), 'utf8');
      const imports = [...src.matchAll(/from\s*["']\.\/([^"']+)["']|import\(["']\.\/([^"']+)["']\)/g)].map((m) => m[1] ?? m[2]!);
      for (const i of imports) expect(i, `${page} → ${i}`).not.toMatch(/three|Scene3D|GLTFLoader|meshopt|sim\.worker|KitchenCook/i);
    }
  });
  it('الحزمة الرئيسية index ≤ 110 KB مضغوطة (الأساس 93KB؛ المطبخ والجدول في مقاطع كسولة)', () => {
    expect(gz(find(/^index-.*\.js$/)[0]!)).toBeLessThanOrEqual(110 * KB);
  });
  it('كل صفحة جدول/وجبات/اقتراحات ≤ 45 KB مضغوطة', () => {
    for (const page of ['Calendar', 'CalendarMeals', 'CalendarProposals']) expect(gz(find(new RegExp(`^${page}-.*\\.js$`))[0]!), page).toBeLessThanOrEqual(45 * KB);
  });
});
