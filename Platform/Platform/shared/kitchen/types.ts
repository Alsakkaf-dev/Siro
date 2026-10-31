/** أنواع منصة المطبخ (DM-02). طبقة نقية: لا إطار ولا شبكة ولا تخزين. */
export type NutritionVector = { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number };
export type Money = number; // RM، دقتان عشريتان عند العرض فقط

/** ملف التغذية المستعمل للسطر (UNIT-03): الافتراضي خام/جاف، ويُصرَّح بغيره. */
export type Profile = 'raw' | 'cooked' | 'juice';

export type SaleUnit = 'kg' | 'g' | 'piece' | 'dozen' | 'loaf' | 'pack' | 'box' | 'jar' | 'tub' | 'bunch' | 'l' | 'bottle' | 'bag';

export type Category = 'خضروات' | 'فواكه' | 'لحوم ودواجن' | 'ألبان وبيض' | 'حبوب ونشويات' | 'مخبوزات' | 'توابل' | 'زيوت' | 'محليات' | 'معلبات وصلصات';

/** وسوم الجودة على بيانات المكوّن (DEF-xx). */
export type IngredientFlag = 'assumed_pack' | 'needs_label_verification' | 'needs_owner_confirmation' | 'not_in_recipes';

export interface Ingredient {
  /** ثابت لا يتغير أبدًا (S1) */
  slug: string;
  /** كما كتبه المالك (2.2/S1) — اسم العرض الرسمي */
  name_ar: string;
  name_en: string;
  name_ms: string;
  category: Category;
  icon: string;
  sale_unit: SaleUnit;
  /** حجم العبوة/وحدة البيع بالغرام (تقديري — DEF-07) */
  pack_g: number;
  /** وزن الحبة الكامل بالغرام (للبيض) */
  piece_g?: number;
  /** وزن الحبة الصالح للأكل */
  piece_edible_g?: number;
  density_g_ml?: number;
  /** نسبة الصالح للأكل من الوزن المشترى (S1) */
  edible_yield: number;
  /** الملف الغذائي الافتراضي */
  profile: Profile;
  synonyms: string[];
  flags: IngredientFlag[];
  /** للدجاج: النوع (DEF-05) */
  variant?: 'whole_cut' | 'breast_boneless';
  note?: string;
}

export type PriceSource = 'estimate_tier' | 'manual' | 'receipt' | 'pricecatcher';
export type Confidence = 'low' | 'medium' | 'high';
export type StoreTier = 'cheap' | 'mid' | 'high';

export interface Store { slug: string; name: string; tier: StoreTier; aliases: string[] }

export interface PricePoint {
  ingredient: string;
  store: string;
  /** سعر وحدة البيع (sale_unit) بالرينغيت */
  price_rm: Money;
  price_min: Money;
  price_max: Money;
  source: PriceSource;
  confidence: Confidence;
  /** غير متحقَّق منه (2.7: سعر الدجاج «المضبوط» والسكر) */
  unverified?: boolean;
  observed_at: string;
}

export interface RecipeLine {
  ingredient: string;
  /** null = بلا كمية في نص الوصفة («الملح»، «الكمون» دون جرامات) */
  amount_g: number | null;
  profile?: Profile;
}

export type MealType = 'فطور' | 'غداء' | 'عشاء';
export type RecipeStatus = 'verified' | 'draft' | 'needs_quantities' | 'body_mismatch_title' | 'proposed';

export interface Recipe {
  slug: string;
  title_ar: string;
  meal_types: MealType[];
  origin: 'board' | 'kitchen' | 'import' | 'variant';
  status: RecipeStatus;
  /** نص الوصفة كما كتبه المالك حرفيًا — لا يُعدَّل في مكانه (N-12) */
  steps_original: string[];
  lines: RecipeLine[];
  flags: string[];
  parent_slug?: string;
}
