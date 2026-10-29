import { useState } from 'react';
import { Card, CardHead, Switch } from '../ui/ui.js';
import { FLAG_LABELS, flagEnabled, setFlag } from './flags.js';
import type { FlagName } from './registry.js';

/** أعلام الميزات (تجاوز محلي على هذا المتصفح). التغيير يُطبَّق بعد إعادة التحميل. */
export function FlagsCard() {
  const [, force] = useState(0);
  const [dirty, setDirty] = useState(false);
  return (
    <Card id="flags">
      <CardHead title="ميزات تجريبية" icon="flag" />
      <div className="stack" style={{ gap: 'var(--s-2)' }}>
        {(Object.keys(FLAG_LABELS) as FlagName[]).map((f) => (
          <Switch key={f} checked={flagEnabled(f)} onChange={(v) => { setFlag(f, v); setDirty(true); force((x) => x + 1); }} label={FLAG_LABELS[f]} />
        ))}
      </div>
      {dirty && <p className="muted" style={{ marginBlockStart: 'var(--s-3)' }}>أعد تحميل الصفحة لتطبيق التغيير. <button type="button" className="btn sm" onClick={() => location.reload()}>إعادة التحميل</button></p>}
    </Card>
  );
}
