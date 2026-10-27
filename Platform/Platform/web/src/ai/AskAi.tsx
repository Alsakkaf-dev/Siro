/** زر «بالذكاء» السياقي: يفتح المساعد بطلب جاهز (يُرسل فورًا أو يُترك للإكمال). خفيف — لا يحمّل نواة الذكاء. */
import { useApp } from '../core/app-context.js';
import { Icon } from '../lib/icons.js';
import { cx } from '../ui/ui.js';

export function AskAi({ prompt, send = false, label, sm, title }: { prompt: string; send?: boolean; label: string; sm?: boolean; title?: string }) {
  const { openAi } = useApp();
  return (
    <button type="button" className={cx('btn ai-ask', sm && 'sm')} title={title ?? 'بالمساعد الذكي (Ctrl+J)'} onClick={() => openAi({ prompt, send })}>
      <Icon name="sparkle" size={sm ? 14 : 16} /> {label}
    </button>
  );
}
