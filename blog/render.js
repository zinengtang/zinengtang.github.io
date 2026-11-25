// Templates for the public blog pages. The editor (edit.js) calls these at publish time and
// commits the resulting static HTML, so the public site needs no JavaScript to show posts.

export const SITE_NAME = "Zineng Tang";
export const SETTINGS_KEY = "blogEditor.settings";

const FAVICON = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2218%22 fill=%22%23003262%22/><text x=%2250%22 y=%2268%22 font-size=%2252%22 text-anchor=%22middle%22 fill=%22%23FDB515%22 font-family=%22Georgia%22>Z</text></svg>";
const FONTS = "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&family=Instrument+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

// Shows an "edit" link only in the owner's browser (where editor settings exist). No token is read here.
const OWNER_SCRIPT = (href) => `<script>
try { if (localStorage.getItem("${SETTINGS_KEY}") || sessionStorage.getItem("${SETTINGS_KEY}")) {
  var o = document.querySelector(".bhead .owner"); o.href = ${JSON.stringify(href)}; o.classList.add("on"); } } catch (e) {}
</script>`;

const ANALYTICS = `<script data-goatcounter="https://terrantang.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>`;

function head(title, description, cssHref) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="author" content="${SITE_NAME}">
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="${cssHref}">
</head>`;
}

/** posts: [{slug, title, date, excerpt}] sorted newest first. Written to blog/index.html. */
export function renderIndex(posts) {
  const items = posts.length
    ? `<ul class="plist">\n${posts.map((p) => `  <li>
    <span class="d">${esc(formatDate(p.date))}</span>
    <h2><a href="${esc(p.slug)}/">${esc(p.title)}</a></h2>
    ${p.excerpt ? `<p class="x">${esc(p.excerpt)}</p>` : ""}
  </li>`).join("\n")}\n</ul>`
    : `<p class="empty">No posts yet.</p>`;
  return `${head(`Blog — ${SITE_NAME}`, `Blog posts by ${SITE_NAME}.`, "blog.css")}
<body>
<div class="bwrap">
  <header class="bhead"><a class="home" href="../">${SITE_NAME}</a><span class="sep">/</span><span>blog</span><a class="owner" href="#">✎ editor</a></header>
  <main>
    <h1 class="btitle">Blog</h1>
    ${items}
  </main>
</div>
${OWNER_SCRIPT("edit.html")}
${ANALYTICS}
</body>
</html>
`;
}

/** post: {slug, title, date, updated, excerpt, html}. Written to blog/<slug>/index.html. */
export function renderPost(post) {
  const updated = post.updated && formatDate(post.updated) !== formatDate(post.date)
    ? ` · updated ${esc(formatDate(post.updated))}` : "";
  return `${head(`${post.title} — ${SITE_NAME}`, post.excerpt || post.title, "../blog.css")}
<body>
<div class="bwrap">
  <header class="bhead"><a class="home" href="../../">${SITE_NAME}</a><span class="sep">/</span><a href="../">blog</a><a class="owner" href="#">✎ edit</a></header>
  <article>
    <h1 class="ptitle">${esc(post.title)}</h1>
    <p class="pdate">${esc(formatDate(post.date))}${updated}</p>
    <div class="post">
${post.html}
    </div>
  </article>
  <footer class="bfoot"><a href="../">← All posts</a><span>${SITE_NAME}</span></footer>
</div>
${OWNER_SCRIPT(`../edit.html#${post.slug}`)}
${ANALYTICS}
</body>
</html>
`;
}
