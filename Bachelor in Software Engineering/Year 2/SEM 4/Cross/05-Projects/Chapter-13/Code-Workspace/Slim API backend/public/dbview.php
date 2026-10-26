<?php
/**
 * Read-only database inspector for the Chapter 13 video (Section 1).
 * Served by the running API at:  http://localhost:8000/dbview.php
 * Shows that the MySQL "books" database is live with tables + sample data.
 * Localhost-only.
 */
declare(strict_types=1);

$remote = $_SERVER['REMOTE_ADDR'] ?? '';
if (!in_array($remote, ['127.0.0.1', '::1', 'localhost'], true)) {
    http_response_code(403);
    exit('Forbidden (localhost only).');
}

$host = '127.0.0.1';
$port = '3306';
$db   = 'books';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4", 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $books  = $pdo->query('SELECT id, title, author, year, genre, created_by, created_at FROM books ORDER BY id')->fetchAll();
    $users  = $pdo->query('SELECT id, name, email, role, created_at FROM users ORDER BY id')->fetchAll();
    $serverVersion = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
} catch (Throwable $e) {
    http_response_code(500);
    exit('DB error: ' . htmlspecialchars($e->getMessage()));
}

function h($v): string { return htmlspecialchars((string)$v, ENT_QUOTES); }
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MySQL — books database (Production)</title>
<style>
  :root{--p:#065A82;--s:#1C7293;--bg:#0f172a;--card:#fff;--line:#e2e8f0;--muted:#64748b;--ok:#10B981;}
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f1f5f9;color:#1e293b}
  header{background:linear-gradient(135deg,var(--p),var(--s));color:#fff;padding:22px 28px}
  header h1{margin:0 0 4px;font-size:22px}
  header .sub{opacity:.9;font-size:14px}
  .wrap{max-width:1000px;margin:22px auto;padding:0 18px}
  .badges{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 22px}
  .badge{background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-size:13px;font-weight:600}
  .badge b{color:var(--p)}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--ok);margin-right:6px;vertical-align:middle}
  .card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
  .card h2{margin:0 0 12px;font-size:16px;color:var(--p);display:flex;align-items:center;gap:8px}
  .pill{font-size:11px;background:#e0f2fe;color:var(--p);border-radius:999px;padding:2px 10px;font-weight:700}
  table{width:100%;border-collapse:collapse;font-size:13.5px}
  th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line)}
  th{background:#f8fafc;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  tr:hover td{background:#f8fafc}
  .tag{font-size:11px;border-radius:999px;padding:2px 9px;font-weight:700}
  .admin{background:#fef3c7;color:#92400e}.member{background:#e0f2fe;color:#075985}
  code{background:#f1f5f9;padding:1px 6px;border-radius:5px}
  footer{color:var(--muted);font-size:12px;text-align:center;margin:26px 0}
</style>
</head>
<body>
<header>
  <h1>🗄️ MySQL Database — <code style="color:#fff;background:rgba(255,255,255,.15)">books</code></h1>
  <div class="sub">Live production database · MySQL <?= h($serverVersion) ?> · host 127.0.0.1:3306</div>
</header>

<div class="wrap">
  <div class="badges">
    <span class="badge"><span class="dot"></span><b>Server:</b> running</span>
    <span class="badge"><b>Tables:</b> <?= count($tables) ?> (<?= h(implode(', ', $tables)) ?>)</span>
    <span class="badge"><b>Books:</b> <?= count($books) ?> rows</span>
    <span class="badge"><b>Users:</b> <?= count($users) ?> rows</span>
  </div>

  <div class="card">
    <h2>📚 books <span class="pill"><?= count($books) ?> records</span></h2>
    <table>
      <tr><th>id</th><th>title</th><th>author</th><th>year</th><th>genre</th><th>owner&nbsp;id</th><th>created_at</th></tr>
      <?php foreach ($books as $b): ?>
      <tr>
        <td><?= h($b['id']) ?></td>
        <td><strong><?= h($b['title']) ?></strong></td>
        <td><?= h($b['author']) ?></td>
        <td><?= h($b['year']) ?></td>
        <td><?= h($b['genre']) ?></td>
        <td><?= h($b['created_by']) ?></td>
        <td><?= h($b['created_at']) ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
  </div>

  <div class="card">
    <h2>👤 users <span class="pill"><?= count($users) ?> records</span></h2>
    <table>
      <tr><th>id</th><th>name</th><th>email</th><th>role</th><th>created_at</th></tr>
      <?php foreach ($users as $u): ?>
      <tr>
        <td><?= h($u['id']) ?></td>
        <td><?= h($u['name']) ?></td>
        <td><?= h($u['email']) ?></td>
        <td><span class="tag <?= $u['role']==='admin'?'admin':'member' ?>"><?= h($u['role']) ?></span></td>
        <td><?= h($u['created_at']) ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
  </div>

  <footer>Read-only inspector · data fetched live from MySQL via PDO · SCSM2223 Chapter 13</footer>
</div>
</body>
</html>
