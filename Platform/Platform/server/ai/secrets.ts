/** مفاتيح المزوّدين: خارج القاعدة عمدًا (لا تُرفع مع Blob ولا مع النسخ الاحتياطية ولا التصدير).
 *  الجهاز: data/ai-secrets.json · الأونلاين: متغيرات البيئة (ثابتة) أو ملف مؤقت في /tmp (يضيع عند إعادة التشغيل). */
import fs from 'node:fs';
import path from 'node:path';

const envName = (id: string): string => `AI_KEY_${id.toUpperCase().replace(/-/g, '_')}`;

/** مفاتيح معروفة الأسماء في Vercel */
const ALIASES: Record<string, string[]> = {
  anthropic: ['ANTHROPIC_API_KEY'],
  'cloud-free': ['AI_FREE_API_KEY', 'OPENROUTER_API_KEY', 'GROQ_API_KEY'],
  'paid-openai': ['OPENAI_API_KEY'],
  // Vercel AI Gateway: مفتاح صريح، أو رمز OIDC الذي يحقنه Vercel في كل طلب (بلا مفتاح من المالك)
  env: ['AI_API_KEY', 'AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN'],
};

export class Secrets {
  constructor(private file: string) {}

  private read(): Record<string, string> {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8')) as Record<string, string>;
    } catch {
      return {};
    }
  }

  private write(v: Record<string, string>): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(v, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }

  fromEnv(id: string): string | null {
    for (const n of [envName(id), ...(ALIASES[id] ?? [])]) {
      const v = process.env[n];
      if (v && v.trim()) return v.trim();
    }
    return null;
  }

  get(id: string): string | null {
    return this.fromEnv(id) ?? this.read()[id] ?? null;
  }

  has(id: string): boolean {
    return this.get(id) !== null;
  }

  set(id: string, key: string): void {
    const v = this.read();
    v[id] = key.trim();
    this.write(v);
  }

  del(id: string): void {
    const v = this.read();
    delete v[id];
    this.write(v);
  }
}
