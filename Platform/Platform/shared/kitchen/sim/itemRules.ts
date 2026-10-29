/** قواعد المكوّنات (cooking-rules): نضج وتحمير وحرق وامتصاص. كل مكوّن من القائمة المقفلة الـ26 له سطر. */
import type { ItemRule } from './rules.js';

const R = (r: ItemRule): ItemRule => r;

export const ITEM_RULES: Readonly<Record<string, ItemRule>> = Object.freeze({
  potato: R({ cp: 3.4, moisture0: 0.79, release: 0.2, tauS: 30, tauC: 150, Tmin: 70, tref: 1050, cookable: true, brownable: true, burnK: 1, absorbOil: 0.15 }),
  onion: R({ cp: 3.8, moisture0: 0.89, release: 0.55, tauS: 20, tauC: 40, Tmin: 60, tref: 140, cookable: true, brownable: true, burnK: 1.1 }),
  tomato: R({ cp: 3.9, moisture0: 0.94, release: 0.6, tauS: 20, tauC: 40, Tmin: 55, tref: 90, cookable: true, brownable: false, burnK: 1 }),
  carrot: R({ cp: 3.8, moisture0: 0.88, release: 0.3, tauS: 25, tauC: 90, Tmin: 70, tref: 420, cookable: true, brownable: true, burnK: 1 }),
  cucumber: R({ cp: 4.0, moisture0: 0.96, release: 0.5, tauS: 20, tauC: 40, Tmin: 60, tref: 300, cookable: false, brownable: false, burnK: 1 }),
  toast: R({ cp: 2.6, moisture0: 0.38, release: 0.2, tauS: 6, tauC: 8, Tmin: 40, tref: 60, cookable: true, brownable: true, burnK: 1.3 }),
  lemon: R({ cp: 3.9, moisture0: 0.9, release: 0.3, tauS: 20, tauC: 40, Tmin: 60, tref: 300, cookable: false, brownable: false, burnK: 1 }),
  oats: R({ cp: 1.8, moisture0: 0.08, release: 0, tauS: 10, tauC: 12, Tmin: 70, tref: 200, cookable: true, brownable: false, burnK: 0.8 }),
  egg: R({ cp: 3.1, moisture0: 0.76, release: 0.12, tauS: 15, tauC: 150, Tmin: 63, tref: 152, cookable: true, brownable: true, burnK: 1.2 }),
  banana: R({ cp: 3.5, moisture0: 0.75, release: 0.2, tauS: 20, tauC: 40, Tmin: 60, tref: 300, cookable: false, brownable: false, burnK: 1 }),
  milk: R({ cp: 3.9, moisture0: 0.87, release: 0, tauS: 5, tauC: 5, Tmin: 100, tref: 1, cookable: false, brownable: false, burnK: 1 }),
  honey: R({ cp: 2.4, moisture0: 0.17, release: 0, tauS: 5, tauC: 5, Tmin: 100, tref: 1, cookable: false, brownable: false, burnK: 1 }),
  cheese: R({ cp: 2.7, moisture0: 0.45, release: 0.15, tauS: 12, tauC: 20, Tmin: 55, tref: 40, cookable: true, brownable: true, burnK: 1.1 }),
  yogurt: R({ cp: 3.6, moisture0: 0.88, release: 0.2, tauS: 5, tauC: 5, Tmin: 100, tref: 1, cookable: false, brownable: false, burnK: 1 }),
  chicken: R({ cp: 3.2, moisture0: 0.7, release: 0.28, tauS: 20, tauC: 60, Tmin: 74, tref: 360, cookable: true, brownable: true, burnK: 1 }),
  garlic: R({ cp: 3.0, moisture0: 0.6, release: 0.4, tauS: 8, tauC: 10, Tmin: 60, tref: 60, cookable: true, brownable: true, burnK: 2.6 }),
  rice: R({ cp: 1.8, moisture0: 0.12, release: 0, tauS: 12, tauC: 40, Tmin: 80, tref: 880, cookable: true, brownable: false, burnK: 0.8 }),
  eggplant: R({ cp: 3.9, moisture0: 0.92, release: 0.5, tauS: 20, tauC: 60, Tmin: 65, tref: 300, cookable: true, brownable: true, burnK: 1, absorbOil: 0.6 }),
  green_beans: R({ cp: 3.7, moisture0: 0.9, release: 0.3, tauS: 20, tauC: 60, Tmin: 65, tref: 420, cookable: true, brownable: false, burnK: 1 }),
  ginger: R({ cp: 3.5, moisture0: 0.79, release: 0.3, tauS: 10, tauC: 15, Tmin: 60, tref: 120, cookable: true, brownable: true, burnK: 1.5 }),
  coriander: R({ cp: 3.9, moisture0: 0.9, release: 0.5, tauS: 5, tauC: 5, Tmin: 60, tref: 30, cookable: true, brownable: false, burnK: 2 }),
  cumin: R({ cp: 1.8, moisture0: 0.08, release: 0, tauS: 4, tauC: 4, Tmin: 100, tref: 1, cookable: false, brownable: true, burnK: 3 }),
  tomato_paste: R({ cp: 3.4, moisture0: 0.76, release: 0.3, tauS: 10, tauC: 10, Tmin: 60, tref: 60, cookable: true, brownable: true, burnK: 1.4 }),
  salt: R({ cp: 0.9, moisture0: 0, release: 0, tauS: 4, tauC: 4, Tmin: 100, tref: 1, cookable: false, brownable: false, burnK: 0 }),
  sugar: R({ cp: 1.2, moisture0: 0, release: 0, tauS: 4, tauC: 4, Tmin: 100, tref: 1, cookable: false, brownable: true, burnK: 1.5 }),
  oil: R({ cp: 2.0, moisture0: 0, release: 0, tauS: 4, tauC: 4, Tmin: 100, tref: 1, cookable: false, brownable: false, burnK: 0 }),
});

/** سوائل تُصبّ مباشرة في الوعاء (لا تُنشأ قطعة) */
export const LIQUIDS: ReadonlySet<string> = new Set(['oil', 'milk', 'water']);
/** مكوّنات «القليل» الجافة (تُرش/تُضاف بالملعقة) */
export const SEASONINGS: ReadonlySet<string> = new Set(['salt', 'cumin', 'sugar']);
