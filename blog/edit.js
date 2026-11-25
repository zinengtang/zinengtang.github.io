// Blog editor. Drafts live in a private GitHub repo; publishing writes static pages to the site repo.
// Everything goes through the GitHub REST API with a fine-grained token kept in this browser.
import { renderIndex, renderPost, SETTINGS_KEY, esc } from "./render.js";

const $ = (id) => document.getElementById(id);
const DEFAULTS = {
  token: "", remember: true,
  siteRepo: "zinengtang/zinengtang.github.io",
  draftsRepo: "zinengtang/blog-drafts",
  branch: "main",
};
const MAX_IMAGE_WIDTH = 1600;
const AUTOSAVE_PREFIX = "blogEditor.autosave.";

// ---------------------------------------------------------------- settings
function loadSettings() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const v = store.getItem(SETTINGS_KEY);
      if (v) return { ...DEFAULTS, ...JSON.parse(v) };
    } catch { /* storage unavailable */ }
  }
  return { ...DEFAULTS };
}
function storeSettings(s) {
  try { localStorage.removeItem(SETTINGS_KEY); sessionStorage.removeItem(SETTINGS_KEY); } catch { /* ignore */ }
  try { (s.remember ? localStorage : sessionStorage).setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------- encoding helpers
function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
function hash(str) { // FNV-1a, 32-bit, hex
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, "0");
}
const contentHash = (title, html) => hash(`${title}\u0000${html}`);

function slugify(s) {
  const slug = String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  if (slug) return slug;
  const d = new Date();
  return `post-${d.toISOString().slice(0, 10)}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
}

function siteBaseUrl(repo) {
  const [owner, name] = repo.split("/");
  return name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${name}/` : `https://${owner}.github.io/${name}/`;
}

// ---------------------------------------------------------------- GitHub client
class GitHub {
  constructor(token) { this.token = token; }

  async req(method, path, body) {
    const res = await fetch(`https://api.github.com${path}`, {
      method, cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`GitHub ${res.status}: ${data?.message || res.statusText}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async repo(repo) { return this.req("GET", `/repos/${repo}`); }

  async headSha(repo, branch) {
    try { return (await this.req("GET", `/repos/${repo}/git/ref/heads/${branch}`)).object.sha; }
    catch (e) { if (e.status === 404 || e.status === 409) return null; throw e; }
  }

  async readText(repo, branch, path) {
    let meta;
    try {
      const p = path.split("/").map(encodeURIComponent).join("/");
      meta = await this.req("GET", `/repos/${repo}/contents/${p}?ref=${encodeURIComponent(branch)}`);
    } catch (e) { if (e.status === 404) return null; throw e; }
    if (meta.encoding === "base64" && meta.content) return b64ToUtf8(meta.content);
    const blob = await this.req("GET", `/repos/${repo}/git/blobs/${meta.sha}`); // files over 1 MB
    return b64ToUtf8(blob.content);
  }

  async listFiles(repo, branch, prefix) {
    const head = await this.headSha(repo, branch);
    if (!head) return [];
    const commit = await this.req("GET", `/repos/${repo}/git/commits/${head}`);
    const tree = await this.req("GET", `/repos/${repo}/git/trees/${commit.tree.sha}?recursive=1`);
    return tree.tree.filter((t) => t.type === "blob" && t.path.startsWith(prefix)).map((t) => t.path);
  }

  /** One atomic commit. changes: [{path, text} | {path, base64} | {path, remove: true}] */
  async commit(repo, branch, changes, message, onProgress) {
    for (let attempt = 0; ; attempt++) {
      let head = await this.headSha(repo, branch);
      if (!head) { // empty repository: create the first commit through the contents API
        await this.req("PUT", `/repos/${repo}/contents/README.md`, { message: "Initialize", content: utf8ToB64("Private drafts for the blog editor.\n") });
        head = await this.headSha(repo, branch);
      }
      const parent = await this.req("GET", `/repos/${repo}/git/commits/${head}`);
      const tree = [];
      let i = 0;
      for (const c of changes) {
        onProgress?.(++i, changes.length);
        if (c.remove) { tree.push({ path: c.path, mode: "100644", type: "blob", sha: null }); continue; }
        if (c.sha) { tree.push({ path: c.path, mode: "100644", type: "blob", sha: c.sha }); continue; }
        const blob = await this.req("POST", `/repos/${repo}/git/blobs`,
          c.base64 != null ? { content: c.base64, encoding: "base64" } : { content: utf8ToB64(c.text), encoding: "base64" });
        tree.push({ path: c.path, mode: "100644", type: "blob", sha: blob.sha });
      }
      const newTree = await this.req("POST", `/repos/${repo}/git/trees`, { base_tree: parent.tree.sha, tree });
      const newCommit = await this.req("POST", `/repos/${repo}/git/commits`, { message, tree: newTree.sha, parents: [head] });
      try {
        await this.req("PATCH", `/repos/${repo}/git/refs/heads/${branch}`, { sha: newCommit.sha });
        return newCommit.sha;
      } catch (e) {
        if (e.status !== 422 || attempt >= 1) throw e; // branch moved underneath us: rebuild once
      }
    }
  }
}

// ---------------------------------------------------------------- state
let S = loadSettings();
let gh = S.token ? new GitHub(S.token) : null;
let index = [];        // drafts/index.json entries
let cur = null;        // post being edited
let dirty = false;
let busy = false;
let lastRange = null;  // last caret position inside the body
let selFig = null;     // selected <figure>

const body = $("body");
const figbar = $("figbar");

// ---------------------------------------------------------------- UI helpers
let toastTimer;
function toast(msg, { error = false, sticky = false } = {}) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.toggle("err", error);
  t.hidden = false;
  clearTimeout(toastTimer);
  if (!sticky) toastTimer = setTimeout(() => { t.hidden = true; }, error ? 7000 : 2600);
}
function setBusy(on, msg) {
  busy = on;
  for (const id of ["btnSave", "btnPublish", "btnUnpublish", "btnDelete", "btnNew", "btnBack"]) $(id).disabled = on;
  if (on && msg) toast(msg, { sticky: true });
}
async function run(msg, fn) {
  if (busy) return;
  setBusy(true, msg);
  try { await fn(); } catch (e) { console.error(e); toast(e.message || String(e), { error: true }); } finally { setBusy(false); }
}
function requireConnection() {
  if (!gh) { openSettings(); throw new Error("Add your GitHub token in Settings first."); }
}

function statusOf(entry, isDirty) {
  if (!entry || !entry.updated) return { text: "new — not saved", cls: "dirty" };
  if (isDirty) return { text: "unsaved changes", cls: "dirty" };
  if (entry.published && entry.hash === entry.publishedHash) return { text: "published", cls: "pub" };
  if (entry.published) return { text: "published · draft has changes", cls: "chg" };
  return { text: "draft", cls: "" };
}

// ---------------------------------------------------------------- list view
async function loadIndex() {
  const txt = await gh.readText(S.draftsRepo, S.branch, "drafts/index.json");
  return txt ? JSON.parse(txt) : [];
}

function renderList() {
  const ul = $("postList");
  ul.innerHTML = "";
  const sorted = [...index].sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
  for (const p of sorted) {
    const st = statusOf(p, false);
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.innerHTML = `<span class="t">${esc(p.title || "(untitled)")}</span>
      <span class="badge ${st.cls}">${esc(st.text)}</span>
      <span class="u">/${esc(p.slug)}/ · edited ${esc(new Date(p.updated).toLocaleString())}</span>`;
    li.addEventListener("click", () => openPost(p.slug));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") openPost(p.slug); });
    ul.append(li);
  }
  $("listHint").textContent = !gh ? "Open Settings and add your GitHub token to start."
    : index.length ? "Click a post to edit it. Only published posts appear on the public blog."
    : "No posts yet. Click “New post”.";
}

async function showList() {
  if (dirty && !confirm("Leave without saving your changes?")) return;
  dirty = false;
  cur = null;
  deselectFigure();
  $("viewEdit").hidden = true;
  $("viewList").hidden = false;
  history.replaceState(null, "", location.pathname);
  if (gh) {
    try { index = await loadIndex(); } catch (e) { toast(e.message, { error: true }); }
  }
  renderList();
}

// ---------------------------------------------------------------- editor view
function showEditor() {
  $("viewList").hidden = true;
  $("viewEdit").hidden = false;
  refreshEditorChrome();
}

function fitSlug() { const el = $("slug"); el.style.width = `${Math.max(12, el.value.length + 2)}ch`; }

function refreshEditorChrome() {
  fitSlug();
  const entry = index.find((p) => p.slug === cur.slug);
  const st = statusOf(entry && { ...entry, hash: cur.hash ?? entry.hash }, dirty);
  const b = $("status");
  b.textContent = st.text;
  b.className = `badge ${st.cls}`;
  $("btnPublish").textContent = cur.published ? "Update published" : "Publish";
  $("btnUnpublish").hidden = !cur.published;
  const live = $("lnkLive");
  live.hidden = !cur.published;
  if (cur.published) live.href = `${siteBaseUrl(S.siteRepo)}blog/${cur.slug}/`;
  $("slug").readOnly = !!cur.updated; // the address is fixed once the post has been saved
  $("btnDelete").hidden = !cur.updated;
}

function setBodyHTML(html) {
  body.innerHTML = html || "<p><br></p>";
  for (const fig of body.querySelectorAll("figure.img")) prepareFigure(fig);
}
function prepareFigure(fig) {
  fig.contentEditable = "false";
  const cap = fig.querySelector("figcaption");
  if (cap) cap.contentEditable = "true";
  const img = fig.querySelector("img");
  if (img) img.draggable = false;
}

/** The body HTML without editor-only attributes. */
function cleanHTML() {
  const root = body.cloneNode(true);
  root.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
  root.querySelectorAll("[draggable]").forEach((el) => el.removeAttribute("draggable"));
  root.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
  root.querySelectorAll(".sel").forEach((el) => el.classList.remove("sel"));
  root.querySelectorAll("figcaption").forEach((c) => { if (!c.textContent.trim()) c.remove(); });
  root.querySelectorAll("span:not([class])").forEach((s) => s.replaceWith(...s.childNodes));
  // wrap stray top-level text / inline nodes in paragraphs
  for (const n of [...root.childNodes]) {
    if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) { const p = document.createElement("p"); n.replaceWith(p); p.append(n); }
    else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "DIV") { const p = document.createElement("p"); p.append(...n.childNodes); n.replaceWith(p); }
  }
  // drop trailing empty paragraphs
  while (root.lastElementChild && root.lastElementChild.tagName === "P" && !root.lastElementChild.textContent.trim() && !root.lastElementChild.querySelector("img")) root.lastElementChild.remove();
  return root.innerHTML.trim();
}

function markDirty() {
  if (!cur) return;
  dirty = true;
  refreshEditorChrome();
}

function newPost() {
  if (dirty && !confirm("Discard your unsaved changes?")) return;
  cur = { slug: "", title: "", published: false };
  dirty = false;
  $("title").value = "";
  $("slug").value = "";
  $("slug").dataset.touched = "";
  setBodyHTML("");
  showEditor();
  maybeRestoreAutosave();
  $("title").focus();
}

async function openPost(slug) {
  if (!gh) return;
  await run("Opening…", async () => {
    const txt = await gh.readText(S.draftsRepo, S.branch, `drafts/${slug}.json`);
    if (!txt) throw new Error(`Draft “${slug}” not found.`);
    const d = JSON.parse(txt);
    cur = d;
    dirty = false;
    $("title").value = d.title;
    $("slug").value = d.slug;
    setBodyHTML(d.html);
    showEditor();
    history.replaceState(null, "", `#${slug}`);
    $("toast").hidden = true;
    maybeRestoreAutosave();
  });
}

// ---------------------------------------------------------------- local autosave (convenience only)
const autosaveKey = () => AUTOSAVE_PREFIX + (cur?.slug || "new");
function autosave() {
  if (!cur || !dirty) return;
  try { localStorage.setItem(autosaveKey(), JSON.stringify({ title: $("title").value, slug: $("slug").value, html: body.innerHTML, at: new Date().toISOString() })); }
  catch { /* quota exceeded (large images): skip */ }
}
function clearAutosave(key = autosaveKey()) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
function maybeRestoreAutosave() {
  let a = null;
  try { a = JSON.parse(localStorage.getItem(autosaveKey()) || "null"); } catch { /* ignore */ }
  if (!a || (cur.updated && a.at <= cur.updated)) return;
  if (confirm(`Restore unsaved changes from ${new Date(a.at).toLocaleString()}?`)) {
    $("title").value = a.title;
    if (!cur.updated) $("slug").value = a.slug;
    setBodyHTML(a.html);
    markDirty();
  } else clearAutosave();
}
setInterval(autosave, 3000);

// ---------------------------------------------------------------- save / publish / unpublish / delete
async function saveDraft() {
  requireConnection();
  const title = $("title").value.trim();
  if (!title) { $("title").focus(); throw new Error("Give the post a title first."); }
  index = await loadIndex(); // fresh copy, in case another device saved meanwhile
  const oldKey = autosaveKey();
  if (!cur.updated) { // first save: settle the address
    let slug = slugify($("slug").value.trim() || title);
    const taken = new Set(index.map((p) => p.slug));
    for (let n = 2; taken.has(slug); n++) slug = `${slug.replace(/-\d+$/, "")}-${n}`;
    cur.slug = slug;
    $("slug").value = slug;
  }
  const html = cleanHTML();
  const now = new Date().toISOString();
  const draft = {
    slug: cur.slug, title, html,
    created: cur.created || now, updated: now,
    published: !!cur.published, publishedAt: cur.publishedAt || null, publishedHash: cur.publishedHash || null,
    hash: contentHash(title, html),
  };
  await writeDraft(draft, `Save draft: ${title}`);
  cur = draft;
  dirty = false;
  clearAutosave(oldKey);
  clearAutosave();
  history.replaceState(null, "", `#${draft.slug}`);
  refreshEditorChrome();
  return draft;
}

async function writeDraft(draft, message) {
  const { html, ...entry } = draft;
  const next = index.filter((p) => p.slug !== draft.slug).concat([entry]);
  await gh.commit(S.draftsRepo, S.branch, [
    { path: `drafts/${draft.slug}.json`, text: JSON.stringify(draft) },
    { path: "drafts/index.json", text: JSON.stringify(next, null, 2) },
  ], message);
  index = next;
}

/** Move data: URL images out of the HTML into separate files named by content hash. */
function extractImages(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const images = new Map();
  for (const img of tpl.content.querySelectorAll("img")) {
    const m = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(img.getAttribute("src") || "");
    if (!m) continue;
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg" }[m[1].toLowerCase()] || "img";
    const name = `img-${hash(m[2])}.${ext}`;
    images.set(name, m[2]);
    img.setAttribute("src", name);
    img.setAttribute("loading", "lazy");
  }
  return { html: tpl.innerHTML, images };
}
function excerptOf(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  tpl.content.querySelectorAll("figure, figcaption").forEach((n) => n.remove());
  const text = tpl.content.textContent.replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177).replace(/\s+\S*$/, "").replace(/[\s.,;:!?·—-]+$/, "")}…` : text;
}

async function loadManifest() {
  const txt = await gh.readText(S.siteRepo, S.branch, "blog/posts.json");
  return txt ? JSON.parse(txt) : [];
}

async function publish() {
  const draft = await saveDraft();
  const { slug, title } = draft;
  const { html, images } = extractImages(draft.html);
  const now = new Date().toISOString();
  const date = draft.publishedAt || now;
  const post = { slug, title, date, updated: draft.publishedAt ? now : null, excerpt: excerptOf(draft.html), html };

  const manifest = (await loadManifest()).filter((p) => p.slug !== slug);
  manifest.push({ slug, title, date, updated: post.updated, excerpt: post.excerpt });
  manifest.sort((a, b) => b.date.localeCompare(a.date));

  const dir = `blog/${slug}/`;
  const existing = new Set(await gh.listFiles(S.siteRepo, S.branch, dir));
  const changes = [{ path: `${dir}index.html`, text: renderPost(post) }];
  for (const [name, b64] of images) {
    if (!existing.has(dir + name)) changes.push({ path: dir + name, base64: b64 }); // same name = same bytes
  }
  const keep = new Set([`${dir}index.html`, ...[...images.keys()].map((n) => dir + n)]);
  for (const p of existing) if (!keep.has(p)) changes.push({ path: p, remove: true });
  changes.push({ path: "blog/posts.json", text: JSON.stringify(manifest, null, 2) });
  changes.push({ path: "blog/index.html", text: renderIndex(manifest) });

  await gh.commit(S.siteRepo, S.branch, changes, `${draft.publishedAt ? "Update" : "Publish"} blog post: ${title}`,
    (i, n) => toast(`Publishing… (${i}/${n})`, { sticky: true }));

  const done = { ...draft, published: true, publishedAt: date, publishedHash: draft.hash };
  await writeDraft(done, `Mark published: ${title}`);
  cur = done;
  refreshEditorChrome();
  toast("Published. GitHub Pages usually updates within a minute.");
}

async function unpublish({ quiet = false } = {}) {
  requireConnection();
  const { slug, title } = cur;
  const files = await gh.listFiles(S.siteRepo, S.branch, `blog/${slug}/`);
  const manifest = (await loadManifest()).filter((p) => p.slug !== slug);
  await gh.commit(S.siteRepo, S.branch, [
    ...files.map((p) => ({ path: p, remove: true })),
    { path: "blog/posts.json", text: JSON.stringify(manifest, null, 2) },
    { path: "blog/index.html", text: renderIndex(manifest) },
  ], `Unpublish blog post: ${title}`);
  index = await loadIndex();
  const entry = index.find((p) => p.slug === slug);
  const txt = await gh.readText(S.draftsRepo, S.branch, `drafts/${slug}.json`);
  const draft = { ...JSON.parse(txt), published: false, publishedAt: null, publishedHash: null };
  if (entry) await writeDraft(draft, `Mark unpublished: ${title}`);
  cur = { ...cur, published: false, publishedAt: null, publishedHash: null };
  refreshEditorChrome();
  if (!quiet) toast("Unpublished. The post is a draft again.");
}

async function deletePost() {
  requireConnection();
  if (cur.published) await unpublish({ quiet: true });
  index = (await loadIndex()).filter((p) => p.slug !== cur.slug);
  await gh.commit(S.draftsRepo, S.branch, [
    { path: `drafts/${cur.slug}.json`, remove: true },
    { path: "drafts/index.json", text: JSON.stringify(index, null, 2) },
  ], `Delete draft: ${cur.title}`);
  clearAutosave();
  dirty = false;
  toast("Deleted.");
  await showList();
}

// ---------------------------------------------------------------- images
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
async function prepareImage(file) {
  if (file.type === "image/gif" || file.type === "image/svg+xml") return readAsDataURL(file); // keep animation / vectors
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_WIDTH / bmp.width);
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const png = file.type === "image/png";
  if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(bmp, 0, 0, w, h);
  let url = canvas.toDataURL(png ? "image/png" : "image/jpeg", 0.86);
  if (png && url.length > 1_200_000) { // big PNG photo: convert to JPEG
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    url = canvas.toDataURL("image/jpeg", 0.86);
  }
  return url;
}

function topBlockOf(node) {
  while (node && node.parentNode !== body) node = node.parentNode;
  return node && node.parentNode === body ? node : null;
}
function insertBlock(el, range = lastRange) {
  const anchor = range && body.contains(range.startContainer) ? topBlockOf(range.startContainer) : null;
  if (anchor) body.insertBefore(el, anchor); // float beside the paragraph the caret is in
  else body.append(el);
  if (!el.nextElementSibling) { const p = document.createElement("p"); p.innerHTML = "<br>"; body.append(p); }
}

async function insertImages(files, range) {
  const list = [...files].filter((f) => f.type.startsWith("image/"));
  if (!list.length) return;
  toast(list.length > 1 ? `Adding ${list.length} images…` : "Adding image…", { sticky: true });
  try {
    let last;
    for (const f of list) {
      const fig = document.createElement("figure");
      fig.className = "img right m";
      const img = document.createElement("img");
      img.src = await prepareImage(f);
      img.alt = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      fig.append(img);
      prepareFigure(fig);
      insertBlock(fig, range);
      last = fig;
    }
    markDirty();
    $("toast").hidden = true;
    selectFigure(last);
  } catch (e) {
    toast(`Could not read that image: ${e.message}`, { error: true });
  }
}

// ---------------------------------------------------------------- figure toolbar
function selectFigure(fig, keepCaret = false) {
  if (selFig && selFig !== fig) selFig.classList.remove("sel");
  if (!keepCaret) document.getSelection().removeAllRanges(); // so Backspace/Delete act on the image
  selFig = fig;
  fig.classList.add("sel");
  figbar.hidden = false;
  syncFigbar();
}
function deselectFigure() {
  if (selFig) selFig.classList.remove("sel");
  selFig = null;
  figbar.hidden = true;
}
function syncFigbar() {
  if (!selFig || !body.contains(selFig)) { deselectFigure(); return; }
  const c = $("canvas").getBoundingClientRect();
  const f = selFig.getBoundingClientRect();
  figbar.style.top = `${Math.max(0, f.top - c.top - figbar.offsetHeight - 8)}px`;
  figbar.style.left = `${Math.max(0, Math.min(f.left - c.left, c.width - figbar.offsetWidth))}px`;
  const full = selFig.classList.contains("full");
  for (const b of figbar.querySelectorAll("button[data-fig]")) {
    const k = b.dataset.fig;
    if (["left", "right", "full", "s", "m", "l"].includes(k)) b.setAttribute("aria-pressed", String(selFig.classList.contains(k) && !(full && ["s", "m", "l"].includes(k))));
    if (["s", "m", "l"].includes(k)) b.disabled = full;
    if (k === "caption") b.setAttribute("aria-pressed", String(!!selFig.querySelector("figcaption")));
  }
}
function figAction(k) {
  const fig = selFig;
  if (!fig) return;
  if (["left", "right", "full"].includes(k)) { fig.classList.remove("left", "right", "full"); fig.classList.add(k); }
  else if (["s", "m", "l"].includes(k)) { fig.classList.remove("s", "m", "l"); fig.classList.add(k); }
  else if (k === "caption") {
    const cap = fig.querySelector("figcaption");
    if (cap) cap.remove();
    else {
      const c = document.createElement("figcaption");
      c.contentEditable = "true";
      fig.append(c);
      c.focus();
      const r = document.createRange(); r.selectNodeContents(c); r.collapse(false);
      const sel = document.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }
  } else if (k === "up" && fig.previousElementSibling) body.insertBefore(fig, fig.previousElementSibling);
  else if (k === "down" && fig.nextElementSibling) body.insertBefore(fig.nextElementSibling, fig);
  else if (k === "delete") { deselectFigure(); fig.remove(); markDirty(); return; }
  markDirty();
  syncFigbar();
  requestAnimationFrame(syncFigbar); // again after layout settles
}

// ---------------------------------------------------------------- formatting
function toggleBlock(tag) {
  const now = String(document.queryCommandValue("formatBlock") || "").toUpperCase();
  document.execCommand("formatBlock", false, now === tag ? "P" : tag);
}
const COMMANDS = {
  bold: () => document.execCommand("bold"),
  italic: () => document.execCommand("italic"),
  h2: () => toggleBlock("H2"),
  h3: () => toggleBlock("H3"),
  p: () => document.execCommand("formatBlock", false, "P"),
  quote: () => toggleBlock("BLOCKQUOTE"),
  ul: () => document.execCommand("insertUnorderedList"),
  ol: () => document.execCommand("insertOrderedList"),
  link: () => {
    const url = prompt("Link address (https://…). Leave empty to remove the link.");
    if (url === null) return;
    if (url.trim()) document.execCommand("createLink", false, url.trim());
    else document.execCommand("unlink");
  },
  hr: () => document.execCommand("insertHorizontalRule"),
  image: () => $("filePick").click(),
};

// ---------------------------------------------------------------- settings dialog
function openSettings() {
  $("sToken").value = S.token;
  $("sRemember").checked = S.remember;
  $("sSite").value = S.siteRepo;
  $("sDrafts").value = S.draftsRepo;
  $("sBranch").value = S.branch;
  $("sResult").textContent = "";
  $("dlgSettings").showModal();
}
function settingsFromForm() {
  return {
    token: $("sToken").value.trim(),
    remember: $("sRemember").checked,
    siteRepo: $("sSite").value.trim() || DEFAULTS.siteRepo,
    draftsRepo: $("sDrafts").value.trim() || DEFAULTS.draftsRepo,
    branch: $("sBranch").value.trim() || "main",
  };
}
async function checkConnection(s) {
  const g = new GitHub(s.token);
  const out = [];
  for (const [label, repo, wantPrivate] of [["site", s.siteRepo, false], ["drafts", s.draftsRepo, true]]) {
    try {
      const r = await g.repo(repo);
      if (!r.permissions?.push) out.push(`${label}: no write access`);
      else if (wantPrivate && !r.private) out.push(`${label}: ⚠ repository is PUBLIC — drafts would be visible`);
      else out.push(`${label}: ok`);
    } catch (e) {
      out.push(e.status === 404 ? `${label}: not found (create it, or check the token's repository access)` : `${label}: ${e.message}`);
    }
  }
  return out;
}
async function updateConn() {
  const el = $("conn");
  if (!gh) { el.textContent = "not connected"; el.className = "conn bad"; return; }
  const res = await checkConnection(S);
  const ok = res.every((r) => r.endsWith(": ok"));
  el.textContent = ok ? `connected · ${S.siteRepo.split("/")[1]}` : res.filter((r) => !r.endsWith(": ok")).join(" · ");
  el.className = `conn ${ok ? "ok" : "bad"}`;
}

// ---------------------------------------------------------------- events
document.execCommand("defaultParagraphSeparator", false, "p");

$("btnNew").addEventListener("click", newPost);
$("btnBack").addEventListener("click", showList);
$("btnSettings").addEventListener("click", openSettings);
$("btnSave").addEventListener("click", () => run("Saving draft…", async () => { await saveDraft(); toast("Draft saved (only you can see it)."); }));
$("btnPublish").addEventListener("click", () => {
  const verb = cur.published ? "Update the published version" : "Publish this post";
  if (confirm(`${verb}? It will be visible to everyone.`)) run("Publishing…", publish);
});
$("btnUnpublish").addEventListener("click", () => {
  if (confirm("Unpublish? The post disappears from the public blog but stays here as a draft.")) run("Unpublishing…", () => unpublish());
});
$("btnDelete").addEventListener("click", () => {
  const extra = cur.published ? " It will also be removed from the public blog." : "";
  if (confirm(`Delete “${cur.title}” permanently?${extra}`)) run("Deleting…", deletePost);
});

$("title").addEventListener("input", () => {
  if (!cur.updated && !$("slug").dataset.touched) $("slug").value = $("title").value.trim() ? slugify($("title").value) : "";
  markDirty();
});
$("slug").addEventListener("input", () => { $("slug").dataset.touched = "1"; fitSlug(); markDirty(); });
$("slug").addEventListener("blur", () => { if ($("slug").value.trim()) $("slug").value = slugify($("slug").value); });
$("title").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); body.focus(); } });

for (const b of $("toolbar").querySelectorAll("button[data-cmd]")) {
  b.addEventListener("mousedown", (e) => e.preventDefault()); // keep the text selection
  b.addEventListener("click", () => {
    if (b.dataset.cmd !== "image") body.focus();
    COMMANDS[b.dataset.cmd]();
    markDirty();
  });
}
for (const b of figbar.querySelectorAll("button[data-fig]")) {
  b.addEventListener("mousedown", (e) => e.preventDefault());
  b.addEventListener("click", () => figAction(b.dataset.fig));
}
$("filePick").addEventListener("change", (e) => { insertImages(e.target.files); e.target.value = ""; });

document.addEventListener("selectionchange", () => {
  const sel = document.getSelection();
  if (sel.rangeCount && body.contains(sel.anchorNode)) lastRange = sel.getRangeAt(0).cloneRange();
});
body.addEventListener("input", () => { markDirty(); if (selFig) syncFigbar(); });
body.addEventListener("click", (e) => {
  const fig = e.target.closest("figure.img");
  if (fig && body.contains(fig)) selectFigure(fig, !!e.target.closest("figcaption"));
  else deselectFigure();
});
body.addEventListener("keydown", (e) => {
  if (!selFig) return;
  const a = document.getSelection().anchorNode;
  if (a && body.contains(a) && a !== body && !selFig.contains(a)) { deselectFigure(); return; } // typing in the text
  if (a && selFig.contains(a)) return;                                                          // typing in the caption
  if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); figAction("delete"); }
  else if (e.key === "Escape") deselectFigure();
});
body.addEventListener("focus", () => { if (!body.firstChild) body.innerHTML = "<p><br></p>"; });
body.addEventListener("paste", (e) => {
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
  if (files.length) { e.preventDefault(); insertImages(files); return; }
  const text = e.clipboardData?.getData("text/plain");
  if (text == null) return;
  e.preventDefault(); // paste as clean text (no foreign styles)
  if (e.target.closest?.("figcaption")) { document.execCommand("insertText", false, text.replace(/\s+/g, " ")); return; }
  const parts = text.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  if (parts.length === 1) document.execCommand("insertText", false, text);
  else document.execCommand("insertHTML", false, parts.map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join(""));
});
body.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); body.classList.add("drop"); } });
body.addEventListener("dragleave", () => body.classList.remove("drop"));
body.addEventListener("drop", (e) => {
  body.classList.remove("drop");
  if (!e.dataTransfer.files.length) return;
  e.preventDefault();
  const r = document.caretRangeFromPoint?.(e.clientX, e.clientY);
  insertImages(e.dataTransfer.files, r || lastRange);
});
window.addEventListener("resize", () => selFig && syncFigbar());
document.addEventListener("scroll", () => selFig && syncFigbar(), { passive: true });
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && cur && !$("viewEdit").hidden) {
    e.preventDefault();
    $("btnSave").click();
  }
});
window.addEventListener("beforeunload", (e) => { if (dirty) { autosave(); e.preventDefault(); e.returnValue = ""; } });

$("sTest").addEventListener("click", async () => {
  $("sResult").textContent = "checking…";
  $("sResult").textContent = (await checkConnection(settingsFromForm())).join(" · ");
});
$("dlgSettings").addEventListener("close", async () => {
  if ($("dlgSettings").returnValue !== "save") return;
  S = settingsFromForm();
  storeSettings(S);
  gh = S.token ? new GitHub(S.token) : null;
  await updateConn();
  if ($("viewEdit").hidden) await showList();
});

// ---------------------------------------------------------------- start
(async function start() {
  renderList();
  if (!gh) { openSettings(); return; }
  const slug = decodeURIComponent(location.hash.slice(1)); // read before showList() clears it
  updateConn();
  await showList();
  if (slug && index.some((p) => p.slug === slug)) await openPost(slug);
})();
