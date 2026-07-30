Build files for the personal site (not needed for the site to run).

- gen.py: all content as Python data (PAPERS, categories, bio, service).
- imgs.json: base64-encoded thumbnails keyed by name.
- gen.py reads imgs.json and writes index.html; adjust the two paths in the
  script for your machine, then run `python3 gen.py`.
- To add a paper: append a dict to PAPERS (cat = agent / mm / other; either
  img='key.png' matching an imgs.json entry, or tile=('AB','#hex1','#hex2')
  for a gradient placeholder), then rerun.
- Note: the category nav pills and one removed placeholder line were patched
  into index.html after generation; if you regenerate, copy the .catnav block
  from the current index.html.
