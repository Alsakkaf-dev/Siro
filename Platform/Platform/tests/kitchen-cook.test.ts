import { describe, expect, it } from 'vitest';
import { BOTS, Cook } from '../shared/kitchen/sim/bot.js';
import { AR_DEF, analyze, cardSimilarity, cookToCard, findDuplicate, nameDish, writeSteps } from '../shared/kitchen/sim/cookcard.js';
import {
  CYCLE, ORIGINAL_RECIPES, RECIPE_BY_SLUG, SEED_PRICES, evaluateDay, gramsAr, indexPrices, mealCost, nutritionOf, outlookBody, scaleDay, scaleLines, scaleStepsText, type RecipeLine,
} from '../shared/kitchen/index.js';

const idx = indexPrices(SEED_PRICES);
const cook = (slug: string) => {
  const c = new Cook();
  BOTS[slug]!(c);
  return { c, card: cookToCard(c.ops, idx, 'mydin') };
};
const WORD = /[ء-ي]/;

describe('من الطبخ إلى بطاقة (MC-01…06، AC-05/06)', () => {
  it('AC-05: «توست بالبيض والجبنة» بأوزان الوصفة → 532 kcal ±2، تكلفة المتجر المختار، خطوات مطابقة بالمعنى', () => {
    const { card } = cook('bk-03');
    expect(card.nutrition.kcal).toBeGreaterThan(530);
    expect(card.nutrition.kcal).toBeLessThan(534);
    const ref = RECIPE_BY_SLUG.get('bk-03')!;
    expect(card.cost_rm).toBeCloseTo(mealCost(ref.lines, idx, { store: 'mydin' }).total_rm, 6);
    expect(card.lines).toEqual(expect.arrayContaining([{ ingredient: 'egg', amount_g: 100 }, { ingredient: 'toast', amount_g: 80 }, { ingredient: 'cheese', amount_g: 40 }, { ingredient: 'oil', amount_g: 5 }]));
    const text = card.steps_ar.join(' ');
    for (const must of ['اسلق 100 غرام من البيض ثماني دقائق', 'قشّره وقطّعه شرائح', 'حمّص 80 غراماً من التوست', 'ضع 40 غراماً من الجبنة فوق التوست', 'وزّع 5 غرامات من الزيت']) expect(text, must).toContain(must);
    expect(card.name_ar).toBe('توست بالبيض والجبنة');
    expect(card.flags).toEqual([]);
  });
  it('الأوزان الفعلية من السجل تعطي تغذية الوصفة الأصلية (S5) لكل الوصفات التي يلعبها الطاهي الآلي', () => {
    for (const slug of Object.keys(BOTS)) {
      const { card } = cook(slug);
      const ref = nutritionOf(RECIPE_BY_SLUG.get(slug)!.lines).total.kcal;
      expect(Math.abs(card.nutrition.kcal - ref) / ref, slug).toBeLessThan(0.012);
      expect(card.matched, slug).toBe(slug === 'ln-04' ? 'ln-01' : slug);
      expect(card.name_ar, slug).toBe(RECIPE_BY_SLUG.get(slug)!.title_ar);
    }
  });
  it('AC-06: تكرار السجل نفسه ينتج البطاقة نفسها حرفيًا (حتمية)', () => {
    const a = cook('ln-03');
    const b = cook('ln-03');
    expect(JSON.stringify(b.card)).toBe(JSON.stringify(a.card));
    const again = cookToCard(a.c.ops, idx, 'mydin');
    expect(JSON.stringify(again)).toBe(JSON.stringify(a.card));
  });
  it('الخطوات: مرقّمة بصيغة لوحتك، تنتهي بنقطة، أرقام 0-9 فقط، وتذكر وزن كل مكوّن رئيسي بقواعد S6', () => {
    for (const slug of Object.keys(BOTS)) {
      const { card } = cook(slug);
      const joined = card.steps_ar.join('\n');
      expect(joined, slug).not.toMatch(/[٠-٩]/);
      card.steps_ar.forEach((s, i) => {
        expect(s.startsWith(`${i + 1}: `), `${slug} ${s}`).toBe(true);
        expect(s.endsWith('.'), `${slug} ${s}`).toBe(true);
        expect(WORD.test(s), s).toBe(true);
      });
      for (const l of card.lines) {
        if (['salt', 'cumin', 'sugar'].includes(l.ingredient) || (l.amount_g ?? 0) < 3) continue;
        expect(joined, `${slug}:${l.ingredient}`).toContain(gramsAr(l.amount_g!));
        expect(joined, `${slug}:${l.ingredient}`).toContain(AR_DEF[l.ingredient]!);
      }
    }
  });
  it('الطبخ الحر J5: يسمّي الطبق بقواعد MC-20 ولا يحمل اسمًا خارج المكوّنات المعروفة', () => {
    // إيدام: دجاج + فاصوليا + طماطم + بصل + ثوم + معجون طماطم
    const stew = new Cook();
    const onion = stew.take('onion', 40);
    stew.cut(onion, 'diced', 'small');
    const chicken = stew.take('chicken', 150);
    stew.cut(chicken, 'cubes', 'small');
    const beans = stew.take('green_beans', 120);
    const tomato = stew.take('tomato', 80);
    const paste = stew.take('tomato_paste', 15);
    stew.pour('oil', 5, 'pot_small');
    stew.fire('pot_small', 1, 6);
    stew.wait(30);
    for (const i of [onion, chicken, beans, tomato, paste]) stew.add(i, 'pot_small');
    stew.pour('water', 60, 'pot_small');
    stew.level(1, 2);
    stew.untilStirring('pot_small', () => stew.it(beans).doneAt !== null && stew.it(chicken).doneAt !== null, 2400, 30);
    stew.serve(['pot_small']);
    const c1 = cookToCard(stew.ops, idx, 'mydin');
    expect(c1.name_ar.startsWith('إيدام الدجاج')).toBe(true);
    expect(c1.matched).toBeNull();
    expect(c1.name_ar.split(/\s+/).length).toBeLessThanOrEqual(7);
    // سلطة دجاج: دجاج مشوي مع خضار طازجة
    const sal = new Cook();
    const ch = sal.take('chicken', 150);
    sal.cut(ch, 'slices');
    sal.pour('oil', 8, 'pan');
    sal.fire('pan', 1, 7);
    sal.wait(45);
    sal.add(ch, 'pan');
    sal.untilStirring('pan', () => sal.it(ch).doneAt !== null, 900, 40);
    const cu = sal.take('cucumber', 90);
    const tm = sal.take('tomato', 90);
    sal.serve(['pan', cu, tm]);
    const c2 = cookToCard(sal.ops, idx, 'mydin');
    expect(c2.name_ar.startsWith('سلطة دجاج')).toBe(true);
    for (const card of [c1, c2]) for (const w of card.name_ar.split(/\s+/)) expect(w === 'طبق' || /[ء-ي]/.test(w)).toBe(true);
  });
  it('MC-06: التكرار ≥ 90% تشابهًا بالأوزان يقترح البطاقة الأصلية؛ ودونها بطاقة جديدة', () => {
    const base = RECIPE_BY_SLUG.get('bk-03')!.lines;
    const near: RecipeLine[] = base.map((l) => ({ ...l, amount_g: l.amount_g! + (l.ingredient === 'toast' ? 5 : 0) }));
    expect(cardSimilarity(base, base)).toBe(1);
    expect(cardSimilarity(base, near)).toBeGreaterThan(0.9);
    expect(findDuplicate(near, ORIGINAL_RECIPES)?.slug).toBe('bk-03');
    const far = base.map((l) => ({ ...l, amount_g: l.ingredient === 'cheese' ? 100 : l.amount_g }));
    expect(findDuplicate(far, ORIGINAL_RECIPES)?.slug).not.toBe('bk-03');
    expect(cardSimilarity(base, RECIPE_BY_SLUG.get('dn-01')!.lines)).toBeLessThan(0.1);
  });
  it('الإهدار يُسجَّل بتكلفته، والدجاج غير الآمن والمحترق يُوسَمان فلا يُعتمدان', () => {
    const c = new Cook();
    const ch = c.take('chicken', 200);
    c.cut(ch, 'cubes', 'medium');
    c.pour('oil', 5, 'pan');
    c.fire('pan', 1, 6);
    c.wait(30);
    c.add(ch, 'pan');
    c.wait(25);
    const spare = c.take('onion', 50);
    c.do({ type: 'discard', target: spare });
    c.serve(['pan']);
    const card = cookToCard(c.ops, idx, 'mydin');
    expect(card.flags).toEqual(expect.arrayContaining(['unsafe_chicken', 'has_waste']));
    expect(card.waste['onion']).toBe(50);
    expect(card.waste_cost_rm).toBeGreaterThan(0);
    expect(card.lines.some((l) => l.ingredient === 'onion')).toBe(false);
    const burnt = new Cook();
    const p = burnt.take('potato', 100);
    burnt.cut(p, 'cubes', 'small');
    burnt.fire('pan', 1, 10);
    burnt.wait(100);
    burnt.add(p, 'pan');
    burnt.wait(420);
    burnt.serve(['pan']);
    expect(cookToCard(burnt.ops, idx, 'mydin').flags).toContain('burnt');
  });
});

describe('الخطة: تقسيم الأوزان في الخطوات وقالب الوصف (2.6)', () => {
  it('scaleStepsText يعيد كتابة كل وزن مذكور للحصص ×0.5 و×0.75 و×1.25 دون ترك وزن قديم', () => {
    for (const r of ORIGINAL_RECIPES.filter((x) => x.status === 'verified')) {
      for (const k of [0.5, 0.75, 1.25]) {
        const to = scaleLines(r.lines, k);
        const { steps, unmapped } = scaleStepsText(r.steps_original, r.lines, to);
        expect(unmapped, `${r.slug} ×${k}`).toEqual([]);
        for (const [i, l] of r.lines.entries()) {
          if (l.amount_g === null) continue;
          const t = to[i]!.amount_g!;
          expect(steps.join(' '), `${r.slug} ×${k} ${l.ingredient}`).toContain(gramsAr(t));
        }
      }
    }
  });
  it('الوصفة الأصلية لا تُمسّ (N-12) والدقائق لا تتغير', () => {
    const r = RECIPE_BY_SLUG.get('bk-03')!;
    const before = JSON.stringify(r.steps_original);
    const out = scaleStepsText(r.steps_original, r.lines, scaleLines(r.lines, 0.5));
    expect(JSON.stringify(r.steps_original)).toBe(before);
    expect(out.steps[0]).toBe('1: اسلق 50 غراماً من البيض ثماني دقائق، ثم قشّره وقطّعه شرائح.');
    expect(out.steps[1]).toBe('2: حمّص 40 غراماً من التوست.');
  });
  it('outlookBody يطابق القالب الحرفي: عنوان، خطوات، 5 أسطر قيم صحيحة بالعربية وأرقام 0-9', () => {
    const body = outlookBody('توست بالبيض والجبنة', RECIPE_BY_SLUG.get('bk-03')!.steps_original, nutritionOf(RECIPE_BY_SLUG.get('bk-03')!.lines).total);
    const lines = body.split('\n');
    expect(lines[0]).toBe('توست بالبيض والجبنة');
    expect(lines.slice(1, 5)).toEqual(RECIPE_BY_SLUG.get('bk-03')!.steps_original);
    expect(lines.slice(5)).toEqual(['القيمة الغذائية الإجمالية للوجبة:', 'السعرات الحرارية: 532 سعرة حرارية', 'البروتين: 27 غرام', 'الكربوهيدرات: 44 غرام', 'الدهون: 27 غرام', 'الألياف: 2 غرام']);
    expect(body).not.toMatch(/[٠-٩%<>()]/);
  });
  it('تقسيم يوم الدورة الأول يبقى داخل القانون وبالأوزان المقسّمة يتولّد نص الوصف', () => {
    const d = CYCLE[0]!;
    const day = scaleDay(d.meals.map((m) => ({ slot: m.slot, lines: m.lines })));
    expect(day.ok).toBe(true);
    expect(evaluateDay(Object.fromEntries(day.meals.map((m) => [m.slot, m.nutrition]))).ok).toBe(true);
  });
  it('analyze/writeSteps يعملان على سجل ذهبي مخزَّن (إعادة التشغيل من ملف)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const doc = JSON.parse(fs.readFileSync(path.join(__dirname, 'replay', 'bk-03.json'), 'utf8')) as { ops: never[] };
    const an = analyze(doc.ops);
    expect(writeSteps(an)[0]).toContain('اسلق 100 غرام من البيض ثماني دقائق');
    expect(nameDish(cookToCard(doc.ops, idx, 'mydin').lines, an).name).toBe('توست بالبيض والجبنة');
  });
});
