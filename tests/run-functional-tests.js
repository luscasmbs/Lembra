const fs = require("fs");
const path = require("path");
const vm = require("vm");

class ClassList {
  constructor(el) {
    this.el = el;
    this.items = new Set();
  }
  add(name) { this.items.add(name); this.el.className = [...this.items].join(" "); }
  remove(name) { this.items.delete(name); this.el.className = [...this.items].join(" "); }
  contains(name) { return this.items.has(name); }
  toggle(name, force) {
    const shouldAdd = force === undefined ? !this.items.has(name) : Boolean(force);
    if (shouldAdd) this.add(name); else this.remove(name);
  }
}

class Element {
  constructor(tag = "div", attrs = {}) {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.dataset = {};
    this.style = {};
    this.events = {};
    this.textContent = "";
    this.value = "";
    this.hidden = false;
    this.className = "";
    this.classList = new ClassList(this);
    Object.entries(attrs).forEach(([key, value]) => this.setAttribute(key, value));
  }
  setAttribute(key, value = "") {
    if (key.startsWith("data-")) {
      const prop = key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = String(value);
    } else if (key === "class") {
      this.className = String(value);
      this.className.split(/\s+/).filter(Boolean).forEach(c => this.classList.items.add(c));
    } else {
      this[key] = value;
    }
  }
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }
  addEventListener(type, fn) {
    this.events[type] = this.events[type] || [];
    this.events[type].push(fn);
  }
  click() {
    (this.events.click || []).forEach(fn => fn({ preventDefault() {} }));
  }
  dispatch(type) {
    (this.events[type] || []).forEach(fn => fn({ preventDefault() {} }));
  }
  focus() {}
  set innerHTML(html) {
    this._innerHTML = html;
    this.children = [];
    const lineMatches = [...html.matchAll(/<p[^>]*data-line[^>]*>(.*?)<\/p>/g)];
    lineMatches.forEach(match => {
      const el = new Element("p", { "data-line": "" });
      el.textContent = match[1].replace(/<[^>]+>/g, "");
      if (match[0].includes("display:none")) el.style.display = "none";
      this.appendChild(el);
    });
    if (html.includes("data-close-finish")) {
      this.appendChild(new Element("button", { "data-close-finish": "" }));
    }
  }
  get innerHTML() {
    return this._innerHTML || "";
  }
  matches(selector) {
    if (selector.startsWith(".")) {
      return this.classList.contains(selector.slice(1)) || this.className.split(/\s+/).includes(selector.slice(1));
    }
    const data = selector.match(/^\[data-([a-z0-9-]+)(?:="([^"]+)")?\]$/i);
    if (data) {
      const prop = data[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (!(prop in this.dataset)) return false;
      return data[2] === undefined || this.dataset[prop] === data[2];
    }
    return false;
  }
  querySelectorAll(selector) {
    const found = [];
    const walk = node => {
      node.children.forEach(child => {
        if (child.matches(selector)) found.push(child);
        walk(child);
      });
    };
    walk(this);
    return found;
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function createContext(body) {
  const storage = {};
  const document = {
    body,
    createElement: tag => new Element(tag),
    querySelector: selector => body.querySelector(selector),
    querySelectorAll: selector => body.querySelectorAll(selector),
    addEventListener() {}
  };
  const context = {
    document,
    localStorage: {
      getItem: key => (key in storage ? storage[key] : null),
      setItem: (key, value) => { storage[key] = String(value); }
    },
    window: { location: { href: "" } },
    console,
    Intl,
    Date,
    Number,
    Math,
    String,
    JSON,
    setTimeout: fn => { fn(); return 1; },
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    Infinity
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "assets/script/lembra-v2.js"), "utf8"), context);
  return context;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function add(body, tag, attrs = {}, text = "") {
  const el = new Element(tag, attrs);
  el.textContent = text;
  body.appendChild(el);
  return el;
}

function testMusic() {
  const body = new Element("body");
  add(body, "div", { "data-music-title": "" });
  add(body, "div", { "data-music-artist": "" });
  add(body, "button", { "data-music-play": "" });
  add(body, "button", { "data-music-prev": "" });
  add(body, "button", { "data-music-next": "" });
  add(body, "span", { "data-music-progress": "" });
  add(body, "span", { "data-music-current": "" });
  add(body, "span", { "data-music-duration": "" });
  add(body, "section", { "data-lyrics": "" });
  add(body, "button", { "data-sing-start": "" });
  for (let i = 0; i < 4; i++) add(body, "button", { "data-song-index": String(i) });
  const ctx = createContext(body);
  ctx.setupMusic();
  assert(body.querySelector("[data-music-title]").textContent === "Tropeiro Velho", "Musica inicial incorreta");
  body.querySelector("[data-music-next]").click();
  assert(body.querySelector("[data-music-title]").textContent === "Garota de Ipanema", "Botao proxima nao trocou musica");
  body.querySelector("[data-music-play]").click();
  assert(body.querySelector("[data-music-play]").textContent.includes("Pausar"), "Play nao alterna para pausar");
  body.querySelector("[data-sing-start]").click();
  assert(body.querySelectorAll("[data-line]").length > 0, "Cantar junto nao renderizou letra");
}

function testOrientation() {
  const body = new Element("body");
  add(body, "div", { "data-orientation-question": "" });
  add(body, "div", { "data-orientation-options": "" });
  add(body, "p", { "data-orientation-feedback": "" });
  add(body, "span", { "data-orientation-score": "" });
  add(body, "span", { "data-orientation-progress": "" });
  add(body, "button", { "data-orientation-reset": "" });
  add(body, "section", { "data-finish": "" });
  const ctx = createContext(body);
  ctx.initOrientationGame();
  assert(body.querySelectorAll(".mood-option").length === 3, "Orientacao nao criou alternativas");
  for (let round = 0; round < 4; round++) {
    const before = Number(body.querySelector("[data-orientation-score]").textContent || 0);
    const options = [...body.querySelectorAll(".mood-option")];
    for (const option of options) {
      option.click();
      const after = Number(body.querySelector("[data-orientation-score]").textContent || 0);
      if (after > before || body.querySelector("[data-finish]").classList.contains("show")) break;
    }
  }
  assert(body.querySelector("[data-finish]").classList.contains("show"), "Orientacao nao concluiu com feedback");
}

function testFluency() {
  const body = new Element("body");
  const form = add(body, "form", { "data-fluency-form": "" });
  const input = new Element("input");
  form.palavra = input;
  form.appendChild(input);
  add(body, "div", { "data-fluency-list": "" });
  add(body, "span", { "data-fluency-score": "" }, "0");
  add(body, "p", { "data-fluency-prompt": "" });
  add(body, "button", { "data-fluency-help": "" });
  add(body, "p", { "data-fluency-feedback": "" });
  add(body, "section", { "data-finish": "" });
  const ctx = createContext(body);
  ctx.initFluencyGame();
  body.querySelector("[data-fluency-help]").click();
  form.dispatch("submit");
  assert(Number(body.querySelector("[data-fluency-score]").textContent) === 1, "Fluencia nao aceitou palavra valida");
}

testMusic();
console.log("OK testMusic");
testOrientation();
console.log("OK testOrientation");
testFluency();
console.log("OK testFluency");
console.log("Todos os testes funcionais passaram.");
