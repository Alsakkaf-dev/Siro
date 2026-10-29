"""ديكور: براميل، أسطوانة غاز، طفاية حريق، صناديق كرتون، سلة مهملات، أحواض أعشاب معلّقة (مرجع 1 و2 و6)."""
from lib import *
import items

def build(C):
    P = C['PROPS']
    barrel = mat('MAT_barrel_blue', '#2c4f7a', 0.55, 0.6); rust = mat('MAT_barrel_rust', '#7a3a1c', 0.8, 0.5); ring = mat('MAT_barrel_ring', '#3a3d41', 0.6, 0.7)
    for k, (x, y) in enumerate(((-3.1, -2.85), (-2.55, -2.9))):
        bm = bmesh.new(); bm_lathe(bm, (0, 0, 0), [(0.0, 0.0), (0.26, 0.0), (0.285, 0.1), (0.30, 0.45), (0.285, 0.8), (0.26, 0.88), (0.0, 0.88)], 28, 0)
        for z in (0.12, 0.44, 0.76): bm_cyl(bm, (0, 0, z-0.012), 0.304 if z == 0.44 else 0.29, 0.024, 28, 1)
        new_obj(f'PRP_barrel_{k+1}', bm, [barrel if k == 0 else rust, ring], P, (x, y, 0), smooth=True)
    # أسطوانة غاز زرقاء وطفاية حريق (مرجع 1)
    bm = bmesh.new(); bm_lathe(bm, (0, 0, 0), [(0.0, 0.0), (0.14, 0.0), (0.17, 0.02), (0.17, 0.42), (0.14, 0.52), (0.04, 0.58), (0.04, 0.62), (0.0, 0.62)], 28, 0)
    bm_cyl(bm, (0, 0, 0.62), 0.04, 0.06, 10, 1); bm_cyl(bm, (0, 0, 0.0), 0.15, 0.03, 20, 1, 0.17)
    new_obj('PRP_gas_cylinder', bm, [mat('MAT_gas_blue', '#2a79d6', 0.35, 0.3), mat('MAT_brass', '#b08a3a', 0.35, 1.0)], P, (3.75, -2.95, 0), smooth=True)
    bm = bmesh.new(); bm_lathe(bm, (0, 0, 0), [(0.0, 0.0), (0.045, 0.0), (0.05, 0.02), (0.05, 0.38), (0.03, 0.43), (0.0, 0.43)], 20, 0); bm_box(bm, (0.0, 0.0, 0.46), (0.03, 0.09, 0.04), 1); bm_cyl(bm, (0, 0, 0.43), 0.014, 0.03, 8, 1)
    new_obj('PRP_extinguisher', bm, [mat('MAT_extinguisher', '#c4251c', 0.4, 0.2), mat('MAT_black_plastic', '#17181a', 0.5)], P, (3.55, -3.12, 0.88), smooth=True)
    # صناديق كرتون (مرجع 3 و4)
    cardb = mat('MAT_cardboard', '#b78d52', 0.9); tape = mat('MAT_tape', '#d6c4a0', 0.5)
    bm = bmesh.new()
    for (x, y, z, sx, sy, sz, rz) in ((2.4, -2.9, 0.0, 0.5, 0.4, 0.35, 0.2), (2.45, -2.85, 0.35, 0.4, 0.34, 0.28, -0.1), (-3.3, 2.85, 0.0, 0.55, 0.45, 0.4, 0.0)):
        bm_box(bm, (x, y, z+sz/2), (sx, sy, sz), 0, rz); bm_box(bm, (x, y, z+sz+0.001), (sx*0.12, sy+0.002, 0.002), 1, rz)
    new_obj('PRP_boxes', bm, [cardb, tape], P)
    # سلة مهملات
    bm = bmesh.new(); bm_lathe(bm, (0, 0, 0), [(0.0, 0.0), (0.19, 0.0), (0.22, 0.6), (0.225, 0.62), (0.0, 0.62)], 24, 0)
    new_obj('PRP_bin', bm, [mat('MAT_bin', '#4b5156', 0.5, 0.4)], P, (1.9, -2.95, 0), smooth=True)
    # أحواض أعشاب معلّقة على الجدار الأمامي (مرجع 1)
    pot = mat('MAT_planter_white', '#f2f2ef', 0.35); soil = mat('MAT_soil', '#2c2118', 0.9); herb = mat('MAT_herb', '#4a8f3a', 0.6); shelfm = mat('MAT_planter_shelf', '#d9dcdf', 0.3, 0.8)
    bm = bmesh.new(); bg = bmesh.new()
    for r, z in enumerate((1.15, 1.6, 2.05)):
        bm_box(bm, (3.0, -3.1, z), (1.3, 0.2, 0.02), 2)
        for k in range(3):
            x = 2.55+k*0.45
            bm_lathe(bm, (x, -3.1, z+0.01), [(0.0, 0.0), (0.05, 0.0), (0.075, 0.1), (0.07, 0.1), (0.045, 0.006)], 14, 0)
            bm_lathe(bm, (x, -3.1, z+0.09), [(0.0, 0.0), (0.065, 0.0), (0.0, 0.0)], 8, 1) if False else None
            for j in range(7):
                a = 2*math.pi*j/7; h = 0.08 + 0.05*((j+k+r) % 3)
                bm_lathe(bg, (x+math.cos(a)*0.035, -3.1+math.sin(a)*0.03, z+0.1), [(0.0, 0.0), (0.018, 0.02), (0.02, 0.05), (0.01, h), (0.0, h+0.02)], 6, 0)
    new_obj('PRP_planters', bm, [pot, soil, shelfm], P); new_obj('PRP_herbs', bg, [herb], P, smooth=True)
