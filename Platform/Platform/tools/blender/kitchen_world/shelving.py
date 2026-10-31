"""رفوف معدنية سوداء بألواح خشب (مرجع 1 و5 و7) + السلع الجافة والمبرّدة على الرفوف. أسماء العقد: slot_ing_<slug>."""
from lib import *
import items

RACK_W, RACK_D, RACK_H = 1.40, 0.50, 2.12
LEVELS = [0.30, 0.85, 1.40, 1.95]

def rack(C, name, cx, cy, rz=0.0):
    S = C['SHELVING']
    steel = mat('MAT_rack_steel', '#2a2c30', 0.45, 0.6); hole = mat('MAT_rack_hole', '#0c0d0f', 0.8)
    wood = mat('MAT_shelf_wood', '#8a6a4c', 0.7); proc_color(wood, 'wave', 40.0, '#5e4631', '#9a7a58', bump=0.1, stretch=(0.05, 1, 1))
    wire = mat('MAT_rack_brace', '#1d1f22', 0.5, 0.5)
    bm = bmesh.new()
    for ux in (-RACK_W/2+0.02, RACK_W/2-0.02):
        for uy in (-RACK_D/2+0.02, RACK_D/2-0.02):
            bm_box(bm, (ux, uy, RACK_H/2), (0.04, 0.04, RACK_H), 0)
            for k in range(36):  # ثقوب الزاوية
                z = 0.06+k*0.057
                bm_box(bm, (ux, uy + (0.0205 if uy < 0 else -0.0205), z), (0.012, 0.002, 0.024), 1)
    for z in LEVELS:
        bm_box(bm, (0, 0, z), (RACK_W, RACK_D, 0.028), 2)
        bm_box(bm, (0, -RACK_D/2+0.012, z-0.04), (RACK_W, 0.02, 0.05), 3); bm_box(bm, (0, RACK_D/2-0.012, z-0.04), (RACK_W, 0.02, 0.05), 3)
    o = new_obj(name, bm, [steel, hole, wood, wire], S, (cx, cy, 0), (0, 0, rz))
    return o

def shelf_goods(C, slug, count, x, y, z, rz=0.0, spread=(0.4, 0.3), seed=1):
    bm, mats = items.build_ingredient_mesh(slug, count, spread, seed)
    if slug == 'egg':
        tray = mat('MAT_egg_tray', '#c9b79a', 0.9)
        mats = mats + [tray]; bm_box(bm, (0, 0, 0.012), (spread[0]+0.04, spread[1]+0.04, 0.024), len(mats)-1)
    o = new_obj(f'slot_ing_{slug}', bm, mats, C['FOOD'], (x, y, z+0.014), (0, 0, rz), smooth=True)
    return o

def build(C):
    random.seed(3)
    y = 2.88
    racks = {'R1': -2.2, 'R2': -0.6, 'R3': 1.0}
    for n, x in racks.items(): rack(C, f'PRP_rack_{n}', x, y)
    L = LEVELS; top = 0.014
    def put(slug, count, rx, dx, lvl, spread, **kw):
        shelf_goods(C, slug, count, racks[rx]+dx, y, L[lvl]+top, spread=spread, **kw)
    # R1 جاف
    put('rice', 5, 'R1', -0.30, 0, (0.55, 0.30), seed=2); put('sugar', 3, 'R1', 0.40, 0, (0.45, 0.30), seed=3)
    put('oats', 5, 'R1', -0.30, 1, (0.55, 0.20), seed=4); put('salt', 4, 'R1', 0.35, 1, (0.40, 0.25), seed=5)
    put('oil', 6, 'R1', -0.28, 2, (0.55, 0.30), seed=6); put('honey', 4, 'R1', 0.36, 2, (0.40, 0.25), seed=7)
    put('cumin', 4, 'R1', -0.30, 3, (0.45, 0.25), seed=8); put('tomato_paste', 6, 'R1', 0.30, 3, (0.45, 0.30), seed=9)
    # R2 مبرّد وخبز
    put('milk', 8, 'R2', -0.05, 0, (1.0, 0.30), seed=10)
    put('yogurt', 6, 'R2', -0.32, 1, (0.55, 0.30), seed=11); put('cheese', 3, 'R2', 0.38, 1, (0.45, 0.30), seed=12)
    put('egg', 24, 'R2', -0.05, 2, (0.62, 0.34), seed=13)
    put('chicken', 5, 'R2', -0.30, 3, (0.58, 0.32), seed=14); put('toast', 3, 'R2', 0.38, 3, (0.45, 0.30), seed=15)
