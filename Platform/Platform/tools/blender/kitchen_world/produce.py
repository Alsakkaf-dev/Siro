"""منصّة الخضار والفواكه: أقفاص خشب مائلة على 3 مستويات على الجدار الأيسر (مرجع 2 و6)، لكل مكوّن قفص واحد."""
from lib import *
import items

TIERS = [(0.30, 0.55), (0.80, 0.50), (1.30, 0.45)]  # (ارتفاع قاع القفص، عمقه عن الجدار)
ORDER = [['tomato', 'onion', 'potato', 'carrot'], ['cucumber', 'eggplant', 'lemon', 'banana'], ['garlic', 'ginger', 'coriander', 'green_beans']]
COUNTS = {'tomato': 20, 'onion': 12, 'potato': 18, 'carrot': 16, 'cucumber': 8, 'eggplant': 6, 'lemon': 14, 'banana': 6, 'garlic': 16, 'ginger': 7, 'coriander': 3, 'green_beans': 3}

def build(C):
    S = C['SHELVING']; P = C['PRODUCE']
    wood = mat('MAT_crate_wood', '#a07548', 0.75); proc_color(wood, 'wave', 30.0, '#6a4a2a', '#b08454', bump=0.15, stretch=(1, 0.05, 1))
    frame = mat('MAT_stand_wood', '#8a6038', 0.7)
    x0 = -3.55
    ys = [-2.1, -0.7, 0.7, 2.1]
    bm = bmesh.new()
    # هيكل المنصّة: 5 أعمدة أمامية/خلفية ولوحات مائلة
    for y in [-2.8, -1.4, 0.0, 1.4, 2.8]:
        bm_box(bm, (x0+0.45, y, 0.9), (0.05, 0.05, 1.8), 0); bm_box(bm, (x0-0.05, y, 1.0), (0.05, 0.05, 2.0), 0)
    for (z, d) in TIERS:
        bm_box(bm, (x0+0.20, 0, z-0.02), (d+0.1, 5.7, 0.03), 0, 0)
    new_obj('PRP_stand_frame', bm, [frame], S)
    bmc = bmesh.new()
    for ti, (z, d) in enumerate(TIERS):
        for ci, slug in enumerate(ORDER[ti]):
            cy = ys[ci]; cx = x0 + 0.20
            tilt = math.radians(-14)  # مائل نحو الأمام
            rot = Matrix.Rotation(tilt, 3, 'Y')
            def P3(v): return rot @ Vector(v) + Vector((cx, cy, z+0.05))
            w, dd, h = 0.62, 0.50, 0.14
            # قاع وجوانب (ألواح)
            def board(c, s):
                pts = []
                hx, hy, hz = s[0]/2, s[1]/2, s[2]/2
                for dx in (-hx, hx):
                    for dy in (-hy, hy):
                        for dz in (-hz, hz): pts.append(bmc.verts.new(P3((c[0]+dx, c[1]+dy, c[2]+dz))))
                for q in [(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]:
                    bmc.faces.new([pts[i] for i in q]).material_index = 0
            board((0, 0, 0.01), (dd, w, 0.02))
            for k in range(3): board((dd/2-0.01, 0, 0.03+k*0.04), (0.02, w, 0.03))
            for k in range(3): board((-dd/2+0.01, 0, 0.03+k*0.04), (0.02, w, 0.03))
            for k in range(3): board((0, w/2-0.01, 0.03+k*0.04), (dd, 0.02, 0.03)); board((0, -w/2+0.01, 0.03+k*0.04), (dd, 0.02, 0.03))
            cnt = COUNTS[slug]
            bm, mats = items.build_ingredient_mesh(slug, cnt, (dd-0.08, w-0.08), seed=ti*4+ci+20, jitter=0.0)
            o = new_obj(f'slot_ing_{slug}', bm, mats, P, (cx, cy, z+0.05+0.02), (0, tilt, 0), smooth=True)
    new_obj('PRP_crates', bmc, [wood], S)
