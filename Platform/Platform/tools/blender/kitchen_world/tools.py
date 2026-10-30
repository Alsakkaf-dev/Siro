"""أدوات المطبخ اليدوية (تُمسك باليد في اللعبة): كل أداة كائن مستقل tool_<id> أصله عند المقبض ومحوره الطويل نحو +Y (يصير −Z في glTF = الأمام).
الأدوات: knife peeler grater masher whisk spoon spatula + bottle_oil carton_milk shaker_salt shaker_cumin shaker_sugar.
مستلقية على الجزيرة؛ التدوير الأولي في الكائن (يصل glTF كما هو) ويُستعمل كوضع «العودة»."""
from lib import *
from cooking import steel

def extrude_poly(bm, pts, x0, x1, mi=0):
    """مضلع محدّب في المستوى (y,z) يُسحب بين x0 و x1"""
    a = [bm.verts.new((x0, y, z)) for (y, z) in pts]; b = [bm.verts.new((x1, y, z)) for (y, z) in pts]
    n = len(pts)
    fs = [bm.faces.new(list(reversed(a))), bm.faces.new(b)]
    for i in range(n): fs.append(bm.faces.new((a[i], a[(i+1) % n], b[(i+1) % n], b[i])))
    for f in fs: f.material_index = mi

def prism_xz(bm, pts, y0, y1, mi=0):
    """مضلع في المستوى (x,z) يُسحب بين y0 و y1"""
    a = [bm.verts.new((x, y0, z)) for (x, z) in pts]; b = [bm.verts.new((x, y1, z)) for (x, z) in pts]
    n = len(pts)
    fs = [bm.faces.new(a), bm.faces.new(list(reversed(b)))]
    for i in range(n): fs.append(bm.faces.new((a[i], b[i], b[(i+1) % n], a[(i+1) % n])))
    for f in fs: f.material_index = mi

def lathe_y(bm, c, profile, seg=20, mi=0):
    """مخرطة حول المحور Y: profile = [(r, y)…]"""
    rings = [[bm.verts.new((c[0]+math.cos(2*math.pi*i/seg)*r, c[1]+y, c[2]+math.sin(2*math.pi*i/seg)*r)) for i in range(seg)] for (r, y) in profile]
    fs = []
    for k in range(len(rings)-1):
        for i in range(seg):
            j = (i+1) % seg
            fs.append(bm.faces.new((rings[k][i], rings[k+1][i], rings[k+1][j], rings[k][j])))
    if profile[0][0] > 1e-6: fs.append(bm.faces.new(rings[0]))
    if profile[-1][0] > 1e-6: fs.append(bm.faces.new(list(reversed(rings[-1]))))
    for f in fs: f.material_index = mi

def tube(bm, pts, r, seg=6, mi=0):
    """أنبوب رفيع على خط متعدد النقاط (أسلاك الخفّاقة)"""
    for p, q in zip(pts[:-1], pts[1:]):
        d = Vector(q) - Vector(p); L = d.length
        if L < 1e-6: continue
        rot = d.to_track_quat('Z', 'Y').to_matrix()
        bm_cyl(bm, p, r, L, seg, mi, None, rot)

def build(C):
    E = C['EQUIPMENT']
    st = steel(); st_dark = mat('MAT_tool_steel_dark', '#8c9399', 0.3, 1.0)
    wood = mat('MAT_wood_tool', '#b07a45', 0.55); proc_color(wood, 'wave', 30.0, '#8a5a2e', '#c08a54', bump=0.05, stretch=(0.05, 1, 1))
    black = mat('MAT_tool_black', '#16171a', 0.5, 0.2); blade = mat('MAT_knife_blade', '#d3d7dc', 0.18, 1.0)
    hdl = mat('MAT_knife_handle', '#231812', 0.5)
    ROLL = math.pi/2; Z0 = 0.91

    # ── سكين الطاهي ──
    bm = bmesh.new()
    extrude_poly(bm, [(0.065, 0.024), (0.19, 0.024), (0.25, 0.014), (0.275, -0.004), (0.24, -0.019), (0.15, -0.027), (0.065, -0.024)], -0.0018, 0.0018, 0)
    bm_box(bm, (0, 0.067, 0.0), (0.011, 0.012, 0.05), 0)
    for k in (-1, 0, 1): bm_box(bm, (0, k*0.026-0.004, 0.0), (0.0145, 0.026, 0.03-abs(k)*0.002), 2)
    for yy in (-0.03, -0.004, 0.022): bm_cyl(bm, (-0.0075, yy, 0.0), 0.0032, 0.015, 10, 0, None, Matrix.Rotation(math.pi/2, 3, 'Y'))
    new_obj('tool_knife', bm, [blade, st, hdl], E, (-0.50, -0.78, Z0+0.0085), (0, ROLL, 0.0), smooth=False)

    # ── مقشرة (Y) ──
    bm = bmesh.new()
    lathe_y(bm, (0, 0, 0), [(0.0, -0.075), (0.008, -0.074), (0.0105, -0.05), (0.0105, 0.02), (0.008, 0.04), (0.0, 0.041)], 14, 2)
    bm_box(bm, (0, 0.06, 0.0), (0.006, 0.04, 0.012), 0)
    for sx in (-0.021, 0.021): bm_box(bm, (sx, 0.10, 0.0), (0.004, 0.06, 0.012), 0)
    bm_box(bm, (0, 0.13, 0.0), (0.046, 0.006, 0.012), 0)
    bm_box(bm, (0, 0.1, -0.001), (0.036, 0.034, 0.0015), 1)
    new_obj('tool_peeler', bm, [st, blade, black], E, (-0.38, -0.80, Z0+0.008), (0, 0, 0.0))

    # ── هراسة بطاطس ──
    bm = bmesh.new()
    lathe_y(bm, (0, 0, 0), [(0.0, -0.12), (0.011, -0.118), (0.014, -0.06), (0.011, 0.0), (0.0085, 0.06), (0.0, 0.065)], 16, 0)
    bm_cyl(bm, (0, 0.06, 0), 0.0035, 0.1, 8, 1, None, Matrix.Rotation(-math.pi/2, 3, 'X'))
    bm_box(bm, (0, 0.165, 0), (0.07, 0.006, 0.006), 1)
    for k in range(-4, 5): bm_box(bm, (k*0.0085, 0.175, 0.0), (0.004, 0.014, 0.07), 1)
    bm_box(bm, (0, 0.18, 0.0), (0.075, 0.004, 0.004), 1)
    new_obj('tool_masher', bm, [wood, st_dark], E, (-0.26, -0.82, Z0+0.037), (0, 0, 0.0))

    # ── خفّاقة ──
    bm = bmesh.new()
    lathe_y(bm, (0, 0, 0), [(0.0, -0.11), (0.009, -0.109), (0.013, -0.06), (0.012, 0.02), (0.008, 0.04), (0.0, 0.041)], 16, 1)
    for k in range(9):
        ph = k*math.pi/9; cx, cz = math.cos(ph), math.sin(ph)
        up = []; dn = []
        for i in range(0, 13):
            s = i/12; y = 0.04 + 0.17*s; r = 0.034*(math.sin(math.pi*min(1.0, s*1.05))**0.75)
            up.append((cx*r, y, cz*r)); dn.append((-cx*r, y, -cz*r))
        tube(bm, up + list(reversed(dn)), 0.0011, 5, 0)
    new_obj('tool_whisk', bm, [st, black], E, (0.55, -0.82, Z0+0.034), (0, 0, 0.0))

    # ── ملعقة خشبية ──
    bm = bmesh.new()
    lathe_y(bm, (0, 0, 0), [(0.0, -0.14), (0.006, -0.139), (0.0075, -0.1), (0.0095, -0.04), (0.008, 0.06), (0.0065, 0.12), (0.0, 0.125)], 14, 0)
    prof = [(math.sin(a), -math.cos(a)) for a in [i*math.pi/2/8 for i in range(0, 9)]]
    bm_lathe(bm, (0, 0.17, 0.005), prof, 20, 0, (0.028, 0.045, 0.02))
    new_obj('tool_spoon', bm, [wood], E, (0.70, -0.82, Z0+0.0105), (0, 0, 0.0), smooth=True)

    # ── مجرفة (قلاّبة) ──
    bm = bmesh.new()
    lathe_y(bm, (0, 0, 0), [(0.0, -0.13), (0.0055, -0.129), (0.008, -0.08), (0.0105, -0.02), (0.0075, 0.05), (0.0055, 0.09), (0.0, 0.092)], 14, 0)
    bm_box(bm, (0, 0.115, -0.006), (0.012, 0.05, 0.004), 1)
    bm_box(bm, (0, 0.2, -0.014), (0.078, 0.11, 0.003), 1)
    for sx in (-0.022, 0.0, 0.022): bm_box(bm, (sx, 0.21, -0.0125), (0.006, 0.07, 0.0036), 2)
    new_obj('tool_spatula', bm, [wood, black, mat('MAT_tool_slot', '#07080a', 0.6)], E, (0.83, -0.82, Z0+0.016), (0, 0, 0.0))

    # ── مبشرة مسطحة ──
    bm = bmesh.new()
    bm_box(bm, (0, 0.07, 0.0), (0.085, 0.2, 0.004), 0)
    for r in range(13):
        for c in range(5):
            bm_cyl(bm, (-0.032+c*0.016+(0.008 if r % 2 else 0)*0.0, -0.01+r*0.0145, 0.002), 0.0038, 0.0035, 6, 1, 0.0006)
    bm_box(bm, (0, -0.075, 0.0), (0.022, 0.1, 0.018), 2)
    bm_box(bm, (0, -0.02, 0.0), (0.05, 0.012, 0.01), 0)
    new_obj('tool_grater', bm, [st, st_dark, black], E, (0.96, -0.70, Z0+0.0025), (0, 0, 0.0))

    # ── زجاجة زيت (يقف قائمًا؛ الأصل منتصف الجسم) ──
    glass = mat('MAT_oil_glass', '#d9b53b', 0.12, 0.0); lab = mat('MAT_oil_label', '#e9e2cc', 0.7); cap = mat('MAT_oil_cap', '#c41f1a', 0.4)
    bm = bmesh.new()
    bm_lathe(bm, (0, 0, 0), [(0.0, -0.13), (0.04, -0.13), (0.044, -0.12), (0.046, -0.08), (0.046, 0.05), (0.04, 0.08), (0.021, 0.105), (0.0155, 0.115), (0.0155, 0.127), (0.0, 0.127)], 28, 0)
    bm_lathe(bm, (0, 0, 0), [(0.0468, -0.07), (0.0468, 0.02)], 28, 1) if False else None
    bm_lathe(bm, (0, 0, 0), [(0.0463, -0.075), (0.0467, -0.074), (0.0467, 0.025), (0.0463, 0.026)], 28, 1)
    bm_lathe(bm, (0, 0, 0), [(0.0155, 0.12), (0.0185, 0.121), (0.0185, 0.15), (0.017, 0.153), (0.0, 0.153)], 20, 2)
    new_obj('tool_bottle_oil', bm, [glass, lab, cap], E, (-1.30, 0.38, Z0+0.13), (0, 0, 0.0), smooth=True)

    # ── علبة حليب ──
    bm = bmesh.new()
    milk = mat('MAT_milk_carton', '#f3f4f6', 0.55); blue = mat('MAT_milk_blue', '#2f6fd1', 0.5); cow = mat('MAT_milk_cap', '#2a6fd0', 0.4)
    bm_box(bm, (0, 0, -0.03), (0.07, 0.07, 0.16), 0)
    bm_box(bm, (0, 0, -0.045), (0.0716, 0.0716, 0.05), 1)
    prism_xz(bm, [(-0.035, 0.05), (0.035, 0.05), (0.0, 0.095)], -0.035, 0.035, 0)
    bm_cyl(bm, (0.015, 0, 0.07), 0.009, 0.014, 10, 2)
    new_obj('tool_carton_milk', bm, [milk, blue, cow], E, (-1.20, 0.38, Z0+0.11), (0, 0, 0.0))

    # ── مملحة/علب توابل ──
    def shaker(name, x, y, content, capcol, lab_col):
        gl = mat('MAT_shaker_glass', '#dfe8ee', 0.08, 0.0); ct = mat(f'MAT_shaker_{name}_content', content, 0.9); cp = mat(f'MAT_shaker_{name}_cap', capcol, 0.35, 0.6); lb = mat(f'MAT_shaker_{name}_label', lab_col, 0.7)
        bm = bmesh.new()
        bm_lathe(bm, (0, 0, 0), [(0.0, -0.06), (0.032, -0.06), (0.034, -0.055), (0.034, 0.035), (0.03, 0.04), (0.0, 0.04)], 24, 0)
        bm_lathe(bm, (0, 0, 0), [(0.0, -0.056), (0.031, -0.056), (0.031, 0.026), (0.0, 0.026)], 24, 1)
        bm_lathe(bm, (0, 0, 0), [(0.0306, 0.038), (0.0338, 0.04), (0.0338, 0.062), (0.03, 0.066), (0.0, 0.066)], 24, 2)
        bm_lathe(bm, (0, 0, 0), [(0.0346, -0.04), (0.0346, 0.01)], 24, 3) if False else None
        bm_lathe(bm, (0, 0, 0), [(0.0343, -0.035), (0.0347, -0.034), (0.0347, 0.012), (0.0343, 0.013)], 24, 3)
        for k in range(7):
            a = 2*math.pi*k/7
            bm_cyl(bm, (math.cos(a)*0.014*(1 if k else 0), math.sin(a)*0.014*(1 if k else 0), 0.0662), 0.0026, 0.001, 8, 1)
        new_obj(name, bm, [gl, ct, cp, lb], E, (x, y, Z0+0.06), (0, 0, 0.0), smooth=True)
    shaker('tool_shaker_salt', -1.55, 0.38, '#f6f6f2', '#a7adb3', '#e5eaf0')
    shaker('tool_shaker_cumin', -1.46, 0.38, '#8a5a2b', '#c9792a', '#e9a23a')
    shaker('tool_shaker_sugar', -1.37, 0.38, '#fbf8ec', '#2f6fd1', '#e8f0fb')
