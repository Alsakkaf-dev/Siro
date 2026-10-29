"""العالم الكامل: python build.py [preview|export] — يحتاج bpy (pip install bpy) أو Blender: blender -b -P build.py -- preview"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import env

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    C = {n: coll(n) for n in ('ENV', 'LIGHTS', 'CAMERAS', 'SHELVING', 'EQUIPMENT', 'PRODUCE', 'FOOD', 'PROPS', 'CONTRACT')}
    w = bpy.data.worlds.new('World'); w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs[0].default_value = (0.30, 0.28, 0.25, 1); bg.inputs[1].default_value = 0.5
    sc.world = w
    return C

def build_all(C):
    env.build_env(C)
    for name in ('shelving', 'cooking', 'island', 'produce', 'props', 'contract'):
        try:
            mod = __import__(name)
        except ImportError:
            continue
        mod.build(C)

def cam(name, loc, target, lens=22):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.clip_start = 0.05; cd.clip_end = 60
    co = bpy.data.objects.new(name, cd); co.location = loc
    bpy.context.scene.collection.objects.link(co)
    d = Vector(target) - Vector(loc); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return co

def render(path, c, res=(640, 360), samples=24):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    try: sc.cycles.use_denoising = True
    except Exception: pass
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.image_settings.file_format = 'PNG'
    sc.camera = c; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

if __name__ == '__main__':
    mode = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else (sys.argv[1] if len(sys.argv) > 1 else 'preview')
    out = os.environ.get('KW_OUT', '/tmp')
    C = fresh(); build_all(C)
    if mode == 'export':
        import bake
        done = bake.bake_all()
        print('BAKED', len(done))
        outp = os.environ.get('KW_GLB', os.path.join(out, 'kitchen-world.glb'))
        bpy.ops.object.select_all(action='DESELECT')
        bpy.ops.export_scene.gltf(filepath=outp, export_format='GLB', export_apply=True, export_extras=True, export_yup=True, export_cameras=False, export_lights=False, use_selection=False, export_image_format='JPEG', export_jpeg_quality=82)
        print('EXPORTED', outp, os.path.getsize(outp))
    if mode == 'preview':
        views = {'fp': ((0.0, -2.5, 1.65), (0.0, 1.0, 1.2)), 'back': ((2.8, -2.9, 1.9), (-1.0, 2.0, 1.1)), 'right': ((-1.5, -2.5, 1.6), (3.5, 0.3, 1.1))}
        for k, (l, t) in views.items():
            render(os.path.join(out, f'kw_{k}.png'), cam(f'CAM_{k}', l, t))
