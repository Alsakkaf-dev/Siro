import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/ui.js';
import { Icon } from '../lib/icons.js';

interface PlayerProps {
  initial: number;
  onTime: (sec: number, duration: number | null) => void;
  registerSeek: (fn: (sec: number) => void) => void;
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** مشغّل فيديو/صوت محلي (الملف يُخدَم من الخادم مع دعم Range). */
export function MediaPlayer({ src, audio, initial, onTime, registerSeek }: PlayerProps & { src: string; audio: boolean }) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [rate, setRate] = useState(() => Number(localStorage.getItem('lib.rate')) || 1);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    registerSeek((s) => {
      const el = ref.current;
      if (!el) return;
      el.currentTime = s;
      void el.play().catch(() => undefined);
    });
  }, [registerSeek]);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = rate;
    localStorage.setItem('lib.rate', String(rate));
  }, [rate]);

  const common = {
    ref,
    src,
    controls: true,
    preload: 'metadata' as const,
    className: 'lib-media',
    onLoadedMetadata: (): void => {
      const el = ref.current;
      if (!el) return;
      el.playbackRate = rate;
      if (initial > 1 && Number.isFinite(el.duration) && initial < el.duration - 3) el.currentTime = initial;
      onTime(el.currentTime, Number.isFinite(el.duration) ? el.duration : null);
    },
    onTimeUpdate: (): void => {
      const el = ref.current;
      if (el) onTime(el.currentTime, Number.isFinite(el.duration) ? el.duration : null);
    },
    onError: (): void => setErr('تعذّر تشغيل هذا الملف في المتصفح (الصيغة أو الترميز غير مدعوم). يمكنك تنزيله وفتحه ببرنامج آخر.'),
  };
  return (
    <div className="lib-stage">
      {audio ? <audio {...common} style={{ inlineSize: '100%', display: 'block', padding: 16 }} /> : <video {...common} playsInline />}
      <div className="lib-bar" role="group" aria-label="سرعة التشغيل">
        <span className="muted">السرعة</span>
        {RATES.map((r) => (
          <button key={r} className="chip" aria-pressed={rate === r} onClick={() => setRate(r)}>{r}×</button>
        ))}
      </div>
      {err && <div className="callout danger" role="alert" style={{ margin: 'var(--s-3)' }}>{err}</div>}
    </div>
  );
}

const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/** YouTube بتحميل عند الضغط فقط (اتصال خارجي)، مع تتبّع الوقت عبر postMessage إن توفّر. */
export function YoutubePlayer({ videoId, initial, onTime, registerSeek, onTracking }: PlayerProps & { videoId: string; onTracking: (on: boolean) => void }) {
  const [on, setOn] = useState(false);
  const [start, setStart] = useState(Math.floor(initial));
  const [nonce, setNonce] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const tracking = useRef(false);
  const startRef = useRef(start);
  startRef.current = start;

  const post = useCallback((msg: unknown): void => {
    frame.current?.contentWindow?.postMessage(JSON.stringify(msg), YT_ORIGIN);
  }, []);

  useEffect(() => {
    registerSeek((s) => {
      if (!on) {
        setStart(Math.floor(s));
        setOn(true);
        return;
      }
      if (tracking.current) {
        post({ event: 'command', func: 'seekTo', args: [s, true] });
        post({ event: 'command', func: 'playVideo', args: [] });
      } else {
        setStart(Math.floor(s));
        setNonce((n) => n + 1);
      }
    });
  }, [registerSeek, on, post]);

  useEffect(() => {
    if (!on) return;
    tracking.current = false;
    onTracking(false);
    const onMsg = (e: MessageEvent): void => {
      if (e.origin !== YT_ORIGIN || e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      let d: { event?: string; info?: { currentTime?: number; duration?: number } };
      try {
        d = JSON.parse(e.data) as typeof d;
      } catch {
        return;
      }
      const info = d.info;
      if (info && typeof info.currentTime === 'number') {
        if (!tracking.current) {
          tracking.current = true;
          onTracking(true);
        }
        onTime(info.currentTime, typeof info.duration === 'number' && info.duration > 0 ? info.duration : null);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [on, nonce, onTime, onTracking]);

  const onLoad = (): void => {
    // "listening" يطلب من المشغّل إرسال infoDelivery دوريًا
    const send = (): void => post({ event: 'listening', id: 1, channel: 'widget' });
    send();
    setTimeout(send, 800);
    setTimeout(send, 2500);
  };

  if (!on) {
    return (
      <div className="lib-stage">
        <div className="yt-box">
          <div>
            <p>سيتصل المتصفح بـ youtube-nocookie.com عند التشغيل فقط. لا يُحمَّل شيء من يوتيوب قبل ضغطك.</p>
            <Button variant="primary" icon="play" onClick={() => setOn(true)}>تشغيل الفيديو{start > 0 ? ` من ${Math.floor(start / 60)}:${String(start % 60).padStart(2, '0')}` : ''}</Button>
          </div>
        </div>
      </div>
    );
  }
  const q = new URLSearchParams({ enablejsapi: '1', rel: '0', playsinline: '1', start: String(startRef.current), origin: window.location.origin, autoplay: '1' });
  return (
    <div className="lib-stage">
      <div className="yt-box">
        <iframe
          key={nonce}
          ref={frame}
          title="مشغّل YouTube"
          src={`${YT_ORIGIN}/embed/${videoId}?${q.toString()}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={onLoad}
        />
      </div>
      <div className="lib-bar"><Icon name="info" size={15} /><span className="muted">الوقت والتقدّم يُتتبَّعان تلقائيًا إن سمح المشغّل، وإلا استخدم إدخال الوقت اليدوي في العلامات.</span></div>
    </div>
  );
}
