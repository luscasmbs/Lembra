const LembraStore = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const EMPTY_PATIENT = {
  nome: "",
  cpf: "",
  telefone: "",
  tipo: "",
  doenca: "",
  restricao: ""
};

const QUICK_ICONS = {
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  video: '<rect x="2" y="5" width="20" height="14" rx="2"/><polygon points="10 9 16 12 10 15 10 9" fill="#fff" stroke="none"/>',
  star: '<path d="M12 2l2.4 6.26L21 9.27l-5 4.87 1.18 6.88L12 17.77l-5.18 3.25L8 14.14 3 9.27l6.6-1.01z"/>'
};

let appReminders = [];
let appProgresso = null;
let appHistorico = [];
let appMusicas = [];

function getPatient() {
  return { ...EMPTY_PATIENT, ...LembraStore.get("dados", EMPTY_PATIENT) };
}

function getCaregiverSettings() {
  return LembraStore.get("caregiverSettings", {
    nome: "",
    email: "",
    cpfPaciente: "",
    timerEnabled: false,
    moodScale: "simple",
    patientStage: "moderado"
  });
}

function hasPatientSession() {
  return Boolean(getPatient().cpf);
}

async function fetchApi(recurso, extra = {}) {
  const patient = getPatient();
  const params = new URLSearchParams({ recurso, ...extra });
  if (patient.cpf && !extra.email && !extra.cpf_paciente) {
    params.set("cpf", patient.cpf);
  }
  const response = await fetch(`./connect/api.php?${params}`);
  if (!response.ok) throw new Error("Falha na API");
  return response.json();
}

function emptyState(message, icon = "📋") {
  return `<div class="empty-state">${icon}<br>${escapeHtml(message)}</div>`;
}

function initQuickIcons() {
  const map = { bell: QUICK_ICONS.bell, music: QUICK_ICONS.music, video: QUICK_ICONS.video, star: QUICK_ICONS.star };
  qsa("[data-icon]").forEach(el => {
    const key = el.dataset.icon;
    if (!map[key]) return;
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${map[key]}</svg>`;
  });
}

function syncEvent(tipo, payload = {}) {
  if (typeof fetch !== "function") return;
  const patient = getPatient();
  fetch("./connect/api_evento.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, cpf: patient.cpf || "", ...payload })
  }).catch(() => {});
}

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

const ROTAS = {
  inicioPaciente: "./inicio-paciente.html",
  jogos: "./jogos.html"
};

function goTo(path) {
  window.location.href = path;
}

const NAV_PACIENTE = [
  { id: "inicio", label: "Início", href: "./inicio-paciente.html", icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { id: "lembretes", label: "Lembretes", href: "./lembretes.html", icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
  { id: "jogos", label: "Jogos", href: "./jogos.html", icon: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01M7 12h.01M17 12h.01"/>' },
  {
    id: "config",
    label: "Config.",
    href: "./configuracoes.html",
    icon: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
  }
];

const NAV_CUIDADOR = [
  { id: "inicio", label: "Início", href: "./painel-cuidador.html", icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { id: "historico", label: "Histórico", href: "./historico-cuidador.html", icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { id: "localizacao", label: "Localização", href: "./localizacao-cuidador.html", icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' },
  { id: "paciente", label: "Paciente", href: "./dados-paciente-cuidador.html", icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>' }
];

function renderPatientNav() {
  const nav = qs("[data-patient-nav]");
  if (!nav) return;
  const active = nav.dataset.active || "";
  nav.innerHTML = NAV_PACIENTE.map(item => `
    <a class="nav-item ${item.id === active ? "active" : ""}" href="${item.href}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${item.icon}</svg>
      <span>${item.label}</span>
    </a>
  `).join("");
}

function renderCareNav() {
  const nav = qs("[data-care-nav]");
  if (!nav) return;
  const active = nav.dataset.active || "";
  nav.innerHTML = NAV_CUIDADOR.map(item => `
    <a class="nav-item ${item.id === active ? "active" : ""}" href="${item.href}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${item.icon}</svg>
      <span>${item.label}</span>
    </a>
  `).join("");
}

function fillPatientCopy() {
  const patient = getPatient();
  const displayName = patient.nome || "Paciente";
  qsa("[data-patient-name]").forEach(el => {
    el.textContent = displayName;
  });
  qsa("[data-patient-initials]").forEach(el => {
    el.textContent = patient.nome ? initials(patient.nome) : "—";
  });
  qsa("[data-patient-condition]").forEach(el => {
    el.textContent = patient.doenca || "—";
  });
  qsa("[data-patient-type]").forEach(el => {
    el.textContent = patient.tipo || "—";
  });
  qsa("[data-patient-fullname]").forEach(el => {
    el.textContent = patient.nome || "—";
  });
  qsa("[data-patient-phone]").forEach(el => {
    el.textContent = patient.telefone || "—";
  });
  qsa("[data-patient-notes]").forEach(el => {
    el.textContent = patient.restricao || "—";
  });
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || "")
    .join("")
    .toUpperCase();
}

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

function savePatientForm(form) {
  const data = {
    nome: form.nome.value.trim(),
    cpf: form.cpf.value.trim(),
    telefone: form.telefone.value.trim(),
    tipo: form.tipo.value,
    doenca: form.medico.value.trim(),
    restricao: form.restricao.value.trim()
  };
  LembraStore.set("dados", data);
}

function saveCaregiverForm(form) {
  const settings = getCaregiverSettings();
  settings.nome = form.nome_cuidador.value.trim();
  settings.email = form.email_cuidador.value.trim();
  settings.cpfPaciente = form.cpf_paciente.value.trim();
  settings.patientStage = form.estagio.value;
  settings.timerEnabled = form.timer_jogos.checked;
  settings.moodScale = form.estagio.value === "moderado" ? "simple" : "expanded";
  LembraStore.set("caregiverSettings", settings);
}

function setupForms() {
  const patientForm = qs("[data-patient-form]");
  if (patientForm) {
    patientForm.addEventListener("submit", () => savePatientForm(patientForm));
  }

  const caregiverForm = qs("[data-caregiver-form]");
  if (caregiverForm) {
    caregiverForm.addEventListener("submit", () => saveCaregiverForm(caregiverForm));
  }
}

function getReminders() {
  return appReminders;
}

async function loadPatientData() {
  if (!hasPatientSession()) {
    appReminders = [];
    appProgresso = null;
    appHistorico = [];
    appMusicas = [];
    return;
  }
  try {
    const [lembretesRes, progressoRes, historicoRes, musicasRes, pacienteRes] = await Promise.all([
      fetchApi("lembretes"),
      fetchApi("progresso"),
      fetchApi("historico"),
      fetchApi("musicas"),
      fetchApi("paciente")
    ]);
    if (lembretesRes.ok) appReminders = lembretesRes.lembretes || [];
    if (progressoRes.ok) appProgresso = progressoRes.progresso;
    if (historicoRes.ok) appHistorico = historicoRes.historico || [];
    if (musicasRes.ok) appMusicas = musicasRes.musicas || [];
    if (pacienteRes.ok && pacienteRes.paciente) {
      LembraStore.set("dados", { ...getPatient(), ...pacienteRes.paciente, doenca: pacienteRes.paciente.doenca });
    }
  } catch {
    appReminders = [];
    appProgresso = null;
    appHistorico = [];
    appMusicas = [];
  }
}

async function loadCaregiverData() {
  const care = getCaregiverSettings();
  if (!care.email && !care.cpfPaciente) return null;
  try {
    const res = await fetchApi("cuidador", { email: care.email || "", cpf_paciente: care.cpfPaciente || "" });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

function renderReminders(limit = Infinity) {
  const container = qs("[data-reminders]");
  if (!container) return;

  if (!hasPatientSession()) {
    container.innerHTML = emptyState("Faça seu cadastro para ver lembretes.", "🔔");
    return;
  }

  const reminders = [...appReminders].sort((a, b) => a.time.localeCompare(b.time));
  const items = reminders.slice(0, limit);

  if (!items.length) {
    container.innerHTML = emptyState(
      qs("[data-care-dashboard]") ? "Seu paciente ainda não tem lembretes cadastrados." : "Nenhum lembrete cadastrado ainda. Peça ao seu cuidador para adicionar.",
      "🔔"
    );
    return;
  }

  container.innerHTML = "";
  items.forEach(reminder => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div class="badge violet">${escapeHtml(reminder.time)}</div>
      <div class="tile-icon" style="background:${reminder.type === "Medicacao" ? "var(--amber)" : "var(--violet)"}">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
      </div>
      <div style="flex:1">
        <div class="row-title">${escapeHtml(reminder.text)}</div>
        <div class="row-subtitle">${escapeHtml(reminder.type || "Rotina")}</div>
      </div>
      <button class="check ${reminder.done ? "done" : ""}" type="button" aria-label="Marcar lembrete"></button>
    `;
    qs(".check", row).addEventListener("click", async () => {
      const next = !reminder.done;
      reminder.done = next;
      if (reminder.id) {
        await fetch("./connect/api.php?recurso=lembrete-toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: getPatient().cpf, id: reminder.id, done: next })
        }).catch(() => {});
      }
      renderReminders(limit);
      renderHomeSummary();
    });
    container.appendChild(row);
  });
}

function setupReminderForm() {
  const form = qs("[data-reminder-form]");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const text = form.lembrete.value.trim();
    const time = form.hora.value;
    const type = form.tipo.value;
    if (!text || !time) return;
    syncEvent("lembrete", { titulo: text, categoria: type, horario: time });
    form.reset();
    loadPatientData().then(() => {
      renderReminders();
      renderHomeSummary();
    });
  });
}

function setupMood() {
  const moodRoot = qs("[data-mood]");
  if (!moodRoot) return;
  qsa("[data-mood-value]", moodRoot).forEach(button => {
    button.addEventListener("click", () => {
      qsa("[data-mood-value]", moodRoot).forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      LembraStore.set("lastMood", {
        value: button.dataset.moodValue,
        at: new Date().toISOString()
      });
      syncEvent("humor", { humor: button.dataset.moodValue });
    });
  });
}

function setupTabs() {
  qsa("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      const value = button.dataset.filter;
      qsa("[data-filter]").forEach(item => item.classList.toggle("active", item === button));
      qsa("[data-category]").forEach(card => {
        card.style.display = value === "Todos" || card.dataset.category === value ? "" : "none";
      });
    });
  });
}

function showCompletion(gameName, points = 120) {
  const patient = getPatient();
  syncEvent("jogo", { jogo: gameName, pontos: points, resultado: "concluido" });
  loadPatientData().then(() => {
    renderDashboardBits();
    renderHomeSummary();
  });
  const finish = qs("[data-finish]");
  if (!finish) return;
  finish.innerHTML = `
    <h2>🎉 Parabens, ${escapeHtml(patient.nome || "voce")}!</h2>
    <p class="muted">Voce concluiu ${escapeHtml(gameName)} hoje e ganhou <strong>${points} pontos</strong>.</p>
    <div class="actions">
      <button class="btn" type="button" data-close-finish>Continuar</button>
      <a class="btn secondary" href="./jogos.html">Ver outros jogos</a>
    </div>
  `;
  finish.classList.add("show");
  qs("[data-close-finish]", finish).addEventListener("click", () => finish.classList.remove("show"));
}

function setupTimerPreference() {
  const timerAreas = qsa("[data-optional-timer]");
  if (!timerAreas.length) return;
  const settings = getCaregiverSettings();
  timerAreas.forEach(area => {
    area.hidden = !settings.timerEnabled;
  });
}

function initMemoryGame() {
  const board = qs("[data-memory-board]");
  if (!board) return;
  const movesEl = qs("[data-memory-moves]");
  const pairsEl = qs("[data-memory-pairs]");
  const symbols = ["🏠", "🌸", "☀️", "🌙", "☕", "📷", "🍞", "📻"];
  const cards = shuffle([...symbols, ...symbols]);
  let first = null;
  let lock = false;
  let moves = 0;
  let pairs = 0;
  board.innerHTML = "";
  cards.forEach(symbol => {
    const button = document.createElement("button");
    button.className = "memory-card";
    button.type = "button";
    button.dataset.symbol = symbol;
    button.textContent = "?";
    button.addEventListener("click", () => {
      if (lock || button.classList.contains("matched") || button === first) return;
      reveal(button);
      if (!first) {
        first = button;
        return;
      }
      moves += 1;
      if (movesEl) movesEl.textContent = String(moves);
      if (first.dataset.symbol === button.dataset.symbol) {
        first.classList.add("matched");
        button.classList.add("matched");
        first = null;
        pairs += 1;
        if (pairsEl) pairsEl.textContent = `${pairs}/8`;
        if (pairs === symbols.length) showCompletion("Memoria de Pares", 160);
      } else {
        lock = true;
        setTimeout(() => {
          hide(first);
          hide(button);
          first = null;
          lock = false;
        }, 850);
      }
    });
    board.appendChild(button);
  });
}

function reveal(button) {
  button.classList.add("revealed");
  button.textContent = button.dataset.symbol;
}

function hide(button) {
  if (!button) return;
  button.classList.remove("revealed");
  button.textContent = "?";
}

function initFluencyGame() {
  const form = qs("[data-fluency-form]");
  if (!form) return;
  const list = qs("[data-fluency-list]");
  const score = qs("[data-fluency-score]");
  const prompt = qs("[data-fluency-prompt]");
  const feedback = qs("[data-fluency-feedback]");
  const prompts = [
    { letter: "A", category: "animais", examples: ["anta", "arara", "abelha"] },
    { letter: "C", category: "alimentos", examples: ["cafe", "caju", "canjica"] },
    { letter: "M", category: "objetos da casa", examples: ["mesa", "mala", "manta"] }
  ];
  const current = prompts[Math.floor(Math.random() * prompts.length)];
  const words = new Set();
  prompt.textContent = `Diga ou escreva ${current.category} que comecam com a letra ${current.letter}.`;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const word = form.palavra.value.trim().toLowerCase();
    if (!word) return;
    if (!word.startsWith(current.letter.toLowerCase())) {
      if (feedback) feedback.textContent = `Tente uma palavra que comece com ${current.letter}.`;
      return;
    }
    if (words.has(word)) {
      if (feedback) feedback.textContent = "Essa palavra ja entrou. Tente outra.";
      return;
    }
    words.add(word);
    const chip = document.createElement("span");
    chip.className = "word-chip";
    chip.textContent = word;
    list.appendChild(chip);
    score.textContent = String(words.size);
    if (feedback) feedback.textContent = "Boa lembranca.";
    form.palavra.value = "";
    if (words.size >= 6) showCompletion("Fluencia Verbal", 180);
  });

  const help = qs("[data-fluency-help]");
  if (help) {
    help.addEventListener("click", () => {
      form.palavra.value = current.examples[Math.min(words.size, current.examples.length - 1)];
      form.palavra.focus();
    });
  }
}

function initSimonGame() {
  const board = qs("[data-simon-board]");
  if (!board) return;
  const pads = qsa("[data-color]", board);
  const start = qs("[data-simon-start]");
  const status = qs("[data-simon-status]");
  const colors = pads.map(pad => pad.dataset.color);
  let sequence = [];
  let player = [];
  let canPlay = false;

  start.addEventListener("click", () => {
    sequence = [];
    nextRound();
  });

  pads.forEach(pad => {
    pad.addEventListener("click", () => {
      if (!canPlay) return;
      const color = pad.dataset.color;
      flash(pad);
      player.push(color);
      if (sequence[player.length - 1] !== color) {
        canPlay = false;
        status.textContent = "Tudo bem. Vamos tentar de novo com calma.";
        showCompletion("Sequencia Luminosa", 80);
        return;
      }
      if (player.length === sequence.length) {
        if (sequence.length >= 5) {
          canPlay = false;
          showCompletion("Sequencia Luminosa", 160);
        } else {
          setTimeout(nextRound, 900);
        }
      }
    });
  });

  function nextRound() {
    player = [];
    canPlay = false;
    sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    status.textContent = `Nivel ${sequence.length}. Observe a sequencia.`;
    sequence.forEach((color, index) => {
      setTimeout(() => flash(qs(`[data-color="${color}"]`, board)), 650 * (index + 1));
    });
    setTimeout(() => {
      canPlay = true;
      status.textContent = "Sua vez. Toque nas cores na mesma ordem.";
    }, 650 * sequence.length + 500);
  }
}

function flash(pad) {
  pad.classList.add("active");
  setTimeout(() => pad.classList.remove("active"), 350);
}

function setupMusic() {
  const title = qs("[data-music-title]");
  const artist = qs("[data-music-artist]");
  const play = qs("[data-music-play]");
  const prev = qs("[data-music-prev]");
  const next = qs("[data-music-next]");
  const progress = qs("[data-music-progress]");
  const currentTime = qs("[data-music-current]");
  const durationEl = qs("[data-music-duration]");
  const lyrics = qs("[data-lyrics]");
  const start = qs("[data-sing-start]");
  if (!title || !artist || !play || !lyrics || !start) return;

  const songs = [
    {
      name: "Tropeiro Velho",
      artist: "Sertanejo classico",
      duration: 200,
      color: "var(--violet)",
      lines: ["Eu sou o tropeiro velho", "Pelas estradas eu vou", "Levando lembrancas boas", "Do tempo que ficou"]
    },
    {
      name: "Garota de Ipanema",
      artist: "Bossa Nova",
      duration: 188,
      color: "var(--green)",
      lines: ["Olha que coisa mais linda", "Mais cheia de graca", "E um doce balanco", "Que acalma o coracao"]
    },
    {
      name: "Asa Branca",
      artist: "Forro classico",
      duration: 182,
      color: "var(--amber)",
      lines: ["Quando olhei a terra ardendo", "Eu perguntei com carinho", "Guardei lembrancas boas", "Pra cantar devagarinho"]
    },
    {
      name: "Carinhoso",
      artist: "Choro classico",
      duration: 196,
      color: "var(--red)",
      lines: ["Meu coracao recorda", "Uma cancao de amor", "Canto junto bem baixinho", "Com calma e com calor"]
    }
  ];

  let active = Number(localStorage.getItem("activeSongIndex") || 0);
  let elapsed = 0;
  let lyricIndex = 0;
  let playing = false;
  let timer = null;

  function format(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  }

  function renderSong(resetTime = true) {
    const song = songs[active];
    if (resetTime) elapsed = 0;
    lyricIndex = 0;
    title.textContent = song.name;
    artist.textContent = song.artist;
    durationEl.textContent = format(song.duration);
    currentTime.textContent = format(elapsed);
    progress.style.width = `${Math.min(100, (elapsed / song.duration) * 100)}%`;
    progress.style.background = song.color;
    lyrics.innerHTML = '<div class="section-title" style="padding:0 0 12px">Letra grande</div>' +
      song.lines.map((line, index) => `<p class="lyrics" data-line style="${index ? "display:none" : ""}">${escapeHtml(line)}</p>`).join("");
    qsa("[data-song-index]").forEach(item => {
      item.classList.toggle("active", Number(item.dataset.songIndex) === active);
    });
    LembraStore.set("lastSong", { name: song.name, artist: song.artist, at: new Date().toISOString() });
    localStorage.setItem("activeSongIndex", String(active));
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function setPlaying(value) {
    playing = value;
    play.textContent = playing ? "⏸ Pausar" : "▶ Tocar";
    stopTimer();
    if (!playing) return;
    syncEvent("musica", { musica: songs[active].name, artista: songs[active].artist, duracao: songs[active].duration });
    timer = setInterval(() => {
      const song = songs[active];
      elapsed += 1;
      if (elapsed >= song.duration) {
        active = (active + 1) % songs.length;
        renderSong(true);
      } else {
        currentTime.textContent = format(elapsed);
        progress.style.width = `${Math.min(100, (elapsed / song.duration) * 100)}%`;
      }
    }, 1000);
  }

  renderSong(true);

  play.addEventListener("click", () => setPlaying(!playing));
  prev.addEventListener("click", () => {
    active = (active - 1 + songs.length) % songs.length;
    renderSong(true);
  });
  next.addEventListener("click", () => {
    active = (active + 1) % songs.length;
    renderSong(true);
  });

  let index = 0;
  start.addEventListener("click", () => {
    const lines = qsa("[data-line]", lyrics);
    if (!lines.length) return;
    lines.forEach(line => line.style.display = "none");
    lines[lyricIndex].style.display = "block";
    lyricIndex = (lyricIndex + 1) % lines.length;
  });

  qsa("[data-song-index]").forEach(song => {
    song.addEventListener("click", () => {
      active = Number(song.dataset.songIndex);
      renderSong(true);
    });
  });
}

function initOrientationGame() {
  const questionEl = qs("[data-orientation-question]");
  const optionsEl = qs("[data-orientation-options]");
  if (!questionEl || !optionsEl) return;

  const feedback = qs("[data-orientation-feedback]");
  const scoreEl = qs("[data-orientation-score]");
  const progressEl = qs("[data-orientation-progress]");
  const reset = qs("[data-orientation-reset]");
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now);
  const hour = now.getHours();
  const period = hour < 12 ? "manha" : hour < 18 ? "tarde" : "noite";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const questions = [
    {
      text: "Que dia da semana e hoje?",
      answer: weekday,
      options: shuffle([weekday, new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(yesterday), new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(tomorrow)])
    },
    {
      text: "Em que mes estamos?",
      answer: month,
      options: shuffle([month, "janeiro", "agosto"])
    },
    {
      text: "Agora parece ser qual parte do dia?",
      answer: period,
      options: ["manha", "tarde", "noite"]
    },
    {
      text: "Qual atividade combina com a rotina de hoje?",
      answer: "jogo cognitivo",
      options: ["jogo cognitivo", "viagem longa", "consulta sem aviso"]
    }
  ];

  let current = 0;
  let score = 0;

  function renderQuestion() {
    const item = questions[current];
    questionEl.textContent = item.text;
    feedback.textContent = "";
    optionsEl.innerHTML = "";
    item.options.forEach(option => {
      const button = document.createElement("button");
      button.className = "mood-option";
      button.type = "button";
      button.textContent = option;
      button.addEventListener("click", () => answer(option));
      optionsEl.appendChild(button);
    });
    scoreEl.textContent = String(score);
    progressEl.style.width = `${(score / questions.length) * 100}%`;
  }

  function answer(option) {
    const item = questions[current];
    if (option === item.answer) {
      score += 1;
      feedback.textContent = "Muito bem. Vamos para a proxima.";
      current += 1;
      if (current >= questions.length) {
        scoreEl.textContent = String(score);
        progressEl.style.width = "100%";
        showCompletion("Orientacao no Tempo", 140);
        LembraStore.set("lastOrientation", { score, total: questions.length, at: new Date().toISOString() });
        return;
      }
      setTimeout(renderQuestion, 500);
    } else {
      feedback.textContent = `Quase. Uma pista: a resposta certa e "${item.answer}". Tente tocar nela.`;
    }
  }

  reset.addEventListener("click", () => {
    current = 0;
    score = 0;
    renderQuestion();
  });

  renderQuestion();
}

function setupLoginForms() {
  const patientLogin = qs("[data-login-paciente]");
  if (patientLogin) {
    patientLogin.addEventListener("submit", event => {
      event.preventDefault();
      const nome = patientLogin.nome.value.trim();
      if (nome) {
        const data = getPatient();
        data.nome = nome;
        LembraStore.set("dados", data);
      }
      goTo("./inicio-paciente.html");
    });
  }

  const careLogin = qs("[data-login-cuidador]");
  if (careLogin) {
    careLogin.addEventListener("submit", event => {
      event.preventDefault();
      goTo("./painel-cuidador.html");
    });
  }
}

function setupSettings() {
  const settings = LembraStore.get("appSettings", {});
  qsa("[data-toggle-setting]").forEach(row => {
    const key = row.dataset.toggleSetting;
    const toggle = qs(".toggle-switch", row);
    if (!toggle) return;
    if (settings[key]) toggle.classList.remove("off");
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("off");
      settings[key] = !toggle.classList.contains("off");
      LembraStore.set("appSettings", settings);
      document.body.classList.toggle("text-large", settings.textoGrande);
      document.body.classList.toggle("high-contrast", settings.altoContraste);
    });
  });
  if (settings.textoGrande) document.body.classList.add("text-large");
  if (settings.altoContraste) document.body.classList.add("high-contrast");
}

function renderActivityHistory() {
  const container = qs("[data-activity-history]");
  if (!container) return;

  if (!appHistorico.length) {
    container.innerHTML = emptyState("Nenhuma atividade registrada ainda.", "🕐");
    return;
  }

  container.innerHTML = `
    <div class="section-title">Recentes</div>
    ${appHistorico.map(item => `
      <div class="hist-item">
        <div class="hist-time">${escapeHtml(item.time)}</div>
        <div class="hist-dot" style="background:${item.color || "var(--violet)"}"></div>
        <div style="flex:1">
          <div class="row-title">${escapeHtml(item.title)}</div>
          <div class="row-subtitle">${escapeHtml(item.sub || "")}</div>
        </div>
      </div>
    `).join("")}
  `;
}

function renderContacts() {
  const container = qs("[data-contacts-list]");
  if (!container) return;
  const contacts = LembraStore.get("emergencyContacts", []);
  if (!contacts.length) {
    container.innerHTML = emptyState("Nenhum contato de emergência cadastrado.", "📞");
    return;
  }
  container.innerHTML = contacts.map(contact => `
    <div class="contact-item">
      <div style="width:42px;height:42px;border-radius:50%;background:${contact.color};display:grid;place-items:center;font-weight:800;color:var(--violet-dark)">${escapeHtml(contact.initials)}</div>
      <div style="flex:1">
        <div class="row-title">${escapeHtml(contact.name)}</div>
        <div class="row-subtitle">${escapeHtml(contact.rel)}</div>
      </div>
      <div class="contact-actions">
        <a class="contact-btn" style="background:var(--green-soft)" href="${contact.phone || "#"}">
          <svg viewBox="0 0 24 24" stroke="var(--green)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6.29 6.29l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </a>
      </div>
    </div>
  `).join("");
}

function initWordImageGame() {
  const root = qs("[data-word-game]");
  if (!root) return;
  const intro = qs("[data-word-intro]", root);
  const play = qs("[data-word-play]", root);
  const start = qs("[data-word-start]", root);
  const optionsEl = qs("[data-word-options]", root);
  const scoreEl = qs("[data-word-score]", root);
  const roundEl = qs("[data-word-round]", root);
  const emojiEl = qs("[data-word-emoji]", root);
  const feedback = qs("[data-word-feedback]", root);

  const rounds = [
    { emoji: "🍎", answer: "maçã", options: ["maçã", "cadeira", "rio"] },
    { emoji: "🏠", answer: "casa", options: ["casa", "nuvem", "trem"] },
    { emoji: "☕", answer: "café", options: ["café", "livro", "praia"] },
    { emoji: "🌸", answer: "flor", options: ["flor", "carro", "relógio"] },
    { emoji: "🐕", answer: "cachorro", options: ["cachorro", "mesa", "lua"] },
    { emoji: "📻", answer: "rádio", options: ["rádio", "sapato", "porta"] }
  ];

  let index = 0;
  let score = 0;

  start.addEventListener("click", () => {
    intro.hidden = true;
    play.hidden = false;
    renderRound();
  });

  function renderRound() {
    const item = rounds[index];
    emojiEl.textContent = item.emoji;
    roundEl.textContent = String(index + 1);
    scoreEl.textContent = String(score);
    feedback.textContent = "";
    optionsEl.innerHTML = shuffle([...item.options]).map(word => `
      <button class="word-option" type="button" data-word="${escapeHtml(word)}">${escapeHtml(word)}</button>
    `).join("");
    qsa(".word-option", optionsEl).forEach(button => {
      button.addEventListener("click", () => choose(button, item.answer));
    });
  }

  function choose(button, answer) {
    const word = button.dataset.word;
    qsa(".word-option", optionsEl).forEach(item => item.disabled = true);
    if (word === answer) {
      button.classList.add("correct");
      score += 1;
      feedback.textContent = "Muito bem!";
    } else {
      button.classList.add("wrong");
      feedback.textContent = `Quase! A resposta certa é "${answer}".`;
    }
    scoreEl.textContent = String(score);
    index += 1;
    if (index >= rounds.length) {
      setTimeout(() => {
        showCompletion("Palavra e Imagem", 120 + score * 10);
      }, 900);
      return;
    }
    setTimeout(renderRound, 900);
  }
}

function initPuzzleGame() {
  const root = qs("[data-puzzle-game]");
  if (!root) return;
  const intro = qs("[data-puzzle-intro]", root);
  const play = qs("[data-puzzle-play]", root);
  const start = qs("[data-puzzle-start]", root);
  const board = qs("[data-puzzle-board]", root);
  const movesEl = qs("[data-puzzle-moves]", root);
  const resetBtn = qs("[data-puzzle-reset]", root);
  const tiles = ["🌻", "🏡", "🌳", "☀️", "🐦", "🌈", "🍃", "⭐", ""];
  let state = [];
  let moves = 0;

  start.addEventListener("click", () => {
    intro.hidden = true;
    play.hidden = false;
    reset();
  });

  resetBtn.addEventListener("click", reset);

  function reset() {
    state = [...tiles];
    let empty = state.indexOf("");
    for (let i = 0; i < 40; i++) {
      const neighbors = [empty - 1, empty + 1, empty - 3, empty + 3].filter(index => {
        if (index < 0 || index > 8) return false;
        if (Math.abs(index - empty) === 1 && Math.floor(index / 3) !== Math.floor(empty / 3)) return false;
        return true;
      });
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      [state[empty], state[next]] = [state[next], state[empty]];
      empty = next;
    }
    moves = 0;
    if (movesEl) movesEl.textContent = "0";
    render();
  }

  function render() {
    board.innerHTML = "";
    state.forEach((value, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `puzzle-tile ${value ? "" : "empty"}`;
      button.textContent = value;
      button.addEventListener("click", () => move(index));
      board.appendChild(button);
    });
  }

  function move(index) {
    const empty = state.indexOf("");
    const valid = [empty - 1, empty + 1, empty - 3, empty + 3];
    if (!valid.includes(index)) return;
    if (Math.abs(empty - index) === 3 && Math.floor(empty / 3) !== Math.floor(index / 3)) return;
    [state[empty], state[index]] = [state[index], state[empty]];
    moves += 1;
    if (movesEl) movesEl.textContent = String(moves);
    render();
    if (state.every((value, i) => value === tiles[i])) {
      showCompletion("Quebra-cabeça", 150);
    }
  }
}

function renderHomeSummary() {
  const pending = appReminders.filter(r => !r.done).length;
  const badgeRem = qs("[data-home-reminder-badge]");
  if (badgeRem) {
    if (pending > 0) {
      badgeRem.textContent = `${pending} pendente${pending > 1 ? "s" : ""}`;
      badgeRem.hidden = false;
    } else {
      badgeRem.textContent = "";
      badgeRem.hidden = true;
    }
  }

  const streakBadge = qs("[data-home-streak-badge]");
  const streak = appProgresso?.streak || 0;
  if (streakBadge) {
    if (streak > 0) {
      streakBadge.textContent = `🔥 ${streak} dia${streak > 1 ? "s" : ""} seguidos`;
      streakBadge.hidden = false;
    } else {
      streakBadge.hidden = true;
    }
  }

  const lastSongEl = qs("[data-last-song]");
  if (lastSongEl) {
    if (appMusicas.length) {
      lastSongEl.textContent = appMusicas[0].name;
      lastSongEl.hidden = false;
    } else {
      lastSongEl.hidden = true;
    }
  }

  const videoBadge = qs("[data-home-video-badge]");
  if (videoBadge) videoBadge.hidden = true;

  const nextSection = qs("[data-next-reminder-section]");
  const nextEl = qs("[data-next-reminder]");
  const next = appReminders.filter(r => !r.done).sort((a, b) => a.time.localeCompare(b.time))[0];
  if (nextSection && nextEl) {
    if (next) {
      nextSection.hidden = false;
      nextEl.innerHTML = `
        <span class="tile-icon" style="background:var(--amber)"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg></span>
        <div style="flex:1">
          <div class="row-title">${escapeHtml(next.text)}</div>
          <div class="row-subtitle">${escapeHtml(next.type || "Rotina")}</div>
        </div>
        <span class="badge violet">${escapeHtml(next.time)}</span>
      `;
    } else {
      nextSection.hidden = true;
    }
  }

  const label = qs("[data-progress-label]");
  const percentEl = qs("[data-progress-percent]");
  const bar = qs("[data-progress-bar]");
  if (label && percentEl && bar && appProgresso) {
    const { concluidas, meta, percent } = appProgresso;
    if (concluidas > 0) {
      label.textContent = `${concluidas} de ${meta} atividades concluídas`;
      percentEl.textContent = `${percent}%`;
      bar.style.width = `${percent}%`;
    } else {
      label.textContent = "Nenhuma atividade registrada ainda";
      percentEl.textContent = "0%";
      bar.style.width = "0%";
    }
  }
}

function renderCareDashboard(apiData) {
  const care = apiData?.cuidador;
  const stats = apiData?.stats;
  const emptyPatient = qs("[data-care-empty-patient]");
  const chip = qs("[data-patient-chip]");

  if (!care?.cpfPaciente || !care.pacienteNome) {
    if (emptyPatient) emptyPatient.hidden = false;
    if (chip) chip.hidden = true;
    const rem = qs("[data-stat-remedios]");
    if (rem) rem.textContent = "0/0";
    const jog = qs("[data-stat-jogos]");
    if (jog) jog.textContent = "0";
    const mus = qs("[data-stat-musica]");
    if (mus) mus.textContent = "0 min";
    const hum = qs("[data-stat-humor]");
    if (hum) hum.textContent = "—";
    const alerts = qs("[data-care-alerts]");
    if (alerts) alerts.innerHTML = emptyState("Nenhum alerta no momento.", "✅");
    return;
  }

  if (emptyPatient) emptyPatient.hidden = true;
  if (chip) {
    chip.hidden = false;
    const chipText = qs("[data-patient-chip-text]");
    if (chipText) chipText.textContent = `${care.pacienteNome} · ${care.pacienteDoenca || "Paciente"}`;
  }

  if (stats) {
    const rem = qs("[data-stat-remedios]");
    if (rem) rem.textContent = `${stats.remedios.feitos}/${stats.remedios.total}`;
    const jogos = qs("[data-stat-jogos]");
    if (jogos) jogos.textContent = String(stats.jogos);
    const musica = qs("[data-stat-musica]");
    if (musica) musica.textContent = `${stats.musicaMin} min`;
    const humor = qs("[data-stat-humor]");
    if (humor) humor.textContent = stats.humor ? formatHumor(stats.humor) : "—";
  }

  const alerts = qs("[data-care-alerts]");
  if (alerts) {
    if (!apiData.alertas?.length && stats?.remedios.total === 0) {
      alerts.innerHTML = emptyState("Cadastre lembretes para o paciente para receber alertas.", "🔔");
    } else if (!apiData.alertas?.length) {
      alerts.innerHTML = emptyState("Nenhum alerta pendente.", "✅");
    }
  }
}

function formatHumor(value) {
  const map = { otimo: "Ótimo", bem: "Bem", regular: "Regular", triste: "Triste", ansioso: "Ansioso", bom: "Bem", ruim: "Ruim" };
  return map[value] || value;
}

function renderDashboardBits() {
  const date = qs("[data-today]");
  if (date) date.textContent = todayLabel();
  const points = qs("[data-points]");
  if (points) points.textContent = (appProgresso?.pontosHoje ?? 0).toLocaleString("pt-BR");
  const streak = qs("[data-streak]");
  if (streak) streak.textContent = String(appProgresso?.streak ?? 0);
  renderHomeSummary();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

async function bootstrapApp() {
  initQuickIcons();
  fillPatientCopy();

  if (hasPatientSession()) {
    await loadPatientData();
    fillPatientCopy();
  }

  let careApi = null;
  if (qs("[data-care-dashboard]")) {
    const care = getCaregiverSettings();
    if (care.cpfPaciente) {
      const patientData = {
        ...EMPTY_PATIENT,
        cpf: care.cpfPaciente,
        nome: care.pacienteNome || "",
        doenca: care.pacienteDoenca || ""
      };
      LembraStore.set("dados", patientData);
      await loadPatientData();
    }
    careApi = await loadCaregiverData();
    renderCareDashboard(careApi);
  }

  renderReminders(Number(document.body.dataset.reminderLimit || Infinity));
  renderActivityHistory();
  renderDashboardBits();
}

document.addEventListener("DOMContentLoaded", () => {
  setupForms();
  setupLoginForms();
  setupSettings();
  setupMood();
  setupTabs();
  setupReminderForm();
  setupTimerPreference();
  renderPatientNav();
  renderCareNav();
  renderContacts();
  initMemoryGame();
  initFluencyGame();
  initSimonGame();
  initWordImageGame();
  initPuzzleGame();
  setupMusic();
  initOrientationGame();
  bootstrapApp();
});
