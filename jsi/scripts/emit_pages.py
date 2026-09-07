# Author: Yogabrata Mukhopadhyay
# Organization: Brahmexa
# Copyright (c) 2026 Brahmexa. All rights reserved.
"""Emit JSI HTML shells. Run from 1o1-web: python jsi/scripts/emit_pages.py"""

from pathlib import Path

YM_ROOT = Path(__file__).resolve().parents[1]
YM_ORIGIN = "https://yogabrata.com"

YM_NAV = """        <a href="/jsi/#solutions">Solutions</a>
        <a href="/jsi/#offerings">Offerings</a>
        <a href="/jsi/see-ai-at-work/">See AI at work</a>
        <a href="/jsi/#architecture">Architecture</a>
        <a href="/jsi/swan/">SWAN</a>
        <a href="/jsi/#nexus">Nexus</a>
        <a href="/jsi/#contact">Contact</a>"""

YM_HOME_BODY = r"""
    <header class="jsi-hero">
      <div>
        <p class="eyebrow">The infrastructure behind practical AI</p>
        <h1>Your infrastructure. Your knowledge. AI that gets work done.</h1>
        <p class="lede">Private compute, local language models, knowledge retrieval, and agentic workflows—from school operations to the board at the front of the room.</p>
        <div class="jsi-status-row">
          <span class="jsi-badge" data-status="in-flight">In Flight</span>
          <span class="jsi-badge" data-status="available">SWAN hardware available</span>
          <span class="jsi-badge" data-status="proposed">AI platform packaging in preview</span>
        </div>
        <div class="jsi-hero-actions">
          <a class="btn-primary" href="#solutions">Explore a solution</a>
          <button type="button" class="btn-secondary" data-nexus-open data-nexus-ask="What does JSI Software Solutions offer?">Ask Nexus</button>
          <a class="btn-secondary" href="#contact">Discuss your deployment</a>
        </div>
      </div>
      <img class="jsi-hero-photo" src="/jsi/assets/swan-hero.webp" width="720" height="540" alt="SWAN interactive board in a classroom" />
    </header>

    <section class="jsi-section" id="solutions" aria-labelledby="ym-solutions-title">
      <p class="eyebrow">Solutions</p>
      <h2 id="ym-solutions-title">One stack, from board to compute</h2>
      <p class="lede" style="margin-left:0">JSI connects compute, local LLMs, private knowledge retrieval, workflow orchestration, and intelligent devices into something a school leader or business owner can actually run.</p>
      <div class="jsi-sol-grid">
        <a class="jsi-sol-card" href="/jsi/infrastructure/">
          <div class="jsi-sol-bar" aria-hidden="true"></div>
          <div class="jsi-sol-body">
            <span class="jsi-badge" data-status="pilot">Pilot</span>
            <h3>Private AI Infrastructure</h3>
            <p>On-premises, managed private, or hybrid. Placement decides data location, connectivity, control, and who operates the stack.</p>
            <span class="jsi-sol-link">Open this solution</span>
          </div>
        </a>
        <a class="jsi-sol-card" href="/jsi/local-llm/">
          <div class="jsi-sol-bar" aria-hidden="true"></div>
          <div class="jsi-sol-body">
            <span class="jsi-badge" data-status="pilot">Pilot</span>
            <h3>Local LLM Solutions</h3>
            <p>Hosted models for assistants and APIs. Selection follows hardware and workload—not a claim that every model fits every machine.</p>
            <span class="jsi-sol-link">Open this solution</span>
          </div>
        </a>
        <a class="jsi-sol-card" href="/jsi/knowledge/">
          <div class="jsi-sol-bar" aria-hidden="true"></div>
          <div class="jsi-sol-body">
            <span class="jsi-badge" data-status="pilot">Pilot</span>
            <h3>RAG and Enterprise Knowledge</h3>
            <p>Answers grounded in approved files, with citations. If evidence is missing, the system should say so.</p>
            <span class="jsi-sol-link">Open this solution</span>
          </div>
        </a>
        <a class="jsi-sol-card" href="/jsi/workflows/">
          <div class="jsi-sol-bar" aria-hidden="true"></div>
          <div class="jsi-sol-body">
            <span class="jsi-badge" data-status="proposed">Proposed integration</span>
            <h3>Local Agentic Workflows</h3>
            <p>Self-hosted n8n with local models and RAG. Rules and people control actions; the model drafts and extracts.</p>
            <span class="jsi-sol-link">Open this solution</span>
          </div>
        </a>
        <a class="jsi-sol-card" href="/jsi/swan/">
          <div class="jsi-sol-bar" aria-hidden="true"></div>
          <div class="jsi-sol-body">
            <span class="jsi-badge" data-status="available">Available</span>
            <h3>SWAN Intelligent Smart Boards</h3>
            <p>The classroom and meeting interface. Hardware is available now; AI lesson and meeting features are proposed integrations.</p>
            <span class="jsi-sol-link">Open this solution</span>
          </div>
        </a>
        <a class="jsi-sol-card" href="/jsi/operations/">
          <div class="jsi-sol-bar" aria-hidden="true"></div>
          <div class="jsi-sol-body">
            <span class="jsi-badge" data-status="pilot">Pilot</span>
            <h3>Deployment and Operations</h3>
            <p>Discover → Design → Pilot → Deploy → Operate. Monitoring, maintenance, and support are scoped—not unlimited.</p>
            <span class="jsi-sol-link">Open this solution</span>
          </div>
        </a>
      </div>
    </section>

    <section class="jsi-section" id="offerings" aria-labelledby="ym-offer-title">
      <p class="eyebrow">Also from JSI</p>
      <h2 id="ym-offer-title">Products and services already in the field</h2>
      <p class="lede" style="margin-left:0">These paths exist on the live JSI storefront. Current trials, rental, and purchase terms are confirmed with sales—not advertised here as guarantees.</p>
      <div class="jsi-offer-grid">
        <article class="jsi-offer">
          <span class="jsi-badge" data-status="available">Available</span>
          <h3>SWAN boards — rent or buy</h3>
          <p>Registered JSI brand. Classroom and meeting panels, installation, and support by enquiry.</p>
        </article>
        <article class="jsi-offer">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>Computer labs</h3>
          <p>Lab setup for schools and institutes, as a rental or purchase engagement.</p>
        </article>
        <article class="jsi-offer">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>Abhyas exam portal</h3>
          <p>Online examinations, question banks, and analytics. <a href="mailto:abhyas@jsisoftwaresolutions.com">abhyas@jsisoftwaresolutions.com</a></p>
        </article>
        <article class="jsi-offer">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>ChitrGupt school ERP</h3>
          <p>Students, fees, attendance, exams, and parent communication—scoped with the school.</p>
        </article>
        <article class="jsi-offer">
          <span class="jsi-badge" data-status="proposed">Enquiry</span>
          <h3>Chat X</h3>
          <p>JSI’s LLM chatbot offering for websites and support. Distinct from Nexus on this preview.</p>
        </article>
        <article class="jsi-offer">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>Hosting, software, apps, web</h3>
          <p>Managed hosting, custom software, mobile apps, websites, and digital marketing—by discussion.</p>
        </article>
      </div>
    </section>

    <section class="jsi-section" id="see-ai" aria-labelledby="ym-demo-title">
      <p class="eyebrow">See AI at work</p>
      <h2 id="ym-demo-title">Three demonstrations, synthetic data only</h2>
      <p class="lede" style="margin-left:0">Each scenario shows the problem, sample inputs, processing stages, where the local LLM, RAG, and n8n participate, where rules or a person intervene, and what is local versus external. Nothing here is a live customer system.</p>
      <p class="jsi-loc">Interactive demo • Synthetic data. Runs in the browser only.</p>
      <div id="ym-scenarios"></div>
    </section>

    <section class="jsi-section" id="architecture" aria-labelledby="ym-arch-title">
      <p class="eyebrow">Architecture</p>
      <h2 id="ym-arch-title">Interfaces → Orchestration → Models and Knowledge → Compute</h2>
      <p class="lede" style="margin-left:0">Select a component to read its role and data boundary. External connectors can move data off a local deployment; they are optional and must be named.</p>
      <div class="jsi-arch">
        <div class="jsi-arch-stack" id="ym-arch-stack" role="group" aria-label="Architecture layers"></div>
        <div class="jsi-arch-detail" id="ym-arch-detail" aria-live="polite">
          <p>Loading architecture…</p>
        </div>
      </div>
      <p class="jsi-legend">
        <span><i class="jsi-dot"></i>Local or private by default</span>
        <span><i class="jsi-dot ext"></i>May leave the building if a connector is enabled</span>
      </p>
    </section>

    <section class="jsi-section" aria-labelledby="ym-swan-title">
      <div class="jsi-swan-hero">
        <div>
          <p class="eyebrow">SWAN · registered JSI brand</p>
          <h2 id="ym-swan-title">The intelligent interface in the room</h2>
          <p class="lede" style="margin-left:0">SWAN boards are how teachers and teams meet the platform: ask about approved materials, review a quiz, present, and write together. Hardware is a current JSI product. AI features on the board are proposed integrations, shown in the classroom demo as a simulation.</p>
          <p class="launch-row">
            <a class="btn-primary" href="/jsi/swan/">SWAN capabilities vs proposed AI</a>
            <a class="btn-secondary" href="mailto:hello@jsisoftwaresolutions.com?subject=SWAN%20board%20%2F%20installation%20enquiry">Hardware enquiry</a>
          </p>
        </div>
        <img src="/jsi/assets/swan-boards.webp" alt="SWAN interactive smart boards" width="640" height="400" />
      </div>
      <div class="jsi-photo-band">
        <figure>
          <img src="/jsi/assets/swan-65.webp" alt="SWAN 65-inch class interactive board" width="400" height="240" />
          <figcaption class="jsi-loc">65" class</figcaption>
        </figure>
        <figure>
          <img src="/jsi/assets/swan-75.webp" alt="SWAN 75-inch class interactive board" width="400" height="240" />
          <figcaption class="jsi-loc">75" class</figcaption>
        </figure>
        <figure>
          <img src="/jsi/assets/swan-86.webp" alt="SWAN 86-inch class interactive board" width="400" height="240" />
          <figcaption class="jsi-loc">86" class</figcaption>
        </figure>
      </div>
    </section>

    <section class="jsi-section" id="nexus" aria-labelledby="ym-nexus-title">
      <div class="jsi-nexus">
        <div>
          <p class="eyebrow">Nexus · Brahmexa Business Brain</p>
          <h2 id="ym-nexus-title">Ask about JSI and Brahmexa</h2>
          <p class="lede" style="margin-left:0">Nexus on this preview is seeded with JSI products, places, and the public Brahmexa catalog. Answers cite business sources when they can; questions outside that material are labelled as general AI. It is not a live customer tenant and it does not replace email or phone.</p>
          <p class="launch-row">
            <button type="button" class="btn-primary" data-nexus-open data-nexus-ask="How is JSI related to Brahmexa?">Open Nexus</button>
            <a class="btn-secondary" href="https://brahmexa.com/nexus.php">What Nexus is</a>
          </p>
        </div>
        <p class="jsi-loc">Widget key pk_jsi_site · yogabrata.com allowlisted · powered by Brahmexa Nexus</p>
      </div>
    </section>

    <section class="jsi-section" id="leadership" aria-labelledby="ym-leader-title">
      <div class="jsi-leader">
        <img src="/jsi/assets/yoga-mukhopadhyay.jpg" width="220" height="264" alt="Portrait of Yogabrata Mukhopadhyay, CEO of JSI Software Solutions" />
        <div>
          <p class="eyebrow">Leadership</p>
          <h2 id="ym-leader-title">Yogabrata “Yoga” Mukhopadhyay</h2>
          <p class="jsi-loc">CEO, JSI Software Solutions</p>
          <p>Yogabrata ‘Yoga’ Mukhopadhyay, CEO of JSI Software Solutions, brings more than 25 years of experience combining business leadership with hands-on expertise in engineering, enterprise architecture, and technology transformation. Throughout his career at Ericsson, Comverse, and other technology organizations, he led the adoption of emerging technologies to create revenue opportunities, improve operational efficiency, and strengthen delivery through automation and lean processes. At JSI, he applies this blend of commercial insight and technical depth to infrastructure for AI-based services, including local language models, enterprise knowledge systems, agentic workflows, and intelligent SWAN smart boards. His focus is on connecting hardware, software, and intelligence into dependable solutions that translate technology investment into productivity, better experiences, and sustainable growth.</p>
        </div>
      </div>
    </section>

    <section class="jsi-section" id="contact" aria-labelledby="ym-contact-title">
      <p class="eyebrow">Contact</p>
      <h2 id="ym-contact-title">Discuss a deployment</h2>
      <p class="lede" style="margin-left:0">This preview has no message backend. Use email, phone, or WhatsApp. A form that claimed “sent” without a server would be dishonest, so it is not offered here.</p>
      <div class="jsi-contact-grid">
        <article class="card jsi-card">
          <h3>Email enquiry</h3>
          <p>Sales and general questions.</p>
          <a href="mailto:hello@jsisoftwaresolutions.com?subject=JSI%20AI%20infrastructure%20enquiry">hello@jsisoftwaresolutions.com</a>
        </article>
        <article class="card jsi-card">
          <h3>Technical support</h3>
          <p>Existing hardware and software support.</p>
          <a href="mailto:tech-support@jsisoftwaresolutions.com">tech-support@jsisoftwaresolutions.com</a>
        </article>
        <article class="card jsi-card">
          <h3>Phone / WhatsApp</h3>
          <p>Published JSI number.</p>
          <a href="tel:+917983875643">+91 79838 75643</a><br />
          <a href="https://wa.me/917983875643">WhatsApp</a>
        </article>
        <article class="card jsi-card">
          <h3>Places</h3>
          <p>Moradabad (JSI). Rampur (infrastructure location; no capacity claims on this page). Manesar. Renton, WA (Brahmexa LLC).</p>
        </article>
      </div>
    </section>
"""

YM_PAGES = [
    {
        "file": "index.html",
        "page": "home",
        "title": "JSI — AI Infrastructure & Intelligent Systems",
        "desc": "Private LLMs, enterprise RAG, local agentic workflows, and SWAN intelligent smart boards. The infrastructure behind practical AI.",
        "path": "/jsi/",
        "extra": YM_HOME_BODY,
        "scripts": (
            '  <script src="/jsi/js/ym_architecture.js?v=2"></script>\n'
            '  <script src="/jsi/js/ym_scenarios.js?v=2"></script>\n'
        ),
    },
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
    <header class="hero-intro jsi-hero" style="grid-template-columns:1fr">
      <div>
        <p class="eyebrow">Interactive demo · Synthetic data</p>
        <h1>See AI at work</h1>
        <p class="lede" style="margin-left:0">Three browser-only demonstrations. They do not call a live model, a live n8n instance, or any customer system.</p>
      </div>
    </header>
    <div id="ym-scenarios"></div>
""",
        "scripts": '  <script src="/jsi/js/ym_scenarios.js?v=2"></script>\n',
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
<html lang="en" data-cosmic-theme="forge" data-theme="dark">
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
      var ym_saved = "forge";
      try {{
        ym_saved = localStorage.getItem("jsi_cosmic_theme") || "forge";
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
  <link rel="stylesheet" href="/assets/theme-presets.css?v=jsi-forge" />
  <link rel="stylesheet" href="/jsi/css/jsi.css?v=2" />
</head>
<body class="jsi-page" data-ym-page="{ym_page["page"]}">
  <a class="skip-link" href="#ym-main">Skip to content</a>
  <canvas id="cosmos" aria-hidden="true"></canvas>
  <div class="mesh" aria-hidden="true"></div>
  <div class="jsi-watermark" aria-hidden="true">
    <img src="/jsi/assets/jsi-favicon.png" alt="" width="620" height="620" />
  </div>
  <div class="jsi-banner">In-flight preview · yogabrata.com/jsi/ · not the live jsisoftwaresolutions.com storefront</div>
  <header class="site-header jsi-header">
    <div class="header-inner">
      <a class="jsi-brand" href="/jsi/">
        <img class="jsi-brand-mark" src="/jsi/assets/jsi-favicon.png" width="72" height="72" alt="JSI Software Solutions" />
        <span>
          <span class="site-name">JSI Software Solutions</span>
          <span class="site-tag">The infrastructure behind practical AI</span>
        </span>
      </a>
      <button type="button" class="jsi-menu-toggle" id="jsi-menu-toggle" aria-expanded="false" aria-controls="jsi-nav">Menu</button>
      <nav class="jsi-nav" id="jsi-nav" aria-label="JSI">
{YM_NAV}
      </nav>
    </div>
  </header>
  <main class="main-wrap jsi-main" id="ym-main">
{ym_article}{ym_main_extra}
  </main>
  <footer class="site-footer jsi-footer">
    <p>JSI Software Solutions Pvt Ltd · a <a href="https://brahmexa.com">Brahmexa LLC</a> related delivery organisation in the KAIORB network. KAI247 is the SaaS platform.</p>
    <p class="footer-tag"><a href="/">Yogabrata inflight projects</a> · Preview indexing: noindex · jsisoftwaresolutions.com is unchanged</p>
  </footer>
  <script src="/assets/cosmic.js"></script>
  <script src="/assets/theme-picker.js?v=jsi-forge"></script>
  <script src="/jsi/js/ym_app.js?v=2"></script>
{ym_page["scripts"]}  <script src="https://brahmexa.com/nexus/widget.js" data-nexus-key="pk_jsi_site" data-nexus-accent="#c44536" defer></script>
</body>
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
