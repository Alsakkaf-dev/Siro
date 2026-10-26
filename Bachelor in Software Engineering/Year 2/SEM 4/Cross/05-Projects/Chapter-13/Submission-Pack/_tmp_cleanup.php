<?php
$p = new PDO('mysql:host=127.0.0.1;dbname=books;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$n = $p->exec("DELETE FROM books WHERE title='__TMP_VERIFY__'");
echo "DELETED=$n\n";
echo "BOOKS=" . $p->query('SELECT COUNT(*) FROM books')->fetchColumn() . "\n";
echo "USERS=" . $p->query('SELECT COUNT(*) FROM users')->fetchColumn() . "\n";
echo "MAXID=" . $p->query('SELECT MAX(id) FROM books')->fetchColumn() . "\n";
