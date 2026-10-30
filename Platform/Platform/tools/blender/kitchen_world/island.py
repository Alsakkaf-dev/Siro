"""طاولة التحضير المركزية بألواح تقطيع خشبية (end-grain) وسكاكين وجرار توابل وميزان (مرجع 3 و4 و9 و10)."""
from lib import *
import items
from cooking import steel, pan_mesh

def butcher_board(C, name, x, y, z, w=0.62, d=0.42, th=0.04, rz=0.0):
    E = C['EQUIPMENT']
    a = mat('MAT_butcher_a', '#b27b43', 0.55); b = mat('MAT_butcher_b', '#8a5a2c', 0.55); c = mat('MAT_butcher_c', '#c58f58', 0.55)
    bm = bmesh.new(); n = 12; sw = w/n
    for i in range(n):
        for j in range(8):
            bm_box(bm, (-w/2+(i+0.5)*sw, -d/2+(j+0.5)*d/8, th/2), (sw-0.0008, d/8-0.0008, th), (i*3+j*5) % 3)
    return new_obj(name, bm, [a, b, c], E, (x, y, z), (0, 0, rz))

def build(C):
    P = C['PROPS']; E = C['EQUIPMENT']
    st = steel()
    # الجزيرة: سطح ستانلس وأرجل ورفّ سفلي (مرجع 3)
    bm = bmesh.new()
    bm_box(bm, (-0.3, -0.225, 0.89), (2.7, 1.35, 0.04), 0)
    for sx in (-1.6, 1.0):
        for sy in (-0.85, 0.40): bm_box(bm, (sx+0.0, sy, 0.44), (0.05, 0.05, 0.88), 0)
    bm_box(bm, (-0.3, -0.225, 0.25), (2.6, 1.25, 0.025), 0); bm_box(bm, (-0.3, 0.42, 0.6), (2.6, 0.02, 0.5), 0)
    new_obj('PRP_island', bm, [st], P)
    butcher_board(C, 'board_main', -0.9, -0.4, 0.91, rz=0.0)
    butcher_board(C, 'PRP_board_2', 0.15, -0.35, 0.91, 0.55, 0.38, rz=0.12)
    # ميزان رقمي
    bm = bmesh.new(); bm_box(bm, (0, 0, 0.015), (0.2, 0.16, 0.03), 0); bm_box(bm, (0, -0.05, 0.032), (0.07, 0.03, 0.004), 1)
    new_obj('scale_main', bm, [mat('MAT_scale_body', '#202428', 0.4, 0.5), mat('MAT_scale_display', '#6fe0a0', 0.2, 0.0, '#3cff9a', 2.0)], E, (0.2, 0.1, 0.91))
    # قالب سكاكين ومقابض (مرجع 9)
    bm = bmesh.new(); knife = mat('MAT_knife_blade', '#cfd3d8', 0.2, 1.0); hndl = mat('MAT_knife_handle', '#2a1c14', 0.5); blockm = mat('MAT_knife_block', '#5a3a22', 0.6)
    for k in range(5): bm_box(bm, (0, -0.07+k*0.035, 0.07), (0.13, 0.03, 0.14), 0) if False else None
    bm_box(bm, (0, 0, 0.08), (0.14, 0.22, 0.16), 0)
    for k in range(5):
        bm_box(bm, (0, -0.08+k*0.04, 0.2), (0.012, 0.012, 0.12), 1)
    new_obj('PRP_knife_block', bm, [blockm, hndl], P, (-1.55, -0.1, 0.91))
    bm = bmesh.new()
    for k, (x, y, rz) in enumerate(((-0.8, -0.55, 0.3), (-0.2, -0.3, -0.5))):
        bm_box(bm, (x, y, 0.925), (0.20, 0.03, 0.006), 0, rz); bm_box(bm, (x+0.13*math.cos(rz), y+0.13*math.sin(rz), 0.93), (0.11, 0.022, 0.018), 1, rz)
    # جرار توابل وزجاجات على الجزيرة
    for k, slug in enumerate(['honey']):
        bm, mats = items.build_ingredient_mesh(slug, 1, (0.01, 0.01), seed=40+k)
        new_obj(f'PRP_island_{slug}', bm, mats, P, (-1.05, 0.38, 0.91), smooth=True)
    # وعاء فاكهة (مرجع 3): طماطم وليمون وفلفل
    bm = bmesh.new(); bm_lathe(bm, (0, 0, 0), [(0.0, 0.0), (0.09, 0.0), (0.18, 0.05), (0.22, 0.11), (0.215, 0.11), (0.17, 0.056), (0.085, 0.006), (0.0, 0.006)], 36, 0)
    new_obj('PRP_fruit_bowl', bm, [mat('MAT_ceramic_white', '#f2efe6', 0.2)], P, (0.78, -0.2, 0.91), smooth=True)
    bm, mats = items.build_ingredient_mesh('tomato', 7, (0.2, 0.2), seed=60)
    for v in bm.verts: v.co.z += 0.03
    new_obj('PRP_fruit_tomatoes', bm, mats, P, (0.78, -0.2, 0.91), smooth=True)
