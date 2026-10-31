// يتحقق من ملف GLB بـgltf-validator (مثبّت مؤقتًا خارج المستودع بواسطة optimize.mjs): node validate-glb.mjs <مجلد-التثبيت> <ملف.glb>
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const [dir, file] = process.argv.slice(2);
const validator = createRequire(join(dir, 'package.json'))('gltf-validator');
const r = await validator.validateBytes(new Uint8Array(readFileSync(file)), { uri: file, ignoredIssues: ['KHR_MATERIALS_EMISSIVE_STRENGTH_ON_NON_EMISSIVE', 'NODE_EMPTY'] });
const { numErrors, numWarnings, numInfos } = r.issues;
console.log(`gltf-validator: ${numErrors} أخطاء · ${numWarnings} تحذيرات · ${numInfos} معلومات`);
for (const m of r.issues.messages.filter((x) => x.severity === 0).slice(0, 8)) console.log('  ✗', m.code, m.pointer);
process.exit(numErrors ? 1 : 0);
