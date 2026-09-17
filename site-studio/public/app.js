const projects = {
  "srakaj/srakaj-portfolio": {
    label: "srakaj.com / Portfolio",
    cssPath: "assets/style.css",
    pages: ["index.html", "work.html", "about.html"],
    vars: [
      ["Background", "--bg", "color"], ["Surface", "--surface", "color"], ["Text", "--text", "color"],
      ["Muted text", "--muted", "color"], ["Lines", "--line", "color"], ["Accent", "--accent", "color"],
      ["Accent soft", "--accent-soft", "color"], ["Max width", "--max", "text"]
    ],
    defaults: { sansVar: "--sans", serifVar: "--serif" }
  },
  "srakaj/opportunity-radar": {
    label: "Opportunity Radar",
    cssPath: "docs/style.css",
    pages: ["docs/index.html"],
    vars: [
      ["Background", "--bg", "color"], ["Cards", "--card", "color"], ["Text", "--text", "color"],
      ["Muted text", "--muted", "color"], ["Border", "--border", "color"], ["Soft border", "--soft-border", "color"],
      ["Soft background", "--soft-bg", "color"], ["Chip", "--chip", "color"], ["Ink", "--ink", "color"]
    ],
    defaults: { sansSelector: ":root", serifSelector: "h1, .workspace-head h3" }
  }
};

const fonts = [
  "Inter","Roboto","Open Sans","Lato","Montserrat","Poppins","Nunito","Source Sans 3","Work Sans","Manrope","DM Sans","Plus Jakarta Sans","Outfit","Figtree","Urbanist","Mulish","Rubik","Karla","Cabin","Barlow","Barlow Condensed","IBM Plex Sans","IBM Plex Sans Condensed","Noto Sans","Noto Sans Display","PT Sans","Ubuntu","Raleway","Merriweather Sans","Josefin Sans","Quicksand","Assistant","Public Sans","Archivo","Archivo Narrow","Asap","Atkinson Hyperlegible","Lexend","Space Grotesk","Sora","Albert Sans","Red Hat Display","Red Hat Text","Hind","Heebo","Titillium Web","Exo 2","Kanit","Questrial","Jost","Varela Round","Comfortaa","Alegreya Sans","Bitter Sans","Overpass","Noto Sans Mono","IBM Plex Mono","Roboto Mono","Source Code Pro","Space Mono","JetBrains Mono","Fira Code","Fira Mono","DM Mono","Inconsolata","Ubuntu Mono","PT Mono","Courier Prime","Geist Mono",
  "Georgia","Times New Roman","Merriweather","Playfair Display","Libre Baskerville","Lora","Cormorant Garamond","EB Garamond","Crimson Pro","Crimson Text","Source Serif 4","Noto Serif","Noto Serif Display","PT Serif","Bitter","Alegreya","Vollkorn","Spectral","Literata","Cardo","Gentium Book Plus","Newsreader","DM Serif Display","DM Serif Text","Fraunces","Bodoni Moda","Libre Caslon Text","Libre Caslon Display","Prata","Cinzel","Marcellus","Cormorant","Cormorant Infant","Cormorant SC","Old Standard TT","Sorts Mill Goudy","Zilla Slab","Roboto Slab","Arvo","Bree Serif","Lustria","Gelasio","Petrona","Domine","Neuton","Tinos","Lusitana","Average","Alice","Andada Pro","Eczar","Yrsa","Martel","Rufina",
  "Oswald","Bebas Neue","Anton","Archivo Black","League Spartan","Teko","Roboto Condensed","Fjalla One","Saira Condensed","Barlow Semi Condensed","Yanone Kaffeesatz","Abel","Economica","Pathway Gothic One","Unica One","Chivo","Chivo Mono","League Gothic","Big Shoulders Display","Big Shoulders Text",
  "Pacifico","Caveat","Dancing Script","Satisfy","Great Vibes","Sacramento","Allura","Parisienne","Kaushan Script","Marck Script","Handlee","Patrick Hand","Kalam","Indie Flower","Permanent Marker","Shadows Into Light","Nothing You Could Do",
  "Syne","Unbounded","Azeret Mono","Anybody","Recursive","Spline Sans","Epilogue","Onest","Instrument Sans","Instrument Serif","Bricolage Grotesque","Gabarito","Schibsted Grotesk","Familjen Grotesk","Hanken Grotesk","Libre Franklin","Geist"
];

const el = id => document.getElementById(id);
const state = {
  projectKey: Object.keys(projects)[0], branch: "main", page: "", selected: "", computed: {},
  patches: {}, globalVars: {}, globalFonts: {}, connected: false, cssSource: null, cssSha: null
};

const projectEl = el("project"), pageEl = el("page"), branchEl = el("branch"), preview = el("preview"),
  device = el("device"), publishBtn = el("publish"), statusEl = el("status"), historyEl = el("history"), selectorEl = el("selector");

for (const [key, project] of Object.entries(projects)) {
  const option = document.createElement("option"); option.value = key; option.textContent = project.label; projectEl.appendChild(option);
}
for (const font of [...new Set(fonts)].sort()) {
  const option = document.createElement("option"); option.value = font; el("fonts").appendChild(option);
}

const currentProject = () => projects[state.projectKey];
const splitRepo = () => { const [owner, repo] = state.projectKey.split("/"); return { owner, repo }; };
const storageKey = () => `site-studio:${state.projectKey}:${state.branch}`;

function saveDraft() {
  localStorage.setItem(storageKey(), JSON.stringify({ patches: state.patches, globalVars: state.globalVars, globalFonts: state.globalFonts }));
}
function loadDraft() {
  const raw = localStorage.getItem(storageKey()); const data = raw ? JSON.parse(raw) : {};
  state.patches = data.patches || {}; state.globalVars = data.globalVars || {}; state.globalFonts = data.globalFonts || {};
}
function fontStack(value, serif = false) {
  const name = String(value || "").trim(); if (!name) return "";
  const quoted = /\s/.test(name) ? `"${name}"` : name;
  return `${quoted}, ${serif ? "Georgia, serif" : "ui-sans-serif, system-ui, sans-serif"}`;
}
function googleFontImportNames() {
  const names = new Set();
  for (const value of Object.values(state.globalFonts)) if (value && !["Georgia","Times New Roman"].includes(value)) names.add(value);
  for (const props of Object.values(state.patches)) {
    const value = props["font-family"] || "";
    const first = value.replace(/^["']|["']$/g, "").split(",")[0].replace(/["']/g, "").trim();
    if (first && fonts.includes(first) && !["Georgia","Times New Roman"].includes(first)) names.add(first);
  }
  return [...names];
}
function buildDraftCss() {
  const blocks = [], rootProps = { ...state.globalVars }, p = currentProject();
  if (p.defaults.sansVar && state.globalFonts.sans) rootProps[p.defaults.sansVar] = fontStack(state.globalFonts.sans, false);
  if (p.defaults.serifVar && state.globalFonts.serif) rootProps[p.defaults.serifVar] = fontStack(state.globalFonts.serif, true);
  if (Object.keys(rootProps).length) blocks.push(`:root{\n${Object.entries(rootProps).map(([k,v]) => `  ${k}: ${v};`).join("\n")}\n}`);
  if (p.defaults.sansSelector && state.globalFonts.sans) blocks.push(`${p.defaults.sansSelector}{font-family:${fontStack(state.globalFonts.sans,false)};}`);
  if (p.defaults.serifSelector && state.globalFonts.serif) blocks.push(`${p.defaults.serifSelector}{font-family:${fontStack(state.globalFonts.serif,true)};}`);
  for (const [selector, props] of Object.entries(state.patches)) {
    const lines = Object.entries(props).filter(([,v]) => String(v).trim() !== "").map(([k,v]) => `  ${k}: ${v} !important;`);
    if (lines.length) blocks.push(`${selector}{\n${lines.join("\n")}\n}`);
  }
  return blocks.join("\n\n");
}
function applyPreviewCss() {
  preview.contentWindow?.postMessage({ type: "SITE_STUDIO_APPLY_CSS", css: buildDraftCss() }, "*");
  saveDraft(); renderHistory(); publishBtn.disabled = !state.connected || !hasChanges();
}
const hasChanges = () => Object.keys(state.patches).length > 0 || Object.keys(state.globalVars).length > 0 || Object.values(state.globalFonts).some(Boolean);

function renderGlobalFields() {
  const wrap = el("globalFields"); wrap.innerHTML = "";
  for (const [label, variable, type] of currentProject().vars) {
    const row = document.createElement("div"); row.className = "field";
    const labelEl = document.createElement("label"); labelEl.textContent = label;
    const input = document.createElement("input"); input.dataset.var = variable; input.value = state.globalVars[variable] || "";
    input.placeholder = type === "color" ? "#ffffff" : "e.g. 1160px";
    input.addEventListener("input", () => {
      if (input.value.trim()) state.globalVars[variable] = input.value.trim(); else delete state.globalVars[variable]; applyPreviewCss();
    });
    row.append(labelEl,input); wrap.appendChild(row);
  }
  el("globalSans").value = state.globalFonts.sans || ""; el("globalSerif").value = state.globalFonts.serif || "";
}
function renderPages() {
  pageEl.innerHTML = "";
  for (const page of currentProject().pages) { const option = document.createElement("option"); option.value = page; option.textContent = page; pageEl.appendChild(option); }
  state.page = currentProject().pages[0]; pageEl.value = state.page;
}
function previewUrl() {
  const { owner, repo } = splitRepo();
  return `/preview/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(state.branch)}/${state.page}?t=${Date.now()}`;
}
async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`); return data;
}
async function checkAuth() {
  try {
    const data = await api("/api/auth/status"); state.connected = Boolean(data.connected);
    statusEl.textContent = data.connected ? `GitHub: ${data.login}` : "Preview mode"; statusEl.className = "status" + (data.connected ? " ok" : "");
    publishBtn.disabled = !state.connected || !hasChanges();
  } catch { state.connected = false; statusEl.textContent = "Preview mode"; }
}
async function loadCssSource() {
  const { owner, repo } = splitRepo(), cssPath = currentProject().cssPath;
  const data = await api(`/api/repo/${owner}/${repo}/file?ref=${encodeURIComponent(state.branch)}&path=${encodeURIComponent(cssPath)}`);
  state.cssSource = data.content; state.cssSha = data.sha;
}
async function reloadProject() {
  state.branch = branchEl.value.trim() || "main"; loadDraft(); renderPages(); renderGlobalFields(); selectorEl.textContent = "Click an element in the preview."; state.selected = "";
  try { statusEl.textContent = "Loading…"; await loadCssSource(); preview.src = previewUrl(); statusEl.textContent = state.connected ? "Ready to edit" : "Preview mode"; }
  catch (error) { statusEl.textContent = error.message; }
  renderHistory();
}
function fillComputedFields(computed) {
  for (const input of document.querySelectorAll("[data-css]")) {
    const property = input.dataset.css, own = state.patches[state.selected]?.[property]; input.value = own ?? computed[property] ?? "";
  }
}
function renderHistory() {
  historyEl.innerHTML = ""; const items = [];
  for (const [k,v] of Object.entries(state.globalVars)) items.push(["Global", `${k}: ${v}`]);
  for (const [k,v] of Object.entries(state.globalFonts)) if (v) items.push(["Global font", `${k}: ${v}`]);
  for (const [selector,props] of Object.entries(state.patches)) for (const [k,v] of Object.entries(props)) if (v) items.push([selector, `${k}: ${v}`]);
  if (!items.length) { historyEl.innerHTML = `<div class="empty">No unpublished changes.</div>`; return; }
  for (const [title, detail] of items) {
    const div = document.createElement("div"); div.className = "history-item"; div.innerHTML = `<b></b><span></span>`;
    div.querySelector("b").textContent = title; div.querySelector("span").textContent = detail; historyEl.appendChild(div);
  }
}
function stripOldStudioBlocks(css) {
  return css.replace(/\/\* SITE STUDIO FONTS START \*\/[\s\S]*?\/\* SITE STUDIO FONTS END \*\/\s*/g, "")
    .replace(/\s*\/\* SITE STUDIO OVERRIDES START \*\/[\s\S]*?\/\* SITE STUDIO OVERRIDES END \*\/\s*/g, "\n").trimEnd();
}
function buildPublishedCss() {
  const base = stripOldStudioBlocks(state.cssSource || ""), fontNames = googleFontImportNames();
  const fontBlock = fontNames.length ? `/* SITE STUDIO FONTS START */\n${fontNames.map(name => `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g,"+")}:wght@300;400;500;600;700;800;900&display=swap');`).join("\n")}\n/* SITE STUDIO FONTS END */\n\n` : "";
  const overrides = buildDraftCss(), overrideBlock = overrides ? `\n\n/* SITE STUDIO OVERRIDES START */\n${overrides}\n/* SITE STUDIO OVERRIDES END */\n` : "";
  return fontBlock + base + overrideBlock;
}
async function publish() {
  if (!state.connected || !hasChanges()) return;
  if (!confirm(`Publish these visual changes to ${state.projectKey} on branch "${state.branch}"?`)) return;
  try {
    publishBtn.disabled = true; publishBtn.textContent = "Publishing…"; await loadCssSource();
    const { owner, repo } = splitRepo(); const finalCss = buildPublishedCss();
    const result = await api(`/api/repo/${owner}/${repo}/publish`, { method: "POST", body: JSON.stringify({ ref: state.branch, path: currentProject().cssPath, sha: state.cssSha, content: finalCss, message: "Site Studio: visual design update" }) });
    state.cssSha = result.content_sha || state.cssSha; state.cssSource = finalCss; localStorage.removeItem(storageKey()); state.patches = {}; state.globalVars = {}; state.globalFonts = {};
    renderGlobalFields(); renderHistory(); statusEl.textContent = `Published ${String(result.commit || "").slice(0,7)}`; preview.src = previewUrl();
  } catch (error) { alert(`Publish failed:\n${error.message}`); }
  finally { publishBtn.textContent = "Publish to GitHub"; publishBtn.disabled = !state.connected || !hasChanges(); }
}

projectEl.addEventListener("change", () => { state.projectKey = projectEl.value; reloadProject(); });
pageEl.addEventListener("change", () => { state.page = pageEl.value; preview.src = previewUrl(); });
branchEl.addEventListener("change", reloadProject); el("reload").addEventListener("click", reloadProject); publishBtn.addEventListener("click", publish);
for (const button of document.querySelectorAll(".tabs button")) button.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("active", x === button)); document.querySelectorAll(".panel").forEach(x => x.classList.remove("active")); el(`panel-${button.dataset.tab}`).classList.add("active");
});
for (const button of document.querySelectorAll("[data-device]")) button.addEventListener("click", () => {
  document.querySelectorAll("[data-device]").forEach(x => x.classList.toggle("active", x === button)); device.className = "device " + (button.dataset.device === "desktop" ? "" : button.dataset.device);
});
for (const input of document.querySelectorAll("[data-css]")) input.addEventListener("input", () => {
  if (!state.selected) return; state.patches[state.selected] ||= {}; const value = input.value.trim();
  if (value) state.patches[state.selected][input.dataset.css] = value; else delete state.patches[state.selected][input.dataset.css];
  if (!Object.keys(state.patches[state.selected]).length) delete state.patches[state.selected]; applyPreviewCss();
});
el("applyGlobalFonts").addEventListener("click", () => { state.globalFonts.sans = el("globalSans").value.trim(); state.globalFonts.serif = el("globalSerif").value.trim(); applyPreviewCss(); });
el("globalSans").addEventListener("change", () => { state.globalFonts.sans = el("globalSans").value.trim(); applyPreviewCss(); });
el("globalSerif").addEventListener("change", () => { state.globalFonts.serif = el("globalSerif").value.trim(); applyPreviewCss(); });
el("removeElementOverrides").addEventListener("click", () => { if (!state.selected) return; delete state.patches[state.selected]; fillComputedFields(state.computed); applyPreviewCss(); });
el("copySelector").addEventListener("click", async () => { if (state.selected) await navigator.clipboard.writeText(state.selected); });
el("clearAll").addEventListener("click", () => { if (!confirm("Discard all unpublished Site Studio changes for this project and branch?")) return; state.patches = {}; state.globalVars = {}; state.globalFonts = {}; localStorage.removeItem(storageKey()); renderGlobalFields(); applyPreviewCss(); });

const authDialog = el("authDialog");
el("connect").addEventListener("click", () => authDialog.showModal()); el("cancelAuth").addEventListener("click", () => authDialog.close());
el("saveAuth").addEventListener("click", async () => {
  try { const data = await api("/api/auth", { method: "POST", body: JSON.stringify({ token: el("token").value.trim() }) }); state.connected = true; statusEl.textContent = `GitHub: ${data.login}`; authDialog.close(); el("token").value = ""; publishBtn.disabled = !hasChanges(); }
  catch (error) { alert(error.message); }
});
window.addEventListener("message", event => {
  const data = event.data || {}; if (data.type === "SITE_STUDIO_READY") applyPreviewCss();
  if (data.type === "SITE_STUDIO_SELECT") { state.selected = data.selector; state.computed = data.computed || {}; selectorEl.textContent = `${data.selector}${data.text ? `\n"${data.text}"` : ""}`; fillComputedFields(state.computed); document.querySelector('[data-tab="element"]').click(); }
});

checkAuth().then(reloadProject);
