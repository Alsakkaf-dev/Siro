import { startServer } from './index.js';

startServer()
  .then((r) => {
    console.log('────────────────────────────────────────────');
    console.log(' Platform is running  |  المنصة الشخصية تعمل الآن');
    console.log(` http://${r.cfg.host}:${r.cfg.port}   (على جهازك فقط)`);
    console.log(` قاعدة البيانات: ${r.getDb().file} [${r.getDb().driver}]`);
    console.log(' للإيقاف: اضغط Ctrl+C أو أغلق هذه النافذة');
    console.log('────────────────────────────────────────────');
    const stop = (): void => {
      void r.close().then(() => process.exit(0));
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  })
  .catch(async (e: NodeJS.ErrnoException) => {
    if (e.code === 'EADDRINUSE') {
      const port = process.env['PLATFORM_PORT'] ?? '4310';
      console.error(`Port ${port} is already in use - the platform is probably already running: http://127.0.0.1:${port}`);
      console.error(`المنفذ ${port} مستخدم. غالبًا الموقع شغّال بالفعل.`);
      process.exit(0);
    }
    console.error('فشل التشغيل:', e);
    process.exit(1);
  });
