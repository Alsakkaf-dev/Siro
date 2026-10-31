"""إعادة توليد web/src/fonts/*.woff2 (مجموعات جزئية من خطوط OFL: IBM Plex Sans Arabic؛ Cairo أُزيل — 500 و700 مأخوذان كاملين من @fontsource).
يُشغَّل يدويًا عند الحاجة فقط (يتطلب: pip install fonttools brotli @ وملفات المصدر من حزم @fontsource عبر npm pack). الناتج مُلتزَم في المستودع فلا يحتاج الجهاز لبايثون."""
import glob, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont

SRC = sys.argv[1]  # مجلد فيه ملفات woff2 من @fontsource/*/files
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'web', 'src', 'fonts')
AR = 'U+0600-0603,U+060C,U+061B,U+061F,U+0620-0655,U+0660-066D,U+0670-06D5,U+06DD-06DE,U+06E5-06E6,U+06FD-06FE,U+200C-200F,U+2010-2011,U+2013-2014,U+2018-201D,U+2022,U+2026,U+0020,U+00A0,U+00B7,U+00AB,U+00BB'
LAT = 'U+0020-007E,U+00A0,U+00B7,U+00D7,U+00AB,U+00BB,U+2013,U+2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+2212,U+2248,U+2264,U+2265,U+20AC'
for f in sorted(glob.glob(os.path.join(SRC, '*-normal.woff2'))):
    name = os.path.basename(f)
    is_ar = name.split('-normal')[0].endswith(('arabic-400', 'arabic-600', 'arabic-700', 'arabic-800')) and '-latin-' not in name
    o = subset.Options(); o.flavor = 'woff2'; o.layout_features = ['*']; o.hinting = False; o.desubroutinize = True; o.name_IDs = [1, 2]
    font = TTFont(f)
    s = subset.Subsetter(o); s.populate(unicodes=subset.parse_unicodes(AR if is_ar else LAT)); s.subset(font)
    font.flavor = 'woff2'; font.save(os.path.join(OUT, name)); print(name, os.path.getsize(os.path.join(OUT, name)))
