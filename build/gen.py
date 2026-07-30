import json, html

IMGS = json.load(open('/home/claude/imgs.json'))

# ---------- data ----------
MOD_COLORS = {
  'vision':  '#3B7EA1',
  'language':'#2E7D5B',
  'audio':   '#C77D1F',
  'video':   '#6B5CA5',
  'embodied':'#B0563B',
  'agents':  '#8A5A83',
  'layout':  '#4E8577',
}

def A(name, url=None):
    return {'n': name, 'u': url}

PAPERS = [
 dict(id='decouple', cat='agent', title='Decoupling Planning and Control for Instructable Agents',
   authors=[A('Zineng Tang'), A('Kelsey R. Allen'), A('Sjoerd van Steenkiste'), A('Ishita Dasgupta'), A('Alane Suhr','https://www.alanesuhr.com/')],
   venue='COLM', year=2026, mods=['language','embodied'],
   links=[],
   img='decouple.png',
   blurb='A VLM planner reasons and issues language subgoals; a learned low-level controller decides how, and for how long, to act on each one — decoupling instruction understanding from motor control.'),
 dict(id='vlr', cat='mm', title='Images are Worth Variable Length of Representations',
   authors=[A('Lingjun Mao'), A('Rodolfo Corona'), A('Xin Liang'), A('Wenhao Yan'), A('Zineng Tang')],
   venue='arXiv preprint', year=2025, mods=['vision','language'],
   links=[('arXiv','https://arxiv.org/abs/2506.03643')],
   tile=('VLR', '#3B7EA1', '#6B5CA5'),
   blurb='A dynamic visual tokenizer that encodes each image into a variable number of tokens matched to its information content.'),
 dict(id='tulip', cat='mm', title='TULIP: Towards Unified Language-Image Pretraining',
   authors=[A('Zineng Tang'), A('Long Lian'), A('Seun Eisape'), A('XuDong Wang'), A('Roei Herzig'), A('Adam Yala'),
            A('Alane Suhr','https://www.alanesuhr.com/'), A('Trevor Darrell'), A('David M. Chan')],
   venue='ICCV Workshops', year=2025, mods=['vision','language'],
   links=[('arXiv','https://arxiv.org/abs/2503.15485')],
   img='tulip.png',
   blurb='An open-source drop-in replacement for CLIP-style encoders that learns fine-grained visual features while preserving global semantic alignment.'),
 dict(id='illusion', cat='mm', title='Evaluating Model Perception of Color Illusions in Photorealistic Scenes',
   authors=[A('Lingjun Mao'), A('Zineng Tang'), A('Alane Suhr','https://www.alanesuhr.com/')],
   venue='CVPR', year=2025, mods=['vision','language'],
   links=[('arXiv','https://arxiv.org/abs/2412.06184'),
          ('paper','https://openaccess.thecvf.com/content/CVPR2025/html/Mao_Evaluating_Model_Perception_of_Color_Illusions_in_Photorealistic_Scenes_CVPR_2025_paper.html')],
   img='illusion.png',
   blurb='Do vision-language models see color illusions the way people do? A benchmark of photorealistic illusion scenes says: partly, and revealingly.'),
 dict(id='refcom', cat='agent', title='Grounding Language in Multi-Perspective Referential Communication',
   authors=[A('Zineng Tang'), A('Lingjun Mao'), A('Alane Suhr','https://www.alanesuhr.com/')],
   venue='EMNLP', year=2024, mods=['language','embodied'],
   links=[('arXiv','https://arxiv.org/abs/2410.03959'), ('paper','https://aclanthology.org/2024.emnlp-main.1100')],
   img='refcom.jpg',
   blurb='A task and dataset for referential communication between embodied agents whose perspectives on a shared 3D scene differ.'),
 dict(id='codi2', cat='mm', title='CoDi-2: In-Context, Interleaved, and Interactive Any-to-Any Generation',
   authors=[A('Zineng Tang'), A('Ziyi Yang','https://ziyi-yang.github.io/'), A('Mahmoud Khademi'), A('Yang Liu','https://nlp-yang.github.io/'),
            A('Chenguang Zhu','https://cs.stanford.edu/people/cgzhu/'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='CVPR', year=2024, mods=['vision','language','audio','video'],
   links=[('arXiv','https://arxiv.org/abs/2311.18775')],
   img='codi2.jpg',
   blurb='A multimodal LLM that follows interleaved instructions across modalities for in-context, conversational any-to-any generation and editing.'),
 dict(id='codi', cat='mm', title='CoDi: Any-to-Any Generation via Composable Diffusion',
   authors=[A('Zineng Tang'), A('Ziyi Yang','https://ziyi-yang.github.io/'), A('Chenguang Zhu','https://cs.stanford.edu/people/cgzhu/'),
            A('Michael Zeng','https://www.microsoft.com/en-us/research/people/nzeng/'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='NeurIPS', year=2023, mods=['vision','language','audio','video'],
   links=[('arXiv','https://arxiv.org/abs/2305.11846'), ('project','https://codi-gen.github.io/'), ('code','https://github.com/microsoft/i-Code/tree/main/i-Code-V3')],
   img='codi.jpg',
   blurb='Composable diffusion generates any combination of output modalities from any combination of inputs, including temporally aligned video and audio.'),
 dict(id='udop', cat='mm', title='Unifying Vision, Text, and Layout for Universal Document Processing',
   authors=[A('Zineng Tang'), A('Ziyi Yang','https://ziyi-yang.github.io/'), A('Guoxin Wang','https://www.guoxwang.com/'),
            A('Yuwei Fang','https://www.microsoft.com/en-us/research/people/yuwfan/'), A('Yang Liu','https://nlp-yang.github.io/'),
            A('Chenguang Zhu','https://cs.stanford.edu/people/cgzhu/'), A('Michael Zeng','https://www.microsoft.com/en-us/research/people/nzeng/'),
            A('Cha Zhang','https://www.microsoft.com/en-us/research/people/chazhang/'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='CVPR', year=2023, badge='Highlight', mods=['vision','language','layout'],
   links=[('arXiv','https://arxiv.org/pdf/2212.02623'), ('code','https://github.com/microsoft/i-Code/tree/main/i-Code-Doc')],
   img='udop.png',
   blurb='One foundation model for document AI, unifying vision, text, and layout across understanding and generation tasks.'),
 dict(id='paxion', cat='mm', title='Paxion: Patching Action Knowledge in Video-Language Foundation Models',
   authors=[A('Zhenhailong Wang'), A('Ansel Blume'), A('Sha Li'), A('Genglin Liu'), A('Jaemin Cho','https://j-min.io/'),
            A('Zineng Tang'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/'), A('Heng Ji')],
   venue='NeurIPS', year=2023, mods=['video','language'],
   links=[('arXiv','https://arxiv.org/abs/2305.10683')],
   img='paxion.png',
   blurb='Patching action knowledge into video-language models without degrading their general vision-language ability.'),
 dict(id='perceiver', cat='mm', title='Perceiver-VL: Efficient Vision-and-Language Modeling with Iterative Latent Attention',
   authors=[A('Zineng Tang'), A('Jaemin Cho','https://j-min.io/'), A('Jie Lei','https://jayleicn.github.io/'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='WACV', year=2023, mods=['vision','language','video'],
   links=[('arXiv','https://arxiv.org/abs/2211.11701')],
   img='perceiver.png',
   blurb='Iterative latent attention scales vision-and-language modeling to long videos with linear complexity.'),
 dict(id='tvlt', cat='mm', title='TVLT: Textless Vision-Language Transformer',
   authors=[A('Zineng Tang'), A('Jaemin Cho','https://j-min.io/'), A('Yixin Nie','https://easonnie.github.io/'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='NeurIPS', year=2022, badge='Oral', mods=['vision','audio','video'],
   links=[('arXiv','https://arxiv.org/abs/2209.14156'), ('code','https://github.com/zinengtang/TVLT')],
   img='tvlt.png',
   blurb='Vision-language learning from raw pixels and audio alone, with no text anywhere in the pipeline.'),
 dict(id='vidlankd', cat='mm', title='VidLanKD: Improving Language Understanding via Video-Distilled Knowledge Transfer',
   authors=[A('Zineng Tang'), A('Jaemin Cho','https://j-min.io/'), A('Hao Tan'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='NeurIPS', year=2021, mods=['video','language'],
   links=[('arXiv','https://arxiv.org/pdf/2107.02681'), ('code','https://github.com/zinengtang/VidLanKD')],
   img='vidlankd.png',
   blurb='Distilling knowledge from a video-language teacher improves purely textual language understanding.'),
 dict(id='flow', cat='other', title='Continuous Language Generative Flow',
   authors=[A('Zineng Tang'), A('Shiyue Zhang','https://www.cs.unc.edu/~shiyue/'), A('Hyounghun Kim','https://hyounghk.github.io/'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='ACL', year=2021, mods=['language'],
   links=[('paper','https://aclanthology.org/2021.acl-long.355/'), ('code','https://github.com/zinengtang/ContinuousFlowNLG')],
   img='flow.png',
   blurb='Normalizing flows as a continuous latent generative model for language generation and semi-supervised learning.'),
 dict(id='decembert', cat='mm', title='DeCEMBERT: Learning from Noisy Instructional Videos via Dense Captions and Entropy Minimization',
   authors=[A('Zineng Tang'), A('Jie Lei','https://jayleicn.github.io/'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='NAACL', year=2021, mods=['video','language'],
   links=[('paper','https://aclanthology.org/2021.naacl-main.193/'), ('code','https://github.com/zinengtang/DeCEMBERT')],
   img='decembert.png',
   blurb='Dense captions and entropy minimization make noisy instructional video a usable pre-training signal.'),
 dict(id='densecap', cat='mm', title='Dense-Caption Matching and Frame-Selection Gating for Temporal Localization in VideoQA',
   authors=[A('Hyounghun Kim','https://hyounghk.github.io/'), A('Zineng Tang'), A('Mohit Bansal','https://www.cs.unc.edu/~mbansal/')],
   venue='ACL', year=2020, mods=['video','language'],
   links=[('paper','https://arxiv.org/pdf/2005.06409')],
   img='densecap.png',
   blurb='Matching dense captions and gating frame selection to localize the moments that answer a video question.'),
]

NEWS = [
 ('Jul 2026', 'Co-organizing the <a href="https://colmweb.org/" target="_blank" rel="noopener">LSEI Workshop at COLM 2026</a> — October 9, San Francisco. Submissions are in; see you there.'),
 ('Oct 2025', 'TULIP was presented at the ICCV 2025 Workshops.'),
 ('Aug 2025', 'Started my Ph.D. at UC Berkeley, advised by Alane Suhr.'),
 ('Jun 2025', 'Our study of color-illusion perception in vision-language models appeared at CVPR 2025.'),
 ('Nov 2024', '“Grounding Language in Multi-Perspective Referential Communication” was presented at EMNLP 2024.'),
 ('Jun 2024', 'CoDi-2 was presented at CVPR 2024.'),
]

# ---------- render helpers ----------
def authors_html(auths):
    parts = []
    for a in auths:
        nm = html.escape(a['n'])
        if a['n'] == 'Zineng Tang':
            parts.append(f'<span class="me">{nm}</span>')
        elif a['u']:
            parts.append(f'<a href="{a["u"]}" target="_blank" rel="noopener">{nm}</a>')
        else:
            parts.append(nm)
    return ', '.join(parts)

def chips(mods):
    return ''  # modality chips removed

def links_html(links):
    return ' '.join(f'<a class="plink" href="{u}" target="_blank" rel="noopener">{t}</a>' for t, u in links)

def tile_html(p):
    if 'img' in p:
        return f'<img class="pimg" src="{IMGS[p["img"]]}" alt="" loading="lazy">'
    txt, c1, c2 = p['tile']
    return (f'<div class="ptile" style="background:linear-gradient(135deg,{c1}18,{c2}2b);color:{c1}">'
            f'<span>{txt}</span></div>')

def paper_html(p):
    badge = f'<span class="badge">{p["badge"]}</span>' if p.get('badge') else ''
    if p['links']:
        title = f'<a href="{p["links"][0][1]}" target="_blank" rel="noopener">{html.escape(p["title"])}</a>'
    else:
        title = html.escape(p['title'])
    return f'''<article class="pub" id="{p['id']}">
  <div class="pub-media"><span class="pyear">{p['year']}</span>{tile_html(p)}</div>
  <div class="pub-body">
    <h3>{title}</h3>
    <p class="authors">{authors_html(p['authors'])}</p>
    <p class="venue"><span class="v">{p['venue']} {p['year']}</span>{badge}</p>
    <p class="blurb">{html.escape(p['blurb'])}</p>
    <p class="meta">{chips(p['mods'])}{('<span class="sep"></span>' + links_html(p['links'])) if p['links'] else ''}</p>
  </div>
</article>'''

CATS = [
 ('agent', 'Multi-Agent & Embodied Interaction',
  'Agents that communicate, cooperate, and act — grounding language in shared environments and social play.'),
 ('mm', 'Multimodal Learning & Generation',
  'Models that connect vision, language, audio, and video — from unified representations to any-to-any generation.'),
 ('other', 'Others',
  'Excursions beyond the two threads above.'),
]
pubs = ''
for cid, cname, cdesc in CATS:
    group = sorted([p for p in PAPERS if p['cat'] == cid], key=lambda p: -p['year'])
    if not group:
        continue
    entries = '\n'.join(paper_html(p) for p in group)
    pubs += (f'<section class="catgroup" id="cat-{cid}">'
             f'<header class="cathead"><h2>{cname}</h2><span class="count">{len(group):02d}</span>'
             f'<p class="catdesc">{cdesc}</p></header>'
             f'<div class="catpubs">{entries}</div></section>\n')

news = '\n'.join(f'<li><span class="date">{d}</span><span class="item">{t}</span></li>' for d, t in NEWS)

# ---------- page ----------
page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Zineng Tang</title>
<meta name="author" content="Zineng Tang">
<meta name="description" content="Zineng Tang — Ph.D. student at UC Berkeley (BAIR). Multimodal AI, embodied agents, and world models.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2218%22 fill=%22%23003262%22/><text x=%2250%22 y=%2268%22 font-size=%2252%22 text-anchor=%22middle%22 fill=%22%23FDB515%22 font-family=%22Georgia%22>Z</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&family=Instrument+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {{
  --bg: #FBFBF9;
  --ink: #14283C;
  --muted: #5B6B79;
  --berkeley: #003262;
  --rock: #3B7EA1;
  --gold: #FDB515;
  --line: #E3E6E4;
  --card: #FFFFFF;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html {{ scroll-behavior: smooth; }}
@media (prefers-reduced-motion: reduce) {{ html {{ scroll-behavior: auto; }} * {{ animation: none !important; transition: none !important; }} }}
body {{
  background: var(--bg);
  color: var(--ink);
  font-family: 'Instrument Sans', system-ui, sans-serif;
  font-size: 15.5px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}}
a {{ color: var(--rock); text-decoration: none; }}
a:hover {{ color: var(--berkeley); text-decoration: underline; text-decoration-color: var(--gold); text-decoration-thickness: 2px; text-underline-offset: 3px; }}
a:focus-visible {{ outline: 2px solid var(--rock); outline-offset: 2px; border-radius: 2px; }}

.wrap {{
  max-width: 1060px;
  margin: 0 auto;
  padding: 56px 28px 80px;
  display: grid;
  grid-template-columns: 288px 1fr;
  gap: 60px;
}}

/* ---------- left rail ---------- */
.rail {{ position: sticky; top: 48px; align-self: start; }}
.portrait {{
  width: 100%; max-width: 174px; aspect-ratio: 1; object-fit: cover;
  border-radius: 6px;
}}
.rail h1 {{
  font-family: 'Newsreader', serif;
  font-optical-sizing: auto;
  font-size: 34px; font-weight: 600; letter-spacing: -0.01em;
  margin-top: 26px; color: var(--berkeley);
}}
.rail .zh {{ font-family: 'Newsreader', serif; color: var(--muted); font-size: 16px; margin-top: 2px; }}
.rail .role {{ margin-top: 14px; font-size: 14.5px; color: var(--muted); line-height: 1.55; }}
.rail .role b {{ color: var(--ink); font-weight: 600; }}
.rail nav {{ margin-top: 22px; display: flex; flex-wrap: wrap; gap: 8px 10px; }}
.rail nav a {{
  font-family: 'Spline Sans Mono', monospace; font-size: 12.5px;
  border: 1px solid var(--line); background: var(--card);
  padding: 5px 11px; border-radius: 999px; color: var(--ink);
}}
.rail nav a:hover {{ border-color: var(--rock); text-decoration: none; color: var(--berkeley); }}

/* ---------- main ---------- */
main > section {{ margin-bottom: 58px; }}
.eyebrow {{
  font-family: 'Spline Sans Mono', monospace;
  font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}}
.eyebrow::after {{ content: ''; height: 1px; background: var(--line); flex: 1; }}

.lede {{
  font-family: 'Newsreader', serif;
  font-size: 26px; line-height: 1.42; font-weight: 400;
  color: var(--ink); letter-spacing: -0.005em;
  max-width: 620px;
}}
.lede em {{ font-style: italic; color: var(--berkeley); }}
.lede .hl {{ background: linear-gradient(transparent 62%, rgba(253,181,21,.42) 62%); }}
.bio {{ margin-top: 18px; max-width: 620px; color: var(--muted); }}
.bio p + p {{ margin-top: 10px; }}
.bio a {{ color: var(--rock); }}

/* news */
.news {{ list-style: none; max-width: 640px; }}
.news li {{ display: grid; grid-template-columns: 84px 1fr; gap: 16px; padding: 9px 0; border-bottom: 1px dashed var(--line); }}
.news li:last-child {{ border-bottom: 0; }}
.news .date {{ font-family: 'Spline Sans Mono', monospace; font-size: 12.5px; color: var(--muted); padding-top: 3px; white-space: nowrap; }}
.news .item {{ font-size: 15px; }}

/* publications */
.catgroup + .catgroup {{ margin-top: 40px; }}
.cathead {{ display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 4px 14px; margin-bottom: 6px; }}
.cathead h2 {{
  font-family: 'Newsreader', serif; font-size: 24px; font-weight: 600;
  color: var(--berkeley); letter-spacing: -0.005em;
}}
.cathead .count {{
  font-family: 'Spline Sans Mono', monospace; font-size: 13px; color: var(--muted);
}}
.catdesc {{ grid-column: 1 / -1; font-size: 14px; color: var(--muted); max-width: 600px; }}
.catpubs {{ border-top: 1px solid var(--line); }}
.pyear {{
  display: block; font-family: 'Spline Sans Mono', monospace; font-size: 12px;
  color: var(--muted); margin-bottom: 6px;
}}
.pub {{ display: grid; grid-template-columns: 108px 1fr; gap: 18px; padding: 16px 0; }}
.pub + .pub {{ border-top: 1px dashed var(--line); }}
.pub-media {{ padding-top: 4px; }}
.pimg {{ width: 108px; border-radius: 4px; border: 1px solid var(--line); background: #fff; display: block; }}
.ptile {{
  width: 108px; aspect-ratio: 4/3; border-radius: 4px; border: 1px solid var(--line);
  display: grid; place-items: center;
  font-family: 'Newsreader', serif; font-weight: 600; font-size: 19px; letter-spacing: .01em;
}}
.pub h3 {{ font-size: 16.5px; font-weight: 600; line-height: 1.4; letter-spacing: -0.005em; }}
.pub h3 a {{ color: var(--ink); }}
.pub h3 a:hover {{ color: var(--berkeley); }}
.authors {{ font-size: 13.5px; color: var(--muted); margin-top: 4px; }}
.authors .me {{ color: var(--ink); font-weight: 600; }}
.venue {{ margin-top: 4px; font-size: 13px; }}
.venue .v {{ font-family: 'Spline Sans Mono', monospace; color: var(--berkeley); }}
.badge {{
  font-family: 'Spline Sans Mono', monospace; font-size: 11.5px;
  background: rgba(253,181,21,.28); border: 1px solid rgba(253,181,21,.7);
  color: #6B4A00; border-radius: 3px; padding: 1px 7px; margin-left: 8px;
}}
.blurb {{ margin-top: 6px; font-size: 14px; color: var(--muted); max-width: 560px; }}
.meta {{ margin-top: 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px 8px; }}
.chip {{
  font-family: 'Spline Sans Mono', monospace; font-size: 11px; color: var(--muted);
  display: inline-flex; align-items: center; gap: 5px;
  border: 1px solid var(--line); background: var(--card); border-radius: 999px; padding: 2px 9px;
}}
.chip i {{ width: 6px; height: 6px; border-radius: 50%; display: inline-block; }}
.sep {{ width: 1px; height: 14px; background: var(--line); margin: 0 4px; }}
.plink {{ font-family: 'Spline Sans Mono', monospace; font-size: 12px; }}

/* teaching / service */
.list {{ list-style: none; max-width: 640px; }}
.list li {{ padding: 8px 0; border-bottom: 1px dashed var(--line); font-size: 15px; }}
.list li:last-child {{ border-bottom: 0; }}
.list .k {{ font-family: 'Spline Sans Mono', monospace; font-size: 12.5px; color: var(--muted); margin-right: 12px; }}

footer {{ margin-top: 20px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }}

/* reveal on load */
main > section {{ animation: rise .5s ease both; }}
main > section:nth-child(2) {{ animation-delay: .06s; }}
main > section:nth-child(3) {{ animation-delay: .12s; }}
main > section:nth-child(4) {{ animation-delay: .18s; }}
@keyframes rise {{ from {{ opacity: 0; transform: translateY(8px); }} to {{ opacity: 1; transform: none; }} }}

@media (max-width: 860px) {{
  .wrap {{ grid-template-columns: 1fr; gap: 36px; padding-top: 36px; }}
  .rail {{ position: static; display: grid; grid-template-columns: 120px 1fr; gap: 20px; align-items: center; }}
  .portrait {{ max-width: 90px; }}
  .rail h1 {{ margin-top: 0; font-size: 28px; }}
  .rail nav {{ grid-column: 1 / -1; }}
  .cathead h2 {{ font-size: 21px; }}
  .pub {{ grid-template-columns: 84px 1fr; gap: 14px; }}
  .pimg, .ptile {{ width: 84px; }}
  .lede {{ font-size: 22px; }}
}}
</style>
</head>
<body>
<div class="wrap">

  <aside class="rail">
    <img class="portrait" src="{IMGS['zineng.jpg']}" alt="Portrait of Zineng Tang">
    <h1>Zineng Tang</h1>
    <p class="role">Ph.D. student, <b>UC Berkeley</b><br>Berkeley Artificial Intelligence Research</p>
    <nav aria-label="Profile links">
      <a href="mailto:zn.tang.terran@gmail.com">email</a>
      <a href="images/CV.pdf">cv</a>
      <a href="https://scholar.google.com/citations?user=bZy4vtwAAAAJ" target="_blank" rel="noopener">scholar</a>
      <a href="https://github.com/zinengtang" target="_blank" rel="noopener">github</a>
      <a href="https://twitter.com/ZinengTang" target="_blank" rel="noopener">twitter</a>
    </nav>
  </aside>

  <main>
    <section id="about">
      <p class="lede">I study how machines can <em>see, listen, speak, and act</em> in one coherent loop — building <span class="hl">multimodal models, embodied agents, and world models</span> that learn from and operate in rich environments.</p>
      <div class="bio">
        <p>I am a Ph.D. student at UC Berkeley (BAIR), advised by <a href="https://www.alanesuhr.com/" target="_blank" rel="noopener">Alane Suhr</a>. Before Berkeley, I had wonderful experiences working with <a href="https://www.cs.unc.edu/~mbansal/" target="_blank" rel="noopener">Mohit Bansal</a> at <a href="https://nlp.cs.unc.edu/" target="_blank" rel="noopener">UNC-NLP</a> / <a href="https://murgelab.cs.unc.edu/" target="_blank" rel="noopener">MURGe-Lab</a> and with <a href="https://ziyi-yang.github.io/" target="_blank" rel="noopener">Ziyi Yang</a> at Microsoft. I did my undergrad at UNC Chapel Hill.</p>
      </div>
    </section>

    <section id="publications">
      <div class="eyebrow">Publications</div>
{pubs}
    </section>

    <section id="service">
      <div class="eyebrow">Teaching &amp; Service</div>
      <ul class="list">
        <li><span class="k">organizing</span>LSEI Workshop, co-located with COLM 2026 (San Francisco, Oct 9)</li>
        <li><span class="k">teaching</span>Graduate Student Instructor, CS 288 — Natural Language Processing, UC Berkeley</li>
        <li><span class="k">reviewing</span>NeurIPS · ICLR · ICML · CVPR · ACL · EMNLP</li>
      </ul>
    </section>

    <footer>
      <span>© 2026 Zineng Tang</span>
      <span>Berkeley, California</span>
    </footer>
  </main>

</div>
</body>
</html>'''

open('/mnt/user-data/outputs/index.html', 'w').write(page)
print('bytes:', len(page))
