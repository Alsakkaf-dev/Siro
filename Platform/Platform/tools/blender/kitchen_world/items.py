"""بناة العناصر: الخضار والأطعمة والأوعية (مقياس حقيقي بالمتر). كل باني يضيف هندسة إلى bm عند الموضع c بدوران z
ويستعمل فهارس المواد من القائمة التي تُمرَّر (mats[i])."""
from lib import *
import mathutils.noise as MN

def M(name, hexcol, rough=0.5, metal=0.0, **kw):
    return mat(name, hexcol, rough, metal, **kw)

def _xf(bm, verts_from, c, rz, s=1.0, tilt=0.0):
    rot = Matrix.Rotation(rz, 3, 'Z') @ Matrix.Rotation(tilt, 3, 'X')
    for v in verts_from:
        v.co = rot @ (v.co * s) + Vector(c)

def _sphere(bm, r, seg=16, ring=10, squash=(1, 1, 1), noise=0.0, seed=0, mi=0):
    prof = []
    for k in range(ring+1):
        a = math.pi*k/ring
        prof.append((max(math.sin(a)*r, 0.0), -math.cos(a)*r))
    n0 = len(bm.verts)
    bm_lathe(bm, (0, 0, 0), prof, seg, mi, squash)
    vs = bm.verts[n0:]
    if noise: 
        for v in vs:
            d = MN.noise(v.co*(12.0/max(r, 1e-3)*0.06) + Vector((seed*3.1, seed*1.7, seed*2.3)))
            v.co += v.co.normalized()*(d*noise*r) if v.co.length > 1e-6 else Vector()
    return vs

def tomato(bm, c, rz, mats, s=1.0, seed=0):
    vs = _sphere(bm, 0.038, 18, 12, (1.0, 1.0, 0.82), 0.04, seed, 0)
    # قمع أخضر
    n0 = len(bm.verts)
    for i in range(5):
        a = 2*math.pi*i/5
        bm_cyl(bm, (math.cos(a)*0.004, math.sin(a)*0.004, 0.030), 0.002, 0.014, 4, 1, 0.0005, Matrix.Rotation(0.9, 3, 'Y') @ Matrix.Rotation(a, 3, 'Z') if False else None)
    vs += bm.verts[n0:]
    _xf(bm, vs, c, rz, s); return 0.04
def onion(bm, c, rz, mats, s=1.0, seed=0):
    prof = [(0.0, -0.034), (0.022, -0.032), (0.040, -0.014), (0.044, 0.008), (0.034, 0.030), (0.016, 0.050), (0.004, 0.066), (0.0, 0.07)]
    n0 = len(bm.verts); bm_lathe(bm, (0, 0, 0), prof, 16, 0)
    vs = bm.verts[n0:]
    for v in vs:
        d = MN.noise(v.co*60 + Vector((seed, 2*seed, 3*seed))); v.co.x *= 1+d*0.04; v.co.y *= 1+d*0.04
    n1 = len(bm.verts)
    for i in range(6):
        a = 2*math.pi*i/6; bm_cyl(bm, (math.cos(a)*0.004, math.sin(a)*0.004, -0.036), 0.0006, 0.010, 3, 1)
    vs += bm.verts[n1:]
    _xf(bm, vs, c, rz, s); return 0.04
def potato(bm, c, rz, mats, s=1.0, seed=0):
    vs = _sphere(bm, 0.04, 14, 9, (1.3, 0.95, 0.82), 0.10, seed, 0)
    _xf(bm, vs, c, rz, s, 0.1*seed % 0.4); return 0.034
def carrot(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_cyl(bm, (0, 0, 0), 0.016, 0.17, 10, 0, 0.0012)
    vs = bm.verts[n0:]
    n1 = len(bm.verts)
    for i in range(4):
        a = 2*math.pi*i/4; bm_cyl(bm, (math.cos(a)*0.005, math.sin(a)*0.005, 0.165), 0.0025, 0.07, 5, 1, 0.0008)
    vs += bm.verts[n1:]
    rot = Matrix.Rotation(math.pi/2, 3, 'Y')
    for v in vs: v.co = rot @ v.co
    _xf(bm, vs, c, rz, s); return 0.017
def cucumber(bm, c, rz, mats, s=1.0, seed=0):
    prof = [(0.0, 0.0), (0.014, 0.004), (0.026, 0.02), (0.030, 0.06), (0.030, 0.17), (0.027, 0.21), (0.018, 0.23), (0.0, 0.235)]
    n0 = len(bm.verts); bm_lathe(bm, (0, 0, -0.1175), prof, 14, 0)
    vs = bm.verts[n0:]; rot = Matrix.Rotation(math.pi/2, 3, 'Y')
    for v in vs: v.co = rot @ v.co
    _xf(bm, vs, c, rz, s); return 0.03
def eggplant(bm, c, rz, mats, s=1.0, seed=0):
    prof = [(0.0, 0.0), (0.030, 0.004), (0.046, 0.04), (0.050, 0.09), (0.040, 0.15), (0.026, 0.195), (0.018, 0.215), (0.0, 0.222)]
    n0 = len(bm.verts); bm_lathe(bm, (0, 0, -0.11), prof, 18, 0); vs = bm.verts[n0:]
    n1 = len(bm.verts)
    for i in range(6):
        a = 2*math.pi*i/6; bm_cyl(bm, (math.cos(a)*0.012, math.sin(a)*0.012, 0.095), 0.004, 0.02, 4, 1, 0.001)
    bm_cyl(bm, (0, 0, 0.105), 0.007, 0.03, 6, 1, 0.005)
    vs += bm.verts[n1:]; rot = Matrix.Rotation(math.pi/2, 3, 'Y')
    for v in vs: v.co = rot @ v.co
    _xf(bm, vs, c, rz, s); return 0.05
def lemon(bm, c, rz, mats, s=1.0, seed=0):
    prof = [(0.0, -0.045), (0.008, -0.040), (0.024, -0.026), (0.034, 0.0), (0.024, 0.026), (0.008, 0.040), (0.0, 0.046)]
    n0 = len(bm.verts); bm_lathe(bm, (0, 0, 0), prof, 16, 0); vs = bm.verts[n0:]
    rot = Matrix.Rotation(math.pi/2, 3, 'Y')
    for v in vs: v.co = rot @ v.co
    _xf(bm, vs, c, rz, s); return 0.034
def banana(bm, c, rz, mats, s=1.0, seed=0):
    segs, ring, R, arc = 14, 5, 0.12, 1.05
    rings = []
    for i in range(segs+1):
        t = i/segs; a = (t-0.5)*arc
        rad = 0.018 * (0.55 + 0.45*math.sin(math.pi*min(max(t, 0.06), 0.94)))
        cen = Vector((math.sin(a)*R, 0, (math.cos(a)-1)*R))
        tan = Vector((math.cos(a), 0, -math.sin(a))); nor = Vector((math.sin(a), 0, math.cos(a)))
        rr = []
        for k in range(5):
            th = 2*math.pi*k/5; off = nor*math.cos(th)*rad + Vector((0, 1, 0))*math.sin(th)*rad
            rr.append(bm.verts.new(cen+off))
        rings.append(rr)
    vs = [v for r in rings for v in r]
    for i in range(segs):
        for k in range(5):
            f = bm.faces.new((rings[i][k], rings[i][(k+1) % 5], rings[i+1][(k+1) % 5], rings[i+1][k])); f.material_index = 1 if (i in (0, segs-1)) else 0
    bm.faces.new(list(reversed(rings[0]))).material_index = 1; bm.faces.new(rings[-1]).material_index = 1
    _xf(bm, vs, c, rz, s); return 0.02
def garlic(bm, c, rz, mats, s=1.0, seed=0):
    prof = [(0.0, -0.018), (0.016, -0.016), (0.028, -0.002), (0.026, 0.014), (0.012, 0.030), (0.003, 0.046), (0.0, 0.05)]
    n0 = len(bm.verts); bm_lathe(bm, (0, 0, 0), prof, 12, 0); vs = bm.verts[n0:]
    _xf(bm, vs, c, rz, s); return 0.02
def ginger(bm, c, rz, mats, s=1.0, seed=0):
    vs = []
    for k, (dx, dy, r) in enumerate([(0, 0, 0.022), (0.035, 0.01, 0.018), (-0.03, -0.012, 0.017), (0.02, -0.03, 0.014), (-0.02, 0.03, 0.014)]):
        n0 = len(bm.verts); prof = [(max(math.sin(math.pi*j/6)*r, 0), -math.cos(math.pi*j/6)*r) for j in range(7)]
        bm_lathe(bm, (dx, dy, 0), prof, 10, 0, (1.3, 1, 0.9))
        vs += bm.verts[n0:]
    for v in vs:
        d = MN.noise(v.co*50+Vector((seed, 1, 2))); v.co += Vector((0, 0, d*0.006))
    _xf(bm, vs, c, rz, s); return 0.018
def coriander(bm, c, rz, mats, s=1.0, seed=0):
    vs = []
    random.seed(seed)
    for i in range(14):
        a = 2*math.pi*i/14 + random.random()*0.3; lean = 0.15 + random.random()*0.25
        n0 = len(bm.verts)
        bm_cyl(bm, (0, 0, 0), 0.0018, 0.16, 4, 0, 0.001)
        vs += bm.verts[n0:]
        for v in bm.verts[n0:]:
            v.co = Matrix.Rotation(a, 3, 'Z') @ (Matrix.Rotation(lean, 3, 'X') @ v.co)
        top = Matrix.Rotation(a, 3, 'Z') @ (Matrix.Rotation(lean, 3, 'X') @ Vector((0, 0, 0.16)))
        n1 = len(bm.verts)
        bm_lathe(bm, tuple(top), [(0.0, -0.008), (0.014, -0.004), (0.016, 0.0), (0.012, 0.006), (0.0, 0.01)], 7, 1, (1, 1, 0.6))
        vs += bm.verts[n1:]
    _xf(bm, vs, c, rz, s); return 0.01
def green_beans(bm, c, rz, mats, s=1.0, seed=0):
    vs = []
    random.seed(seed)
    for i in range(12):
        ang = random.random()*0.3; y0 = (i-6)*0.006; z0 = 0.004*random.random()
        pts = [Vector((j*0.02-0.06, y0+math.sin(j*0.8+i)*0.004, z0+math.sin(j*0.5)*0.003)) for j in range(7)]
        ring0 = None
        n0 = len(bm.verts)
        rings = []
        for p in pts:
            rr = [bm.verts.new(p+Vector((0, math.cos(2*math.pi*k/4)*0.0035, math.sin(2*math.pi*k/4)*0.0035))) for k in range(4)]
            rings.append(rr)
        for j in range(len(rings)-1):
            for k in range(4): bm.faces.new((rings[j][k], rings[j][(k+1) % 4], rings[j+1][(k+1) % 4], rings[j+1][k])).material_index = 0
        vs += bm.verts[n0:]
    _xf(bm, vs, c, rz, s); return 0.005
def egg(bm, c, rz, mats, s=1.0, seed=0):
    prof = [(0.0, -0.030), (0.012, -0.027), (0.021, -0.014), (0.0235, 0.0), (0.019, 0.016), (0.010, 0.027), (0.0, 0.031)]
    n0 = len(bm.verts); bm_lathe(bm, (0, 0, 0), prof, 12, 0); vs = bm.verts[n0:]
    _xf(bm, vs, c, rz, s); return 0.03
def bread_loaf(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts)
    bm_box(bm, (0, 0, 0.055), (0.24, 0.11, 0.11), 0)
    prof = [(0.0, 0.0), (0.050, 0.004), (0.058, 0.02), (0.050, 0.04), (0.0, 0.048)]
    bm_lathe(bm, (-0.10, 0, 0.11), prof, 12, 0, (1.0, 1.0, 1.0)); bm_lathe(bm, (0.10, 0, 0.11), prof, 12, 0)
    vs = bm.verts[n0:]
    _xf(bm, vs, c, rz, s); return 0.0
def cheese_block(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_box(bm, (0, 0, 0.03), (0.15, 0.09, 0.06), 0)
    vs = bm.verts[n0:]; _xf(bm, vs, c, rz, s); return 0.0
def chicken_piece(bm, c, rz, mats, s=1.0, seed=0):
    vs = _sphere(bm, 0.055, 14, 9, (1.4, 0.9, 0.55), 0.08, seed, 0)
    n0 = len(bm.verts); bm_cyl(bm, (0.07, 0, 0), 0.012, 0.07, 8, 1, 0.008, Matrix.Rotation(math.pi/2, 3, 'Y'))
    vs += bm.verts[n0:]
    _xf(bm, vs, c, rz, s); return 0.03

BUILDERS = {  # slug: (باني, مواد [(اسم, لون, خشونة)])
    'tomato': (tomato, [('MAT_tomato', '#c8261b', 0.35), ('MAT_green_leaf', '#3f7a2c', 0.6)]),
    'onion': (onion, [('MAT_onion', '#b9772e', 0.55), ('MAT_onion_root', '#e9dcc0', 0.8)]),
    'potato': (potato, [('MAT_potato', '#c8a465', 0.8)]),
    'carrot': (carrot, [('MAT_carrot', '#e8761d', 0.55), ('MAT_green_leaf', '#3f7a2c', 0.6)]),
    'cucumber': (cucumber, [('MAT_cucumber', '#2f6b2b', 0.4)]),
    'eggplant': (eggplant, [('MAT_eggplant', '#2a1236', 0.25), ('MAT_green_leaf', '#3f7a2c', 0.6)]),
    'lemon': (lemon, [('MAT_lemon', '#e8d02a', 0.45)]),
    'banana': (banana, [('MAT_banana', '#e6c528', 0.5), ('MAT_banana_tip', '#4a3418', 0.7)]),
    'garlic': (garlic, [('MAT_garlic', '#eadcd6', 0.7)]),
    'ginger': (ginger, [('MAT_ginger', '#c9a064', 0.75)]),
    'coriander': (coriander, [('MAT_stem', '#5a8f3a', 0.6), ('MAT_green_leaf', '#3f7a2c', 0.6)]),
    'green_beans': (green_beans, [('MAT_beans', '#4f8a2f', 0.5)]),
    'egg': (egg, [('MAT_egg', '#e9dcc0', 0.45)]),
    'toast': (bread_loaf, [('MAT_bread', '#c68a43', 0.7)]),
    'cheese': (cheese_block, [('MAT_cheese', '#f0c02a', 0.5)]),
    'chicken': (chicken_piece, [('MAT_chicken', '#e8b5a0', 0.45), ('MAT_bone', '#efe6d8', 0.6)]),
}

def build_ingredient_mesh(slug, count, spread, seed=1, jitter=0.0):
    """شبكة تحوي count نسخة موزّعة في مستطيل spread=(sx, sy) (تتكدّس بتراص بسيط)؛ تعيد (bm, مواد)"""
    fn, ms = BUILDERS[slug]; mats = [M(*m) for m in ms]
    bm = bmesh.new(); random.seed(seed*97+count)
    cols = max(1, int(round(math.sqrt(count*spread[0]/max(spread[1], 1e-6)))))
    rows = max(1, math.ceil(count/cols))
    for i in range(count):
        r, k = divmod(i, cols)
        x = (k+0.5)/cols*spread[0] - spread[0]/2 + (random.random()-0.5)*jitter
        y = (r+0.5)/rows*spread[1] - spread[1]/2 + (random.random()-0.5)*jitter
        n0 = len(bm.verts)
        fn(bm, (x, y, 0.0), random.random()*6.28, mats, 1.0+(random.random()-0.5)*0.15, i+seed)
        new = bm.verts[n0:]
        if new:
            lo = min(v.co.z for v in new)
            for v in new: v.co.z -= lo
    return bm, mats

# ───── سلع معبّأة: أكياس وزجاجات وعلب (الملصقات أحزمة بمادة ثانية بدل النسيج) ─────
def paper_sack(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_box(bm, (0, 0, 0.14), (0.20, 0.10, 0.28), 0)
    bm_box(bm, (0, 0, 0.18), (0.202, 0.102, 0.10), 1)
    bm_box(bm, (0, 0, 0.285), (0.20, 0.04, 0.02), 0)
    _xf(bm, bm.verts[n0:], c, rz, s); return 0.0
def carton(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_box(bm, (0, 0, 0.11), (0.07, 0.07, 0.22), 0); bm_box(bm, (0, 0, 0.12), (0.0715, 0.0715, 0.10), 1)
    bm_box(bm, (0, 0, 0.23), (0.07, 0.035, 0.03), 0); bm_cyl(bm, (0.015, 0, 0.245), 0.012, 0.014, 8, 2)
    _xf(bm, bm.verts[n0:], c, rz, s); return 0.0
def bottle(bm, c, rz, mats, s=1.0, seed=0):
    prof = [(0.0, 0.0), (0.034, 0.002), (0.038, 0.01), (0.038, 0.17), (0.030, 0.20), (0.014, 0.225), (0.012, 0.255), (0.0, 0.257)]
    n0 = len(bm.verts); bm_lathe(bm, (0, 0, 0), prof, 18, 0)
    bm_cyl(bm, (0, 0, 0.056), 0.0385, 0.07, 18, 1)
    bm_cyl(bm, (0, 0, 0.255), 0.0135, 0.016, 12, 2)
    _xf(bm, bm.verts[n0:], c, rz, s); return 0.0
def jar(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_cyl(bm, (0, 0, 0), 0.04, 0.10, 18, 0); bm_cyl(bm, (0, 0, 0.03), 0.0405, 0.04, 18, 1); bm_cyl(bm, (0, 0, 0.10), 0.042, 0.02, 18, 2)
    _xf(bm, bm.verts[n0:], c, rz, s); return 0.0
def can_tin(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_cyl(bm, (0, 0, 0), 0.037, 0.085, 18, 0); bm_cyl(bm, (0, 0, 0.012), 0.0375, 0.06, 18, 1)
    _xf(bm, bm.verts[n0:], c, rz, s); return 0.0
def tub(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_cyl(bm, (0, 0, 0), 0.04, 0.09, 18, 0, 0.052); bm_cyl(bm, (0, 0, 0.09), 0.054, 0.012, 18, 1)
    _xf(bm, bm.verts[n0:], c, rz, s); return 0.0
def box_goods(bm, c, rz, mats, s=1.0, seed=0):
    n0 = len(bm.verts); bm_box(bm, (0, 0, 0.12), (0.17, 0.07, 0.24), 0); bm_box(bm, (0, 0, 0.12), (0.172, 0.072, 0.11), 1)
    _xf(bm, bm.verts[n0:], c, rz, s); return 0.0

BUILDERS.update({
    'rice': (paper_sack, [('MAT_sack_kraft', '#b88a54', 0.9), ('MAT_label_rice', '#f2ead6', 0.8)]),
    'sugar': (paper_sack, [('MAT_sack_white', '#ebe7dd', 0.85), ('MAT_label_sugar', '#3a6fb0', 0.7)]),
    'milk': (carton, [('MAT_carton_white', '#f1f3f5', 0.5), ('MAT_label_milk', '#2c76c9', 0.5), ('MAT_cap_blue', '#2c76c9', 0.4)]),
    'oil': (bottle, [('MAT_glass_amber', '#b8821a', 0.12), ('MAT_label_oil', '#e9d9a8', 0.6), ('MAT_cap_black', '#1b1b1b', 0.4)]),
    'honey': (jar, [('MAT_honey', '#d9961b', 0.15), ('MAT_label_honey', '#f2e4b8', 0.6), ('MAT_cap_gold', '#c99b2c', 0.35)]),
    'cumin': (jar, [('MAT_spice_cumin', '#8a6a3a', 0.6), ('MAT_label_cumin', '#e8d9bc', 0.6), ('MAT_cap_gold', '#c99b2c', 0.35)]),
    'salt': (jar, [('MAT_spice_salt', '#e9e9e6', 0.4), ('MAT_label_salt', '#7aa9d8', 0.6), ('MAT_cap_gold', '#c99b2c', 0.35)]),
    'tomato_paste': (can_tin, [('MAT_tin', '#c9ced3', 0.3), ('MAT_label_tomato', '#b32018', 0.5)]),
    'yogurt': (tub, [('MAT_tub_white', '#f4f5f2', 0.45), ('MAT_label_yogurt', '#a8d0ec', 0.5)]),
    'oats': (box_goods, [('MAT_box_oats', '#d8c690', 0.8), ('MAT_label_oats', '#9a6a2e', 0.7)]),
})
