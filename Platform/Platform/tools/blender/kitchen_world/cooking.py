"""خط الطبخ على الجدار الأيمن: طاولة ستانلس، موقد 4 مواقد بمقابض زرقاء، مدخنة، رفّ جرار، سكة أدوات معلّقة، شواية، حوض، ثلاجة، والأوعية (مرجع 3 و4 و8)."""
from lib import *
import items

def steel(name='MAT_steel', rough=0.32):
    m = mat(name, '#b9bec4', rough, 1.0); proc_color(m, 'noise', 40.0, '#8e949a', '#c9ced3', 6, bump=0.03, stretch=(1.0, 0.04, 1.0)); return m

def pan_mesh(bm, c, r, h, mi, handle_len=0.2, handle_mi=1, wall=0.0025, lip=0.01, seg=36):
    prof = [(r*0.92, 0.0), (r*0.97, 0.004), (r, h*0.85), (r+lip, h), (r+lip-wall*2, h), (r-wall, h*0.9), (r*0.9-wall, 0.006), (0.0, 0.004)]
    prof2 = [(0.0, 0.0), (r*0.92, 0.0), (r*0.97, 0.004), (r, h*0.85), (r+lip, h), (r+lip-wall*2, h), (r-wall, h*0.9), (r*0.92-wall, 0.006), (0.0, 0.006)]
    bm_lathe(bm, c, prof2, seg, mi)
    if handle_len:
        bm_box(bm, (c[0]+r+handle_len/2, c[1], c[2]+h*0.9), (handle_len, 0.026, 0.014), handle_mi)

def pot_mesh(bm, c, r, h, mi, hmi=1, lid=False, seg=36):
    prof = [(0.0, 0.0), (r, 0.0), (r*1.01, h), (r*1.03, h+0.006), (r*1.01-0.003, h+0.004), (r-0.003, 0.004), (0.0, 0.004)]
    bm_lathe(bm, c, prof, seg, mi)
    for sgn in (1, -1):
        bm_box(bm, (c[0]+sgn*(r+0.035), c[1], c[2]+h*0.8), (0.07, 0.03, 0.014), hmi)
    if lid:
        bm_lathe(bm, (c[0], c[1], c[2]+h+0.006), [(r*1.02, 0.0), (r*1.0, 0.012), (r*0.6, 0.03), (r*0.2, 0.038), (0.0, 0.04)], seg, mi)
        bm_cyl(bm, (c[0], c[1], c[2]+h+0.044), 0.012, 0.025, 10, hmi)

def build(C):
    E = C['EQUIPMENT']; P = C['PROPS']
    st = steel(); black = mat('MAT_cast_iron', '#1a1b1d', 0.55, 0.5); knob = mat('MAT_knob_blue', '#2d62c8', 0.35); dark = mat('MAT_steel_dark', '#3b3f44', 0.45, 0.8)
    cab = mat('MAT_cabinet', '#6b4426', 0.65); proc_color(cab, 'wave', 18.0, '#4e301a', '#7a502d', bump=0.1, stretch=(0.05, 1, 1))
    X = 3.52  # مركز حافة الطاولة
    # طاولة الطبخ: هيكل ستانلس مع واجهات خشب
    bm = bmesh.new()
    bm_box(bm, (X, -0.4, 0.43), (0.7, 4.4, 0.86), 1); bm_box(bm, (X, -0.4, 0.88), (0.74, 4.44, 0.04), 0)
    new_obj('PRP_cook_counter', bm, [st, cab], P)
    # أبواب/مقابض الواجهة
    bm = bmesh.new()
    for k in range(8):
        yy = -2.4+k*0.55
        bm_box(bm, (X-0.355, yy, 0.43), (0.01, 0.5, 0.74), 1)
        bm_box(bm, (X-0.37, yy, 0.65), (0.02, 0.12, 0.016), 0)
    new_obj('PRP_cook_counter_fronts', bm, [st, cab], P)
    # الموقد: 4 مواقد (مرجع 8) — شبكة حديد وحلقات
    bm = bmesh.new(); bmk = bmesh.new()
    burners = [(X, -1.45), (X, -0.95), (X, -0.45), (X, 0.05)]
    bm_box(bm, (X, -0.7, 0.91), (0.62, 1.7, 0.03), 0)
    for i, (bx, by) in enumerate(burners):
        bm_cyl(bm, (bx, by, 0.925), 0.07, 0.012, 20, 1)
    grate_m = 1
    for i, (bx, by) in enumerate(burners):
        for dy in (-0.11, 0.11): bm_box(bm, (bx, by+dy*0.0, 0.945), (0.30, 0.012, 0.012), 1) if False else None
        bm_box(bm, (bx, by, 0.953), (0.26, 0.016, 0.012), 1); bm_box(bm, (bx, by, 0.953), (0.016, 0.26, 0.012), 1)
        bm_box(bm, (bx, by, 0.945), (0.24, 0.24, 0.008), 1) if False else None
        for sx, sy in ((-0.125, -0.125), (0.125, -0.125), (-0.125, 0.125), (0.125, 0.125)): bm_cyl(bm, (bx+sx, by+sy, 0.925), 0.011, 0.03, 6, 1)
        bm_box(bm, (bx-0.34, by, 0.82), (0.03, 0.06, 0.06), 2)  # مكان المقبض على الواجهة
        bm_cyl(bmk, (bx-0.36, by, 0.80), 0.02, 0.025, 12, 0, 0.018, Matrix.Rotation(math.pi/2, 3, 'Y') @ Matrix.Rotation(math.pi, 3, 'X'))
    new_obj('PRP_range_top', bm, [steel('MAT_steel'), black, dark], P)
    new_obj('PRP_range_knobs', bmk, [knob], P)
    # شواية سوداء
    bm = bmesh.new(); bm_box(bm, (X, 1.0, 0.915), (0.6, 0.8, 0.02), 0); bm_box(bm, (X+0.29, 1.0, 0.94), (0.03, 0.8, 0.04), 0); bm_box(bm, (X-0.0, 1.38, 0.94), (0.6, 0.03, 0.04), 0)
    new_obj('PRP_griddle', bm, [black], P)
    # مدخنة فوق الموقد + قناتها
    bm = bmesh.new()
    bm_cyl(bm, (X, -0.7, 1.65), 0.3, 0.12, 4, 0, 0.52, Matrix.Rotation(math.pi/4, 3, 'Z') @ Matrix.Identity(3)) if False else None
    bm_box(bm, (X, -0.7, 1.72), (0.7, 1.9, 0.10), 0); bm_box(bm, (X+0.05, -0.7, 1.82), (0.55, 1.6, 0.15), 0); bm_box(bm, (X+0.12, -0.7, 2.45), (0.38, 0.5, 1.2), 0)
    new_obj('PRP_hood', bm, [st], P)
    # رف الجدار الستانلس مع جرار وزجاجات (الصورة 4/8)
    bm = bmesh.new(); bm_box(bm, (3.78, 1.0, 1.50), (0.30, 2.8, 0.025), 0); bm_box(bm, (3.78, 1.0, 1.395), (0.30, 2.8, 0.02), 0)
    for yy in (-0.35, 2.35): bm_box(bm, (3.9, yy, 1.45), (0.05, 0.03, 0.13), 2)
    new_obj('PRP_wall_shelf', bm, [st, st, dark], P)
    # سكة أدوات معلّقة: مقالي ومجارف وملاعق (مرجع 4 و8)
    bm = bmesh.new(); bm_box(bm, (3.93, -0.7, 1.35), (0.03, 1.9, 0.03), 0)
    for yy in (-1.5, -1.1, -0.7, -0.3, 0.1): bm_cyl(bm, (3.9, yy, 1.35), 0.006, 0.12, 6, 0, None, Matrix.Rotation(math.pi/2, 3, 'X')) if False else None
    new_obj('PRP_tool_rail', bm, [dark], P)
    # حوض + صنبور (ركن أيمن خلفي)
    bm = bmesh.new(); bm_box(bm, (3.4, 2.45, 0.43), (1.0, 0.8, 0.86), 1); bm_box(bm, (3.4, 2.45, 0.88), (1.04, 0.84, 0.04), 0)
    new_obj('PRP_sink_cabinet', bm, [st, cab], P)
    bm = bmesh.new(); bm_box(bm, (3.4, 2.45, 0.845), (0.7, 0.5, 0.09), 0)
    new_obj('PRP_sink_basin', bm, [mat('MAT_basin', '#8f959b', 0.3, 1.0)], P)
    bm = bmesh.new(); bm_cyl(bm, (3.4, 2.7, 0.9), 0.015, 0.35, 10, 0); bm_cyl(bm, (3.4, 2.62, 1.22), 0.012, 0.16, 10, 0, None, Matrix.Rotation(math.pi/2, 3, 'X')) if False else None
    bm_box(bm, (3.4, 2.62, 1.245), (0.025, 0.2, 0.025), 0)
    new_obj('PRP_faucet', bm, [mat('MAT_chrome', '#d6dade', 0.12, 1.0)], P)
    # ثلاجة ستانلس عمودية
    bm = bmesh.new(); bm_box(bm, (2.55, 2.85, 1.0), (0.9, 0.7, 2.0), 0); bm_box(bm, (2.55, 2.49, 1.0), (0.01, 0.01, 0.01), 0)
    bm_box(bm, (2.22, 2.5, 1.15), (0.03, 0.03, 0.9), 1); bm_box(bm, (2.55, 2.495, 1.0), (0.88, 0.01, 0.01), 1)
    new_obj('PRP_fridge', bm, [st, dark], P)

    # ───── الأوعية (عقد equip_*): على رف المعدات فوق الطاولة الأمامية ─────
    shelf = steel('MAT_steel')
    bm = bmesh.new(); bm_box(bm, (1.6, -2.95, 0.80), (2.8, 0.4, 0.04), 0); bm_box(bm, (1.6, -2.95, 1.3), (2.8, 0.4, 0.04), 0)
    for xx in (0.25, 1.6, 2.95): bm_box(bm, (xx, -3.05, 0.9), (0.04, 0.04, 1.8), 0)
    bm_box(bm, (1.6, -3.14, 0.5), (2.8, 0.04, 1.0), 0) if False else None
    new_obj('PRP_equipment_rack', bm, [dark], P)
    pan_m = mat('MAT_pan_black', '#232528', 0.4, 0.8); handle_m = mat('MAT_handle_black', '#141414', 0.5)
    sp = {'pan': (0.8, -2.95, 0.82, 0.14, 0.05), 'pot_small': (1.2, -2.95, 0.82, 0.10, 0.10), 'pot_large': (1.65, -2.95, 0.82, 0.16, 0.18), 'pressure_cooker': (2.1, -2.95, 0.82, 0.15, 0.20)}
    for k, (x, y, z, r, h) in sp.items():
        bm = bmesh.new()
        if k == 'pan': pan_mesh(bm, (0, 0, 0), r, h, 0, 0.2, 1)
        else: pot_mesh(bm, (0, 0, 0), r, h, 0 if k != 'pressure_cooker' else 2, 1, lid=(k == 'pressure_cooker'))
        new_obj(f'equip_{k}', bm, [pan_m if k == 'pan' else steel('MAT_pot_steel', 0.28), handle_m, mat('MAT_pc_alu', '#c7ccd1', 0.25, 1.0)], E, (x, y, z), smooth=True)
    bm = bmesh.new(); bm_lathe(bm, (0, 0, 0), [(0.0, 0.0), (0.07, 0.0), (0.12, 0.06), (0.13, 0.085), (0.125, 0.085), (0.115, 0.06), (0.065, 0.006), (0.0, 0.006)], 32, 0)
    new_obj('equip_bowl', bm, [mat('MAT_ceramic_white', '#f2efe6', 0.2)], E, (0.35, 0.35, 0.93), smooth=True)
    bm = bmesh.new(); bm_lathe(bm, (0, 0, 0), [(0.0, 0.0), (0.09, 0.0), (0.14, 0.014), (0.145, 0.02), (0.13, 0.02), (0.09, 0.008), (0.0, 0.008)], 40, 0)
    new_obj('plate_1', bm, [mat('MAT_ceramic_white', '#f2efe6', 0.2)], E, (-0.65, 0.22, 0.93), smooth=True)
    bm = bmesh.new(); bm_box(bm, (0, 0, 0.09), (0.28, 0.16, 0.18), 0); bm_box(bm, (0, 0, 0.185), (0.2, 0.1, 0.01), 1); bm_box(bm, (0.15, 0, 0.14), (0.02, 0.05, 0.02), 1)
    new_obj('equip_toaster', bm, [steel('MAT_steel'), black], E, (0.8, 0.3, 0.93))
