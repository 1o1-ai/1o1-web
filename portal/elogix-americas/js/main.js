/* ==========================================================================
   Elogix Americas LLC - Application JavaScript Logic
   Clean Light Theme & Embedded Live Product iFrame Viewport Handler
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLightParticleCanvas();
  initProductViewportTabs();
  initPlanetTriggers();
  initModalHandler();
});

/* --------------------------------------------------------------------------
   1. Light Ambient Particle Canvas
   -------------------------------------------------------------------------- */
function initLightParticleCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const numParticles = Math.min(Math.floor(width / 30), 30);

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? 'rgba(79, 70, 229, 0.15)' : 'rgba(8, 145, 178, 0.15)'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  draw();
}

/* --------------------------------------------------------------------------
   2. Embedded Live Product iFrame Viewport Tab Switcher
   -------------------------------------------------------------------------- */
const capSpecs = {
  nexus: {
    name: "NEXUS",
    title: "AI Knowledge Brain & Document Grounding",
    desc: "NEXUS indexes enterprise documentation and web data to provide zero-hallucination answers with cited evidence. Elogix integrates NEXUS into custom web portals and enterprise backends.",
    url: "https://www.brahmexa.com/nexus-sample-client.php",
    extUrl: "https://www.brahmexa.com/nexus.php"
  },
  orbit: {
    name: "ORBIT",
    title: "Intelligent Web Performance & Digital Audit",
    desc: "ORBIT continuously monitors web uptime, loading velocity, vulnerability protection, and AI search discoverability. Elogix wraps ORBIT into managed enterprise digital SLAs.",
    url: "https://www.brahmexa.com/services/orbit",
    extUrl: "https://www.brahmexa.com/services/orbit"
  },
  reach: {
    name: "REACH",
    title: "Digital Marketing & Content Studio",
    desc: "REACH automates multi-channel social media posts and corporate marketing updates with strict human approval gates. Elogix customizes REACH workflows for enterprise brand governance.",
    url: "https://www.brahmexa.com/services/reach",
    extUrl: "https://saas.brahmexa.com/reach/studio.html"
  },
  lens: {
    name: "LENS",
    title: "Visual Intelligence & Document AI",
    desc: "LENS parses complex forms, invoices, and visual streams with multimodal OCR and defect detection. Elogix connects LENS directly to enterprise ERPs and document storage.",
    url: "https://saas.brahmexa.com/smb/lens/",
    extUrl: "https://saas.brahmexa.com/smb/lens/"
  },
  smb: {
    name: "SMB Engine",
    title: "Autonomous Back-Office Operations",
    desc: "SMB Engine handles routine customer inquiry triage and operational steps for field services, clinics, and hospitality. Elogix deploys turnkey SMB Engine pipelines for rapid ROI.",
    url: "https://www.brahmexa.com/services/smb",
    extUrl: "https://saas.brahmexa.com/smb/"
  }
};

function activateProductTab(productKey) {
  const tabBtns = document.querySelectorAll('.product-tab-btn');
  const iframe = document.getElementById('live-product-frame');
  const extLink = document.getElementById('toolbar-navigate-link');
  const productTitleEl = document.getElementById('toolbar-product-title');
  const capTitleEl = document.getElementById('cap-product-title');
  const capDescEl = document.getElementById('cap-product-desc');

  const spec = capSpecs[productKey] || capSpecs.nexus;

  tabBtns.forEach(b => {
    if (b.getAttribute('data-product') === productKey) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  if (iframe) iframe.src = spec.url;
  if (extLink) {
    extLink.href = spec.extUrl;
    extLink.innerHTML = `Navigate to Brahmexa (${spec.name}) &rarr;`;
  }
  if (productTitleEl) productTitleEl.textContent = `${spec.name} Live Engine`;
  if (capTitleEl) capTitleEl.textContent = spec.title;
  if (capDescEl) capDescEl.textContent = spec.desc;
}

function initProductViewportTabs() {
  const tabBtns = document.querySelectorAll('.product-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-product');
      activateProductTab(key);
    });
  });
}

function initPlanetTriggers() {
  const planetTriggers = document.querySelectorAll('.product-tab-trigger');
  planetTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      const key = trigger.getAttribute('data-product');
      if (key) {
        activateProductTab(key);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. Modal Handler
   -------------------------------------------------------------------------- */
function initModalHandler() {
  const modal = document.getElementById('consultation-modal');
  const triggerBtns = document.querySelectorAll('.open-modal-btn');
  const closeBtn = modal ? modal.querySelector('.modal-close') : null;
  const form = document.getElementById('consultation-form');

  if (!modal) return;

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Transmitting Solution Request...";
      submitBtn.disabled = true;

      setTimeout(() => {
        alert("Thank you! Your request for Elogix Americas LLC solution engineering has been received. Our team will contact you shortly.");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        form.reset();
        modal.classList.remove('active');
      }, 1000);
    });
  }
}
