<?php
include __DIR__ . "/connect/conexao.php";

$id = (int)($_GET["id"] ?? 0);
if ($id <= 0) {
    die("Cadastro nao encontrado.");
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nome = trim($_POST["nome"] ?? "");
    $cpf = trim($_POST["cpf"] ?? "");
    $telefone = trim($_POST["telefone"] ?? "");
    $tipo = trim($_POST["tipo"] ?? "");
    $medico = trim($_POST["medico"] ?? "");
    $restricao = trim($_POST["restricao"] ?? "");

    $stmt = $conexao->prepare("UPDATE cadastro SET nome = ?, cpf = ?, telefone = ?, tipo = ?, medico = ?, restricao = ? WHERE id_pac = ?");
    $stmt->bind_param("ssssssi", $nome, $cpf, $telefone, $tipo, $medico, $restricao, $id);
    $stmt->execute();
    header("Location: dash.php");
    exit;
}

$stmt = $conexao->prepare("SELECT * FROM cadastro WHERE id_pac = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$cadastro = $stmt->get_result()->fetch_assoc();

if (!$cadastro) {
    die("Cadastro nao encontrado.");
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembra+ | Editar paciente</title>
  <link rel="stylesheet" href="./assets/css/lembra-v2.css">
</head>
<body>
  <main class="form-page">
    <div class="topbar" style="position:static;border-radius:0 0 18px 18px">
      <button class="back-btn" onclick="location.href='dash.php'" type="button">&lt;</button>
      <div>
        <div class="topbar-title">Editar paciente</div>
        <div class="topbar-subtitle">Atualize os dados com cuidado</div>
      </div>
      <span class="brand-small">lembra+</span>
    </div>
    <form class="form-card" method="POST">
      <div class="field"><label>Nome</label><input name="nome" value="<?= htmlspecialchars($cadastro["nome"]) ?>" required></div>
      <div class="field"><label>CPF</label><input name="cpf" value="<?= htmlspecialchars($cadastro["cpf"]) ?>" required></div>
      <div class="field"><label>Telefone</label><input name="telefone" value="<?= htmlspecialchars($cadastro["telefone"]) ?>"></div>
      <div class="field"><label>Tipo sanguineo</label><input name="tipo" value="<?= htmlspecialchars($cadastro["tipo"]) ?>" required></div>
      <div class="field"><label>Condicao cognitiva</label><input name="medico" value="<?= htmlspecialchars($cadastro["medico"]) ?>" required></div>
      <div class="field"><label>Restricoes</label><textarea name="restricao" required><?= htmlspecialchars($cadastro["restricao"]) ?></textarea></div>
      <div class="actions">
        <button class="btn" type="submit">Salvar alteracoes</button>
        <a class="btn secondary" href="./dash.php">Cancelar</a>
      </div>
    </form>
  </main>
</body>
</html>
