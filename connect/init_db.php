<?php
include("conexao.php");

$schemaPath = __DIR__ . "/schema.sql";
if (!file_exists($schemaPath)) {
    die("Arquivo schema.sql nao encontrado.");
}

$schema = file_get_contents($schemaPath);
if (!$conn->multi_query($schema)) {
    die("Erro ao aplicar schema: " . $conn->error);
}

do {
    if ($result = $conn->store_result()) {
        $result->free();
    }
} while ($conn->more_results() && $conn->next_result());

echo "Banco Lembra+ inicializado com sucesso.";
?>
