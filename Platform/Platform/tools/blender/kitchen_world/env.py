"""القشرة: أرضية خشب وجدران بلاط وسقف وباب وإضاءة (مرجع الصور 1 و2 و8)."""
from lib import *

W, D, H = 8.0, 6.4, 3.2
HX, HY = W/2, D/2

def build_env(C):
    random.seed(11)
    E = C['ENV']; Lc = C['LIGHTS']
    # أرضية: ألواح خشب بخمس درجات
    wood_tones = [('#8a5a32', '#4a2a14'), ('#7c4f2b', '#3d2310'), ('#946238', '#52301a'), ('#6f4626', '#37200f'), ('#a06c40', '#5a361b')]
    woods = []
    for i, (a, b) in enumerate(wood_tones):
        m = mat(f'MAT_floor_wood_{i}', a, 0.5)
        proc_color(m, 'wave', scale=34.0, c1=b, c2=a, bump=0.15, stretch=(0.06, 1.0, 1.0))
        woods.append(m)
    bm = bmesh.new(); y = -HY
    while y < HY - 0.01:
        pw = 0.14; x = -HX - random.random()*0.9
        while x < HX:
            L = 0.9 + random.random()*0.7
            x0, x1 = max(x, -HX), min(x+L, HX)
            if x1 - x0 > 0.05:
                bm_box(bm, ((x0+x1)/2, y+pw/2, -0.01), (x1-x0-0.004, pw-0.004, 0.02), random.randrange(5))
            x += L
        y += pw
    new_obj('ENV_floor', bm, woods, E)

    # جدران جصّية فوق البلاط وسقف
    plaster = mat('MAT_plaster', '#d9cbb2', 0.9); proc_color(plaster, 'noise', 3.0, '#cdbd9f', '#e3d7c0', 6, bump=0.05)
    ceil = mat('MAT_ceiling', '#eae4d8', 0.95); beam = mat('MAT_beam', '#5d6166', 0.5, 0.35)
    bm = bmesh.new()
    bm_box(bm, (0, HY+0.1, H/2), (W+0.4, 0.2, H)); bm_box(bm, (0, -HY-0.1, H/2), (W+0.4, 0.2, H))
    bm_box(bm, (HX+0.1, 0, H/2), (0.2, D, H)); bm_box(bm, (-HX-0.1, 0, H/2), (0.2, D, H))
    new_obj('ENV_walls_plaster', bm, [plaster], E)
    bm = bmesh.new(); bm_box(bm, (0, 0, H+0.025), (W+0.4, D+0.4, 0.05))
    for bx in (-3.0, -1.0, 1.0, 3.0): bm_box(bm, (bx, 0, H-0.075), (0.2, D, 0.15), 1)
    for by in (-2.0, 0.0, 2.0): bm_box(bm, (0, by, H-0.06), (W, 0.12, 0.12), 1)
    new_obj('ENV_ceiling', bm, [ceil, beam], E)

    # بلاط الجدران: أبيض + شريط رمادي داكن + صف مرقّط في الأعلى
    tw = 0.15; nrows = 14
    tile_w = mat('MAT_tile_white', '#eceae4', 0.2); tile_d = mat('MAT_tile_dark', '#4d5156', 0.28); grout = mat('MAT_grout', '#8d8b86', 0.9)
    walls = [(Vector((-HX, HY, 0)), Vector((1, 0, 0)), Vector((0, -1, 0)), W, []),
             (Vector((-HX, -HY, 0)), Vector((1, 0, 0)), Vector((0, 1, 0)), W, [(0.7, 1.7, 0, 2.2)]),
             (Vector((HX, -HY, 0)), Vector((0, 1, 0)), Vector((-1, 0, 0)), D, []),
             (Vector((-HX, -HY, 0)), Vector((0, 1, 0)), Vector((1, 0, 0)), D, [])]
    bm = bmesh.new(); bg = bmesh.new()
    for (o, t, n, Lw, holes) in walls:
        rz = math.atan2(t.y, t.x)
        for i in range(int(Lw/tw)):
            u = (i+0.5)*tw
            for r in range(nrows):
                z = (r+0.5)*tw
                if any(h[0] <= u <= h[1] and h[2] <= z <= h[3] for h in holes): continue
                dark = (r == 8) or (r == 13 and i % 2 == 0)
                c = o + t*u + n*0.007
                bm_box(bm, (c.x, c.y, z), (tw-0.004, 0.012, tw-0.004), 1 if dark else 0, rz)
        c = o + t*(Lw/2) + n*0.0005
        bm_box(bg, (c.x, c.y, nrows*tw/2), (Lw, 0.002, nrows*tw), 0, rz)
    new_obj('ENV_tiles', bm, [tile_w, tile_d], E); new_obj('ENV_grout', bg, [grout], E)

    # قاعدة الجدار والباب
    base = mat('MAT_baseboard', '#3a3d41', 0.5)
    bm = bmesh.new()
    bm_box(bm, (0, HY-0.015, 0.04), (W, 0.03, 0.08)); bm_box(bm, (HX-0.015, 0, 0.04), (0.03, D, 0.08)); bm_box(bm, (-HX+0.015, 0, 0.04), (0.03, D, 0.08))
    bm_box(bm, (-1.8, -HY+0.015, 0.04), (4.4, 0.03, 0.08)); bm_box(bm, (2.9, -HY+0.015, 0.04), (2.2, 0.03, 0.08))
    new_obj('ENV_baseboard', bm, [base], E)
    door = mat('MAT_door', '#6e5f4f', 0.6); proc_color(door, 'wave', 18.0, '#4a3d30', '#7d6c59', bump=0.1, stretch=(0.05, 1, 1))
    frame = mat('MAT_door_frame', '#c9c3b6', 0.5); handle = mat('MAT_handle', '#b6bcc2', 0.3, 1.0)
    bm = bmesh.new()
    bm_box(bm, (1.2, -HY+0.04, 1.05), (0.92, 0.05, 2.1), 0)
    bm_box(bm, (0.67, -HY+0.03, 1.1), (0.06, 0.08, 2.2), 1); bm_box(bm, (1.73, -HY+0.03, 1.1), (0.06, 0.08, 2.2), 1); bm_box(bm, (1.2, -HY+0.03, 2.23), (1.12, 0.08, 0.06), 1)
    bm_box(bm, (1.55, -HY+0.09, 1.0), (0.12, 0.04, 0.03), 2)
    new_obj('ENV_door', bm, [door, frame, handle], E)

    # قناة تهوية وأجهزة إضاءة
    duct = mat('MAT_duct', '#b9bec3', 0.35, 0.9); panel = mat('MAT_light_panel', '#fff4dc', 0.4, 0.0, '#fff1d6', 5.0)
    bm = bmesh.new(); bm_box(bm, (0, 2.45, 2.88), (W-0.4, 0.5, 0.35)); bm_box(bm, (-3.0, 2.45, 3.0), (0.7, 0.7, 0.3))
    new_obj('ENV_duct', bm, [duct], E)
    bm = bmesh.new(); lp = []
    for lx in (-2.5, 0.0, 2.5):
        for ly in (-1.3, 1.1):
            bm_box(bm, (lx, ly, 3.04), (1.2, 0.25, 0.04)); lp.append((lx, ly))
    new_obj('ENV_light_panels', bm, [panel], Lc)
    for k, (lx, ly) in enumerate(lp):
        ld = bpy.data.lights.new(f'LGT_ceil_{k+1}', 'POINT'); ld.energy = 300; ld.shadow_soft_size = 0.5; ld.color = (1.0, 0.95, 0.85)
        lo = bpy.data.objects.new(f'LGT_ceil_{k+1}', ld); lo.location = (lx, ly, 2.9); Lc.objects.link(lo)
    return {}
