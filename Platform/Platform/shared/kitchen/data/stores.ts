/** الأسواق الخمسة كما كتبها المالك (2.7) والشريحة السعرية لكل منها. */
import type { Store } from '../types.js';

export const STORES: readonly Store[] = Object.freeze([
  { slug: 'mydin', name: 'Mydin Mall Mutiara Rini', tier: 'cheap', aliases: ['Mydin'] },
  { slug: 'nsk', name: 'NSK Trade City Skudai', tier: 'cheap', aliases: ['NSK'] },
  { slug: 'kip', name: 'KIPMall Tampoi', tier: 'mid', aliases: ['KIP', 'KIPMall'] },
  { slug: 'bestari', name: 'Bestari Bestmart / HT Supermart', tier: 'mid', aliases: ['Bestari Bestmart', 'HT Supermart'] },
  { slug: 'aeon', name: 'Aeon Mall Taman Universiti', tier: 'high', aliases: ['Aeon'] },
] satisfies Store[]);

export const DEFAULT_STORE = 'mydin';
