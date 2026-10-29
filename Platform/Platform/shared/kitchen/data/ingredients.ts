/**
 * بذرة المكوّنات الـ26 المقفلة (S1 + 2.2). القائمة مقفلة (N-01/G-04): لا يُضاف مكوّن إلا بموافقة المالك على كل عنصر.
 * الأسماء العربية كما كتبها المالك؛ الفئة من 2.2 (تطابق فلاتر A1-20)؛ pack_g وyield من S1 (تقديرية — DEF-07).
 */
import type { Ingredient } from '../types.js';

export const INGREDIENTS: readonly Ingredient[] = Object.freeze([
  { slug: 'potato', name_ar: 'بطاط', name_en: 'Potato', name_ms: 'Kentang', category: 'خضروات', icon: '🥔', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.81, profile: 'raw', synonyms: ['بطاطا', 'بطاطس', 'potatoes'], flags: [] },
  { slug: 'onion', name_ar: 'بصل', name_en: 'Onion', name_ms: 'Bawang besar', category: 'خضروات', icon: '🧅', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.9, profile: 'raw', synonyms: ['بصلة', 'onions'], flags: [] },
  { slug: 'tomato', name_ar: 'طماطم', name_en: 'Tomato', name_ms: 'Tomato', category: 'خضروات', icon: '🍅', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.97, profile: 'raw', synonyms: ['طماط', 'بندوره', 'tomatoes'], flags: [] },
  { slug: 'carrot', name_ar: 'جزر', name_en: 'Carrot', name_ms: 'Lobak merah', category: 'خضروات', icon: '🥕', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.89, profile: 'raw', synonyms: ['carrots'], flags: [] },
  { slug: 'cucumber', name_ar: 'خيار', name_en: 'Cucumber', name_ms: 'Timun', category: 'خضروات', icon: '🥒', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.97, profile: 'raw', synonyms: [], flags: [], note: 'نيء فقط' },
  { slug: 'toast', name_ar: 'توست', name_en: 'Toast bread', name_ms: 'Roti bakar', category: 'مخبوزات', icon: '🍞', sale_unit: 'loaf', pack_g: 400, edible_yield: 1, profile: 'raw', synonyms: ['خبز توست', 'خبز', 'roti putih', 'white bread', 'bread'], flags: ['assumed_pack'], note: '≈20 غ للشريحة' },
  { slug: 'lemon', name_ar: 'ليمون', name_en: 'Lemon/Lime', name_ms: 'Limau', category: 'فواكه', icon: '🍋', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.3, profile: 'juice', synonyms: ['عصير ليمون', 'lime', 'lemon'], flags: ['needs_owner_confirmation'], note: 'المردود = عصير (DEF-06)' },
  { slug: 'oats', name_ar: 'شوفان', name_en: 'Oats', name_ms: 'Oat', category: 'حبوب ونشويات', icon: '🌾', sale_unit: 'box', pack_g: 800, edible_yield: 1, profile: 'raw', synonyms: ['rolled oats'], flags: ['assumed_pack'] },
  { slug: 'egg', name_ar: 'بيض', name_en: 'Egg', name_ms: 'Telur', category: 'ألبان وبيض', icon: '🥚', sale_unit: 'dozen', pack_g: 720, piece_g: 60, piece_edible_g: 53, edible_yield: 0.88, profile: 'cooked', synonyms: ['بيضه', 'eggs', 'telur ayam', 'chicken egg'], flags: [], note: '≈60 غ للبيضة، بلا قشر ≈53' },
  { slug: 'banana', name_ar: 'موز', name_en: 'Banana', name_ms: 'Pisang', category: 'فواكه', icon: '🍌', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.64, profile: 'raw', synonyms: ['bananas'], flags: [] },
  { slug: 'milk', name_ar: 'حليب', name_en: 'Milk', name_ms: 'Susu', category: 'ألبان وبيض', icon: '🥛', sale_unit: 'l', pack_g: 1000, density_g_ml: 1, edible_yield: 1, profile: 'raw', synonyms: ['susu segar', 'full cream milk'], flags: [] },
  { slug: 'honey', name_ar: 'عسل', name_en: 'Honey', name_ms: 'Madu', category: 'محليات', icon: '🍯', sale_unit: 'jar', pack_g: 500, edible_yield: 1, profile: 'raw', synonyms: [], flags: ['assumed_pack'] },
  { slug: 'cheese', name_ar: 'جبنة مراعي', name_en: 'Cheese (Marigold-type slices)', name_ms: 'Keju', category: 'ألبان وبيض', icon: '🧀', sale_unit: 'pack', pack_g: 200, edible_yield: 1, profile: 'raw', synonyms: ['جبنه', 'جبن', 'مراعي', 'almarai', 'processed cheese', 'cheese'], flags: ['assumed_pack', 'needs_label_verification'], note: 'القيمة من الملصق — DEF-04' },
  { slug: 'yogurt', name_ar: 'زبادي', name_en: 'Yogurt', name_ms: 'Yogurt', category: 'ألبان وبيض', icon: '🥣', sale_unit: 'tub', pack_g: 1000, edible_yield: 1, profile: 'raw', synonyms: ['لبن', 'روب', 'plain yogurt'], flags: ['assumed_pack'], note: 'لا يُسخَّن' },
  { slug: 'chicken', name_ar: 'دجاج مقطع', name_en: 'Chicken (cut)', name_ms: 'Ayam potong', category: 'لحوم ودواجن', icon: '🍗', sale_unit: 'kg', pack_g: 1000, edible_yield: 1, profile: 'raw', synonyms: ['دجاج', 'صدر دجاج', 'صدور دجاج', 'ayam', 'dada ayam', 'chicken breast'], flags: ['needs_owner_confirmation'], variant: 'breast_boneless', note: 'النوع غير محدد — DEF-05؛ القيم على صدر نيء' },
  { slug: 'garlic', name_ar: 'ثوم', name_en: 'Garlic', name_ms: 'Bawang putih', category: 'خضروات', icon: '🧄', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.87, profile: 'raw', synonyms: [], flags: [] },
  { slug: 'rice', name_ar: 'أرز', name_en: 'Rice', name_ms: 'Beras', category: 'حبوب ونشويات', icon: '🍚', sale_unit: 'bag', pack_g: 10000, edible_yield: 1, profile: 'raw', synonyms: ['رز', 'عيش', 'white rice'], flags: [], note: 'القيم على الجاف' },
  { slug: 'eggplant', name_ar: 'باذنجان', name_en: 'Eggplant', name_ms: 'Terung', category: 'خضروات', icon: '🍆', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.81, profile: 'raw', synonyms: ['بيذنجان', 'aubergine'], flags: [] },
  { slug: 'green_beans', name_ar: 'فاصوليا خضراء', name_en: 'Green beans', name_ms: 'Kacang buncis', category: 'خضروات', icon: '🫛', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.88, profile: 'raw', synonyms: ['فاصوليا', 'فاصولياء'], flags: [] },
  { slug: 'ginger', name_ar: 'زنجبيل', name_en: 'Ginger', name_ms: 'Halia', category: 'خضروات', icon: '🫚', sale_unit: 'kg', pack_g: 1000, edible_yield: 0.85, profile: 'raw', synonyms: [], flags: ['not_in_recipes'], note: 'غير مستعمل في الـ12' },
  { slug: 'coriander', name_ar: 'كزبرة', name_en: 'Coriander', name_ms: 'Daun ketumbar', category: 'خضروات', icon: '🌿', sale_unit: 'bunch', pack_g: 100, edible_yield: 0.75, profile: 'raw', synonyms: ['كزبره', 'cilantro'], flags: ['not_in_recipes'] },
  { slug: 'cumin', name_ar: 'كمون مطحون', name_en: 'Ground cumin', name_ms: 'Jintan putih', category: 'توابل', icon: '🫙', sale_unit: 'box', pack_g: 100, edible_yield: 1, profile: 'raw', synonyms: ['كمون', 'serbuk jintan putih', 'cumin'], flags: ['assumed_pack'] },
  { slug: 'tomato_paste', name_ar: 'معجون طماطم (كاتشب)', name_en: 'Tomato paste', name_ms: 'Pes tomato', category: 'معلبات وصلصات', icon: '🥫', sale_unit: 'box', pack_g: 400, edible_yield: 1, profile: 'raw', synonyms: ['معجون طماطم', 'كاتشب', 'صلصه', 'sos tomato', 'ketchup'], flags: ['assumed_pack', 'needs_owner_confirmation'], note: '«الكاتشب» كما سمّاه المالك — DEF-03' },
  { slug: 'salt', name_ar: 'ملح', name_en: 'Salt', name_ms: 'Garam', category: 'توابل', icon: '🧂', sale_unit: 'kg', pack_g: 1000, edible_yield: 1, profile: 'raw', synonyms: [], flags: [], note: '0 سعرة' },
  { slug: 'sugar', name_ar: 'سكر', name_en: 'Sugar', name_ms: 'Gula', category: 'محليات', icon: '🍬', sale_unit: 'kg', pack_g: 1000, edible_yield: 1, profile: 'raw', synonyms: [], flags: ['not_in_recipes'] },
  { slug: 'oil', name_ar: 'زيت', name_en: 'Oil', name_ms: 'Minyak masak', category: 'زيوت', icon: '🫗', sale_unit: 'bottle', pack_g: 1840, density_g_ml: 0.92, edible_yield: 1, profile: 'raw', synonyms: ['زيت طبخ', 'cooking oil'], flags: ['assumed_pack'], note: 'عبوة 2 لتر × كثافة ≈0.92' },
] satisfies Ingredient[]);

export const INGREDIENT_BY_SLUG: ReadonlyMap<string, Ingredient> = new Map(INGREDIENTS.map((i) => [i.slug, i]));

/** مكوّنات «القليل» التي تُعدّ متوفرة إن وُجد منها أي مقدار (FEA) */
export const TINY = new Set(['salt', 'cumin', 'sugar']);
