# zinengtang.github.io — redesigned site

## Deploy
Copy everything inside `site/` to the root of the `zinengtang/zinengtang.github.io` repo
(replacing the old `index.html`; the old `stylesheet.css` is no longer needed) and push.
`index.html` is fully self-contained: all thumbnails and the portrait are inlined as base64,
fonts load from Google Fonts. The only external local file it references is `images/CV.pdf`.

## Edit content
Option A: edit `site/index.html` directly (papers are plain `<article class="pub">` blocks).

Option B: regenerate from the build script:
- `build/gen.py` holds all content as Python data (PAPERS, categories, bio, service).
- `build/imgs.json` holds the base64-encoded thumbnails keyed by name.
- gen.py reads `/home/claude/imgs.json` and writes `/mnt/user-data/outputs/index.html`;
  adjust those two paths at the top/bottom of the script for your machine, then run
  `python3 gen.py`.

To add a paper: append a dict to PAPERS in gen.py (set `cat` to `agent` / `mm` / `other`,
and either `img='key.png'` matching an entry you add to imgs.json, or
`tile=('AB', '#hex1', '#hex2')` for a gradient placeholder), then rerun.

Note: two small fixes were applied to index.html after generation (category nav pills,
removal of a placeholder "reviewing" line), so regenerating from gen.py verbatim will
not include the nav pills — copy that block from the current index.html if you rebuild.
