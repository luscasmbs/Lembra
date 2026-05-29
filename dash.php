<?php
include __DIR__ . "/connect/conexao.php";
$query = $conexao->query("SELECT * FROM cadastro ORDER BY id_pac DESC");
$cadastros = mysqli_fetch_all($query, MYSQLI_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembra+ | Dashboard</title>
  <link rel="stylesheet" href="./assets/css/lembra-v2.css">
</head>
<body>
  <main class="form-page desktop-wide">
    <div class="topbar" style="position:static;border-radius:0 0 18px 18px">
      <button class="back-btn" onclick="location.href='p2.html'" type="button">&lt;</button>
      <div>
        <div class="topbar-title">Pacientes cadastrados</div>
        <div class="topbar-subtitle">Painel administrativo Lembra+</div>
      </div>
      <span class="brand-small">lembra+</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>CPF</th>
            <th>Telefone</th>
            <th>Tipo</th>
            <th>Condicao</th>
            <th>Restricoes</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($cadastros as $cadastro): ?>
            <tr>
              <td><?= htmlspecialchars($cadastro["id_pac"]) ?></td>
              <td><?= htmlspecialchars($cadastro["nome"]) ?></td>
              <td><?= htmlspecialchars($cadastro["cpf"]) ?></td>
              <td><?= htmlspecialchars($cadastro["telefone"]) ?></td>
              <td><?= htmlspecialchars($cadastro["tipo"]) ?></td>
              <td><?= htmlspecialchars($cadastro["medico"]) ?></td>
              <td><?= htmlspecialchars($cadastro["restricao"]) ?></td>
              <td><a class="badge violet" href="edit.php?id=<?= urlencode($cadastro["id_pac"]) ?>">Editar</a></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
