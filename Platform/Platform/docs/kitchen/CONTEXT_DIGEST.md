# ملخص السياق (اقرأه في بداية كل جلسة)
- المرجع الأعلى للتنفيذ: `docs/UNIFIED_PLAN_AR.md` (4 مراحل). مراجع: `nav-restructure/{HANDOFF,PLAN,AUDIT}_AR.md` و`kitchen/MASTER_PROMPT.md` (المواصفة الكاملة، ملاحق S0–S9).
- المالك محمد، مستخدم واحد، KL (UTC+8)، RM، عربي RTL، أرقام 0-9.
- لا تبدأ قبل «إبدأ». بعد كل مرحلة قل «أكملت المرحلة N» وتوقف حتى «أكمل المرحلة N+1».
- ممنوع: لمس tokens/ألوان/خطوط؛ السجل؛ تغيير عقود API؛ مكونات خارج الـ26؛ تخسيس/TDEE؛ كتابة Outlook مباشرة؛ تغيير قانون 1200–1500؛ ارتكاب dist/node_modules/db/backups.
- التشغيل: نسخة عمل خارج المستودع عبر `scripts/dev/sync-to-scratch.sh`؛ بوابات: typecheck، vitest، build، smoke، browser-smoke --strict.
- حالة التنفيذ في جدول `UNIFIED_PLAN_AR.md`. المرحلة 1 منجزة: الطبقة النقية `shared/kitchen/` (القانون في `law.ts` وحده) و`/kitchen` HUB خلف `kitchen.enabled`.
