# Author: Yogabrata Mukhopadhyay
# Organization: Brahmexa
# Copyright (c) 2026 Brahmexa. All rights reserved.
"""Emit nested JSI HTML shells. Run from 1o1-web: python jsi/scripts/emit_pages.py"""

from pathlib import Path

YM_ROOT = Path(__file__).resolve().parents[1]
YM_ORIGIN = "https://yogabrata.com"

YM_PAGES = [
    {
        "file": "infrastructure/index.html",
        "page": "infrastructure",
        "title": "Private AI Infrastructure | JSI Software Solutions",
        "desc": "On-premises, managed private, and hybrid compute foundations for AI services. How placement changes data location, connectivity, control, and operations.",
        "path": "/jsi/infrastructure/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "local-llm/index.html",
        "page": "local-llm",
        "title": "Local LLM Solutions | JSI Software Solutions",
        "desc": "Locally hosted language models for assistants, inference APIs, and business applications—selected and operated to match hardware and workload.",
        "path": "/jsi/local-llm/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "knowledge/index.html",
        "page": "knowledge",
        "title": "RAG and Enterprise Knowledge | JSI Software Solutions",
        "desc": "AI answers grounded in approved organisational information, with citations, access-aware retrieval, freshness, and insufficient-evidence handling.",
        "path": "/jsi/knowledge/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "workflows/index.html",
        "page": "workflows",
        "title": "Local Agentic Workflows | JSI Software Solutions",
        "desc": "Self-hosted n8n connected to local models and RAG, with deterministic rules, run history, retries, and human approval checkpoints.",
        "path": "/jsi/workflows/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "swan/index.html",
        "page": "swan",
        "title": "SWAN Intelligent Smart Boards | JSI Software Solutions",
        "desc": "SWAN interactive boards as an interface for AI-enabled learning and collaboration. Existing hardware capabilities versus proposed AI integrations.",
        "path": "/jsi/swan/",
        "extra": """
    <section class="jsi-section" aria-labelledby="ym-swan-hw">
      <h2 id="ym-swan-hw">Hardware, installation, rental and support</h2>
      <p class="lede" style="margin-left:0">This is the secondary path. Pricing promotions are not the homepage story. Ask JSI for a quote on installation, rental or purchase, and support.</p>
      <div class="jsi-sizes" style="margin:20px 0">
        <figure><img src="/jsi/assets/swan-65.webp" alt="SWAN 65-inch class interactive board"><figcaption class="jsi-loc">65" class</figcaption></figure>
        <figure><img src="/jsi/assets/swan-75.webp" alt="SWAN 75-inch class interactive board"><figcaption class="jsi-loc">75" class</figcaption></figure>
        <figure><img src="/jsi/assets/swan-86.webp" alt="SWAN 86-inch class interactive board"><figcaption class="jsi-loc">86" class</figcaption></figure>
      </div>
      <p class="launch-row">
        <a class="btn-primary" href="mailto:hello@jsisoftwaresolutions.com?subject=SWAN%20board%20%2F%20installation%20enquiry">Email a hardware enquiry</a>
        <a class="btn-secondary" href="tel:+917983875643">Call +91 79838 75643</a>
      </p>
    </section>
""",
        "scripts": "",
    },
    {
        "file": "operations/index.html",
        "page": "operations",
        "title": "Deployment and Operations | JSI Software Solutions",
        "desc": "Discover, design, pilot, deploy, and operate private AI infrastructure. Sizing, integration, evaluation, security, monitoring, and support as scoped services.",
        "path": "/jsi/operations/",
        "extra": """
    <section class="jsi-section" aria-labelledby="ym-journey">
      <h2 id="ym-journey">Engagement journey</h2>
      <div class="jsi-journey" role="list">
        <div class="jsi-step" role="listitem"><span>1</span>Discover</div>
        <div class="jsi-step" role="listitem"><span>2</span>Design</div>
        <div class="jsi-step" role="listitem"><span>3</span>Pilot</div>
        <div class="jsi-step" role="listitem"><span>4</span>Deploy</div>
        <div class="jsi-step" role="listitem"><span>5</span>Operate</div>
      </div>
    </section>
""",
        "scripts": "",
    },
    {
        "file": "see-ai-at-work/index.html",
        "page": "demo",
        "title": "See AI at work | JSI Software Solutions",
        "desc": "Interactive demonstrations with synthetic data: intelligent classroom, private knowledge assistant, and document-to-action workflow. Not a live model or n8n connection.",
        "path": "/jsi/see-ai-at-work/",
        "extra": """
    <header class="hero-intro jsi-hero" style="text-align:left">
      <p class="eyebrow">Interactive demo · Synthetic data</p>
      <h1>See AI at work</h1>
      <p class="lede" style="margin-left:0">Three browser-only demonstrations. They do not call a live model, a live n8n instance, or any customer system.</p>
    </header>
    <div id="ym-scenarios"></div>
""",
        "scripts": '  <script src="/jsi/js/ym_scenarios.js"></script>\n',
        "main_id": "ym-demo-main",
    },
]


def ym_chrome(ym_page: dict) -> str:
    ym_canonical = YM_ORIGIN + ym_page["path"]
    ym_og = YM_ORIGIN + "/jsi/assets/swan-boards.webp"
    ym_main_extra = ym_page.get("extra", "")
    ym_article = ""
    if ym_page["page"] not in ("demo", "home"):
        ym_article = f"""    <article id="ym-solution" class="jsi-prose">
      <p class="eyebrow">JSI Software Solutions</p>
      <h1>{ym_page["title"].split("|")[0].strip()}</h1>
      <p class="lede" style="margin-left:0">{ym_page["desc"]}</p>
    </article>
"""
    return f"""<!--
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.
-->
<!DOCTYPE html>
<html lang="en" data-cosmic-theme="eden" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{ym_page["title"]}</title>
  <meta name="description" content="{ym_page["desc"]}" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="{ym_canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{ym_canonical}" />
  <meta property="og:title" content="{ym_page["title"]}" />
  <meta property="og:description" content="{ym_page["desc"]}" />
  <meta property="og:image" content="{ym_og}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{ym_page["title"]}" />
  <meta name="twitter:description" content="{ym_page["desc"]}" />
  <meta name="twitter:image" content="{ym_og}" />
  <script>
    (function () {{
      var ym_saved = "eden";
      try {{
        ym_saved = localStorage.getItem("brahmexa_cosmic_theme") || localStorage.getItem("manjulab_cosmic_theme") || "eden";
      }} catch (e) {{ /* ignore */ }}
      document.documentElement.setAttribute("data-cosmic-theme", ym_saved);
      var ym_light = ym_saved === "dawn" || ym_saved === "paper" || ym_saved === "ivory";
      document.documentElement.setAttribute("data-theme", ym_light ? "light" : "dark");
    }})();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="icon" href="/jsi/assets/jsi-favicon.png" type="image/png" />
  <link rel="stylesheet" href="/assets/theme.css" />
  <link rel="stylesheet" href="/assets/theme-presets.css" />
  <link rel="stylesheet" href="/jsi/css/jsi.css" />
</head>
<body class="jsi-page" data-ym-page="{ym_page["page"]}">
  <a class="skip-link" href="#ym-main">Skip to content</a>
  <canvas id="cosmos" aria-hidden="true"></canvas>
  <div class="mesh" aria-hidden="true"></div>
  <div class="orb orb-cyan" aria-hidden="true"></div>
  <div class="orb orb-orange" aria-hidden="true"></div>
  <div class="jsi-banner">In-flight preview · yogabrata.com/jsi/ · not the live jsisoftwaresolutions.com storefront</div>
  <header class="site-header jsi-header">
    <div class="header-inner">
      <a class="jsi-brand" href="/jsi/">
        <img src="/jsi/assets/jsi-logo.webp" width="44" height="44" alt="" />
        <span>
          <span class="site-name">JSI Software Solutions</span>
          <span class="site-tag">The infrastructure behind practical AI</span>
        </span>
      </a>
      <button type="button" class="jsi-menu-toggle" id="jsi-menu-toggle" aria-expanded="false" aria-controls="jsi-nav">Menu</button>
      <nav class="jsi-nav" id="jsi-nav" aria-label="JSI">
        <a href="/jsi/#solutions">Solutions</a>
        <a href="/jsi/see-ai-at-work/">See AI at work</a>
        <a href="/jsi/#architecture">Architecture</a>
        <a href="/jsi/swan/">SWAN</a>
        <a href="/jsi/#leadership">Leadership</a>
        <a href="/jsi/#contact">Contact</a>
      </nav>
    </div>
  </header>
  <main class="main-wrap jsi-main" id="ym-main">
{ym_article}{ym_main_extra}
  </main>
  <footer class="site-footer jsi-footer">
    <p>JSI Software Solutions Pvt Ltd · a <a href="https://brahmexa.com">Brahmexa LLC</a> related delivery organisation in the KAIORB network. KAI247 is the SaaS platform.</p>
    <p class="footer-tag"><a href="/">Yogabrata inflight projects</a> · Preview indexing: noindex</p>
  </footer>
  <script src="/assets/cosmic.js"></script>
  <script src="/assets/theme-picker.js"></script>
  <script src="/jsi/js/ym_app.js"></script>
{ym_page["scripts"]}</body>
</html>
"""


def main() -> None:
    for ym_page in YM_PAGES:
        ym_path = YM_ROOT / ym_page["file"]
        ym_path.parent.mkdir(parents=True, exist_ok=True)
        ym_path.write_text(ym_chrome(ym_page), encoding="utf-8")
        print("wrote", ym_path.relative_to(YM_ROOT))


if __name__ == "__main__":
    main()
