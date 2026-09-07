# Author: Yogabrata Mukhopadhyay
# Organization: Brahmexa
# Copyright (c) 2026 Brahmexa. All rights reserved.
"""Emit JSI HTML shells. Run from 1o1-web: python jsi/scripts/emit_pages.py"""

from __future__ import annotations

import html
import json
from pathlib import Path

YM_ROOT = Path(__file__).resolve().parents[1]
YM_ORIGIN = "https://yogabrata.com"

YM_NAV = """        <a href="/jsi/#offerings">Solutions</a>
        <a href="/jsi/swan/">SWAN</a>
        <a href="/jsi/contact/">Contact</a>"""


YM_INFRA_LAYERS = (
    (
        "compute",
        "AI Compute",
        "GPUs and accelerators sized for private AI, local inference, RAG, and computer vision.",
        "",
    ),
    (
        "connect",
        "Connected & Secure",
        "Fast internal networking with secure customer and edge access.",
        "",
    ),
    (
        "data",
        "Data & Recovery",
        "NVMe storage, vector databases, backups, replication, and disaster recovery.",
        "Vector DB: software layer. Recovery is a designed capability, not proven for every workload.",
    ),
    (
        "power",
        "Protected Power",
        "Utility supply, UPS protection, distribution, and monitoring.",
        "Generator: Planned / subject to design",
    ),
    (
        "cool",
        "Engineered Cooling",
        "Cooling matched to rack density, with a path to hybrid or liquid cooling.",
        "Future option: hybrid or liquid cooling",
    ),
)


def ym_metric_value(ym_value: str) -> str:
    ym_path = YM_ROOT / "data" / "metrics.json"
    ym_data = json.loads(ym_path.read_text(encoding="utf-8"))
    for ym_item in ym_data["items"]:
        if str(ym_item["value"]) == ym_value:
            return str(ym_item["value"])
    raise KeyError(ym_value)


def ym_layer(
    ym_key: str,
    ym_label: str,
    ym_detail: str,
    ym_flag: str = "",
) -> str:
    ym_flag_html = ""
    if ym_flag:
        ym_flag_html = (
            f'        <p class="ym-layer-flag">{html.escape(ym_flag)}</p>\n'
        )
    return (
        f'      <div class="ym-layer ym-layer--{html.escape(ym_key)}">\n'
        f"        <details>\n"
        f"          <summary>{html.escape(ym_label)}</summary>\n"
        f"          <p>{html.escape(ym_detail)}</p>\n"
        "        </details>\n"
        f"{ym_flag_html}"
        "      </div>"
    )


def ym_layer_stack_item(
    ym_key: str,
    ym_label: str,
    ym_detail: str,
    ym_flag: str = "",
) -> str:
    ym_flag_html = ""
    if ym_flag:
        ym_flag_html = (
            f'        <p class="ym-layer-flag">{html.escape(ym_flag)}</p>\n'
        )
    return (
        f'      <div class="ym-stack-item ym-layer--{html.escape(ym_key)}">\n'
        f"        <h3>{html.escape(ym_label)}</h3>\n"
        f"        <p>{html.escape(ym_detail)}</p>\n"
        f"{ym_flag_html}"
        "      </div>"
    )


def ym_destination(
    ym_title: str,
    ym_href: str,
    ym_line: str,
    ym_links: list[tuple[str, str]],
    ym_stats: list[tuple[str, str]] | None = None,
) -> str:
    ym_stat_html = ""
    if ym_stats:
        ym_stat_bits = []
        for ym_value, ym_label in ym_stats:
            ym_stat_bits.append(
                "<span><strong>"
                f"{html.escape(ym_value)}</strong> {html.escape(ym_label)}</span>"
            )
        ym_stat_html = (
            '        <p class="ym-dest-stat">'
            + " ".join(ym_stat_bits)
            + "</p>\n"
        )
    ym_link_html = "\n".join(
        f'        <a href="{html.escape(ym_href_item)}">{html.escape(ym_label)}</a>'
        for ym_href_item, ym_label in ym_links
    )
    return (
        '      <article class="ym-dest">\n'
        f"        <h3><a href=\"{html.escape(ym_href)}\">{html.escape(ym_title)}</a></h3>\n"
        f"        <p class=\"ym-dest-line\">{html.escape(ym_line)}</p>\n"
        f"{ym_stat_html}"
        '        <p class="ym-dest-links">\n'
        f"{ym_link_html}\n"
        "        </p>\n"
        "      </article>"
    )


def ym_detail(
    *,
    ym_eyebrow: str,
    ym_title: str,
    ym_lede: str,
    ym_status: str,
    ym_status_label: str,
    ym_blocks: list[tuple[str, str | list[str]]],
    ym_related: list[tuple[str, str]] | None = None,
) -> str:
    ym_parts = [
        '    <section class="jsi-section jsi-detail">\n',
        f'      <p class="eyebrow">{ym_eyebrow}</p>\n',
        f"      <h1>{ym_title}</h1>\n",
        f'      <p class="lede">{ym_lede}</p>\n',
        '      <div class="jsi-status-row" style="justify-content:flex-start;margin:12px 0 20px">\n',
        f'        <span class="jsi-badge" data-status="{html.escape(ym_status)}">{html.escape(ym_status_label)}</span>\n',
        "      </div>\n",
        '      <div class="jsi-prose">\n',
    ]
    for ym_heading, ym_body in ym_blocks:
        ym_parts.append(f"        <h3>{ym_heading}</h3>\n")
        if isinstance(ym_body, list):
            ym_parts.append("        <ul>\n")
            for ym_item in ym_body:
                ym_parts.append(f"          <li>{ym_item}</li>\n")
            ym_parts.append("        </ul>\n")
        else:
            ym_parts.append(f"        <p>{ym_body}</p>\n")
    ym_parts.append("      </div>\n")
    if ym_related:
        ym_parts.append('      <p class="launch-row" style="margin-top:28px">\n')
        for ym_href, ym_label in ym_related:
            ym_parts.append(
                f'        <a class="btn-secondary" href="{html.escape(ym_href)}">{ym_label}</a>\n'
            )
        ym_parts.append("      </p>\n")
    ym_parts.append(
        '      <p class="launch-row" style="margin-top:20px">'
        '<a class="btn-primary" href="/jsi/contact/">Let’s talk</a></p>\n'
        "    </section>\n"
    )
    return "".join(ym_parts)


def ym_home_body() -> str:
    ym_kw = html.escape(ym_metric_value("75 kW"))
    ym_hosted = html.escape(ym_metric_value("100+"))
    ym_swan = html.escape(ym_metric_value("500+"))
    ym_learn = html.escape(ym_metric_value("Thousands"))
    return f"""
    <section class="jsi-home-hero" aria-labelledby="home-title">
      <h1 id="home-title">AI. <span class="ym-accent">At your doorstep.</span></h1>
      <p class="home-intro">AI that understands your business. Websites that work around the clock. Marketing that helps you grow.</p>
      <div class="jsi-hero-actions">
        <a class="btn-primary" href="/jsi/#offerings">Explore Solutions</a>
        <a class="btn-secondary" href="/jsi/contact/">Talk to JSI</a>
      </div>
    </section>
    <section class="ym-infra" aria-labelledby="ym-infra-title">
      <div class="ym-infra-head">
        <div>
          <p class="ym-infra-kicker">Rampur, Uttar Pradesh</p>
          <h2 id="ym-infra-title">Five connected systems. One foundation for your business.</h2>
        </div>
        <p class="ym-capacity"><span>{ym_kw}</span> Data centre capacity &amp; growing</p>
      </div>
      <div class="ym-infra-stage">
        <figure class="ym-infra-figure">
          <picture>
            <source media="(max-width: 720px)" type="image/webp" srcset="/jsi/assets/rampur-cutaway-mobile-720.webp 720w, /jsi/assets/rampur-cutaway-mobile.webp 1200w" sizes="100vw" />
            <img src="/jsi/assets/rampur-cutaway.webp" srcset="/jsi/assets/rampur-cutaway-800.webp 800w, /jsi/assets/rampur-cutaway-1280.webp 1280w, /jsi/assets/rampur-cutaway.webp 1536w" sizes="(max-width: 720px) 100vw, min(1200px, 92vw)" width="1536" height="864" alt="Conceptual cutaway of a modest, expandable data-centre hall in Rampur, with compute racks, networking, storage, power cabinets, and engineered cooling. Not a verified drawing of the actual facility." decoding="async" fetchpriority="high" />
          </picture>
          <svg class="ym-infra-svg" viewBox="0 0 1000 563" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path class="ym-lead ym-lead-power" d="M175 300 L175 255" />
            <path class="ym-lead ym-lead-compute" d="M430 255 L430 205" />
            <path class="ym-lead ym-lead-connect" d="M535 175 L535 125" />
            <path class="ym-lead ym-lead-data" d="M620 310 L620 260" />
            <path class="ym-lead ym-lead-cool" d="M805 365 L805 315" />
          </svg>
          <div class="ym-layers">
{chr(10).join(ym_layer(*ym_row) for ym_row in YM_INFRA_LAYERS)}
          </div>
          <figcaption>Conceptual infrastructure illustration</figcaption>
        </figure>
      </div>
      <div class="ym-layer-stack">
{chr(10).join(ym_layer_stack_item(*ym_row) for ym_row in YM_INFRA_LAYERS)}
      </div>
      <ul class="ym-infra-legend">
        <li><span class="ym-swatch ym-swatch-now" aria-hidden="true"></span> Charcoal equipment in the drawing represents the five systems, not a verified inventory of what is installed in Rampur.</li>
        <li><span class="ym-swatch ym-swatch-future" aria-hidden="true"></span> Dashed outlines are planned or future options. Generator provision is planned / subject to design. Liquid cooling is a future option, not shown as installed.</li>
      </ul>
    </section>
    <svg class="ym-story-link" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M50 0 V12" />
      <path d="M17 28 L50 12 L83 28" />
    </svg>
    <section class="ym-outcomes" id="offerings" aria-labelledby="offerings-title">
      <div class="ym-outcome-connect" aria-hidden="true"></div>
      <div class="home-section-head">
        <h2 id="offerings-title">From this foundation</h2>
        <a class="ym-all-offerings" href="/jsi/offerings/">All solutions</a>
      </div>
      <div class="ym-dest-row">
{ym_destination("Business AI", "/jsi/business/", "Private models · Business knowledge · Automation", [("/jsi/business/", "Private models"), ("/jsi/knowledge/", "Business knowledge"), ("/jsi/workflows/", "Automation")])}
{ym_destination("Digital Growth", "/jsi/websites/", "Websites & hosting · SEO · Digital marketing", [("/jsi/websites/", "Websites & hosting"), ("/jsi/seo/", "SEO"), ("/jsi/marketing/", "Digital marketing")], [(ym_hosted, "hosted services")])}
{ym_destination("Smart Classrooms", "/jsi/swan/", "SWAN boards · AI learning modules", [("/jsi/swan/", "SWAN boards")], [(ym_swan, "SWAN boards"), (ym_learn, "of learners")])}
      </div>
    </section>
    <section class="ym-close" aria-labelledby="ym-close-title">
      <p id="ym-close-title">Tell us about your business.</p>
      <a class="btn-primary" href="/jsi/contact/">Let’s talk</a>
    </section>
"""

YM_PAGES = [
    {
        "file": "index.html",
        "page": "home",
        "title": "JSI — AI, websites, and digital growth",
        "desc": "JSI brings together infrastructure, business intelligence, websites, and digital growth.",
        "path": "/jsi/",
        "extra": "",
        "scripts": "",
    },
    {
        "file": "swan/index.html",
        "page": "swan",
        "title": "SWAN Intelligent Smart Boards | JSI Software Solutions",
        "desc": "SWAN interactive boards as an interface for AI-enabled learning and collaboration. Available hardware and proposed AI capabilities.",
        "path": "/jsi/swan/",
        "extra": """
    <section class="jsi-section jsi-detail">
      <p class="eyebrow">Hardware Product</p>
      <h1>SWAN Intelligent Smart Boards</h1>
      <p class="lede">Interactive classroom and meeting displays, with proposed AI learning tools on the board.</p>
      <div class="jsi-status-row" style="justify-content:flex-start;margin:12px 0 20px">
        <span class="jsi-badge" data-status="available">Available</span>
        <span class="jsi-badge" data-status="proposed">AI features: proposed</span>
      </div>
      <div class="jsi-prose">
        <h3>In the room</h3>
        <p>SWAN boards are how teachers and teams present, write, and share a lesson or meeting. Hardware is a current JSI product: rent or purchase, with installation by enquiry.</p>
        <h3>Proposed AI on the board</h3>
        <p>Lesson-pack questions, quiz drafts, and meeting-note assistance are proposed integrations. They are not presented here as a finished classroom deployment on every board.</p>
      </div>
      <h2 style="margin-top:32px">Hardware specifications</h2>
      <table class="jsi-spec-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Specification</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Display sizes</td>
            <td>65", 75", and 86" Class 4K UHD displays</td>
          </tr>
          <tr>
            <td>Operating systems</td>
            <td>Android onboard with optional Windows OPS PC module</td>
          </tr>
          <tr>
            <td>Touch &amp; interface</td>
            <td>Multi-touch writing, anti-glare tempered glass</td>
          </tr>
          <tr>
            <td>Procurement</td>
            <td>Rental, purchase, installation, and support by direct enquiry</td>
          </tr>
        </tbody>
      </table>
      <p class="launch-row" style="margin-top:28px">
        <a class="btn-primary" href="mailto:hello@jsisoftwaresolutions.com?subject=SWAN%20board%20%2F%20installation%20enquiry">Email hardware enquiry</a>
        <a class="btn-secondary" href="tel:+917983875643">Call +91 79838 75643</a>
      </p>
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
        "extra": ym_detail(
            ym_eyebrow="Pilot",
            ym_title="Private AI Infrastructure",
            ym_lede="Choose where models and data live: on-premises, managed private, or hybrid. Placement decides location, access, and who operates the stack.",
            ym_status="pilot",
            ym_status_label="Pilot",
            ym_blocks=[
                (
                    "Three patterns",
                    [
                        "On-premises: equipment in your room or campus. You control physical access.",
                        "Managed private: dedicated capacity operated with JSI under an agreed site and access list.",
                        "Hybrid: approved information stays local; a named external service may be used for burst work.",
                    ],
                ),
                (
                    "What this is not",
                    "Published kilowatt figures, GPU counts, and uptime percentages are not used as guarantees on this preview. Sizing is agreed during discovery.",
                ),
            ],
            ym_related=[
                ("/jsi/local-llm/", "Local LLMs"),
                ("/jsi/knowledge/", "Knowledge"),
                ("/jsi/operations/", "Deployment"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "local-llm/index.html",
        "page": "local-llm",
        "title": "Local LLM Solutions | JSI Software Solutions",
        "desc": "Locally hosted language models for assistants, inference APIs, and business applications.",
        "path": "/jsi/local-llm/",
        "extra": ym_detail(
            ym_eyebrow="Pilot",
            ym_title="Local LLM Solutions",
            ym_lede="Language models running on compute you can name. They draft, classify, and extract. They do not automatically know your files.",
            ym_status="pilot",
            ym_status_label="Pilot",
            ym_blocks=[
                (
                    "In plain language",
                    "AI models running on private infrastructure, connected to your approved business information when retrieval is configured.",
                ),
                (
                    "Where a local model helps",
                    [
                        "Assistants and internal APIs that should not send every prompt to a public chatbot.",
                        "Drafting and extraction beside a knowledge index, not instead of it.",
                        "Workload matched to hardware — not a claim that every model runs everywhere.",
                    ],
                ),
            ],
            ym_related=[
                ("/jsi/infrastructure/", "Infrastructure"),
                ("/jsi/knowledge/", "Knowledge"),
                ("/jsi/workflows/", "Automation"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "knowledge/index.html",
        "page": "knowledge",
        "title": "Your Knowledge, Put to Work | JSI Software Solutions",
        "desc": "Answers from approved documents, with a clear line between retrieval and calculated reporting.",
        "path": "/jsi/knowledge/",
        "extra": ym_detail(
            ym_eyebrow="Pilot",
            ym_title="Your knowledge, put to work",
            ym_lede="AI models running on private infrastructure, connected to your approved business information.",
            ym_status="pilot",
            ym_status_label="Pilot",
            ym_blocks=[
                (
                    "Document-based answers",
                    "Retrieval uses approved files first: manuals, policies, product notes, and reports you designate. Answers should cite sources or say when evidence is missing.",
                ),
                (
                    "Useful examples",
                    [
                        "Finding a procedure in an operations manual.",
                        "Summarising a report you already hold.",
                        "Retrieving product information from approved catalogues.",
                        "Helping staff read what those documents say about performance — not inventing the numbers.",
                    ],
                ),
                (
                    "Calculated analytics are different",
                    "Numerical reporting must use connected, structured data and reliable calculations. A language model alone is not a source of accurate financial or operational metrics.",
                ),
                (
                    "Controls",
                    "Access follows the permissions of the source files. Indexes are refreshed on a schedule agreed in the engagement — not continuously unless that is specified.",
                ),
            ],
            ym_related=[
                ("/jsi/business/", "How we start"),
                ("/jsi/local-llm/", "Local LLMs"),
                ("/jsi/infrastructure/", "Infrastructure"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "workflows/index.html",
        "page": "workflows",
        "title": "Smart Automation | JSI Software Solutions",
        "desc": "Local agentic workflows for enquiry routing, document retrieval, and routine tasks — with human checkpoints.",
        "path": "/jsi/workflows/",
        "extra": ym_detail(
            ym_eyebrow="Proposed integration",
            ym_title="Smart automation",
            ym_lede="Agents that help move work along. Rules and people still control what actually happens.",
            ym_status="proposed",
            ym_status_label="Proposed integration",
            ym_blocks=[
                (
                    "Supported examples (illustrative)",
                    [
                        "Routing a website enquiry to the right mailbox.",
                        "Retrieving an approved document for a staff question.",
                        "Drafting a routine follow-up for someone to review.",
                    ],
                ),
                (
                    "How it is built",
                    "Technical deployments use local language models and self-hosted n8n. Connectors that leave the building are named, or they are not enabled.",
                ),
                (
                    "Approvals",
                    "These flows are proposed integrations until scoped. Illustrative examples on this preview use synthetic data and are not a live customer system.",
                ),
            ],
            ym_related=[
                ("/jsi/see-ai-at-work/", "See a demonstration"),
                ("/jsi/knowledge/", "Knowledge"),
                ("/jsi/local-llm/", "Local LLMs"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "operations/index.html",
        "page": "operations",
        "title": "Deployment and Operations | JSI Software Solutions",
        "desc": "Discover, design, pilot, deploy, and operate private AI infrastructure.",
        "path": "/jsi/operations/",
        "extra": ym_detail(
            ym_eyebrow="Pilot",
            ym_title="Deployment and operations",
            ym_lede="Discover, design, pilot, deploy, and operate. Monitoring and support are scoped with you — not unlimited.",
            ym_status="pilot",
            ym_status_label="Pilot",
            ym_blocks=[
                (
                    "The path",
                    [
                        "Discover: objectives, information sources, and constraints.",
                        "Design: placement, models, retrieval, and workflow boundaries.",
                        "Pilot: a limited slice with success criteria.",
                        "Deploy and operate: patching, backups, and on-call as written in the engagement.",
                    ],
                ),
            ],
            ym_related=[
                ("/jsi/infrastructure/", "Infrastructure"),
                ("/jsi/business/", "How we start"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "business/index.html",
        "page": "business",
        "title": "AI for Your Business | JSI Software Solutions",
        "desc": "We start with your goals, processes, and everyday challenges — then configure AI around approved knowledge.",
        "path": "/jsi/business/",
        "extra": ym_detail(
            ym_eyebrow="Pilot",
            ym_title="AI for your business",
            ym_lede="We start with your goals, processes, and everyday challenges. Models are configured around approved knowledge. They are not trained automatically on your data.",
            ym_status="pilot",
            ym_status_label="Pilot",
            ym_blocks=[
                (
                    "How a conversation starts",
                    [
                        "Your objectives, workflows, terminology, and information sources.",
                        "Useful applications identified together — not a generic chatbot dropped on the company.",
                        "Access permissions for what the system may read.",
                    ],
                ),
                (
                    "What we configure",
                    "AI is set up against approved business knowledge. A local model does not become private merely because a machine is on site, and it does not train itself on customer files.",
                ),
            ],
            ym_related=[
                ("/jsi/knowledge/", "Knowledge"),
                ("/jsi/infrastructure/", "Private AI"),
                ("/jsi/local-llm/", "Local LLMs"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "websites/index.html",
        "page": "websites",
        "title": "Managed Websites | JSI Software Solutions",
        "desc": "Website development, hosting, maintenance, and operational support for your business online.",
        "path": "/jsi/websites/",
        "extra": ym_detail(
            ym_eyebrow="Available",
            ym_title="Websites that work around the clock",
            ym_lede="We build, host, and maintain your business online. “Working around the clock” describes the website’s role for customers — not an uptime SLA or a promise of staffed support at every hour.",
            ym_status="available",
            ym_status_label="Available",
            ym_blocks=[
                (
                    "What the engagement covers",
                    [
                        "Website development and updates scoped with you.",
                        "Hosting on JSI-operated infrastructure.",
                        "Maintenance and operational support as written in the agreement.",
                    ],
                ),
                (
                    "Monitoring, backups, and recovery",
                    "These are included where the engagement says so. They are not implied by hosting alone.",
                ),
            ],
            ym_related=[
                ("/jsi/seo/", "SEO"),
                ("/jsi/marketing/", "Digital marketing"),
                ("/jsi/offerings/", "All solutions"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "seo/index.html",
        "page": "seo",
        "title": "SEO | JSI Software Solutions",
        "desc": "Technical SEO, content structure, performance, and ongoing improvement so customers can find your website.",
        "path": "/jsi/seo/",
        "extra": ym_detail(
            ym_eyebrow="Available",
            ym_title="Get found. Stay visible.",
            ym_lede="Discoverability through technical SEO, content structure, performance, and ongoing improvement. We do not promise first-page rankings or guaranteed traffic.",
            ym_status="available",
            ym_status_label="Available",
            ym_blocks=[
                (
                    "The work",
                    [
                        "Technical foundations: crawlability, structure, and page performance.",
                        "Content structure that matches how people search for your services.",
                        "Ongoing improvement rather than a one-off report.",
                    ],
                ),
                (
                    "Measurement",
                    "Progress is reviewed with the analytics already available on the site. Rankings move; they are not sold as a guarantee.",
                ),
            ],
            ym_related=[
                ("/jsi/websites/", "Websites"),
                ("/jsi/marketing/", "Digital marketing"),
            ],
        ),
        "scripts": "",
    },
    {
        "file": "marketing/index.html",
        "page": "marketing",
        "title": "Digital Marketing | JSI Software Solutions",
        "desc": "Website content, social publishing, and campaigns that support discovery and enquiries — scoped separately from hosting.",
        "path": "/jsi/marketing/",
        "extra": ym_detail(
            ym_eyebrow="Available",
            ym_title="Turn attention into enquiries",
            ym_lede="Digital marketing connects your website, content, and campaigns. Advertising spend and extra marketing services are not included in hosting unless agreed.",
            ym_status="available",
            ym_status_label="Available",
            ym_blocks=[
                (
                    "Organic and paid are different",
                    "Organic publishing is content you own on the website and social channels. Paid advertising is a separate budget and campaign. Neither is bundled into hosting by default.",
                ),
                (
                    "How we work",
                    "Approvals and reporting are described in the engagement where they are supported. This preview does not list packages or prices.",
                ),
            ],
            ym_related=[
                ("/jsi/websites/", "Websites"),
                ("/jsi/seo/", "SEO"),
            ],
        ),
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
        "scripts": '  <script src="/jsi/js/ym_scenarios.js?v=2" defer></script>\n',
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
      <p class="jsi-sol-index">
        <a href="/jsi/business/">AI for your business</a>
        <a href="/jsi/infrastructure/">Private AI</a>
        <a href="/jsi/local-llm/">Local LLMs</a>
        <a href="/jsi/knowledge/">Knowledge</a>
        <a href="/jsi/workflows/">Automation</a>
        <a href="/jsi/websites/">Websites</a>
        <a href="/jsi/seo/">SEO</a>
        <a href="/jsi/marketing/">Marketing</a>
        <a href="/jsi/swan/">SWAN</a>
        <a href="/jsi/operations/">Deployment</a>
      </p>
      
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
        "scripts": '  <script src="/jsi/js/ym_architecture.js?v=2" defer></script>\n',
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
        "title": "Contact | JSI Software Solutions",
        "desc": "Direct channels for email enquiries, technical support, phone, and WhatsApp.",
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
    </section>
""",
        "scripts": "",
    },
]


def ym_home_chrome(ym_page: dict) -> str:
    ym_canonical = YM_ORIGIN + ym_page["path"]
    ym_og = YM_ORIGIN + "/jsi/assets/rampur-cutaway-og.jpg"
    ym_font = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;display=swap"
    return f"""<!--
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.
-->
<!DOCTYPE html>
<html lang="en">
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
  <link rel="icon" href="/jsi/assets/jsi-favicon.png" type="image/png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="{ym_font}" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="{ym_font}" /></noscript>
  <link rel="stylesheet" href="/jsi/css/home.css?v=4" />
</head>
<body class="jsi-page" data-ym-page="home">
  <a class="skip-link" href="#ym-main">Skip to content</a>
  <div class="jsi-banner">In-flight preview</div>
  <header class="site-header jsi-header">
    <div class="header-inner">
      <a class="jsi-brand" href="/jsi/">
        <img class="jsi-brand-mark" src="/jsi/assets/jsi-favicon.png" width="36" height="36" alt="JSI Software Solutions" />
        <span class="site-name">JSI Software Solutions</span>
      </a>
      <nav class="jsi-nav" id="jsi-nav" aria-label="JSI">
{YM_NAV}
      </nav>
    </div>
  </header>
  <main class="main-wrap jsi-main" id="ym-main">
{ym_home_body()}
  </main>
  <footer class="site-footer jsi-footer">
    <p>JSI Software Solutions Pvt Ltd · <a href="https://brahmexa.com">Brahmexa LLC</a> · KAIORB · KAI247</p>
    <p class="footer-tag"><a href="/jsi/contact/">Contact</a> · <a href="/jsi/offerings/">All solutions</a> · <a href="/jsi/see-ai-at-work/">See AI at work</a> · <a href="/jsi/architecture/">Architecture</a> · <a href="/jsi/nexus/">Nexus</a> · <a href="mailto:hello@jsisoftwaresolutions.com">Email JSI</a></p>
  </footer>
</body>
</html>
"""


def ym_chrome(ym_page: dict) -> str:
    if ym_page["page"] == "home":
        return "\n".join(line.rstrip() for line in ym_home_chrome(ym_page).splitlines()) + "\n"

    ym_canonical = YM_ORIGIN + ym_page["path"]
    ym_og = YM_ORIGIN + "/jsi/assets/swan-boards.webp"
    ym_main_extra = ym_page.get("extra", "")
    ym_article = ""
    if ym_page["page"] not in (
        "demo",
        "home",
        "swan",
        "offerings",
        "architecture",
        "nexus",
        "contact",
        "business",
        "websites",
        "seo",
        "marketing",
        "knowledge",
        "workflows",
        "infrastructure",
        "local-llm",
        "operations",
    ):
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
  <link rel="icon" href="/jsi/assets/jsi-favicon.png" type="image/png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap" /></noscript>
  <link rel="stylesheet" href="/assets/theme.css" />
  <link rel="stylesheet" href="/assets/theme-presets.css?v=jsi-paper" />
  <link rel="stylesheet" href="/jsi/css/jsi.css?v=7" />
  <noscript><style>.jsi-page .jsi-nav{{display:flex !important}}</style></noscript>
</head>
<body class="jsi-page" data-ym-page="{ym_page["page"]}">
  <a class="skip-link" href="#ym-main">Skip to content</a>
  <div class="jsi-watermark" aria-hidden="true">
    <img src="/jsi/assets/jsi-favicon.png" alt="" width="220" height="220" />
  </div>
  <div class="jsi-banner">In-flight preview</div>
  <header class="site-header jsi-header">
    <div class="header-inner">
      <a class="jsi-brand" href="/jsi/">
        <img class="jsi-brand-mark" src="/jsi/assets/jsi-favicon.png" width="48" height="48" alt="JSI Software Solutions" />
        <span>
          <span class="site-name">JSI Software Solutions</span>
          <span class="site-tag">AI. At your doorstep.</span>
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
    <p>JSI Software Solutions Pvt Ltd · <a href="https://brahmexa.com">Brahmexa LLC</a> · KAIORB · KAI247</p>
    <p class="footer-tag"><a href="/jsi/contact/">Contact</a> · <a href="/jsi/offerings/">All solutions</a> · <a href="/jsi/see-ai-at-work/">See AI at work</a> · <a href="/jsi/architecture/">Architecture</a> · <a href="/jsi/nexus/">Nexus</a> · <a href="mailto:hello@jsisoftwaresolutions.com">Email JSI</a></p>
  </footer>
  <script src="/jsi/js/ym_app.js?v=2" defer></script>
{ym_page["scripts"]}  <script src="https://brahmexa.com/nexus/widget.js" data-nexus-key="pk_jsi_site" data-nexus-accent="#ae3024" async></script>
</body>
</html>
"""
    return ym_html


def main() -> None:
    for ym_page in YM_PAGES:
        ym_path = YM_ROOT / ym_page["file"]
        ym_path.parent.mkdir(parents=True, exist_ok=True)
        ym_path.write_text(ym_chrome(ym_page), encoding="utf-8")
        print("wrote", ym_path.relative_to(YM_ROOT))


if __name__ == "__main__":
    main()
