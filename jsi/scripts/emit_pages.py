# Author: Yogabrata Mukhopadhyay
# Organization: Brahmexa
# Copyright (c) 2026 Brahmexa. All rights reserved.
"""Emit JSI HTML shells. Run from 1o1-web: python jsi/scripts/emit_pages.py"""

from pathlib import Path

YM_ROOT = Path(__file__).resolve().parents[1]
YM_ORIGIN = "https://yogabrata.com"

YM_NAV = """        <a href="/jsi/see-ai-at-work/">Work</a>
        <a href="/jsi/swan/">SWAN</a>
        <a href="/jsi/#solutions">Solutions</a>
        <a href="/jsi/offerings/">Offerings</a>
        <a href="/jsi/contact/">Contact</a>"""

YM_HOME_BODY = r"""
    <section class="jsi-home-hero" aria-labelledby="home-title">
      <p class="home-kicker">AI infrastructure &amp; intelligent systems</p>
      <h1 id="home-title">Your AI.<br><span>On your terms.</span></h1>
      <p class="home-intro">Private intelligence. Connected knowledge. Smarter spaces.</p>
      <div class="jsi-hero-actions">
        <a class="btn-primary" href="/jsi/contact/">Talk to JSI</a>
        <a class="home-demo" href="/jsi/see-ai-at-work/">See AI at work <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    <section class="home-offerings" id="solutions" aria-labelledby="offerings-title">
      <div class="home-section-head"><h2 id="offerings-title">Built around your business.</h2><a href="/jsi/offerings/">All offerings ↗</a></div>
      <div class="home-offering-grid">
        <a href="/jsi/infrastructure/"><span class="home-number" aria-hidden="true">01 / COMPUTE</span><h3>Private AI</h3><p>Your infrastructure. Your control.</p></a>
        <a href="/jsi/local-llm/"><span class="home-number" aria-hidden="true">02 / MODELS</span><h3>Local LLMs</h3><p>Intelligence close to your data.</p></a>
        <a href="/jsi/knowledge/"><span class="home-number" aria-hidden="true">03 / KNOWLEDGE</span><h3>Enterprise RAG</h3><p>Your knowledge. Grounded answers.</p></a>
        <a href="/jsi/workflows/"><span class="home-number" aria-hidden="true">04 / AUTOMATION</span><h3>Agentic Workflows</h3><p>Local agents. Connected work.</p></a>
        <a href="/jsi/swan/"><span class="home-number" aria-hidden="true">05 / SPACES</span><h3>SWAN Smart Boards</h3><p>Meet. Teach. Collaborate.</p></a>
      </div>
      <p class="home-availability">SWAN hardware available · AI solutions in pilot &amp; preview</p>
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
        "scripts": "",
    },
    {
        "file": "swan/index.html",
        "page": "swan",
        "title": "SWAN Intelligent Smart Boards | JSI Software Solutions",
        "desc": "SWAN interactive boards as an interface for AI-enabled learning and collaboration. Available hardware and proposed AI capabilities.",
        "path": "/jsi/swan/",
        "extra": """
    <section class="jsi-section">
      <p class="eyebrow">Hardware Product</p>
      <h1>SWAN Intelligent Smart Boards</h1>
      <p class="lede">Classroom and meeting displays built for interactive presentation and grounded AI support.</p>

      <h2 style="margin-top:32px">Hardware Specifications</h2>
      <table class="jsi-spec-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Specification</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Display Sizes</td>
            <td>65", 75", and 86" Class 4K UHD Displays</td>
          </tr>
          <tr>
            <td>Operating Systems</td>
            <td>Android onboard with optional Windows OPS PC Module</td>
          </tr>
          <tr>
            <td>Touch & Interface</td>
            <td>Multi-touch precision writing, anti-glare tempered glass</td>
          </tr>
          <tr>
            <td>Proposed AI Features</td>
            <td>Lesson pack Q&A, automated quiz drafting, meeting note assistance</td>
          </tr>
          <tr>
            <td>Procurement Terms</td>
            <td>Rental, purchase, installation, and support by direct enquiry</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:32px; display:flex; gap:14px; flex-wrap:wrap">
        <a class="btn-primary" href="mailto:hello@jsisoftwaresolutions.com?subject=SWAN%20board%20%2F%20installation%20enquiry">Email hardware enquiry</a>
        <a class="btn-secondary" href="tel:+917983875643">Call +91 79838 75643</a>
      </div>
    </section>
""",
        "scripts": "",
    },
    {
        "file": "infrastructure/index.html",
        "page": "infrastructure",
        "title": "Private AI Infrastructure | JSI Software Solutions",
        "desc": "On-premises, managed private, and hybrid compute foundations for AI services.",
        "path": "/jsi/infrastructure/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "local-llm/index.html",
        "page": "local-llm",
        "title": "Local LLM Solutions | JSI Software Solutions",
        "desc": "Locally hosted language models for assistants, inference APIs, and business applications.",
        "path": "/jsi/local-llm/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "knowledge/index.html",
        "page": "knowledge",
        "title": "RAG and Enterprise Knowledge | JSI Software Solutions",
        "desc": "AI answers grounded in approved organisational information with citations.",
        "path": "/jsi/knowledge/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "workflows/index.html",
        "page": "workflows",
        "title": "Local Agentic Workflows | JSI Software Solutions",
        "desc": "Self-hosted n8n connected to local models and RAG with human approval checkpoints.",
        "path": "/jsi/workflows/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "operations/index.html",
        "page": "operations",
        "title": "Deployment and Operations | JSI Software Solutions",
        "desc": "Discover, design, pilot, deploy, and operate private AI infrastructure.",
        "path": "/jsi/operations/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "see-ai-at-work/index.html",
        "page": "demo",
        "title": "See AI at work | JSI Software Solutions",
        "desc": "Interactive demonstrations with synthetic data: intelligent classroom, private knowledge assistant, and document-to-action workflow.",
        "path": "/jsi/see-ai-at-work/",
        "extra": """
    <header class="hero-intro jsi-hero-arch" style="margin-bottom:24px">
      <div class="jsi-hero-head" style="margin-bottom:0">
        <p class="eyebrow">Interactive Demo · Synthetic Data</p>
        <h1>See AI at work</h1>
        <p class="lede">Three browser-only demonstrations. Interactive demo • Synthetic data. Runs in the browser only.</p>
      </div>
    </header>
    <div id="ym-scenarios"></div>
""",
        "scripts": '  <script src="/jsi/js/ym_scenarios.js?v=2"></script>\n',
    },
    {
        "file": "offerings/index.html",
        "page": "offerings",
        "title": "Products & Services | JSI Software Solutions",
        "desc": "Products and services already in the field: SWAN boards, computer labs, Abhyas exam portal, ChitrGupt ERP, Chat X, and custom hosting.",
        "path": "/jsi/offerings/",
        "extra": """
    <section class="jsi-section">
      <p class="eyebrow">Field Deployments</p>
      <h1>Products & Services</h1>
      <p class="lede">Products and capabilities operating in schools, institutes, and enterprises.</p>
      
      <div class="jsi-offer-grid">
        <article class="jsi-offer-card">
          <span class="jsi-badge" data-status="available">Available</span>
          <h3>SWAN Interactive Boards</h3>
          <p>Classroom and meeting panels, installation, and support by direct enquiry.</p>
          <a class="btn-secondary" href="mailto:hello@jsisoftwaresolutions.com?subject=SWAN%20board%20enquiry">Enquire →</a>
        </article>

        <article class="jsi-offer-card">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>Computer Labs</h3>
          <p>Complete lab setup for schools and institutes as a rental or purchase engagement.</p>
          <a class="btn-secondary" href="mailto:hello@jsisoftwaresolutions.com?subject=Computer%20lab%20enquiry">Enquire →</a>
        </article>

        <article class="jsi-offer-card">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>Abhyas Exam Portal</h3>
          <p>Online examinations, question banks, and analytics for educational institutions.</p>
          <a class="btn-secondary" href="mailto:abhyas@jsisoftwaresolutions.com">Email Abhyas →</a>
        </article>

        <article class="jsi-offer-card">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>ChitrGupt School ERP</h3>
          <p>Students, fees, attendance, examinations, and parent communication portal.</p>
          <a class="btn-secondary" href="mailto:hello@jsisoftwaresolutions.com?subject=ChitrGupt%20ERP%20enquiry">Enquire →</a>
        </article>

        <article class="jsi-offer-card">
          <span class="jsi-badge" data-status="proposed">Enquiry</span>
          <h3>Chat X</h3>
          <p>JSI LLM chatbot offering for websites and customer support.</p>
          <a class="btn-secondary" href="mailto:hello@jsisoftwaresolutions.com?subject=Chat%20X%20enquiry">Enquire →</a>
        </article>

        <article class="jsi-offer-card">
          <span class="jsi-badge" data-status="available">Enquiry</span>
          <h3>Hosting, Software & Apps</h3>
          <p>Managed hosting, custom web applications, mobile apps, and digital platforms.</p>
          <a class="btn-secondary" href="mailto:hello@jsisoftwaresolutions.com?subject=Custom%20software%20enquiry">Enquire →</a>
        </article>
      </div>
    </section>
""",
        "scripts": "",
    },
    {
        "file": "architecture/index.html",
        "page": "architecture",
        "title": "System Architecture | JSI Software Solutions",
        "desc": "Interfaces → Orchestration → Models and Knowledge → Compute. Inspect the data boundary for each layer.",
        "path": "/jsi/architecture/",
        "extra": """
    <section class="jsi-section">
      <p class="eyebrow">Architecture Stack</p>
      <h1>System Architecture</h1>
      <p class="lede">Interfaces → Orchestration → Models and Knowledge → Compute. Select a component to inspect data boundaries.</p>
      
      <div class="jsi-arch">
        <div class="jsi-arch-stack" id="ym-arch-stack" role="group" aria-label="Architecture layers"></div>
        <div class="jsi-arch-detail" id="ym-arch-detail" aria-live="polite">
          <p>Loading architecture…</p>
        </div>
      </div>
      
      <p class="jsi-legend" style="margin-top:20px">
        <span><i class="jsi-dot"></i>Local or private by default</span>
        <span><i class="jsi-dot ext"></i>May leave the building if a connector is enabled</span>
      </p>
    </section>
""",
        "scripts": '  <script src="/jsi/js/ym_architecture.js?v=2"></script>\n',
    },
    {
        "file": "nexus/index.html",
        "page": "nexus",
        "title": "Nexus Assistant | JSI Software Solutions",
        "desc": "Interactive Nexus widget powered by Brahmexa Business Brain.",
        "path": "/jsi/nexus/",
        "extra": """
    <section class="jsi-section">
      <div class="jsi-nexus">
        <div>
          <p class="eyebrow">Nexus · Brahmexa Business Brain</p>
          <h1>Ask about JSI & Brahmexa</h1>
          <p class="lede">Nexus is seeded with JSI products, solutions, and public Brahmexa catalog facts. Powered by Brahmexa Nexus key pk_jsi_site.</p>
          <div class="jsi-hero-actions" style="margin-top:24px">
            <button type="button" class="btn-primary" data-nexus-open data-nexus-ask="What does JSI Software Solutions offer?">Launch Nexus Assistant</button>
            <a class="btn-secondary" href="https://brahmexa.com/nexus.php" target="_blank" rel="noopener">About Nexus →</a>
          </div>
        </div>
      </div>
    </section>
""",
        "scripts": "",
    },
    {
        "file": "contact/index.html",
        "page": "contact",
        "title": "Contact & Leadership | JSI Software Solutions",
        "desc": "Direct channels for email enquiries, technical support, phone/WhatsApp, office locations, and executive leadership.",
        "path": "/jsi/contact/",
        "extra": """
    <section class="jsi-section">
      <p class="eyebrow">Direct Contact</p>
      <h1>Discuss your deployment</h1>
      <p class="lede">Reach sales, engineering, and support directly by email, phone, or WhatsApp.</p>
      
      <div class="jsi-contact-grid">
        <article class="jsi-contact-card">
          <h3>Email Enquiry</h3>
          <p>Sales, partnership, and general questions.</p>
          <a href="mailto:hello@jsisoftwaresolutions.com?subject=JSI%20AI%20infrastructure%20enquiry">hello@jsisoftwaresolutions.com</a>
        </article>

        <article class="jsi-contact-card">
          <h3>Technical Support</h3>
          <p>Existing hardware and software support.</p>
          <a href="mailto:tech-support@jsisoftwaresolutions.com">tech-support@jsisoftwaresolutions.com</a>
        </article>

        <article class="jsi-contact-card">
          <h3>Phone & WhatsApp</h3>
          <p>Published JSI direct line.</p>
          <a href="tel:+917983875643">+91 79838 75643</a><br/>
          <a href="https://wa.me/917983875643" style="display:inline-block; margin-top:6px">WhatsApp chat →</a>
        </article>
      </div>

      <h2 style="margin-top:40px">Office Locations</h2>
      <div class="jsi-address-list">
        <div class="jsi-address-item">
          <h4>India — Moradabad (JSI HQ)</h4>
          <p>2nd Floor, Madhubani Complex, Kanth Road, Moradabad, UP 244001</p>
        </div>
        <div class="jsi-address-item">
          <h4>India — Rampur (Infrastructure)</h4>
          <p>Plot C-16, Roshan Bagh Industrial Area, Civil Lines, Rampur, UP 244901</p>
        </div>
        <div class="jsi-address-item">
          <h4>India — Manesar (Gurugram)</h4>
          <p>Manesar, New City Gurugram, Haryana 122051</p>
        </div>
        <div class="jsi-address-item">
          <h4>United States — Renton (Brahmexa LLC)</h4>
          <p>Renton, WA 98056, United States (Related organisation)</p>
        </div>
      </div>

      <div class="jsi-leader">
        <img src="/jsi/assets/yoga-mukhopadhyay.jpg" width="220" height="264" alt="Portrait of Yogabrata Mukhopadhyay, CEO of JSI Software Solutions" />
        <div>
          <p class="eyebrow">Leadership</p>
          <h2 style="margin-top:4px">Yogabrata “Yoga” Mukhopadhyay</h2>
          <p class="jsi-loc" style="margin-bottom:12px">CEO, JSI Software Solutions</p>
          <p>Yogabrata ‘Yoga’ Mukhopadhyay combines 25+ years of business leadership with hands-on architecture expertise across Ericsson, Comverse, and Brahmexa. At JSI, he leads private AI infrastructure, local LLMs, and intelligent SWAN smart board deployments.</p>
        </div>
      </div>
    </section>
""",
        "scripts": "",
    },
]


def ym_chrome(ym_page: dict) -> str:
    ym_canonical = YM_ORIGIN + ym_page["path"]
    ym_og = YM_ORIGIN + "/jsi/assets/swan-boards.webp"
    ym_main_extra = ym_page.get("extra", "")
    ym_article = ""
    if ym_page["page"] not in ("demo", "home", "swan", "offerings", "architecture", "nexus", "contact"):
        ym_article = f"""    <article id="ym-solution" class="jsi-prose">
      <p class="eyebrow">JSI Software Solutions</p>
      <h1>{ym_page["title"].split("|")[0].strip()}</h1>
      <p class="lede" style="margin-left:0">{ym_page["desc"]}</p>
    </article>
"""
    ym_html = f"""<!--
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.
-->
<!DOCTYPE html>
<html lang="en" data-cosmic-theme="paper" data-theme="light">
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
      var ym_saved = "paper";
      try {{
        ym_saved = localStorage.getItem("jsi_cosmic_theme") || "paper";
      }} catch (e) {{ /* ignore */ }}
      document.documentElement.setAttribute("data-cosmic-theme", ym_saved);
      var ym_light = ym_saved !== "forge" && ym_saved !== "abyss" && ym_saved !== "void" && ym_saved !== "noir";
      document.documentElement.setAttribute("data-theme", ym_light ? "light" : "dark");
    }})();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="icon" href="/jsi/assets/jsi-favicon.png" type="image/png" />
  <link rel="stylesheet" href="/assets/theme.css" />
  <link rel="stylesheet" href="/assets/theme-presets.css?v=jsi-paper" />
  <link rel="stylesheet" href="/jsi/css/jsi.css?v=5" />
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
        <img class="jsi-brand-mark" src="/jsi/assets/jsi-favicon.png" width="80" height="80" alt="JSI Software Solutions" />
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
    <p class="footer-tag"><a href="/jsi/architecture/">Architecture</a> · <a href="/jsi/nexus/">Ask Nexus</a> · <a href="/">Yogabrata inflight projects</a> · Preview indexing: noindex · jsisoftwaresolutions.com is unchanged</p>
  </footer>
  <script src="/assets/cosmic.js"></script>
  <script src="/assets/theme-picker.js?v=jsi-paper"></script>
  <script src="/jsi/js/ym_app.js?v=2"></script>
{ym_page["scripts"]}  <script src="https://brahmexa.com/nexus/widget.js" data-nexus-key="pk_jsi_site" data-nexus-accent="#c44536" defer></script>
</body>
</html>
"""

    if ym_page["page"] == "home":
        # Keep the landing page static and readable without theme/animation JS.
        start = ym_html.index("  <script>")
        end = ym_html.index("  <link rel=\"preconnect\"", start)
        ym_html = ym_html[:start] + ym_html[end:]
        ym_html = ym_html.replace('<link rel="stylesheet" href="/assets/theme.css" />', '')
        ym_html = ym_html.replace('<link rel="stylesheet" href="/assets/theme-presets.css?v=jsi-paper" />', '')
        ym_html = ym_html.replace('<link rel="stylesheet" href="/jsi/css/jsi.css?v=5" />', '<link rel="stylesheet" href="/jsi/css/home.css?v=1" />')
        ym_html = ym_html.replace('<canvas id="cosmos" aria-hidden="true"></canvas>', '')
        ym_html = ym_html.replace('<div class="mesh" aria-hidden="true"></div>', '')
        ym_html = ym_html.replace('<script src="/assets/cosmic.js"></script>', '')
        ym_html = ym_html.replace('<script src="/assets/theme-picker.js?v=jsi-paper"></script>', '')
        ym_html = ym_html.replace('<script src="/jsi/js/ym_app.js?v=2"></script>', '<script src="/jsi/js/ym_app.js?v=2" defer></script>')
        ym_html = ym_html.replace('In-flight preview · yogabrata.com/jsi/ · not the live jsisoftwaresolutions.com storefront', 'JSI · In-flight preview')
        ym_html = ym_html.replace('The infrastructure behind practical AI</span>', 'AI Infrastructure &amp; Intelligent Systems</span>')
        ym_html = ym_html.replace(' · Preview indexing: noindex · jsisoftwaresolutions.com is unchanged', '')
        ym_html = ym_html.replace('Yogabrata inflight projects</a>', 'In-flight projects</a> · <a href="/jsi/operations/">Deployment &amp; Operations</a> · <a href="mailto:hello@jsisoftwaresolutions.com">Email JSI</a>')
        ym_html = "\n".join(line.rstrip() for line in ym_html.splitlines()) + "\n"
    return ym_html



def main() -> None:
    for ym_page in YM_PAGES:
        ym_path = YM_ROOT / ym_page["file"]
        ym_path.parent.mkdir(parents=True, exist_ok=True)
        ym_path.write_text(ym_chrome(ym_page), encoding="utf-8")
        print("wrote", ym_path.relative_to(YM_ROOT))


if __name__ == "__main__":
    main()
