<?php
include("conexao.php");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../cadastro-paciente.html");
    exit;
}

$nome = trim($_POST["nome"] ?? "");
$cpf = trim($_POST["cpf"] ?? "");
$telefone = trim($_POST["telefone"] ?? "");
$tipo = trim($_POST["tipo"] ?? "");
$doenca = trim($_POST["medico"] ?? "");
$restricao = trim($_POST["restricao"] ?? "");

if ($nome === "" || $cpf === "" || $tipo === "" || $doenca === "" || $restricao === "") {
    die("Preencha os campos obrigatorios.");
}

$check = $conn->prepare("SELECT id_pac FROM cadastro WHERE cpf = ?");
$check->bind_param("s", $cpf);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo "<script>alert('CPF ja cadastrado.'); window.location.href = '../cadastro-paciente.html';</script>";
    exit;
}

$stmt = $conn->prepare("INSERT INTO cadastro (nome, cpf, telefone, tipo, medico, restricao) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $nome, $cpf, $telefone, $tipo, $doenca, $restricao);

if (!$stmt->execute()) {
    die("Erro ao cadastrar: " . $conn->error);
}

echo "<script>
localStorage.removeItem('reminders');
localStorage.removeItem('activityLog');
localStorage.removeItem('lembraPoints');
localStorage.removeItem('emergencyContacts');
localStorage.removeItem('lastSong');
localStorage.removeItem('activeSongIndex');
localStorage.setItem('dados', JSON.stringify({
  nome: " . json_encode($nome) . ",
  cpf: " . json_encode($cpf) . ",
  telefone: " . json_encode($telefone) . ",
  tipo: " . json_encode($tipo) . ",
  doenca: " . json_encode($doenca) . ",
  restricao: " . json_encode($restricao) . "
}));
window.location.href = '../inicio-paciente.html';
</script>";

$stmt->close();
$conn->close();
?>
