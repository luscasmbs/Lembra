const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const map = {
  "p2.html": "boas-vindas.html",
  "p3.html": "inicio-paciente.html",
  "p4.html": "musica.html",
  "p5.html": "adicionar-lembrete.html",
  "p6.html": "lembretes.html",
  "p7.html": "cadastro-paciente.html",
  "p8.html": "videos.html",
  "p9.html": "jogos.html",
  "p10.html": "painel-cuidador.html",
  "p11.html": "cadastro-cuidador.html",
  "Memory.html": "jogo-memoria-pares.html",
  "genius.html": "jogo-sequencia-luminosa.html",
  "orientacao.html": "jogo-orientacao-tempo.html",
  "fluencia.html": "jogo-fluencia-verbal.html",
  "sudoku.html": "jogo-numeros-simples.html"
};

const replacements = [
  [/p2\.html/g, "boas-vindas.html"],
  [/p3\.html/g, "inicio-paciente.html"],
  [/p4\.html/g, "musica.html"],
  [/p5\.html/g, "adicionar-lembrete.html"],
  [/p6\.html/g, "lembretes.html"],
  [/p7\.html/g, "cadastro-paciente.html"],
  [/p8\.html/g, "videos.html"],
  [/p9\.html/g, "jogos.html"],
  [/p10\.html/g, "painel-cuidador.html"],
  [/p11\.html/g, "cadastro-cuidador.html"],
  [/Memory\.html/g, "jogo-memoria-pares.html"],
  [/genius\.html/g, "jogo-sequencia-luminosa.html"],
  [/orientacao\.html/g, "jogo-orientacao-tempo.html"],
  [/fluencia\.html/g, "jogo-fluencia-verbal.html"],
  [/sudoku\.html/g, "jogo-numeros-simples.html"]
];

function redirect(target) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=./${target}">
  <script>location.replace("./${target}");</script>
  <title>Redirecionando…</title>
</head>
<body><p><a href="./${target}">Continuar para ${target}</a></p></body>
</html>
`;
}

for (const [oldName, newName] of Object.entries(map)) {
  const oldPath = path.join(root, oldName);
  if (!fs.existsSync(oldPath)) continue;
  let html = fs.readFileSync(oldPath, "utf8");
  if (!fs.existsSync(path.join(root, newName))) {
    for (const [pattern, value] of replacements) {
      html = html.replace(pattern, value);
    }
    html = html.replace(
      /<link rel="stylesheet" href="\.\/assets\/css\/lembra-v2\.css">/,
      '<link rel="stylesheet" href="./assets/css/global.css">\n  <link rel="stylesheet" href="./assets/css/components.css">'
    );
    fs.writeFileSync(path.join(root, newName), html, "utf8");
    console.log("created", newName);
  }
  fs.writeFileSync(oldPath, redirect(newName), "utf8");
  console.log("redirect", oldName, "->", newName);
}
