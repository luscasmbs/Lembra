<?php
include("conexao.php");
session_start();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../cadastro-cuidador.html");
    exit;
}

$nomeCuidador = trim($_POST["nome_cuidador"] ?? "");
$emailCuidador = trim($_POST["email_cuidador"] ?? "");
$senhaCuidador = $_POST["senha_cuidador"] ?? "";
$cpfPaciente = trim($_POST["cpf_paciente"] ?? "");
$estagio = trim($_POST["estagio"] ?? "moderado");
$timerJogos = isset($_POST["timer_jogos"]) ? 1 : 0;

if ($nomeCuidador === "" || $emailCuidador === "" || $senhaCuidador === "" || $cpfPaciente === "") {
    die("Preencha os campos obrigatorios.");
}

$pacienteNome = "Paciente";
$pacienteDoenca = "";
$check = $conn->prepare("SELECT nome, medico FROM cadastro WHERE cpf = ?");
$check->bind_param("s", $cpfPaciente);
$check->execute();
$result = $check->get_result();

if ($row = $result->fetch_assoc()) {
    $pacienteNome = $row["nome"];
    $pacienteDoenca = $row["medico"];
} else {
    echo "<script>alert('CPF do paciente nao encontrado. Cadastre o paciente antes de vincular o cuidador.'); window.location.href = '../cadastro-cuidador.html';</script>";
    exit;
}

$senhaHash = password_hash($senhaCuidador, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO cuidadores (nome, email, senha, cpf_paciente, estagio, timer_jogos) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssi", $nomeCuidador, $emailCuidador, $senhaHash, $cpfPaciente, $estagio, $timerJogos);

if (!$stmt->execute()) {
    die("Erro ao cadastrar cuidador: " . $conn->error);
}

$_SESSION["nome_cuidador"] = $nomeCuidador;
$_SESSION["nome_paciente"] = $pacienteNome;

echo "<script>
localStorage.removeItem('activityLog');
localStorage.removeItem('emergencyContacts');
localStorage.setItem('caregiverSettings', JSON.stringify({
  nome: " . json_encode($nomeCuidador) . ",
  email: " . json_encode($emailCuidador) . ",
  cpfPaciente: " . json_encode($cpfPaciente) . ",
  pacienteNome: " . json_encode($pacienteNome) . ",
  pacienteDoenca: " . json_encode($pacienteDoenca) . ",
  patientStage: " . json_encode($estagio) . ",
  timerEnabled: " . ($timerJogos ? "true" : "false") . ",
  moodScale: " . json_encode($estagio === "moderado" ? "simple" : "expanded") . "
}));
window.location.href = '../painel-cuidador.html';
</script>";

$stmt->close();
$conn->close();
?>
