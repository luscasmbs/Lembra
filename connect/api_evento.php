<?php
include("conexao.php");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "erro" => "Metodo nao permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!is_array($input)) {
    $input = $_POST;
}

$tipo = $input["tipo"] ?? "";
$cpf = trim($input["cpf"] ?? "");

try {
    if ($tipo === "humor") {
        if ($cpf === "") throw new Exception("CPF obrigatorio para humor.");
        $humor = $input["humor"] ?? "";
        $stmt = $conn->prepare("INSERT INTO humor_registros (cpf_paciente, humor) VALUES (?, ?)");
        $stmt->bind_param("ss", $cpf, $humor);
        $stmt->execute();
    } elseif ($tipo === "jogo") {
        $jogo = $input["jogo"] ?? "Jogo";
        $pontos = (int)($input["pontos"] ?? 0);
        $resultado = $input["resultado"] ?? "concluido";
        $cpfNullable = $cpf !== "" ? $cpf : null;
        $stmt = $conn->prepare("INSERT INTO jogo_sessoes (cpf_paciente, jogo, pontos, resultado) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssis", $cpfNullable, $jogo, $pontos, $resultado);
        $stmt->execute();
    } elseif ($tipo === "musica") {
        $musica = $input["musica"] ?? "Musica";
        $artista = $input["artista"] ?? "";
        $duracao = (int)($input["duracao"] ?? 0);
        $cpfNullable = $cpf !== "" ? $cpf : null;
        $stmt = $conn->prepare("INSERT INTO musica_sessoes (cpf_paciente, musica, artista, duracao_segundos) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $cpfNullable, $musica, $artista, $duracao);
        $stmt->execute();
    } elseif ($tipo === "lembrete") {
        if ($cpf === "") throw new Exception("CPF obrigatorio para lembrete.");
        $titulo = $input["titulo"] ?? "";
        $categoria = $input["categoria"] ?? "Rotina";
        $horario = $input["horario"] ?? "00:00";
        $stmt = $conn->prepare("INSERT INTO lembretes (cpf_paciente, titulo, tipo, horario) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $cpf, $titulo, $categoria, $horario);
        $stmt->execute();
    } elseif ($tipo === "localizacao") {
        $lat = $input["lat"] ?? null;
        $lng = $input["lng"] ?? null;
        if ($cpf === "") throw new Exception("CPF obrigatorio para localizacao.");
        $stmt = $conn->prepare("INSERT INTO localizacao_registros (cpf_paciente, latitude, longitude) VALUES (?, ?, ?)");
        $stmt->bind_param("sdd", $cpf, $lat, $lng);
        $stmt->execute();
    } else {
        throw new Exception("Tipo de evento invalido.");
    }

    echo json_encode(["ok" => true]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(["ok" => false, "erro" => $e->getMessage()]);
}
?>
