<?php
include("conexao.php");
header("Content-Type: application/json; charset=utf-8");

function jsonOut($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requireCpf($cpf) {
    $cpf = trim($cpf ?? "");
    if ($cpf === "") {
        jsonOut(["ok" => false, "erro" => "CPF obrigatorio."], 400);
    }
    return $cpf;
}

$method = $_SERVER["REQUEST_METHOD"];
$recurso = $_GET["recurso"] ?? "";

try {
    if ($method === "GET") {
        switch ($recurso) {
            case "lembretes":
                $cpf = requireCpf($_GET["cpf"] ?? "");
                $stmt = $conn->prepare(
                    "SELECT id, titulo AS text, tipo, DATE_FORMAT(horario, '%H:%i') AS time, concluido AS done
                     FROM lembretes WHERE cpf_paciente = ? ORDER BY horario ASC"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                foreach ($rows as &$row) {
                    $row["id"] = (int)$row["id"];
                    $row["done"] = (bool)$row["done"];
                }
                jsonOut(["ok" => true, "lembretes" => $rows]);

            case "historico":
                $cpf = requireCpf($_GET["cpf"] ?? "");
                $items = [];

                $stmt = $conn->prepare(
                    "SELECT jogo AS title, pontos, criado_em FROM jogo_sessoes
                     WHERE cpf_paciente = ? ORDER BY criado_em DESC LIMIT 20"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $res = $stmt->get_result();
                while ($row = $res->fetch_assoc()) {
                    $items[] = [
                        "time" => date("H:i", strtotime($row["criado_em"])),
                        "title" => "Jogo: " . $row["title"],
                        "sub" => $row["pontos"] . " pts",
                        "color" => "var(--violet)",
                        "date" => date("Y-m-d", strtotime($row["criado_em"]))
                    ];
                }

                $stmt = $conn->prepare(
                    "SELECT musica, artista, duracao_segundos, criado_em FROM musica_sessoes
                     WHERE cpf_paciente = ? ORDER BY criado_em DESC LIMIT 10"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $res = $stmt->get_result();
                while ($row = $res->fetch_assoc()) {
                    $min = (int)floor($row["duracao_segundos"] / 60);
                    $items[] = [
                        "time" => date("H:i", strtotime($row["criado_em"])),
                        "title" => "Musicoterapia · " . $row["musica"],
                        "sub" => ($row["artista"] ?: "") . ($min ? " · {$min} min" : ""),
                        "color" => "#7b2fbe",
                        "date" => date("Y-m-d", strtotime($row["criado_em"]))
                    ];
                }

                usort($items, fn($a, $b) => strcmp($b["date"] . $b["time"], $a["date"] . $a["time"]));
                jsonOut(["ok" => true, "historico" => array_slice($items, 0, 30)]);

            case "progresso":
                $cpf = requireCpf($_GET["cpf"] ?? "");
                $stmt = $conn->prepare(
                    "SELECT COUNT(*) AS total FROM lembretes
                     WHERE cpf_paciente = ? AND concluido = 1
                     AND YEARWEEK(criado_em, 1) = YEARWEEK(CURDATE(), 1)"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $remDone = (int)$stmt->get_result()->fetch_assoc()["total"];

                $stmt = $conn->prepare(
                    "SELECT COUNT(*) AS total FROM jogo_sessoes
                     WHERE cpf_paciente = ? AND YEARWEEK(criado_em, 1) = YEARWEEK(CURDATE(), 1)"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $jogos = (int)$stmt->get_result()->fetch_assoc()["total"];

                $stmt = $conn->prepare(
                    "SELECT COUNT(*) AS total FROM musica_sessoes
                     WHERE cpf_paciente = ? AND YEARWEEK(criado_em, 1) = YEARWEEK(CURDATE(), 1)"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $musicas = (int)$stmt->get_result()->fetch_assoc()["total"];

                $concluidas = $remDone + $jogos + $musicas;
                $meta = 7;
                $percent = $meta > 0 ? min(100, (int)round(($concluidas / $meta) * 100)) : 0;

                $stmt = $conn->prepare(
                    "SELECT COALESCE(SUM(pontos), 0) AS pts FROM jogo_sessoes
                     WHERE cpf_paciente = ? AND DATE(criado_em) = CURDATE()"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $ptsHoje = (int)$stmt->get_result()->fetch_assoc()["pts"];

                $stmt = $conn->prepare(
                    "SELECT COUNT(DISTINCT DATE(criado_em)) AS dias FROM jogo_sessoes
                     WHERE cpf_paciente = ? AND criado_em >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $streak = (int)$stmt->get_result()->fetch_assoc()["dias"];

                jsonOut([
                    "ok" => true,
                    "progresso" => [
                        "concluidas" => $concluidas,
                        "meta" => $meta,
                        "percent" => $percent,
                        "jogos" => $jogos,
                        "musicas" => $musicas,
                        "remedios" => $remDone,
                        "pontosHoje" => $ptsHoje,
                        "streak" => $streak
                    ]
                ]);

            case "musicas":
                $cpf = requireCpf($_GET["cpf"] ?? "");
                $stmt = $conn->prepare(
                    "SELECT musica AS name, artista AS artist, duracao_segundos AS duration
                     FROM musica_favoritas WHERE cpf_paciente = ? ORDER BY criado_em DESC"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $fav = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
                jsonOut(["ok" => true, "musicas" => $fav]);

            case "paciente":
                $cpf = requireCpf($_GET["cpf"] ?? "");
                $stmt = $conn->prepare(
                    "SELECT nome, cpf, telefone, tipo, medico AS doenca, restricao FROM cadastro WHERE cpf = ? LIMIT 1"
                );
                $stmt->bind_param("s", $cpf);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                jsonOut(["ok" => true, "paciente" => $row ?: null]);

            case "cuidador":
                $email = trim($_GET["email"] ?? "");
                $cpfPaciente = trim($_GET["cpf_paciente"] ?? "");
                if ($email === "" && $cpfPaciente === "") {
                    jsonOut(["ok" => false, "erro" => "Informe email ou CPF do paciente."], 400);
                }
                if ($email !== "") {
                    $stmt = $conn->prepare(
                        "SELECT c.nome, c.email, c.cpf_paciente, c.estagio, c.timer_jogos,
                                p.nome AS paciente_nome, p.medico AS paciente_doenca
                         FROM cuidadores c
                         LEFT JOIN cadastro p ON p.cpf = c.cpf_paciente
                         WHERE c.email = ? LIMIT 1"
                    );
                    $stmt->bind_param("s", $email);
                } else {
                    $stmt = $conn->prepare(
                        "SELECT c.nome, c.email, c.cpf_paciente, c.estagio, c.timer_jogos,
                                p.nome AS paciente_nome, p.medico AS paciente_doenca
                         FROM cuidadores c
                         LEFT JOIN cadastro p ON p.cpf = c.cpf_paciente
                         WHERE c.cpf_paciente = ? LIMIT 1"
                    );
                    $stmt->bind_param("s", $cpfPaciente);
                }
                $stmt->execute();
                $care = $stmt->get_result()->fetch_assoc();
                if (!$care) {
                    jsonOut(["ok" => true, "cuidador" => null, "alertas" => [], "stats" => []]);
                }
                $cpf = $care["cpf_paciente"];
                $stats = [
                    "remedios" => ["feitos" => 0, "total" => 0],
                    "jogos" => 0,
                    "musicaMin" => 0,
                    "humor" => null
                ];
                $alertas = [];

                if ($cpf) {
                    $stmt = $conn->prepare("SELECT COUNT(*) AS total, COALESCE(SUM(concluido), 0) AS feitos FROM lembretes WHERE cpf_paciente = ?");
                    $stmt->bind_param("s", $cpf);
                    $stmt->execute();
                    $r = $stmt->get_result()->fetch_assoc();
                    $stats["remedios"] = ["total" => (int)$r["total"], "feitos" => (int)$r["feitos"]];

                    $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM jogo_sessoes WHERE cpf_paciente = ? AND DATE(criado_em) = CURDATE()");
                    $stmt->bind_param("s", $cpf);
                    $stmt->execute();
                    $stats["jogos"] = (int)$stmt->get_result()->fetch_assoc()["c"];

                    $stmt = $conn->prepare("SELECT COALESCE(SUM(duracao_segundos),0) AS s FROM musica_sessoes WHERE cpf_paciente = ? AND DATE(criado_em) = CURDATE()");
                    $stmt->bind_param("s", $cpf);
                    $stmt->execute();
                    $stats["musicaMin"] = (int)floor(((int)$stmt->get_result()->fetch_assoc()["s"]) / 60);

                    $stmt = $conn->prepare("SELECT humor FROM humor_registros WHERE cpf_paciente = ? ORDER BY registrado_em DESC LIMIT 1");
                    $stmt->bind_param("s", $cpf);
                    $stmt->execute();
                    $h = $stmt->get_result()->fetch_assoc();
                    $stats["humor"] = $h ? $h["humor"] : null;
                }

                jsonOut([
                    "ok" => true,
                    "cuidador" => [
                        "nome" => $care["nome"],
                        "email" => $care["email"],
                        "cpfPaciente" => $care["cpf_paciente"],
                        "estagio" => $care["estagio"],
                        "timerJogos" => (bool)$care["timer_jogos"],
                        "pacienteNome" => $care["paciente_nome"],
                        "pacienteDoenca" => $care["paciente_doenca"]
                    ],
                    "stats" => $stats,
                    "alertas" => $alertas
                ]);

            default:
                jsonOut(["ok" => false, "erro" => "Recurso invalido."], 404);
        }
    }

    if ($method === "POST") {
        $input = json_decode(file_get_contents("php://input"), true) ?: $_POST;
        if ($recurso === "lembrete-toggle") {
            $id = (int)($input["id"] ?? 0);
            $cpf = requireCpf($input["cpf"] ?? "");
            $done = !empty($input["done"]) ? 1 : 0;
            $stmt = $conn->prepare("UPDATE lembretes SET concluido = ? WHERE id = ? AND cpf_paciente = ?");
            $stmt->bind_param("iis", $done, $id, $cpf);
            $stmt->execute();
            jsonOut(["ok" => true]);
        }
        jsonOut(["ok" => false, "erro" => "Acao invalida."], 400);
    }

    jsonOut(["ok" => false, "erro" => "Metodo nao permitido."], 405);
} catch (Throwable $e) {
    jsonOut(["ok" => false, "erro" => $e->getMessage()], 500);
}
