const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const exists = file => fs.existsSync(path.join(root, file));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function htmlFiles() {
  return fs.readdirSync(root).filter(file => /\.(html|php)$/.test(file));
}

function checkLocalLinks() {
  const missing = [];
  for (const file of htmlFiles()) {
    const html = read(file);
    if (html.includes('meta http-equiv="refresh"')) continue;
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const href = match[1];
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const clean = href.split("#")[0].split("?")[0];
      if (!clean || clean.startsWith("data:")) continue;
      if (!exists(clean)) missing.push(`${file} -> ${href}`);
    }
  }
  assert(!missing.length, `Links locais quebrados:\n${missing.join("\n")}`);
}

function checkRequiredUi() {
  const jogos = read("jogos.html");
  assert(jogos.includes("jogo-orientacao-tempo.html"), "Card de orientação ausente");
  assert(jogos.includes("jogo-fluencia-verbal.html"), "Card de fluência ausente");
  assert(jogos.includes("jogo-memoria-pares.html"), "Card de memória ausente");
  assert(jogos.includes("jogo-sequencia-luminosa.html"), "Card de sequência ausente");
  assert(jogos.includes("jogo-palavra-imagem.html"), "Card de palavra e imagem ausente");
  assert(jogos.includes("jogo-quebracabeca.html"), "Card de quebra-cabeça ausente");

  const music = read("musica.html");
  for (const token of ["data-music-play", "data-music-prev", "data-music-next", "data-sing-start", 'data-song-index="3"']) {
    assert(music.includes(token), `Música sem controle obrigatório: ${token}`);
  }

  const orientation = read("jogo-orientacao-tempo.html");
  for (const token of ["data-orientation-question", "data-orientation-options", "data-orientation-score", "data-orientation-reset"]) {
    assert(orientation.includes(token), `Orientação sem elemento obrigatório: ${token}`);
  }

  assert(read("jogo-fluencia-verbal.html").includes("data-fluency-feedback"), "Fluência precisa de feedback");
  assert(read("jogo-memoria-pares.html").includes("data-memory-board"), "Memória precisa de tabuleiro");
  assert(read("jogo-sequencia-luminosa.html").includes("data-simon-board"), "Sequência precisa de tabuleiro");
  assert(read("jogo-numeros-simples.html").includes("checkNumbers"), "Números simples precisa de verificação");
  assert(read("jogo-palavra-imagem.html").includes("data-word-game"), "Palavra e imagem precisa de área de jogo");
  assert(read("jogo-quebracabeca.html").includes("data-puzzle-board"), "Quebra-cabeça precisa de tabuleiro");

  assert(exists("login-paciente.html"), "Tela de login do paciente ausente");
  assert(exists("configuracoes.html"), "Tela de configurações ausente");
  assert(exists("historico-cuidador.html"), "Histórico do cuidador ausente");
}

function checkCssLayout() {
  assert(exists("assets/css/global.css"), "global.css ausente");
  assert(exists("assets/css/components.css"), "components.css ausente");
  const css = read("assets/css/components.css");
  assert(!css.includes("width: min(100%, 480px)"), "Layout ainda preso em 480px");
  assert(css.includes(".hero-stats"), "CSS sem layout dos stats do hero");
  assert(css.includes(".orientation-options"), "CSS sem layout de orientação");
  assert(read("assets/css/lembra-v2.css").includes("@import"), "lembra-v2.css deve importar módulos");
}

function checkBackendSql() {
  const schema = read("connect/schema.sql");
  for (const table of ["cadastro", "cuidadores", "lembretes", "humor_registros", "jogo_sessoes", "musica_sessoes", "localizacao_registros"]) {
    assert(schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Tabela ausente: ${table}`);
  }
  assert(read("connect/init_db.php").includes("schema.sql"), "init_db.php deve aplicar schema.sql");
  assert(read("connect/api_evento.php").includes("humor_registros"), "api_evento.php deve registrar humor");
  assert(read("connect/api_evento.php").includes("localizacao_registros"), "api_evento.php deve registrar localização");
  assert(exists("connect/api.php"), "api.php ausente");
  assert(read("connect/api.php").includes("case \"progresso\""), "api.php deve expor progresso");
  assert(read("connect/schema.sql").includes("musica_favoritas"), "schema sem musica_favoritas");
  assert(read("connect/cadastro_cuidador.php").includes("CPF do paciente nao encontrado"), "Cuidador deve exigir paciente existente");
}

function checkJavaScriptSyntaxAndFunctions() {
  const js = read("assets/script/lembra-v2.js");
  new vm.Script(js);
  assert(js.includes("fetchApi"), "Front deve buscar dados na API");
  assert(js.includes("loadPatientData"), "Front deve carregar dados do paciente");
  assert(!js.includes("defaultReminders"), "Nao deve usar lembretes mockados");
  for (const fn of [
    "initOrientationGame",
    "setupMusic",
    "initMemoryGame",
    "initFluencyGame",
    "initSimonGame",
    "initWordImageGame",
    "initPuzzleGame",
    "showCompletion",
    "renderPatientNav",
    "initQuickIcons"
  ]) {
    assert(js.includes(`function ${fn}`), `Função ausente: ${fn}`);
  }
}

const checks = [
  checkLocalLinks,
  checkRequiredUi,
  checkCssLayout,
  checkBackendSql,
  checkJavaScriptSyntaxAndFunctions
];

for (const check of checks) {
  check();
  console.log(`OK ${check.name}`);
}

console.log("Todos os testes estaticos passaram.");
