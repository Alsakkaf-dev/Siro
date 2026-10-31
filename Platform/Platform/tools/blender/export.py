"""تصدير مطبخ سيرو من بلندر إلى GLB بعقد الأسماء 3D-10 (K-M8). يعمل بلا واجهة:

    blender -b kitchen.blend -P tools/blender/export.py -- --out web/public/kitchen/models/kitchen-kit.glb
    blender -b kitchen.blend -P tools/blender/export.py -- --check-only      # فحص الأسماء والمقياس بلا تصدير

يتحقق قبل التصدير: (1) أسماء العقد تطابق الاتفاقية، (2) المقياس مطبَّق (1,1,1) والدوران صفر، (3) لا مكوّن خارج القائمة المقفلة
(26)، ثم يصدّر glTF Binary بـY لأعلى ووحدات المتر مع extras. يخرج برمز 1 عند أي مخالفة فلا يُصدَّر ملف معيب.
لا يستورد غير bpy والمكتبة القياسية. تحقق من أحدث إصدار LTS على blender.org (المراجع: 4.2 LTS فأحدث).
"""
import argparse
import math
import re
import sys

import bpy  # type: ignore  # متاح داخل بلندر فقط

INGREDIENTS = {
    "potato", "onion", "tomato", "carrot", "cucumber", "toast", "lemon", "oats", "egg", "banana", "milk", "honey", "cheese",
    "yogurt", "chicken", "garlic", "rice", "eggplant", "green_beans", "ginger", "coriander", "oil", "cumin", "salt", "sugar", "tomato_paste",
}
PATTERNS = {
    "slot": re.compile(r"^slot_ing_([a-z0-9_]+)$"),
    "burner": re.compile(r"^burner_([1-4])$"),
    "station": re.compile(r"^cam_station_([a-z_]+)$"),
    "plate": re.compile(r"^plate_(\d+)$"),
    "tool": re.compile(r"^tool_([a-z0-9_]+)$"),
    "equip": re.compile(r"^equip_([a-z0-9_]+)$"),
    "drop": re.compile(r"^drop_([a-z0-9_]+)$"),
    "shelf": re.compile(r"^shelf_[a-z0-9_]+$"),
    "col": re.compile(r"^col_[a-z0-9_]+$"),
    "fixed": re.compile(r"^(board_main|scale_main)$"),
}
PREFIXES = ("slot_", "burner_", "cam_", "plate_", "tool_", "equip_", "drop_", "shelf_", "col_")


def check_scene():
    """يعيد قائمة المخالفات (نصوص عربية)."""
    problems = []
    for o in bpy.data.objects:
        n = o.name
        matched = None
        for kind, rx in PATTERNS.items():
            m = rx.match(n)
            if m:
                matched = (kind, m)
                break
        if matched is None:
            if n.startswith(PREFIXES):
                problems.append(f"{n}: اسم لا يطابق الاتفاقية")
            continue
        kind, m = matched
        if kind == "slot" and m.group(1) not in INGREDIENTS:
            problems.append(f"{n}: مكوّن خارج القائمة المقفلة (26)")
        if any(abs(s - 1.0) > 1e-4 for s in o.scale):
            problems.append(f"{n}: المقياس غير مطبَّق {tuple(round(s, 4) for s in o.scale)} (Object ▸ Apply ▸ Scale)")
        if o.type == "MESH" and any(abs(math.degrees(r)) > 1e-3 for r in o.rotation_euler) and o.parent is None:
            problems.append(f"{n}: دوران غير مطبَّق (Apply ▸ Rotation)")
    present = {PATTERNS["slot"].match(o.name).group(1) for o in bpy.data.objects if PATTERNS["slot"].match(o.name)}
    missing = sorted(INGREDIENTS - present)
    if missing:
        problems.append("خانات ناقصة (تبقى إجرائية): " + "، ".join(f"slot_ing_{s}" for s in missing))
    return problems


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", help="مسار ملف GLB الناتج")
    ap.add_argument("--check-only", action="store_true")
    ap.add_argument("--strict", action="store_true", help="الخانات الناقصة تُعدّ خطأ")
    a = ap.parse_args(argv)
    problems = check_scene()
    fatal = [p for p in problems if a.strict or not p.startswith("خانات ناقصة")]
    for p in problems:
        print(("✗ " if p in fatal else "! ") + p)
    if fatal:
        print("لم يُصدَّر شيء: أصلح المخالفات أعلاه.")
        sys.exit(1)
    if a.check_only or not a.out:
        print("الفحص نظيف.")
        return
    bpy.ops.export_scene.gltf(
        filepath=a.out, export_format="GLB", export_apply=True, export_extras=True, export_yup=True, export_morph=True,
        export_animations=True, export_cameras=False, export_lights=False, use_selection=False,
    )
    print(f"صُدّر: {a.out}\nالخطوة التالية: node tools/assets/optimize.mjs")


main()
