/**
 * ثوابت محاكاة الطهي (SIM-03): كل رقم هنا بتعليق، ولا أرقام سحرية في المحرك.
 * القيم «تقريبية فيزيائيًا ومضبوطة بالمعايرة» على جدول SIM-50 (أزمنة وصفات المالك هي المرجع). ليست نصيحة طهي أو سلامة غذائية.
 */
import type { Profile } from '../types.js';

/** زمن اللعبة لكل خطوة (SIM-01) */
export const DT = 0.1;
export const T_AMBIENT = 27; // °م (ماليزيا)

/** مواقد الغاز: واط فعّال لكل درجة (0–10) = قدرة × كفاءة */
export const BURNER_W_PER_LEVEL = 130; // درجة 10 ≈ 1300 W فعّالة (غاز ≈ 3 kW × كفاءة ≈ 0.43)
/** فقد حراري للوعاء إلى الجو (W/K) بحسب النوع */
export const VESSEL = {
  pan: { massCp: 520, loss: 3.4, burn: true, label: 'مقلاة' },
  pot_small: { massCp: 420, loss: 2.6, burn: true, label: 'قدر صغير' },
  pot_large: { massCp: 900, loss: 4.2, burn: true, label: 'قدر طبخ كبير' },
  pressure_cooker: { massCp: 1500, loss: 4.0, burn: true, label: 'قدر ضغط' },
  bowl: { massCp: 300, loss: 1.5, burn: false, label: 'وعاء' },
  plate: { massCp: 250, loss: 1.5, burn: false, label: 'صحن' },
} as const;
export type VesselKind = keyof typeof VESSEL;

export const CP_WATER = 4.18; // J/g·K
export const CP_OIL = 2.0;
export const CP_MILK = 3.9;
export const LATENT_EVAP = 2260; // J/g
export const BOIL_C = 100;
/** قدر الضغط: درجة التشغيل ≈ 115–121°م (SIM-16) */
export const PRESSURE_C = 118;
export const PRESSURE_WHISTLE_C = 112;
export const PRESSURE_RELEASE_NATURAL_S = 600; // ≈10 د
export const PRESSURE_RELEASE_QUICK_S = 30;
/** تسخين طرف الوعاء على الصيغة: سقف حرارة الوعاء الفارغ لمنع الانفلات */
export const VESSEL_MAX_C = 400;
/** نقطة دخان الزيت (SIM-12): قابلة للضبط */
export const OIL_SMOKE_C = 210;

/** سرعة مضاعفة التفاعل: Q10 = 2 (كل +10°م يضاعف سرعة النضج) */
export const Q10 = 2;
export const SAFE_CHICKEN_CORE_C = 74; // SIM-10
export const MAILLARD_C = 140; // SIM-12
export const CARAMEL_C = 160;
export const BURN_C = 180;
export const BROWN_FULL_S = 150; // ثوانٍ من سطح 40°م فوق عتبة التحمير إلى تحمير كامل (مرجع)
export const BURN_FULL_S = 70; // ثوانٍ من سطح 40°م فوق عتبة الحرق إلى حرق كامل (مرجع)

/** عوامل القطع: تصغير زمن انتقال الحرارة (قياسًا بالقطعة كما تُؤخذ) */
export const CUT_FACTOR: Record<string, number> = {
  whole: 1,
  slices: 0.45,
  cubes_large: 0.8,
  cubes_medium: 0.6,
  cubes_small: 0.38,
  diced_small: 0.38,
  diced_medium: 0.6,
  sticks_medium: 0.5,
  sticks_small: 0.35,
  minced: 0.2,
  grated: 0.18,
  mashed: 0.15,
};

/** نضج الأرز يحتاج غمرًا: ماء يمتصه (SIM-13) */
export const RICE_ABSORB_G_PER_G = 2.7;
export const OATS_ABSORB_G_PER_G = 3.0;
/** حليب: لحظة الفوران (SIM-15) */
export const MILK_FOAM_C = 96;
export const MILK_FOAM_S = 18; // ثوانٍ بلا تحريك عند الغليان قبل الفوران
export const MILK_BOIL_OVER_LOSS = 0.15;
/** بقاء الأومليت: تماسك البيض (SIM-11) */
export const EGG_SET_C = 62;
export const CHEESE_MELT_C = 55;
/** باذنجان: ترشيش الملح 5 د ثم الشطف (SIM-14) */
export const SALT_REST_S = 300;
export const SALTED_OIL_FACTOR = 0.55;
export const SALTED_BITTER_REMOVED = true;
/** التصاق: وعاء ساخن بلا سائل ولا زيت وبلا تحريك (SIM-18) */
export const STICK_C = 170;
export const STICK_NO_STIR_S = 25;
/** سرعة إطلاق ماء العصارة من القطع (جزء الرطوبة في الثانية عند سطح 100°م) */
export const JUICE_RELEASE_PER_S = 0.0035;
export const SURFACE_WET_G = 0.5; // ماء حر في الوعاء يمنع التحمير

export interface ItemRule {
  /** حرارة نوعية J/g·K */
  cp: number;
  /** نسبة الماء الابتدائية (كسر) */
  moisture0: number;
  /** ثابت زمن تعادل السطح مع الوسط (ث) لقطعة كما تُؤخذ */
  tauS: number;
  /** تأخر القلب عن السطح (ث) */
  tauC: number;
  /** حرارة القلب التي يبدأ عندها النضج */
  Tmin: number;
  /** ثوانٍ لبلوغ نضج 1.0 عند قلب 100°م لقطعة بالقطع المرجعية */
  tref: number;
  cookable: boolean;
  /** يتحمّر سطحه */
  brownable: boolean;
  /** أمان الحرق (مضاعف سرعة الاحتراق؛ الثوم >1) */
  burnK: number;
  /** الجزء من ماء القطعة الذي يخرج عصارةً عند الطهي بلا غمر (الباقي يبقى فيها) */
  release: number;
  /** زيت يمتصه (غ لكل غ) عند القلي الكامل */
  absorbOil?: number;
  /** ملف التغذية بعد الطهي يبقى كما في S4 (مثلًا البيض مطبوخ) — للتوثيق */
  profile?: Profile;
}
