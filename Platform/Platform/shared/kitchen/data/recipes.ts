/**
 * وصفات المالك الـ12 (S2) — النص حرفيًا في steps_original ولا يُعدَّل في مكانه (N-12)؛ أي تصحيح = نسخة جديدة موسومة.
 * الأسطر مستخرجة من النص: الأوزان خام/جافة (M-03). البيض بملف «مطبوخ» حيث يُؤكل مطبوخًا، تطابقًا مع S5 وOutlook (NUT-02).
 * عيوب معلومة: ln-02 بلا أوزان (DEF-01)، ln-04 نصّها = ln-01 (DEF-02).
 */
import type { Recipe, RecipeLine } from '../types.js';

const L = (ingredient: string, amount_g: number | null, profile?: RecipeLine['profile']): RecipeLine => (profile ? { ingredient, amount_g, profile } : { ingredient, amount_g });

const LN01_STEPS = [
  '1: قطّع 200 غرام من الدجاج مكعبات، وتبّله بالملح والكمون.',
  '2: سخّن 10 غرامات من الزيت واطبخ الدجاج 10 دقائق حتى ينضج.',
  '3: اسلق 90 غراماً من الأرز الجاف في ماء مملّح 15 دقيقة، بالتوازي مع طهي الدجاج.',
  '4: ابشر 50 غراماً من الجزر وقطّع 70 غراماً من الخيار.',
  '5: قدّم الدجاج فوق الأرز مع الجزر والخيار و40 غراماً من التوست جانباً.',
];
const LN01_LINES = [L('chicken', 200), L('salt', null), L('cumin', null), L('oil', 10), L('rice', 90), L('carrot', 50), L('cucumber', 70), L('toast', 40)];

export const ORIGINAL_RECIPES: readonly Recipe[] = Object.freeze([
  {
    slug: 'bk-01', title_ar: 'زبادي بالشوفان', meal_types: ['فطور'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: ضع 40 غراماً من الشوفان في كاسة التقديم.',
      '2: أضف 300 غرام من الزبادي فوق الشوفان.',
      '3: اسلق 100 غرام من البيض وقطّعه، وقطّع 50 غراماً من الموز شرائح.',
      '4: أضف البيض والموز مع 10 غرامات من العسل وقلّب برفق.',
    ],
    lines: [L('oats', 40), L('yogurt', 300), L('egg', 100), L('banana', 50), L('honey', 10)],
  },
  {
    slug: 'bk-02', title_ar: 'أومليت الخضار بالجبنة', meal_types: ['فطور'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: اخفق 150 غراماً من البيض في كاسة.',
      '2: قطّع 50 غراماً من الطماطم و30 غراماً من البصل مكعبات صغيرة.',
      '3: سخّن 5 غرامات من الزيت وأضف الطماطم والبصل دقيقتين.',
      '4: اسكب البيض وأضف 30 غراماً من الجبنة فوقه، واتركه حتى ينضج.',
      '5: قدّمه مع 60 غراماً من التوست جانباً.',
    ],
    lines: [L('egg', 150), L('tomato', 50), L('onion', 30), L('oil', 5), L('cheese', 30), L('toast', 60)],
  },
  {
    slug: 'bk-03', title_ar: 'توست بالبيض والجبنة', meal_types: ['فطور'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: اسلق 100 غرام من البيض ثماني دقائق، ثم قشّره وقطّعه شرائح.',
      '2: حمّص 80 غراماً من التوست.',
      '3: ضع 40 غراماً من الجبنة فوق التوست، ثم رتّب شرائح البيض فوقها.',
      '4: وزّع 5 غرامات من الزيت فوق الوجبة قبل التقديم.',
    ],
    lines: [L('egg', 100), L('toast', 80), L('cheese', 40), L('oil', 5)],
  },
  {
    slug: 'bk-04', title_ar: 'شوفان بالحليب', meal_types: ['فطور'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: ضع 60 غراماً من الشوفان في قدر مع 300 غرام من الحليب، واطبخ على نار هادئة 6 دقائق مع التحريك.',
      '2: اسلق 100 غرام من البيض ثماني دقائق، ثم قشّره وقطّعه.',
      '3: قطّع 60 غراماً من الموز شرائح وأضفه مع البيض إلى الشوفان.',
      '4: أضف 10 غرامات من العسل وقلّب برفق..',
    ],
    lines: [L('oats', 60), L('milk', 300), L('egg', 100), L('banana', 60), L('honey', 10)],
  },
  { slug: 'ln-01', title_ar: 'صدور دجاج مع الأرز والخضار', meal_types: ['غداء'], origin: 'board', status: 'verified', flags: [], steps_original: LN01_STEPS, lines: LN01_LINES },
  {
    slug: 'ln-02', title_ar: 'إيدام الدجاج بالفاصوليا الخضراء', meal_types: ['غداء'], origin: 'board', status: 'needs_quantities', flags: ['DEF-01', 'DEF-03'],
    steps_original: [
      'طريقة التحضير: في قدر صغير، شوّح البصل والثوم المهروس بمسحة زيت، ثم أضف الدجاج المقطع وقلبه حتى يتغير لونه. أضف الفاصوليا الخضراء، مكعبات الطماطم، وملعقة من معجون الطماطم (الكاتشب) مع الملح والكمون وربع كوب ماء، واترك الإيدام يتسبك على نار هادئة.',
    ],
    lines: [L('onion', null), L('garlic', null), L('oil', null), L('chicken', null), L('green_beans', null), L('tomato', null), L('tomato_paste', null), L('salt', null), L('cumin', null)],
  },
  {
    slug: 'ln-03', title_ar: 'باذنجان بالدجاج والأرز', meal_types: ['غداء'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: قطّع 300 غرام من الباذنجان شرائح، رُشّها بالملح 5 دقائق ثم اشطفها وجفّفها بسرعة.',
      '2: سخّن 16 غراماً من الزيت واقلِ الباذنجان حتى يحمرّ.',
      '3: اطبخ 180 غراماً من الدجاج مع 35 غراماً من البصل و5 غرامات من الثوم 7 دقائق.',
      '4: أضف الباذنجان و100 غرام من الطماطم، واترك على نار هادئة 7 دقائق.',
      '5: اسلق 40 غراماً من الأرز الجاف بالتوازي، وقدّمه معها مع 40 غراماً من التوست جانباً.',
    ],
    lines: [L('eggplant', 300), L('salt', null), L('oil', 16), L('chicken', 180), L('onion', 35), L('garlic', 5), L('tomato', 100), L('rice', 40), L('toast', 40)],
  },
  { slug: 'ln-04', title_ar: 'فاصوليا خضراء بالدجاج', meal_types: ['غداء'], origin: 'board', status: 'body_mismatch_title', flags: ['DEF-02', 'duplicate_of:ln-01'], steps_original: LN01_STEPS, lines: LN01_LINES },
  {
    slug: 'dn-01', title_ar: 'شوربة دجاج بالخضار والأرز والبطاط', meal_types: ['عشاء'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: قطّع 180 غراماً من صدر الدجاج قطعاً صغيرة، وضعها في قدر مع ماء يغطيها.',
      '2: أضف 60 غراماً من الجزر و50 غراماً من البصل و100 غرام من الطماطم و100 غرام من البطاط مقطعة صغيراً.',
      '3: أضف 30 غراماً من الأرز الجاف و3 غرامات من الكمون.',
      '4: اترك الشوربة على نار هادئة 25 دقيقة حتى تنضج تماماً، وقدّمها مع 50 غراماً من التوست.',
    ],
    lines: [L('chicken', 180), L('carrot', 60), L('onion', 50), L('tomato', 100), L('potato', 100), L('rice', 30), L('cumin', 3), L('toast', 50)],
  },
  {
    slug: 'dn-02', title_ar: 'سلطة دجاج بالخيار والطماطم والأرز', meal_types: ['عشاء'], origin: 'board', status: 'verified', flags: ['DEF-06'],
    steps_original: [
      '1: قطّع 180 غراماً من صدر الدجاج شرائح، واشوه مع 8 غرامات من الزيت 8 دقائق.',
      '2: قطّع 100 غرام من الخيار و100 غرام من الطماطم مكعبات.',
      '3: أضف 20 غراماً من عصير الليمون.',
      '4: اسلق 40 غراماً من الأرز الجاف وقدّمه مع السلطة والدجاج و40 غراماً من التوست جانباً.',
    ],
    lines: [L('chicken', 180), L('oil', 8), L('cucumber', 100), L('tomato', 100), L('lemon', 20, 'juice'), L('rice', 40), L('toast', 40)],
  },
  {
    slug: 'dn-03', title_ar: 'زبادي بالخيار والثوم والجبنة والبيض', meal_types: ['عشاء'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: اسلق 100 غرام من البيض ثماني دقائق وقطّعه.',
      '2: ابشر 70 غراماً من الخيار وأضفه إلى 300 غرام من الزبادي.',
      '3: اهرس 5 غرامات من الثوم وأضفه مع الملح و8 غرامات من الزيت و30 غراماً من الجبنة.',
      '4: أضف البيض وقدّمه مع 40 غراماً من التوست.',
    ],
    lines: [L('egg', 100), L('cucumber', 70), L('yogurt', 300), L('garlic', 5), L('salt', null), L('oil', 8), L('cheese', 30), L('toast', 40)],
  },
  {
    slug: 'dn-04', title_ar: 'أومليت بالجبنة والزبادي', meal_types: ['عشاء'], origin: 'board', status: 'verified', flags: [],
    steps_original: [
      '1: اخفق 150 غراماً من البيض في كاسة.',
      '2: سخّن مقلاة مع 5 غرامات من الزيت وأضف 30 غراماً من الجبنة فوق البيض أثناء الطهي.',
      '3: قدّمه مع 150 غراماً من الزبادي و50 غراماً من الخيار و40 غراماً من التوست جانباً.',
    ],
    lines: [L('egg', 150), L('oil', 5), L('cheese', 30), L('yogurt', 150), L('cucumber', 50), L('toast', 40)],
  },
] satisfies Recipe[]);

export const RECIPE_BY_SLUG: ReadonlyMap<string, Recipe> = new Map(ORIGINAL_RECIPES.map((r) => [r.slug, r]));
