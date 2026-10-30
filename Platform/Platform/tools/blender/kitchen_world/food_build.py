"""يبني ملف الطعام وحده: python food_build.py [preview|export]  — KW_OUT مجلد الخرج، KW_GLB مسار الملف."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import food

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'export'
    out = os.environ.get('KW_OUT', '/tmp')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    C = {'FOOD': coll('FOOD')}
    names = food.build(C)
    print('FOOD objects', len(names))
    if mode == 'preview':
        import build as B
        sc = bpy.context.scene
        w = bpy.data.worlds.new('W'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 1.2; sc.world = w
        for name, (loc, tgt) in {'f1': ((0.5, -0.55, 0.5), (0.5, 0.35, 0.0)), 'f2': ((2.3, -0.5, 0.45), (2.3, 0.35, 0.0)), 'f3': ((4.1, -0.5, 0.45), (4.1, 0.35, 0.0))}.items():
            B.render(os.path.join(out, f'food_{name}.png'), B.cam(name, loc, tgt, 40), (1100, 620), 24)
    else:
        outp = os.environ.get('KW_GLB', os.path.join(out, 'kitchen-food.glb'))
        bpy.ops.object.select_all(action='DESELECT')
        bpy.ops.export_scene.gltf(filepath=outp, export_format='GLB', export_apply=True, export_extras=False, export_yup=True, export_cameras=False, export_lights=False, export_vertex_color='ACTIVE', export_active_vertex_color_when_no_material=True)
        print('EXPORTED', outp, os.path.getsize(outp))
main()
