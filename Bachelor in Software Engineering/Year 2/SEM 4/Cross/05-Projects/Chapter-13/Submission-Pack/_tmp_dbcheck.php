<?php
try {
  $pdo = new PDO('mysql:host=127.0.0.1;dbname=books;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  echo "BOOKS=" . $pdo->query('SELECT COUNT(*) FROM books')->fetchColumn() . "\n";
  echo "USERS=" . $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() . "\n";
  $t = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
  echo "TABLES=" . implode(',', $t) . "\n";
  $clean = $pdo->query("SELECT id,title FROM books WHERE title LIKE '%clean%'")->fetchAll(PDO::FETCH_ASSOC);
  foreach ($clean as $r) { echo "CLEAN: #{$r['id']} {$r['title']}\n"; }
  $max = $pdo->query('SELECT MAX(id) FROM books')->fetchColumn();
  echo "MAX_BOOK_ID=$max\n";
} catch (Exception $e) {
  echo "DBERROR: " . $e->getMessage() . "\n";
}
