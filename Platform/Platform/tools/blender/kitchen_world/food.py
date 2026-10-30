"""مكوّنات الطعام كقطع مفردة بألوان رؤوس (vertex colors) في كل حالاتها: كاملة، مقشّرة، وقطع القطع (شرائح/مكعبات/أعواد/مفروم/مبشور/مهروس).
مادة واحدة مشتركة (MAT_food) فتُرسم كل مجموعة نسخ بنداء واحد؛ لون الحالة (نضج/تحمير/حرق) يضربه المشهد وقت التشغيل.
الأسماء في GLB: food_<slug> · food_<slug>_peeled · cut_<shape>_<slug>  (shape: slices cubes diced sticks minced grated mashed)."""
from lib import *
import items
import mathutils.noise as MN

def lin(h): return srgb(h)

# إعدادات كل مكوّن: skin/flesh/core ألوان؛ r نصف قطر المقطع العرضي؛ el استطالة؛ cube/dice حجم بالمتر؛ stick (عرض، طول)
FOOD = {
  'potato':   dict(skin='#c8a465', flesh='#efe0a6', core=None,      r=0.034, el=1.25, t=0.0065, cube=0.017, stick=(0.010, 0.05), peel=True),
  'onion':    dict(skin='#b9772e', flesh='#f3ecdc', core='#e9e0cc', r=0.040, el=1.0,  t=0.005,  cube=0.014, stick=(0.008, 0.04), peel=True, rings=True),
  'tomato':   dict(skin='#c8261b', flesh='#d9463a', core='#e9c55a', r=0.037, el=1.0,  t=0.0065, cube=0.016, stick=(0.009, 0.04), peel=False, seeds=True),
  'carrot':   dict(skin='#e8761d', flesh='#f28b25', core='#f4a64a', r=0.016, el=1.0,  t=0.005,  cube=0.014, stick=(0.009, 0.05), peel=True),
  'cucumber': dict(skin='#2f6b2b', flesh='#cfe2a4', core='#e6f0c8', r=0.029, el=1.0,  t=0.006,  cube=0.015, stick=(0.010, 0.05), peel=True, seeds=True),
  'eggplant': dict(skin='#2a1236', flesh='#e6e2b6', core='#d9d29a', r=0.034, el=1.0,  t=0.007,  cube=0.017, stick=(0.010, 0.05), peel=True),
  'lemon':    dict(skin='#e8d02a', flesh='#f4e68c', core='#f9f0b8', r=0.030, el=1.0,  t=0.006,  cube=0.014, stick=(0.009, 0.04), peel=True, wedge=True),
  'banana':   dict(skin='#e6c528', flesh='#f7efc6', core='#efe3a8', r=0.018, el=1.0,  t=0.009,  cube=0.014, stick=(0.012, 0.05), peel=True),
  'garlic':   dict(skin='#eadcd6', flesh='#f6f0d6', core=None,      r=0.011, el=1.0,  t=0.003,  cube=0.006, stick=(0.004, 0.02), peel=True),
  'ginger':   dict(skin='#c9a064', flesh='#e5c978', core=None,      r=0.012, el=1.0,  t=0.003,  cube=0.007, stick=(0.005, 0.025), peel=True),
  'egg':      dict(skin='#e9dcc0', flesh='#fbf6e8', core='#f1c232', r=0.022, el=0.9,  t=0.007,  cube=0.012, stick=(0.008, 0.03), peel=True, yolk=True),
  'coriander':dict(skin='#3f7a2c', flesh='#4d8f35', core=None,      r=0.01,  el=1.0,  t=0.002,  cube=0.006, stick=(0.004, 0.02), peel=False),
  'green_beans': dict(skin='#4f8a2f', flesh='#a5cd6c', core='#cfe59a', r=0.0045, el=1.0, t=0.03, cube=0.008, stick=(0.007, 0.03), peel=False),
  'toast':    dict(skin='#c68a43', flesh='#f0daa0', core=None,      r=0.04,  el=1.0,  t=0.006,  cube=0.017, stick=(0.012, 0.06), peel=False),
  'cheese':   dict(skin='#f0c02a', flesh='#f4cc45', core=None,      r=0.04,  el=1.0,  t=0.003,  cube=0.014, stick=(0.008, 0.045), peel=False),
  'chicken':  dict(skin='#e8b5a0', flesh='#efc1ad', core='#f6dccf', r=0.03,  el=1.3,  t=0.008,  cube=0.018, stick=(0.012, 0.05), peel=False),
  'oats':     dict(skin='#d9c9a0', flesh='#e8dcb8', core=None,      r=0.01,  el=1.0,  t=0.002,  cube=0.006, stick=(0.004, 0.02), peel=False),
  'rice':     dict(skin='#f4f0e4', flesh='#f8f5ec', core=None,      r=0.004, el=1.0,  t=0.002,  cube=0.004, stick=(0.003, 0.01), peel=False),
  'honey':    dict(skin='#e0a421', flesh='#e8b43a', core=None,      r=0.02,  el=1.0,  t=0.01,   cube=0.01,  stick=(0.006, 0.03), peel=False),
  'yogurt':   dict(skin='#f6f4ee', flesh='#faf8f2', core=None,      r=0.02,  el=1.0,  t=0.01,   cube=0.01,  stick=(0.006, 0.03), peel=False),
  'tomato_paste': dict(skin='#b8281d', flesh='#c4372b', core=None,  r=0.02,  el=1.0,  t=0.01,   cube=0.01,  stick=(0.006, 0.03), peel=False),
}
SHAPES = ['slices', 'cubes', 'diced', 'sticks', 'minced', 'grated', 'mashed']

_layer = {}
def food_mat():
    m = bpy.data.materials.get('MAT_food')
    if m: return m
    m = bpy.data.materials.new('MAT_food'); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF'); b.inputs['Roughness'].default_value = 0.6; b.inputs['Metallic'].default_value = 0.0
    vc = m.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    m.node_tree.links.new(vc.outputs['Color'], b.inputs['Base Color'])
    return m

def _noise(p, k=1.0, seed=0):
    return MN.noise(Vector((p[0]*k+seed*3.7, p[1]*k+seed*1.3, p[2]*k+seed*2.1)))

def paint(bm, colorfn, var=0.07, seed=0):
    """يلوّن كل وجه: colorfn(face, center) -> hex أو (r,g,b) خطي؛ مع تباين ضجيجي طفيف"""
    lay = bm.loops.layers.float_color.get('Col') or bm.loops.layers.float_color.new('Col')
    for f in bm.faces:
        c = f.calc_center_median()
        col = colorfn(f, c)
        if isinstance(col, str): col = lin(col)
        k = 1.0 + _noise(c, 90.0, seed)*var*2.0
        for lp in f.loops: lp[lay] = (min(1, col[0]*k), min(1, col[1]*k), min(1, col[2]*k), 1.0)

def _mat_colors(mats):
    out = []
    for m in mats:
        b = m.node_tree.nodes.get('Principled BSDF'); c = b.inputs['Base Color'].default_value
        out.append((c[0], c[1], c[2]))
    return out

def to_ground(bm):
    lo = min(v.co.z for v in bm.verts)
    for v in bm.verts: v.co.z -= lo

def center(bm):
    xs = [v.co for v in bm.verts]
    c = sum(xs, Vector()) / len(xs)
    for v in bm.verts: v.co -= c

# ───── قطع كاملة ─────
def _whole_from_builder(slug, seed, peeled, cfg):
    fn, ms = items.BUILDERS[slug]; mats = [items.M(*m) for m in ms]
    cols = _mat_colors(mats)
    bm = bmesh.new(); random.seed(seed)
    fn(bm, (0, 0, 0), 0.0, mats, 1.0, seed)
    to_ground(bm); center(bm)
    flesh = lin(cfg['flesh'])
    def cf(f, c):
        i = f.material_index; col = cols[min(i, len(cols)-1)]
        if peeled and i == 0: return flesh
        return col
    paint(bm, cf, 0.08, seed)
    return bm

def _slab(bm, w, d, t, nx=8, ny=8):
    """لوح مستطيل مقسّم (للتوست والجبن)"""
    verts = [[bm.verts.new((-w/2+w*i/nx, -d/2+d*j/ny, 0)) for j in range(ny+1)] for i in range(nx+1)]
    top = [[bm.verts.new((-w/2+w*i/nx, -d/2+d*j/ny, t)) for j in range(ny+1)] for i in range(nx+1)]
    for i in range(nx):
        for j in range(ny):
            bm.faces.new((top[i][j], top[i+1][j], top[i+1][j+1], top[i][j+1]))
            bm.faces.new((verts[i][j+1], verts[i+1][j+1], verts[i+1][j], verts[i][j]))
    for i in range(nx):
        bm.faces.new((verts[i][0], verts[i+1][0], top[i+1][0], top[i][0])); bm.faces.new((verts[i+1][ny], verts[i][ny], top[i][ny], top[i+1][ny]))
    for j in range(ny):
        bm.faces.new((verts[0][j+1], verts[0][j], top[0][j], top[0][j+1])); bm.faces.new((verts[nx][j], verts[nx][j+1], top[nx][j+1], top[nx][j]))

def whole(slug, peeled=False, seed=3):
    cfg = FOOD[slug]
    if slug in items.BUILDERS and slug not in ('toast', 'cheese', 'chicken'):
        return _whole_from_builder(slug, seed, peeled, cfg)
    bm = bmesh.new()
    if slug == 'toast':
        _slab(bm, 0.10, 0.10, 0.012, 10, 10)
        # قطع علوي مبسّط: الخبز يتقوّس عند الكتفين
        for v in bm.verts:
            if v.co.y > 0.035: v.co.x *= 1.0 + (v.co.y-0.035)*1.6
        crust, crumb = lin(cfg['skin']), lin(cfg['flesh'])
        paint(bm, lambda f, c: crust if (abs(c.x) > 0.043 or abs(c.y) > 0.043 or abs(f.normal.z) < 0.5) else crumb, 0.05, seed)
    elif slug == 'cheese':
        _slab(bm, 0.095, 0.095, 0.0035, 4, 4)
        paint(bm, lambda f, c: cfg['skin'] if abs(f.normal.z) > 0.5 else '#d9a91f', 0.04, seed)
    elif slug == 'chicken':
        vs = items._sphere(bm, 0.045, 14, 9, (1.3, 0.9, 0.55), 0.12, seed, 0)
        flesh, pale = lin(cfg['skin']), lin(cfg['core'])
        paint(bm, lambda f, c: flesh if _noise(c, 40, 5) > -0.1 else pale, 0.1, seed)
    elif slug == 'oats':
        items._sphere(bm, 0.006, 8, 5, (1.6, 1.0, 0.25), 0.15, seed, 0); paint(bm, lambda f, c: cfg['skin'] if c.z > 0 else cfg['flesh'], 0.12, seed)
    elif slug == 'rice':
        items._sphere(bm, 0.0035, 6, 4, (1.9, 0.75, 0.75), 0.0, seed, 0); paint(bm, lambda f, c: cfg['skin'], 0.04, seed)
    else:  # honey / yogurt / tomato_paste: قطرة مقبّبة
        prof = [(0.0, 0.0), (0.030, 0.0), (0.034, 0.004), (0.030, 0.012), (0.018, 0.020), (0.008, 0.026), (0.0, 0.028)]
        bm_lathe(bm, (0, 0, 0), prof, 14, 0)
        for v in bm.verts:
            d = _noise(v.co, 30, seed); v.co.x *= 1+d*0.12; v.co.y *= 1+d*0.12
        paint(bm, lambda f, c: cfg['flesh'] if c.z > 0.016 else cfg['skin'], 0.05, seed)
    center(bm)
    return bm

# ───── قطع القطع ─────
def disc(slug, cfg, seed=1):
    """شريحة: قرص بحلقات ألوان (قشرة/لحم/لبّ/بذور/حلقات بصل)"""
    r, t, el = cfg['r'], cfg['t'], cfg.get('el', 1.0); seg, rings = 18, 5
    skin, flesh = lin(cfg['skin']), lin(cfg['flesh']); core = lin(cfg['core']) if cfg.get('core') else None
    bm = bmesh.new()
    def ring(z, rf): return [bm.verts.new((math.cos(2*math.pi*k/seg)*r*rf*el, math.sin(2*math.pi*k/seg)*r*rf, z)) for k in range(seg)]
    top = [ring(t/2, (i+0.5)/rings if i == 0 else i/rings) for i in range(rings+1)]
    bot = [ring(-t/2, (i+0.5)/rings if i == 0 else i/rings) for i in range(rings+1)]
    tag = {}
    def quad(vs, kind, rf, th):
        f = bm.faces.new(vs); tag[f.index if f.index >= 0 else id(f)] = (kind, rf, th); f.tag = False
        return f
    faces = []
    for i in range(rings):
        for k in range(seg):
            k2 = (k+1) % seg; rf = (i+0.5)/rings; th = 2*math.pi*(k+0.5)/seg
            faces.append((bm.faces.new((top[i][k], top[i][k2], top[i+1][k2], top[i+1][k])), rf, th))
            faces.append((bm.faces.new((bot[i][k2], bot[i][k], bot[i+1][k], bot[i+1][k2])), rf, th))
    # مركز
    faces.append((bm.faces.new(list(top[0])), 0.0, 0.0)); faces.append((bm.faces.new(list(reversed(bot[0]))), 0.0, 0.0))
    side = []
    for k in range(seg):
        k2 = (k+1) % seg; side.append(bm.faces.new((bot[rings][k], bot[rings][k2], top[rings][k2], top[rings][k])))
    cmap = {}
    for f, rf, th in faces: cmap[f] = (rf, th)
    def cf(f, c):
        if f in cmap:
            rf, th = cmap[f]
            if rf > 0.88: return skin if cfg.get('peel', False) or slug in ('tomato', 'cucumber', 'eggplant', 'lemon', 'banana', 'egg', 'onion', 'potato', 'carrot') else flesh
            if cfg.get('rings') and 0.1 < rf: return flesh if int(rf*9) % 2 == 0 else core
            if cfg.get('yolk'): return core if rf < 0.5 else flesh
            if cfg.get('seeds') and core and rf < 0.62 and (int(th/(2*math.pi)*5) % 2 == 0): return core
            if cfg.get('wedge') and core: return core if int(th/(2*math.pi)*12) % 2 == 0 else flesh
            if core and rf < 0.3: return core
            return flesh
        return skin
    paint(bm, cf, 0.06, seed)
    return bm

def cube(slug, cfg, s, seed=1, long=None):
    """مكعب/عود: وجه واحد بلون القشرة والباقي بلون اللحم"""
    sx, sy, sz = (s, s, s) if long is None else (s, s, long)
    bm = bmesh.new(); bm_box(bm, (0, 0, 0), (sx, sy, sz), 0)
    for v in bm.verts:
        d = _noise(v.co, 120, seed); v.co += Vector((d*sx*0.08, d*sy*0.08, d*sz*0.05))
    skin, flesh = lin(cfg['skin']), lin(cfg['flesh'])
    skin_face = cfg.get('peel') or slug in ('tomato', 'toast', 'cucumber')
    paint(bm, lambda f, c: skin if (skin_face and f.normal.x > 0.7) else flesh, 0.08, seed)
    return bm

def crumb(slug, cfg, s, seed=1, flat=1.0):
    bm = bmesh.new()
    items._sphere(bm, s, 5, 3, (1.0, 0.8, 0.6*flat), 0.35, seed, 0)
    flesh = lin(cfg['flesh']); skin = lin(cfg['skin'])
    paint(bm, lambda f, c: skin if (cfg.get('peel') and _noise(c, 300, 9) > 0.35) else flesh, 0.10, seed)
    return bm

def shred(slug, cfg, seed=1):
    bm = bmesh.new(); bm_box(bm, (0, 0, 0), (0.0018, 0.022, 0.0018), 0)
    for v in bm.verts: v.co.x += math.sin(v.co.y*220)*0.001
    flesh = lin(cfg['flesh']); paint(bm, lambda f, c: flesh, 0.1, seed); return bm

def mash(slug, cfg, seed=1):
    bm = bmesh.new(); items._sphere(bm, 0.016, 9, 6, (1.0, 1.0, 0.5), 0.22, seed, 0)
    flesh, skin = lin(cfg['flesh']), lin(cfg['skin'])
    paint(bm, lambda f, c: skin if (cfg.get('peel') and _noise(c, 200, 4) > 0.45) else flesh, 0.10, seed); return bm

def cut_piece(shape, slug, seed=1):
    cfg = FOOD[slug]
    if slug in ('oats', 'rice', 'honey', 'yogurt', 'tomato_paste'): return None
    if shape == 'slices': bm = disc(slug, cfg, seed) if slug != 'green_beans' else cube(slug, cfg, 0.007, seed, 0.03)
    elif shape == 'cubes': bm = cube(slug, cfg, cfg['cube'], seed)
    elif shape == 'diced': bm = cube(slug, cfg, cfg['cube']*0.55, seed)
    elif shape == 'sticks': bm = cube(slug, cfg, cfg['stick'][0], seed, cfg['stick'][1])
    elif shape == 'minced': bm = crumb(slug, cfg, 0.0035, seed)
    elif shape == 'grated': bm = shred(slug, cfg, seed)
    else: bm = mash(slug, cfg, seed)
    center(bm); return bm

def _activate(o):
    ca = o.data.color_attributes
    if 'Col' in ca.keys():
        ca.active_color = ca['Col']; ca.default_color_name = 'Col'
    return o

def build(C):
    """كل القطع كائنات على شبكة عرض (للمعاينة)؛ التصدير يقرأ الأسماء"""
    col = C['FOOD']; m = food_mat(); x = 0
    names = []
    for slug in FOOD:
        row = 0
        bm = whole(slug, False); _activate(new_obj(f'food_{slug}', bm, [m], col, (x, row, 0.0), smooth=True)); names.append(f'food_{slug}'); row += 0.16
        if FOOD[slug].get('peel'):
            bm = whole(slug, True); _activate(new_obj(f'food_{slug}_peeled', bm, [m], col, (x, row, 0.0), smooth=True)); names.append(f'food_{slug}_peeled'); row += 0.16
        for sh in SHAPES:
            bm = cut_piece(sh, slug)
            if bm is None: continue
            _activate(new_obj(f'cut_{sh}_{slug}', bm, [m], col, (x, row, 0.0), smooth=(sh in ('mashed', 'minced')))); names.append(f'cut_{sh}_{slug}'); row += 0.07
        x += 0.28
    return names
