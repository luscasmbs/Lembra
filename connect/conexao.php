<?php
$servername = getenv("LEMBRA_DB_HOST") ?: "sql301.infinityfree.com";
$username = getenv("LEMBRA_DB_USER") ?: "if0_37524636";
$password = getenv("LEMBRA_DB_PASS") ?: "yN21AY2kQT2";
$dbname = getenv("LEMBRA_DB_NAME") ?: "if0_37524636_lucas";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8mb4");

$conexao = $conn;
?>
