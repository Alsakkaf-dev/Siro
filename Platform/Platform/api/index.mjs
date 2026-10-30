// نقطة دخول Vercel: كل الطلبات تمر بهذا التطبيق (انظر vercel.json). نسخة الجهاز لا تستخدم هذا الملف.
import { createOnlineHandler } from '../dist/server/server/online.js';

const app = await createOnlineHandler();
export default app;
