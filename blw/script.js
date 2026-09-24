/* ==========================================================================
   BLW ENGINE VALVES PVT. LTD. - INTERACTIVE JAVASCRIPT ENGINE
   Featuring Aditya AI Nexus Specialist & Product Catalog Engine
   ========================================================================== */

// --- PRODUCT CATALOG DATABASE ---
const PRODUCTS_DATA = [
  {
    id: "blw-ev-pulsar220",
    name: "Bajaj Pulsar 220F Valve Set",
    category: "2w",
    oemCode: "BLW-EV-P220",
    segment: "2-Wheeler (Bajaj)",
    imageIcon: "fa-solid fa-motorcycle",
    badge: "Bestseller",
    badgeType: "p-tag-blue",
    desc: "Precision bi-metallic intake & exhaust valve set engineered for high-RPM thermal resistance in Bajaj Pulsar 220F engines.",
    specs: {
      "Material": "SUH3 / 21-4N Bi-Metallic",
      "Head Dia": "Intake 29.0mm / Exhaust 25.0mm",
      "Stem Dia": "4.98 mm ± 0.005",
      "Treatment": "Liquid Carbo-Nitriding (LCN)",
      "Hardness": "HV 850 - 950 HV"
    }
  },
  {
    id: "blw-ev-ns200",
    name: "Bajaj Pulsar NS200 BS6 Valve Set",
    category: "2w",
    oemCode: "BLW-EV-NS200",
    segment: "2-Wheeler (Bajaj)",
    imageIcon: "fa-solid fa-bolt",
    badge: "BS6 Compliant",
    badgeType: "p-tag-blue",
    desc: "High-end 4-valve configuration valve kit for Pulsar NS200, featuring micro-finished stems and friction-welded tips.",
    specs: {
      "Material": "Austenitic Stainless 21-4N",
      "Stem Coating": "Chrome & LCN Polish",
      "Compatibility": "Pulsar NS200 / RS200 / AS200",
      "Hardness": "Stem 800 HV / Tip 58 HRC"
    }
  },
  {
    id: "blw-ev-apache180",
    name: "TVS Apache RTR 160 / 180 Valve Kit",
    category: "2w",
    oemCode: "BLW-EV-AP180",
    segment: "2-Wheeler (TVS)",
    imageIcon: "fa-solid fa-gauge-high",
    badge: "OEM Standard",
    badgeType: "p-tag-blue",
    desc: "Heavy-duty valves designed specifically for TVS Apache RTR 160 2V & 180 series engines to prevent stem scuffing.",
    specs: {
      "Material": "21-4N (EV8) High Alloy",
      "Treatment": "Manganese Phosphating Base",
      "Stem Dia": "4.97 mm",
      "Corrosion Test": "96 Hr Salt Spray Passed"
    }
  },
  {
    id: "blw-ev-activa100",
    name: "Honda Activa 100 / 110 Valve Set",
    category: "2w",
    oemCode: "BLW-EV-ACT100",
    segment: "2-Wheeler (Honda)",
    imageIcon: "fa-solid fa-scooter",
    badge: "High Demand",
    badgeType: "p-tag-blue",
    desc: "Fuel-efficient low-friction valves for Honda Activa 100/110 and Dream Yuga scooters and motorcycles.",
    specs: {
      "Material": "SUH3 Martensitic Steel",
      "Finish": "Micro-honed Stem Surface",
      "Compatibility": "Activa 100, Dio, CD110 Yuga",
      "Warranty": "50,000 KM Operational Life"
    }
  },
  {
    id: "blw-ev-fzs",
    name: "Yamaha FZ-S / FZ16 Engine Valves",
    category: "2w",
    oemCode: "BLW-EV-FZS16",
    segment: "2-Wheeler (Yamaha)",
    imageIcon: "fa-solid fa-motorcycle",
    badge: "Export Grade",
    badgeType: "p-tag-blue",
    desc: "Premium engine valves for Yamaha FZ-S and FZ16 motorcycles exported to SAARC and Latin American markets.",
    specs: {
      "Material": "Bi-Metallic 4Cr9Si2 / 21-4N",
      "Hardened Tip": "Induction Hardened (55 HRC)",
      "Treatment": "Liquid Carbo-Nitriding",
      "Concentricity": "< 0.015 mm"
    }
  },
  {
    id: "blw-ev-bm150",
    name: "Bajaj Boxer BM150 Engine Valve Kit",
    category: "valves",
    oemCode: "BLW-EV-BM150",
    segment: "2W / Utility",
    imageIcon: "fa-solid fa-box-archive",
    badge: "Utility King",
    badgeType: "p-tag-blue",
    desc: "Robust utility motorcycle engine valve kit engineered for extreme dust and heavy load transport conditions.",
    specs: {
      "Material": "High-Chrome Alloy Steel",
      "Treatment": "Liquid Nitriding & Polishing",
      "STEM OD": "5.00 mm",
      "Export Hub": "Nigeria, Kenya, Egypt, Nepal"
    }
  },
  {
    id: "blw-3w-piaggio",
    name: "Piaggio Ape City 3-Wheeler Valve Set",
    category: "3w",
    oemCode: "BLW-3W-APE",
    segment: "3-Wheeler (Piaggio)",
    imageIcon: "fa-solid fa-truck-pickup",
    badge: "3-Wheeler OEM",
    badgeType: "p-tag-blue",
    desc: "High-durability engine valves for Piaggio Ape City Diesel & CNG commercial passenger 3-wheelers.",
    specs: {
      "Engine Type": "Single Cylinder Commercial",
      "Material": "Stellite Hard-Faced Seat",
      "Treatment": "NOPQ Salt Bath Nitriding",
      "Thermal Defense": "Up to 800°C Exhaust Rating"
    }
  },
  {
    id: "blw-3w-bajajcompact",
    name: "Bajaj Compact / RE 3-Wheeler Valves",
    category: "3w",
    oemCode: "BLW-3W-RE225",
    segment: "3-Wheeler (Bajaj)",
    imageIcon: "fa-solid fa-truck-front",
    badge: "Top Export SKU",
    badgeType: "p-tag-blue",
    desc: "Commercial grade intake & exhaust valves for Bajaj Compact RE 200/225 passenger and cargo autorickshaws.",
    specs: {
      "Material": "Austenitic Stainless Bi-metal",
      "Stem Finish": "Zero-groove precision polished",
      "Target Regions": "Bangladesh, Myanmar, Sri Lanka, Peru",
      "Cert": "IATF 16949 Certified"
    }
  },
  {
    id: "blw-comp-valveguide",
    name: "Precision Bronze/Cast Iron Valve Guides",
    category: "components",
    oemCode: "BLW-VG-UNIVERSAL",
    segment: "Multi-Application",
    imageIcon: "fa-solid fa-circle-notch",
    badge: "High Wear Res.",
    badgeType: "p-tag-blue",
    desc: "High-density powder metallurgy and phosphorus bronze valve guides providing superior oil retention & concentricity.",
    specs: {
      "Material": "Sintered Iron / Phosphor Bronze",
      "ID Tolerance": "H7 (+0.012 / -0)",
      "Thermal Cond.": "High heat dissipation rating",
      "Finish": "Precision Bore Reamed"
    }
  },
  {
    id: "blw-comp-camshaft",
    name: "Motorcycle Camshaft Assembly",
    category: "components",
    oemCode: "BLW-CAM-150",
    segment: "2W Engine",
    imageIcon: "fa-solid fa-compact-disc",
    badge: "Chilled Cast",
    badgeType: "p-tag-blue",
    desc: "Chilled cast iron camshaft assembly with hardened lobes to minimize valvetrain friction and wear.",
    specs: {
      "Material": "Chilled Cast Iron Grade FG300",
      "Lobe Hardness": "HRC 50 - 55",
      "Runout": "< 0.01 mm",
      "Application": "100cc - 220cc Engines"
    }
  },
  {
    id: "blw-sm-washers",
    name: "Spherical & Flat Gearbox Washers",
    category: "sheetmetal",
    oemCode: "BLW-WASHER-DIFF",
    segment: "Differential Gearboxes",
    imageIcon: "fa-solid fa-layer-group",
    badge: "Tier-2 Supply",
    badgeType: "p-tag-blue",
    desc: "Riveted & stamped spherical bronze/steel washers supplied to Tier-1 and Tier-2 automotive transmission builders.",
    specs: {
      "Process": "Fine Blanking & Heat Treat",
      "Coating": "Manganese Phosphating 9-Tank",
      "Thickness": "1.2mm - 4.0mm Custom",
      "Surface Finish": "Anti-Galling Micro Crystalline"
    }
  },
  {
    id: "blw-sm-hydraulic",
    name: "Hydraulic Valve Block Spool",
    category: "sheetmetal",
    oemCode: "BLW-HYD-SPOOL",
    segment: "Hydraulic & Tractor",
    imageIcon: "fa-solid fa-gears",
    badge: "Custom Precision",
    badgeType: "p-tag-blue",
    desc: "Precision turned and nitrided spool valves for agricultural tractor hydraulic lifts and industrial control blocks.",
    specs: {
      "Material": "EN31 Hardened Steel",
      "Tolerance": "< 2 Microns Cylindricity",
      "Treatment": "Ferritic Nitrocarburizing (FNC)",
      "Hardness": "HV 900 Minimum"
    }
  }
];

// --- ADITYA AI KNOWLEDGE BASE ---
const ADITYA_KNOWLEDGE = [
  {
    keywords: ["pulsar", "220", "ns200", "bajaj", "discover", "ct100", "boxer"],
    response: `
      <p><strong>BLW Engine Valve Solutions for Bajaj Motorcycles:</strong></p>
      <p>We manufacture OEM-equivalent bi-metallic and nitrided valve sets for the complete Bajaj family:</p>
      <ul>
        <li><strong>Pulsar 220F / 180 / 150:</strong> SUH3/21-4N Bi-metal valve kits with stem hardness up to 900 HV.</li>
        <li><strong>Pulsar NS200 / RS200 (4-Valve):</strong> Micro-polished stems with friction welded tips for high-rev stability.</li>
        <li><strong>Discover 100/125/135/150 & Boxer BM150:</strong> Liquid nitrided utility valves optimized for high heat and dust resistance.</li>
      </ul>
      <p>Would you like to download the CAD drawings or get a bulk sample export quotation?</p>
    `
  },
  {
    keywords: ["nitriding", "liquid nitriding", "lcn", "phosphating", "treatment", "surface", "nopq", "qpq"],
    response: `
      <p><strong>BLW Advanced Surface Treatment Comparison:</strong></p>
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin:8px 0;">
        <tr style="background:var(--bg-subtle); text-align:left;">
          <th style="padding:4px;">Feature</th>
          <th style="padding:4px;">Liquid Nitriding (LCN)</th>
          <th style="padding:4px;">Manganese Phosphating</th>
        </tr>
        <tr>
          <td style="padding:4px;"><strong>Surface Hardness</strong></td>
          <td style="padding:4px; color:var(--accent-primary); font-weight:700;">850 - 1000 HV</td>
          <td style="padding:4px;">200 - 300 HV</td>
        </tr>
        <tr>
          <td style="padding:4px;"><strong>Corrosion Test</strong></td>
          <td style="padding:4px;">96+ Hr Salt Spray</td>
          <td style="padding:4px;">Oil Absorbing Layer</td>
        </tr>
        <tr>
          <td style="padding:4px;"><strong>Primary Role</strong></td>
          <td style="padding:4px;">Stem wear & anti-scuffing</td>
          <td style="padding:4px;">Initial break-in & anti-galling</td>
        </tr>
      </table>
      <p>Both processes are operated in-house at our 1,10,000 sq. ft. Badli Road facility under strict IATF 16949 control.</p>
    `
  },
  {
    keywords: ["export", "sample", "quote", "5000", "moq", "price", "order", "cost"],
    response: `
      <p><strong>BLW Global Export & MOQ Purchasing Information:</strong></p>
      <ul>
        <li><strong>Export Footprint:</strong> Serving 25+ nations (Bangladesh, Nepal, Egypt, Tanzania, Nigeria, Colombia, Peru, UAE, etc.).</li>
        <li><strong>Sample MOQ:</strong> 500 to 1,000 units per SKU for custom branding or standard white-box packaging.</li>
        <li><strong>Mass Production Capacity:</strong> Over 1.2 Million valves & components monthly.</li>
        <li><strong>Lead Time:</strong> 12 - 18 business days from order confirmation to sea/air freight loading.</li>
      </ul>
      <p>You can use the <strong>RFQ Estimator</strong> on this page, or I can immediately send your specification sheet to our Export Director!</p>
    `
  },
  {
    keywords: ["iatf", "iso", "quality", "certification", "inspection", "lab", "vmm", "microscope"],
    response: `
      <p><strong>BLW Quality Assurance & Testing Standards:</strong></p>
      <p>BLW Engine Valves is strictly certified under <strong>IATF 16949:2016</strong> and <strong>ISO 9001:2015</strong>.</p>
      <p>Our Quality Lab contains:</p>
      <ul>
        <li>Vision Measuring Machine (VMM) & Profile Projectors (&plusmn; 0.001mm).</li>
        <li>Micro Vickers & Rockwell Hardness Testers.</li>
        <li>Metallurgical Microscope up to 1000x for grain structure analysis.</li>
        <li>In-house Spectro Chemical Analysis & Eddy Current crack detectors.</li>
      </ul>
    `
  },
  {
    keywords: ["tvs", "apache", "honda", "activa", "hero", "yamaha", "piaggio", "ape"],
    response: `
      <p><strong>OEM Compatibility Catalogue Overview:</strong></p>
      <p>We manufacture 1,100+ precision component SKUs compatible with leading brands:</p>
      <ul>
        <li><strong>TVS:</strong> Apache 160 2V, Apache 180, Sport 100, TVS Jupiter, Wego.</li>
        <li><strong>Honda:</strong> Activa 100/110, Dio, CD 110 Dream Yuga.</li>
        <li><strong>Hero:</strong> Splendor, Eco Deluxe, HF Deluxe, Passion Pro.</li>
        <li><strong>Yamaha:</strong> FZ-S, FZ16, Ray ZR.</li>
        <li><strong>Piaggio & TVS 3W:</strong> Piaggio Ape City, TVS King 200.</li>
      </ul>
    `
  }
];

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  renderCatalog("all");
  updateCalcEstimate();
  setupScrollAnimations();
  updateRfqBasketUI();

  // Restore Theme Preference (Default: precision light)
  const savedTheme = localStorage.getItem("blw_theme_preference") || "precision";
  setTheme(savedTheme);
});

// --- THEME SWITCHER LOGIC ---
function toggleThemeDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("themeDropdown");
  if (dropdown) dropdown.classList.toggle("open");
}

function setTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("blw_theme_preference", themeName);

  const labelMap = {
    "precision": "Precision Light",
    "warm": "Warm Industrial",
    "dark": "Graphite Showcase"
  };
  const labelEl = document.getElementById("currentThemeLabel");
  if (labelEl) labelEl.innerText = labelMap[themeName] || "Precision Light";

  document.querySelectorAll(".theme-option").forEach(opt => opt.classList.remove("active"));
  const activeOpt = Array.from(document.querySelectorAll(".theme-option")).find(opt => opt.getAttribute("onclick")?.includes(`'${themeName}'`));
  if (activeOpt) activeOpt.classList.add("active");

  const dropdown = document.getElementById("themeDropdown");
  if (dropdown) dropdown.classList.remove("open");
}

document.addEventListener("click", (e) => {
  const wrapper = document.querySelector(".theme-switcher-wrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    const dropdown = document.getElementById("themeDropdown");
    if (dropdown) dropdown.classList.remove("open");
  }
});

// --- RFQ BASKET LOGIC ---
let rfqBasket = JSON.parse(localStorage.getItem("blw_rfq_basket_items") || "[]");

function updateRfqBasketUI() {
  const countEl = document.getElementById("rfqCount");
  if (countEl) countEl.innerText = rfqBasket.length;
  localStorage.setItem("blw_rfq_basket_items", JSON.stringify(rfqBasket));

  const listContainer = document.getElementById("rfqBasketItemsList");
  if (!listContainer) return;

  if (rfqBasket.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center; padding:1.5rem; color:var(--text-muted);">
        <i class="fa-solid fa-basket-shopping" style="font-size:1.75rem; margin-bottom:0.5rem; color:var(--text-dim);"></i>
        <p>Your RFQ Basket is empty. Click "<strong>+ RFQ</strong>" on components to add items to your consolidated inquiry.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = rfqBasket.map((item, index) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-subtle); border:1px solid var(--border-color); padding:0.6rem 0.85rem; border-radius:4px; margin-bottom:0.4rem;">
      <div>
        <strong style="color:var(--text-main); font-size:0.85rem;">${escapeHtml(item.name)}</strong>
        <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">${escapeHtml(item.oemCode)}</div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <input type="number" value="${item.qty || 1000}" min="100" step="100" style="width:75px; padding:2px 4px; font-size:0.8rem;" class="calc-input" onchange="updateRfqItemQty(${index}, this.value)">
        <button class="btn btn-sm btn-outline" style="color:var(--text-muted);" onclick="removeFromRfq(${index})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function addToRfq(idOrName) {
  const product = PRODUCTS_DATA.find(p => p.id === idOrName || p.name === idOrName);
  if (!product) return;

  const existing = rfqBasket.find(item => item.name === product.name);
  if (existing) {
    existing.qty = (existing.qty || 1000) + 500;
  } else {
    rfqBasket.push({ name: product.name, oemCode: product.oemCode, qty: 1000 });
  }

  updateRfqBasketUI();
  toggleRfqBasket(true);
}

function removeFromRfq(index) {
  rfqBasket.splice(index, 1);
  updateRfqBasketUI();
}

function updateRfqItemQty(index, qty) {
  rfqBasket[index].qty = parseInt(qty) || 1000;
  localStorage.setItem("blw_rfq_basket_items", JSON.stringify(rfqBasket));
}

function toggleRfqBasket(forceOpen = false) {
  const overlay = document.getElementById("rfqBasketOverlay");
  if (!overlay) return;
  if (forceOpen === true) {
    overlay.classList.add("open");
  } else if (forceOpen === false && overlay.classList.contains("open")) {
    overlay.classList.remove("open");
  } else {
    overlay.classList.toggle("open");
  }
  updateRfqBasketUI();
}

function submitRfqBasket(e) {
  e.preventDefault();
  if (rfqBasket.length === 0) {
    alert("Please add at least one component to your RFQ basket before submitting.");
    return;
  }

  const name = document.getElementById("rfqName")?.value || "Valued Buyer";
  const email = document.getElementById("rfqEmail")?.value || "buyer@company.com";
  const company = document.getElementById("rfqCompany")?.value || "Automotive Importer";
  const country = document.getElementById("rfqCountry")?.value || "Global";

  const refId = "BLW-RFQ-2026-" + Math.floor(1000 + Math.random() * 9000);

  const demoRFQs = JSON.parse(localStorage.getItem("blw_demo_rfqs") || "[]");
  demoRFQs.unshift({
    refId: refId,
    name: `${company} (${name})`,
    email: email,
    country: country,
    channel: "RFQ Basket",
    skus: rfqBasket.map(i => i.name).join(", "),
    qty: rfqBasket.map(i => `${i.name}: ${i.qty}`).join("; "),
    date: new Date().toISOString()
  });
  localStorage.setItem("blw_demo_rfqs", JSON.stringify(demoRFQs));

  alert(`RFQ SUBMITTED SUCCESSFULLY!\nReference ID: ${refId}\n\nYour consolidated inquiry for ${rfqBasket.length} SKUs has been recorded in the BLW Sales Triage Stream.\nTarget Destination: ${country}\n\nNote: All demo inquiries are safely persisted in local demo state and displayed on the /demo-admin portal.`);

  rfqBasket = [];
  updateRfqBasketUI();
  toggleRfqBasket(false);
}

// --- MULTILINGUAL PROOF ---
const TRANSLATIONS = {
  en: { nav_overview: "Overview", nav_products: "Products", nav_services: "Surface Tech", nav_quality: "Quality & Testing", nav_export: "Global Reach", nav_calculator: "RFQ Estimator", nav_contact: "Contact" },
  es: { nav_overview: "Resumen", nav_products: "Productos", nav_services: "Superficie", nav_quality: "Calidad", nav_export: "Exportación", nav_calculator: "Cotización", nav_contact: "Contacto" },
  ar: { nav_overview: "ملخص", nav_products: "المنتجات", nav_services: "السطح", nav_quality: "الجودة", nav_export: "التصدير", nav_calculator: "حاسبة", nav_contact: "اتصل" }
};

function switchLanguage(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  Object.keys(dict).forEach(key => {
    const el = document.querySelector(`[data-i18n="${key}"]`);
    if (el) el.innerText = dict[key];
  });
}

// --- RENDER CATALOG PRODUCTS ---
function renderCatalog(category = "all") {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = PRODUCTS_DATA.filter(p => category === "all" || p.category === category);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2.5rem; color: var(--text-muted);">No components matched your search. Try another keyword or category!</div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-badge-bar">
        <span class="p-tag ${p.badgeType}">${escapeHtml(p.badge)}</span>
        <span class="oem-code">${escapeHtml(p.oemCode)}</span>
      </div>
      <div class="product-img-box">
        <i class="${p.imageIcon}"></i>
      </div>
      <h3 class="product-title">${escapeHtml(p.name)}</h3>
      <p class="product-desc">${escapeHtml(p.desc)}</p>
      
      <table class="product-spec-table">
        ${Object.entries(p.specs).slice(0, 3).map(([k, v]) => `
          <tr>
            <td>${escapeHtml(k)}:</td>
            <td>${escapeHtml(v)}</td>
          </tr>
        `).join('')}
      </table>

      <div class="product-card-footer">
        <button class="btn btn-sm btn-outline" onclick="openSpecModal('${p.id}')" title="View Spec Sheet">
          <i class="fa-solid fa-info-circle"></i> Spec
        </button>
        <button class="btn btn-sm btn-secondary" onclick="addToRfq('${p.id}')" title="Add to RFQ Basket">
          <i class="fa-solid fa-cart-plus"></i> + RFQ
        </button>
        <button class="btn btn-sm btn-primary" onclick="askAdityaAbout('${p.id}')" title="Ask Aditya AI">
          <i class="fa-solid fa-robot"></i> Ask AI
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function switchCatalogCategory(cat, evt) {
  if (evt) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    evt.target.classList.add("active");
  }
  renderCatalog(cat);
}

function filterCatalog() {
  const query = document.getElementById("catalogSearchInput")?.value.toLowerCase() || "";
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;

  const filtered = PRODUCTS_DATA.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.oemCode.toLowerCase().includes(query) ||
    p.segment.toLowerCase().includes(query) ||
    p.desc.toLowerCase().includes(query)
  );

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2.5rem; color: var(--text-muted);">No components matched "${escapeHtml(query)}".</div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-badge-bar">
        <span class="p-tag ${p.badgeType}">${escapeHtml(p.badge)}</span>
        <span class="oem-code">${escapeHtml(p.oemCode)}</span>
      </div>
      <div class="product-img-box">
        <i class="${p.imageIcon}"></i>
      </div>
      <h3 class="product-title">${escapeHtml(p.name)}</h3>
      <p class="product-desc">${escapeHtml(p.desc)}</p>
      
      <table class="product-spec-table">
        ${Object.entries(p.specs).slice(0, 3).map(([k, v]) => `
          <tr>
            <td>${escapeHtml(k)}:</td>
            <td>${escapeHtml(v)}</td>
          </tr>
        `).join('')}
      </table>

      <div class="product-card-footer">
        <button class="btn btn-sm btn-outline" onclick="openSpecModal('${p.id}')" title="View Spec Sheet">
          <i class="fa-solid fa-info-circle"></i> Spec
        </button>
        <button class="btn btn-sm btn-secondary" onclick="addToRfq('${p.id}')" title="Add to RFQ Basket">
          <i class="fa-solid fa-cart-plus"></i> + RFQ
        </button>
        <button class="btn btn-sm btn-primary" onclick="askAdityaAbout('${p.id}')" title="Ask Aditya AI">
          <i class="fa-solid fa-robot"></i> Ask AI
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- 3D VISUALIZER STAGE ---
function setVizMode(mode, evt) {
  if (evt) {
    document.querySelectorAll(".viz-btn").forEach(b => b.classList.remove("active"));
    evt.target.classList.add("active");
  }

  const infoBox = document.getElementById("stageInfoBox");
  if (!infoBox) return;

  if (mode === "nitride") {
    infoBox.innerHTML = `
      <div class="info-item"><span class="info-key">Process:</span> <span class="info-val">Liquid Carbo-Nitriding (LCN)</span></div>
      <div class="info-item"><span class="info-key">Depth:</span> <span class="info-val">15 - 25 Microns</span></div>
      <div class="info-item"><span class="info-key">Hardness:</span> <span class="info-val">HV 850 - 1000</span></div>
      <div class="info-item"><span class="info-key">Salt Spray:</span> <span class="info-val">96+ Hours Compliant</span></div>
    `;
  } else if (mode === "specs") {
    infoBox.innerHTML = `
      <div class="info-item"><span class="info-key">Stem OD:</span> <span class="info-val">4.98 mm &plusmn; 0.005</span></div>
      <div class="info-item"><span class="info-key">Head OD:</span> <span class="info-val">29.0 mm (Intake) / 25.0 mm (Exh)</span></div>
      <div class="info-item"><span class="info-key">Concentricity:</span> <span class="info-val">&lt; 0.012 mm TIR</span></div>
      <div class="info-item"><span class="info-key">Tip Hardness:</span> <span class="info-val">55 - 60 HRC Induction</span></div>
    `;
  } else if (mode === "motion") {
    infoBox.innerHTML = `
      <div class="info-item"><span class="info-key">Valvetrain Speed:</span> <span class="info-val">8,500 RPM Rated</span></div>
      <div class="info-item"><span class="info-key">Friction Coeff:</span> <span class="info-val">0.08 &mu; (Ultra Low)</span></div>
      <div class="info-item"><span class="info-key">Thermal Max:</span> <span class="info-val">800&deg;C Resilient</span></div>
      <div class="info-item"><span class="info-key">Scuff Defense:</span> <span class="info-val">Zero Seizure Verified</span></div>
    `;
  }
}

// --- PRICE ESTIMATOR ---
function updateCalcEstimate() {
  const cat = document.getElementById("calcCategory")?.value;
  const qty = parseInt(document.getElementById("calcQuantity")?.value || "1000");
  const treatment = document.getElementById("calcTreatment")?.value;

  let basePrice = 1.25;

  if (cat === "valves") basePrice = 1.45;
  if (cat === "guides") basePrice = 0.85;
  if (cat === "camshafts") basePrice = 6.50;
  if (cat === "washers") basePrice = 0.35;
  if (cat === "sheetmetal") basePrice = 2.10;

  if (treatment === "lcn") basePrice += 0.20;
  if (treatment === "stellite") basePrice += 0.45;

  if (qty > 5000) basePrice *= 0.85;
  if (qty > 10000) basePrice *= 0.75;

  const lowUnit = (basePrice * 0.9).toFixed(2);
  const highUnit = (basePrice * 1.15).toFixed(2);

  const lowTotal = Math.round(lowUnit * qty).toLocaleString();
  const highTotal = Math.round(highUnit * qty).toLocaleString();

  const unitEl = document.getElementById("summaryUnitPrice");
  const totalEl = document.getElementById("summaryTotalVal");
  if (unitEl) unitEl.innerText = `$${lowUnit} - $${highUnit} / unit`;
  if (totalEl) totalEl.innerText = `$${lowTotal} - $${highTotal}`;
}

function submitQuoteToAditya() {
  const cat = document.getElementById("calcCategory")?.value || "Engine Valves";
  const seg = document.getElementById("calcSegment")?.value || "2-Wheeler";
  const qty = document.getElementById("calcQuantity")?.value || "1000";

  toggleNexusChat(true);
  const prompt = `Hello Aditya! I calculated a quote for ${qty} units of ${cat} for ${seg}. Can we finalize specs and shipping?`;
  sendUserChatMsg(prompt);
  processAdityaResponse(prompt);
}

// --- ADITYA AI CHATBOT ---
function toggleNexusChat(forceOpen = false) {
  const windowEl = document.getElementById("nexusChatWindow");
  if (!windowEl) return;
  if (forceOpen === true) {
    windowEl.classList.add("open");
  } else {
    windowEl.classList.toggle("open");
  }
}

function handleNexusKeyPress(e) {
  if (e.key === "Enter") {
    sendNexusMessage();
  }
}

function askAdityaAbout(idOrTopic) {
  const product = PRODUCTS_DATA.find(p => p.id === idOrTopic || p.name === idOrTopic);
  const topic = product ? product.name : idOrTopic;
  toggleNexusChat(true);
  const prompt = `Can you provide technical details, OEM compatibility, and quality specs for: ${topic}?`;
  sendUserChatMsg(prompt);
  processAdityaResponse(prompt);
}

function sendNexusMessage() {
  const input = document.getElementById("nexusUserInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  sendUserChatMsg(text);
  input.value = "";
  processAdityaResponse(text);
}

function sendUserChatMsg(text) {
  const body = document.getElementById("nexusChatBody");
  if (!body) return;
  const userMsg = document.createElement("div");
  userMsg.className = "chat-msg user-msg";
  userMsg.innerHTML = `
    <div class="msg-content">
      <p>${escapeHtml(text)}</p>
    </div>
  `;
  body.appendChild(userMsg);
  body.scrollTop = body.scrollHeight;
}

function processAdityaResponse(userQuery) {
  const lower = userQuery.toLowerCase();
  let match = ADITYA_KNOWLEDGE.find(k => k.keywords.some(kw => lower.includes(kw)));

  let responseHTML = "";

  if (match) {
    responseHTML = match.response;
  } else {
    responseHTML = `
      <p>Thank you for reaching out regarding <strong>"${escapeHtml(userQuery)}"</strong>!</p>
      <p>BLW's 1,10,000 sq. ft. plant manufactures precision engine valves, guides, and nitrided components engineered to exact OEM blueprints.</p>
      <p>Our sales engineering team can assist you directly at <a href="mailto:info@blwenginevalves.com">info@blwenginevalves.com</a>. Would you like to leave your email and target vehicle model?</p>
    `;
  }

  setTimeout(() => {
    const body = document.getElementById("nexusChatBody");
    if (!body) return;
    const botMsg = document.createElement("div");
    botMsg.className = "chat-msg bot-msg";
    botMsg.innerHTML = `
      <div class="msg-content">
        ${responseHTML}
      </div>
    `;
    body.appendChild(botMsg);
    body.scrollTop = body.scrollHeight;
  }, 600);
}

// --- SPEC MODAL ---
function openSpecModal(idOrName) {
  const overlay = document.getElementById("specModalOverlay");
  const modalBody = document.getElementById("specModalBody");
  if (!overlay || !modalBody) return;

  const product = PRODUCTS_DATA.find(p => p.id === idOrName || p.name === idOrName) || PRODUCTS_DATA[0];

  modalBody.innerHTML = `
    <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1.25rem;">
      <div style="width:44px; height:44px; background:var(--accent-primary); color:#fff; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
        <i class="${product.imageIcon}"></i>
      </div>
      <div>
        <h3 style="font-size:1.2rem; font-weight:800; color:var(--text-main); margin:0;">${escapeHtml(product.name)}</h3>
        <span style="font-size:0.75rem; color:var(--accent-primary); font-family:var(--font-mono);">${escapeHtml(product.oemCode)} &bull; ${escapeHtml(product.segment)}</span>
      </div>
    </div>

    <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:1.25rem;">${escapeHtml(product.desc)}</p>

    <h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Technical Specification & Metallurgy:</h4>
    <table style="width:100%; font-size:0.825rem; border-collapse:collapse; margin-bottom:1.25rem;">
      ${Object.entries(product.specs).map(([k, v]) => `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:6px 0; color:var(--text-muted);">${escapeHtml(k)}</td>
          <td style="padding:6px 0; color:var(--text-main); text-align:right; font-weight:700;">${escapeHtml(v)}</td>
        </tr>
      `).join('')}
      <tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:6px 0; color:var(--text-muted);">Facility Compliance</td>
        <td style="padding:6px 0; color:var(--accent-success); text-align:right; font-weight:700;">IATF 16949:2016 Certified</td>
      </tr>
    </table>

    <div style="display:flex; gap:0.75rem;">
      <button class="btn btn-secondary btn-full btn-sm" onclick="closeSpecModal(); addToRfq('${product.id}')">
        <i class="fa-solid fa-cart-plus"></i> + Add to RFQ Basket
      </button>
      <button class="btn btn-primary btn-full btn-sm" onclick="closeSpecModal(); askAdityaAbout('${product.id}')">
        <i class="fa-solid fa-robot"></i> Ask Aditya AI
      </button>
    </div>
  `;

  overlay.classList.add("open");
}

function closeSpecModal() {
  const overlay = document.getElementById("specModalOverlay");
  if (overlay) overlay.classList.remove("open");
}

function handleFormSubmit(e) {
  e.preventDefault();
  alert("Thank you! Your direct inquiry has been recorded in the BLW Sales Triage Stream. We will respond within 2 business hours.");
  e.target.reset();
}

function toggleMobileMenu() {
  const menu = document.getElementById("navMenu");
  if (!menu) return;
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function setupScrollAnimations() {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (pageYOffset >= sectionTop - 150) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}
