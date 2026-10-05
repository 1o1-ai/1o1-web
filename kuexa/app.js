/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright: Copyright (c) 2026 Brahmexa. All rights reserved. */

(function () {
  var YM_KEY = "kuexa-demo-v1";
  var YM_GST = 0.18;

  var ym_catalog = [
    { id: "cut-signature", kind: "service", category: "Cut", name: "Signature Cut", minutes: 45, price: 1800 },
    { id: "cut-restyle", kind: "service", category: "Cut", name: "Precision Restyle", minutes: 60, price: 2400 },
    { id: "cut-fringe", kind: "service", category: "Cut", name: "Fringe Refresh", minutes: 20, price: 700 },
    { id: "colour-gloss", kind: "service", category: "Colour", name: "Gloss Colour", minutes: 75, price: 4200 },
    { id: "colour-balayage", kind: "service", category: "Colour", name: "Balayage", minutes: 150, price: 9800 },
    { id: "colour-root", kind: "service", category: "Colour", name: "Root Melt", minutes: 90, price: 5400 },
    { id: "care-ritual", kind: "service", category: "Care", name: "Scalp Ritual", minutes: 40, price: 2200 },
    { id: "care-blow", kind: "service", category: "Care", name: "Blow Dry", minutes: 30, price: 1200 },
    { id: "care-treatment", kind: "service", category: "Care", name: "Bond Treatment", minutes: 35, price: 2800 },
    { id: "nails-atelier", kind: "service", category: "Nails", name: "Atelier Manicure", minutes: 50, price: 1600 },
    { id: "nails-gel", kind: "service", category: "Nails", name: "Gel Finish", minutes: 70, price: 2200 },
    { id: "skin-facial", kind: "service", category: "Skin", name: "Signature Facial", minutes: 60, price: 3600 },
    { id: "retail-serum", kind: "retail", category: "Retail", name: "Shine Serum 50ml", minutes: 0, price: 2400 },
    { id: "retail-shampoo", kind: "retail", category: "Retail", name: "Atelier Shampoo", minutes: 0, price: 1450 },
    { id: "retail-oil", kind: "retail", category: "Retail", name: "Hair Oil 100ml", minutes: 0, price: 980 },
    { id: "retail-mask", kind: "retail", category: "Retail", name: "Repair Mask", minutes: 0, price: 1650 }
  ];

  var ym_stylists = [
    { id: "meera", name: "Meera Shah" },
    { id: "arjun", name: "Arjun Desai" },
    { id: "lila", name: "Lila Nair" },
    { id: "kabir", name: "Kabir Sen" }
  ];

  var ym_clients = [
    { id: "walkin", name: "Walk-in", phone: "", tier: "Guest", stylistId: "meera", spend: 0 },
    { id: "ananya", name: "Ananya Rao", phone: "98200 11420", tier: "Atelier", stylistId: "meera", spend: 86400 },
    { id: "priya", name: "Priya Menon", phone: "98111 22018", tier: "Atelier", stylistId: "lila", spend: 54200 },
    { id: "rahul", name: "Rahul Kapoor", phone: "98333 44190", tier: "Guest", stylistId: "arjun", spend: 12600 },
    { id: "sara", name: "Sara Qureshi", phone: "98700 11884", tier: "Maison", stylistId: "meera", spend: 142800 },
    { id: "dev", name: "Dev Iyer", phone: "99001 77213", tier: "Guest", stylistId: "kabir", spend: 8400 },
    { id: "nisha", name: "Nisha Bose", phone: "98190 33441", tier: "Atelier", stylistId: "lila", spend: 39600 },
    { id: "omar", name: "Omar Sheikh", phone: "98211 90876", tier: "Guest", stylistId: "arjun", spend: 6100 }
  ];

  var ym_categories = ["All", "Cut", "Colour", "Care", "Nails", "Skin", "Retail"];

  function ym_todayAt(ym_hour, ym_minute) {
    var ym_d = new Date();
    ym_d.setHours(ym_hour, ym_minute, 0, 0);
    return ym_d.toISOString();
  }

  function ym_seed() {
    return {
      view: "register",
      category: "All",
      query: "",
      clientId: "walkin",
      selectedClient: "ananya",
      discount: 0,
      lines: [],
      method: "UPI",
      tender: "",
      appointments: [
        { id: "a1", time: "10:30", clientId: "ananya", stylistId: "meera", serviceId: "colour-balayage", status: "chair" },
        { id: "a2", time: "11:00", clientId: "rahul", stylistId: "arjun", serviceId: "cut-signature", status: "arrived" },
        { id: "a3", time: "12:30", clientId: "priya", stylistId: "lila", serviceId: "skin-facial", status: "next" },
        { id: "a4", time: "13:00", clientId: "dev", stylistId: "kabir", serviceId: "cut-restyle", status: "next" },
        { id: "a5", time: "15:30", clientId: "sara", stylistId: "meera", serviceId: "colour-gloss", status: "next" },
        { id: "a6", time: "16:00", clientId: "nisha", stylistId: "lila", serviceId: "nails-atelier", status: "next" },
        { id: "a7", time: "09:30", clientId: "omar", stylistId: "arjun", serviceId: "cut-signature", status: "done" }
      ],
      receipts: [
        ym_makeReceipt("r1", ym_todayAt(9, 40), "omar", [{ catalogId: "cut-signature", stylistId: "arjun", qty: 1 }], 0, "Card"),
        ym_makeReceipt("r2", ym_todayAt(10, 15), "nisha", [{ catalogId: "care-ritual", stylistId: "lila", qty: 1 }, { catalogId: "retail-oil", stylistId: "lila", qty: 1 }], 10, "UPI"),
        ym_makeReceipt("r3", ym_todayAt(11, 5), "walkin", [{ catalogId: "care-blow", stylistId: "kabir", qty: 1 }], 0, "Cash"),
        ym_makeReceipt("r4", ym_todayAt(11, 50), "sara", [{ catalogId: "colour-root", stylistId: "meera", qty: 1 }, { catalogId: "retail-serum", stylistId: "meera", qty: 1 }], 0, "Card")
      ]
    };
  }

  function ym_item(ym_id) {
    return ym_catalog.filter(function (ym_row) { return ym_row.id === ym_id; })[0];
  }
  function ym_client(ym_id) {
    return ym_clients.filter(function (ym_row) { return ym_row.id === ym_id; })[0];
  }
  function ym_stylist(ym_id) {
    return ym_stylists.filter(function (ym_row) { return ym_row.id === ym_id; })[0];
  }

  function ym_money(ym_lines, ym_discount) {
    var ym_sub = ym_lines.reduce(function (ym_sum, ym_line) {
      return ym_sum + ym_item(ym_line.catalogId).price * ym_line.qty;
    }, 0);
    var ym_off = Math.round(ym_sub * (ym_discount || 0) / 100);
    var ym_taxable = ym_sub - ym_off;
    var ym_gst = Math.round(ym_taxable * YM_GST);
    return { sub: ym_sub, off: ym_off, gst: ym_gst, total: ym_taxable + ym_gst };
  }

  function ym_makeReceipt(ym_id, ym_at, ym_clientId, ym_lines, ym_discount, ym_method) {
    var ym_bill = ym_money(ym_lines, ym_discount);
    return {
      id: ym_id,
      at: ym_at,
      clientId: ym_clientId,
      lines: ym_lines,
      discount: ym_discount,
      method: ym_method,
      sub: ym_bill.sub,
      off: ym_bill.off,
      gst: ym_bill.gst,
      total: ym_bill.total
    };
  }

  function ym_load() {
    try {
      var ym_raw = localStorage.getItem(YM_KEY);
      if (ym_raw) return JSON.parse(ym_raw);
    } catch (ym_err) { /* fresh demo day */ }
    return ym_seed();
  }

  var ym_state = ym_load();

  function ym_save() {
    localStorage.setItem(YM_KEY, JSON.stringify(ym_state));
  }

  function ym_esc(ym_value) {
    return String(ym_value).replace(/[&<>"']/g, function (ym_ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ym_ch];
    });
  }

  function ym_inr(ym_n) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(ym_n || 0);
  }

  function ym_clock() {
    var ym_now = new Date();
    var ym_label = ym_now.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
    var ym_el = document.getElementById("ym-clock");
    ym_el.textContent = ym_label;
    ym_el.setAttribute("datetime", ym_now.toISOString());
  }

  function ym_ticketNo(ym_index) {
    return "KX-" + String(10420 + ym_index);
  }

  function ym_todayTotal() {
    return ym_state.receipts.reduce(function (ym_sum, ym_row) { return ym_sum + ym_row.total; }, 0);
  }

  function ym_isOriginal() {
    return document.body.getAttribute("data-skin") === "original";
  }

  function ym_applySkin(ym_next) {
    document.body.setAttribute("data-skin", ym_next === "original" ? "original" : "atelier");
    localStorage.setItem("kuexa-skin", document.body.getAttribute("data-skin"));
    var ym_box = document.getElementById("ym-skin");
    if (ym_box) ym_box.setAttribute("aria-pressed", ym_isOriginal() ? "true" : "false");
    ym_renderNav();
  }

  function ym_renderNav() {
    var ym_original = ym_isOriginal();
    var ym_titles = ym_original
      ? { register: "Billing", book: "Appointments", clients: "Customers", day: "Dashboard" }
      : { register: "Register", book: "Book", clients: "Clients", day: "Day" };
    var ym_crumbs = ym_original
      ? { register: "KUEXA", book: "KUEXA", clients: "KUEXA", day: "KUEXA" }
      : {
        register: "Till 01 · Bandra West",
        book: "Today’s chair",
        clients: "House book",
        day: "Takings"
      };
    document.getElementById("ym-title").textContent = ym_titles[ym_state.view];
    document.getElementById("ym-crumb").textContent = ym_crumbs[ym_state.view];
    document.getElementById("ym-today").textContent = ym_inr(ym_todayTotal());
    var ym_place = document.querySelector(".rail-foot span");
    var ym_note = document.querySelector(".rail-foot em");
    if (ym_place) ym_place.textContent = ym_original ? "Admin" : "Bandra West · Till 01";
    if (ym_note) ym_note.textContent = ym_original ? "Powered by KUEXA · v1.0.0" : "Today on this till";
    Array.prototype.forEach.call(document.querySelectorAll("#ym-nav button"), function (ym_btn) {
      var ym_view = ym_btn.getAttribute("data-view");
      ym_btn.textContent = ym_titles[ym_view];
      ym_btn.classList.toggle("is-on", ym_view === ym_state.view);
    });
  }

  function ym_render() {
    ym_save();
    ym_renderNav();
    var ym_stage = document.getElementById("ym-stage");
    if (ym_state.view === "register") ym_stage.innerHTML = ym_registerHtml();
    else if (ym_state.view === "book") ym_stage.innerHTML = ym_bookHtml();
    else if (ym_state.view === "clients") ym_stage.innerHTML = ym_clientsHtml();
    else ym_stage.innerHTML = ym_dayHtml();
  }

  function ym_registerHtml() {
    var ym_bill = ym_money(ym_state.lines, ym_state.discount);
    var ym_cards = ym_catalog.filter(function (ym_row) {
      var ym_cat = ym_state.category === "All" || ym_row.category === ym_state.category;
      var ym_q = ym_state.query.trim().toLowerCase();
      return ym_cat && (!ym_q || ym_row.name.toLowerCase().indexOf(ym_q) >= 0);
    }).map(function (ym_row) {
      var ym_meta = ym_row.kind === "retail" ? "Retail" : ym_row.minutes + " min";
      return '<button type="button" class="card" data-act="add" data-id="' + ym_row.id + '">' +
        '<small>' + ym_esc(ym_row.category) + '</small>' +
        '<strong>' + ym_esc(ym_row.name) + '</strong>' +
        '<em><span>' + ym_meta + '</span><span>' + ym_inr(ym_row.price) + '</span></em></button>';
    }).join("");

    var ym_cats = ym_categories.map(function (ym_name) {
      return '<button type="button" data-act="category" data-id="' + ym_name + '" class="' +
        (ym_state.category === ym_name ? "is-on" : "") + '">' + ym_name + '</button>';
    }).join("");

    var ym_lines = ym_state.lines.map(function (ym_line, ym_i) {
      var ym_row = ym_item(ym_line.catalogId);
      var ym_opts = ym_stylists.map(function (ym_s) {
        return '<option value="' + ym_s.id + '"' + (ym_s.id === ym_line.stylistId ? " selected" : "") + '>' +
          ym_esc(ym_s.name) + '</option>';
      }).join("");
      return '<div class="line"><div><strong>' + ym_esc(ym_row.name) + '</strong>' +
        '<div class="meta"><select data-act="stylist" data-index="' + ym_i + '">' + ym_opts + '</select>' +
        '<button type="button" class="icon-btn" data-act="remove" data-index="' + ym_i + '" aria-label="Remove">Remove</button></div></div>' +
        '<div class="price">' + ym_inr(ym_row.price * ym_line.qty) + '</div></div>';
    }).join("");

    var ym_clientOpts = ym_clients.map(function (ym_c) {
      return '<option value="' + ym_c.id + '"' + (ym_c.id === ym_state.clientId ? " selected" : "") + '>' +
        ym_esc(ym_c.name) + '</option>';
    }).join("");

    var ym_discounts = [0, 5, 10, 15].map(function (ym_n) {
      return '<button type="button" data-act="discount" data-id="' + ym_n + '" class="' +
        (ym_state.discount === ym_n ? "is-on" : "") + '">' + (ym_n === 0 ? "None" : ym_n + "%") + '</button>';
    }).join("");

    return '<section class="register">' +
      '<div class="catalog"><div class="catalog-bar">' + ym_cats + '</div>' +
      '<input class="catalog-search" id="ym-query" placeholder="Search the menu" value="' + ym_esc(ym_state.query) + '" />' +
      '<div class="grid">' + (ym_cards || '<p class="empty">Nothing under that name.</p>') + '</div></div>' +
      '<aside class="ticket"><header><div><p>Ticket ' + ym_ticketNo(ym_state.receipts.length + 1) + '</p>' +
      '<strong>Open</strong></div><select class="client-pick" data-act="client">' + ym_clientOpts + '</select></header>' +
      '<div class="lines">' + (ym_lines || '<div class="empty"><strong>The ticket is clear</strong>Choose a service or a retail piece.</div>') + '</div>' +
      '<div class="totals"><div><span>Subtotal</span><span>' + ym_inr(ym_bill.sub) + '</span></div>' +
      '<div><span>Courtesy</span><span>− ' + ym_inr(ym_bill.off) + '</span></div>' +
      '<div><span>GST 18%</span><span>' + ym_inr(ym_bill.gst) + '</span></div>' +
      '<div class="grand"><span>Total</span><b>' + ym_inr(ym_bill.total) + '</b></div></div>' +
      '<footer><div class="seg" aria-label="Courtesy">' + ym_discounts + '</div>' +
      '<button type="button" class="solid" data-act="pay" ' + (ym_state.lines.length ? "" : "disabled") + '>Take payment</button></footer></aside></section>';
  }

  function ym_bookHtml() {
    var ym_cols = ym_stylists.map(function (ym_s) {
      var ym_appts = ym_state.appointments.filter(function (ym_a) { return ym_a.stylistId === ym_s.id; })
        .sort(function (ym_a, ym_b) { return ym_a.time.localeCompare(ym_b.time); });
      var ym_cards = ym_appts.map(function (ym_a) {
        var ym_c = ym_client(ym_a.clientId);
        var ym_svc = ym_item(ym_a.serviceId);
        var ym_action = ym_a.status === "done"
          ? ""
          : '<button type="button" class="ghost" data-act="checkin" data-id="' + ym_a.id + '">' +
            (ym_a.status === "chair" ? "Add to ticket" : "Seat and open ticket") + '</button>';
        return '<article class="appt"><time>' + ym_a.time + '</time><strong>' + ym_esc(ym_c.name) + '</strong>' +
          '<span>' + ym_esc(ym_svc.name) + ' · ' + ym_inr(ym_svc.price) + '</span>' +
          '<em class="status ' + ym_a.status + '">' + ym_statusLabel(ym_a.status) + '</em>' + ym_action + '</article>';
      }).join("");
      return '<section class="col"><h2>' + ym_esc(ym_s.name) + '<span>' + ym_appts.length + '</span></h2>' +
        (ym_cards || '<p class="empty">Open chair</p>') + '</section>';
    }).join("");
    return '<div class="board"><div class="cols">' + ym_cols + '</div></div>';
  }

  function ym_statusLabel(ym_status) {
    return { next: "Expected", arrived: "Arrived", chair: "In chair", done: "Complete" }[ym_status] || ym_status;
  }

  function ym_clientsHtml() {
    var ym_list = ym_clients.filter(function (ym_c) { return ym_c.id !== "walkin"; }).map(function (ym_c) {
      return '<button type="button" class="person' + (ym_state.selectedClient === ym_c.id ? " is-on" : "") +
        '" data-act="pick-client" data-id="' + ym_c.id + '"><strong>' + ym_esc(ym_c.name) + '</strong><span>' +
        ym_esc(ym_c.tier) + '</span></button>';
    }).join("");
    var ym_c = ym_client(ym_state.selectedClient) || ym_clients[1];
    var ym_pref = ym_stylist(ym_c.stylistId);
    return '<div class="people"><div class="person-list">' + ym_list + '</div><article class="profile panel">' +
      '<p class="crumb">' + ym_esc(ym_c.tier) + '</p><h2>' + ym_esc(ym_c.name) + '</h2>' +
      '<div class="facts"><div><span>Phone</span><strong>' + ym_esc(ym_c.phone) + '</strong></div>' +
      '<div><span>Preferred</span><strong>' + ym_esc(ym_pref.name) + '</strong></div>' +
      '<div><span>House spend</span><strong>' + ym_inr(ym_c.spend) + '</strong></div></div>' +
      '<button type="button" class="solid" data-act="client-ticket" data-id="' + ym_c.id + '">Open a ticket</button></article></div>';
  }

  function ym_dayHtml() {
    var ym_count = ym_state.receipts.length;
    var ym_total = ym_todayTotal();
    var ym_avg = ym_count ? Math.round(ym_total / ym_count) : 0;
    var ym_open = ym_state.appointments.filter(function (ym_a) { return ym_a.status !== "done"; }).length;
    var ym_start = 9;
    var ym_end = 19;
    ym_state.receipts.forEach(function (ym_r) {
      var ym_hour = new Date(ym_r.at).getHours();
      if (ym_hour < ym_start) ym_start = ym_hour;
      if (ym_hour > ym_end) ym_end = ym_hour;
    });
    var ym_hours = [];
    for (var ym_h = ym_start; ym_h <= ym_end; ym_h += 1) ym_hours.push(ym_h);
    var ym_buckets = ym_hours.map(function () { return 0; });
    ym_state.receipts.forEach(function (ym_r) {
      var ym_hour = new Date(ym_r.at).getHours();
      var ym_idx = ym_hours.indexOf(ym_hour);
      if (ym_idx >= 0) ym_buckets[ym_idx] += ym_r.total;
    });
    var ym_max = Math.max.apply(null, ym_buckets.concat([1]));
    var ym_bars = ym_hours.map(function (ym_h, ym_i) {
      var ym_pct = Math.round((ym_buckets[ym_i] / ym_max) * 100);
      return '<div class="hour"><i style="height:' + Math.max(ym_pct, 4) + '%"></i><span>' + ym_h + '</span></div>';
    }).join("");
    var ym_rows = ym_state.receipts.slice().reverse().map(function (ym_r, ym_i) {
      var ym_no = ym_ticketNo(ym_state.receipts.length - ym_i);
      var ym_when = new Date(ym_r.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      return '<tr><td>' + ym_no + '</td><td>' + ym_when + '</td><td>' + ym_esc(ym_client(ym_r.clientId).name) +
        '</td><td>' + ym_esc(ym_r.method) + '</td><td>' + ym_inr(ym_r.total) + '</td></tr>';
    }).join("");
    return '<div class="day"><div class="stats">' +
      '<article class="stat"><span>Takings</span><strong>' + ym_inr(ym_total) + '</strong></article>' +
      '<article class="stat"><span>Tickets</span><strong>' + ym_count + '</strong></article>' +
      '<article class="stat"><span>Average</span><strong>' + ym_inr(ym_avg) + '</strong></article>' +
      '<article class="stat"><span>Still booked</span><strong>' + ym_open + '</strong></article></div>' +
      '<div class="day-grid"><section class="panel"><h2>By the hour</h2><div class="hours" style="grid-template-columns:repeat(' + ym_hours.length + ',1fr)">' + ym_bars + '</div></section>' +
      '<section class="panel"><h2>Receipts</h2><table><thead><tr><th>Ticket</th><th>Time</th><th>Client</th><th>Tender</th><th>Total</th></tr></thead><tbody>' +
      ym_rows + '</tbody></table></section></div>' +
      '<div class="day-tools"><button type="button" class="ghost" data-act="reset">Start a fresh day</button></div></div>';
  }

  function ym_add(ym_id) {
    var ym_row = ym_item(ym_id);
    var ym_stylistId = (ym_client(ym_state.clientId) || ym_clients[0]).stylistId;
    var ym_existing = ym_state.lines.filter(function (ym_line) {
      return ym_line.catalogId === ym_id && ym_row.kind === "retail";
    })[0];
    if (ym_existing) ym_existing.qty += 1;
    else ym_state.lines.push({ catalogId: ym_id, stylistId: ym_stylistId, qty: 1 });
    ym_render();
  }

  function ym_openPay() {
    if (!ym_state.lines.length) return;
    var ym_bill = ym_money(ym_state.lines, ym_state.discount);
    document.getElementById("ym-pay-total").textContent = ym_inr(ym_bill.total);
    ym_state.method = ym_state.method || "UPI";
    ym_paintPay();
    document.getElementById("ym-pay").showModal();
  }

  function ym_paintPay() {
    var ym_methods = ["UPI", "Card", "Cash"].map(function (ym_name) {
      return '<button type="button" data-act="method" data-id="' + ym_name + '" class="' +
        (ym_state.method === ym_name ? "is-on" : "") + '">' + ym_name + '</button>';
    }).join("");
    document.getElementById("ym-methods").innerHTML = ym_methods;
    var ym_tender = document.getElementById("ym-tender");
    var ym_bill = ym_money(ym_state.lines, ym_state.discount);
    if (ym_state.method === "Cash") {
      ym_tender.hidden = false;
      var ym_chips = [ym_bill.total, 2000, 5000, 10000].filter(function (ym_n, ym_i, ym_arr) {
        return ym_arr.indexOf(ym_n) === ym_i && ym_n >= ym_bill.total;
      }).map(function (ym_n) {
        return '<button type="button" data-act="chip" data-id="' + ym_n + '">' + ym_inr(ym_n) + '</button>';
      }).join("");
      ym_tender.innerHTML = '<label>Cash received<input id="ym-tender-input" inputmode="numeric" value="' +
        ym_esc(ym_state.tender || String(ym_bill.total)) + '" /></label><div class="chips">' + ym_chips + '</div>';
    } else {
      ym_tender.hidden = true;
      ym_tender.innerHTML = "";
    }
    document.getElementById("ym-pay-note").textContent = ym_state.method === "Cash"
      ? "Change is shown on the receipt."
      : "Demo authorisation · " + ym_state.method + " approved";
  }

  function ym_completeSale() {
    var ym_bill = ym_money(ym_state.lines, ym_state.discount);
    var ym_tendered = ym_bill.total;
    if (ym_state.method === "Cash") {
      var ym_input = document.getElementById("ym-tender-input");
      ym_tendered = parseInt((ym_input && ym_input.value || "").replace(/[^\d]/g, ""), 10) || 0;
      if (ym_tendered < ym_bill.total) {
        document.getElementById("ym-pay-note").textContent = "Received is short by " + ym_inr(ym_bill.total - ym_tendered) + ".";
        return;
      }
    }
    var ym_receipt = ym_makeReceipt(
      "r" + Date.now(),
      new Date().toISOString(),
      ym_state.clientId,
      ym_state.lines.map(function (ym_line) { return { catalogId: ym_line.catalogId, stylistId: ym_line.stylistId, qty: ym_line.qty }; }),
      ym_state.discount,
      ym_state.method
    );
    ym_receipt.tendered = ym_tendered;
    ym_receipt.change = ym_tendered - ym_bill.total;
    ym_state.appointments.forEach(function (ym_appt) {
      var ym_matched = ym_appt.clientId === ym_receipt.clientId && ym_receipt.lines.some(function (ym_line) {
        return ym_line.catalogId === ym_appt.serviceId;
      });
      if (ym_matched) ym_appt.status = "done";
    });
    ym_state.receipts.push(ym_receipt);
    ym_state.lines = [];
    ym_state.discount = 0;
    ym_state.clientId = "walkin";
    ym_state.tender = "";
    document.getElementById("ym-pay").close();
    ym_showReceipt(ym_receipt, ym_state.receipts.length);
    ym_render();
  }

  function ym_showReceipt(ym_receipt, ym_index) {
    var ym_when = new Date(ym_receipt.at).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
    var ym_lines = ym_receipt.lines.map(function (ym_line) {
      var ym_row = ym_item(ym_line.catalogId);
      var ym_who = ym_stylist(ym_line.stylistId);
      return '<div class="row"><span>' + ym_esc(ym_row.name) + '<br><span class="who">' + ym_esc(ym_who.name) +
        '</span></span><span>' + ym_inr(ym_row.price * ym_line.qty) + '</span></div>';
    }).join("");
    var ym_change = ym_receipt.method === "Cash"
      ? '<div class="row"><span>Received</span><span>' + ym_inr(ym_receipt.tendered) + '</span></div>' +
        '<div class="row"><span>Change</span><span>' + ym_inr(ym_receipt.change || 0) + '</span></div>'
      : "";
    document.getElementById("ym-receipt-body").innerHTML =
      '<h2>KUEXA</h2><p class="center">Bandra West · Till 01<br>' + ym_esc(ym_when) + '<br>' +
      ym_ticketNo(ym_index) + '</p><hr>' +
      '<div class="row"><span>Client</span><span>' + ym_esc(ym_client(ym_receipt.clientId).name) + '</span></div>' +
      ym_lines + '<hr>' +
      '<div class="row"><span>Subtotal</span><span>' + ym_inr(ym_receipt.sub) + '</span></div>' +
      '<div class="row"><span>Courtesy</span><span>− ' + ym_inr(ym_receipt.off) + '</span></div>' +
      '<div class="row"><span>GST 18%</span><span>' + ym_inr(ym_receipt.gst) + '</span></div>' +
      '<div class="row"><strong>Total</strong><strong>' + ym_inr(ym_receipt.total) + '</strong></div>' +
      '<div class="row"><span>' + ym_esc(ym_receipt.method) + '</span><span></span></div>' + ym_change +
      '<hr><p class="center">Thank you. The house keeps this ticket on the demo till.</p>';
    document.getElementById("ym-receipt").showModal();
  }

  function ym_checkin(ym_id) {
    var ym_appt = ym_state.appointments.filter(function (ym_a) { return ym_a.id === ym_id; })[0];
    if (!ym_appt) return;
    ym_appt.status = "chair";
    ym_state.view = "register";
    ym_state.clientId = ym_appt.clientId;
    ym_state.lines = [{ catalogId: ym_appt.serviceId, stylistId: ym_appt.stylistId, qty: 1 }];
    ym_state.discount = 0;
    ym_render();
  }

  document.body.addEventListener("click", function (ym_ev) {
    var ym_el = ym_ev.target.closest("[data-act]");
    if (!ym_el) return;
    var ym_act = ym_el.getAttribute("data-act");
    var ym_id = ym_el.getAttribute("data-id");
    if (ym_act === "skin") {
      ym_applySkin(ym_isOriginal() ? "atelier" : "original");
    } else if (ym_act === "nav") {
      ym_state.view = ym_el.getAttribute("data-view");
      ym_render();
    } else if (ym_act === "add") ym_add(ym_id);
    else if (ym_act === "category") {
      ym_state.category = ym_id;
      ym_render();
      var ym_box = document.getElementById("ym-query");
      if (ym_box) ym_box.focus();
    } else if (ym_act === "remove") {
      ym_state.lines.splice(parseInt(ym_el.getAttribute("data-index"), 10), 1);
      ym_render();
    } else if (ym_act === "discount") {
      ym_state.discount = parseInt(ym_id, 10);
      ym_render();
    } else if (ym_act === "pay") ym_openPay();
    else if (ym_act === "close-pay") document.getElementById("ym-pay").close();
    else if (ym_act === "method") {
      ym_state.method = ym_id;
      ym_paintPay();
    } else if (ym_act === "chip") {
      ym_state.tender = ym_id;
      var ym_input = document.getElementById("ym-tender-input");
      if (ym_input) ym_input.value = ym_id;
    } else if (ym_act === "close-receipt") document.getElementById("ym-receipt").close();
    else if (ym_act === "print") window.print();
    else if (ym_act === "checkin") ym_checkin(ym_id);
    else if (ym_act === "pick-client") {
      ym_state.selectedClient = ym_id;
      ym_render();
    } else if (ym_act === "client-ticket") {
      ym_state.view = "register";
      ym_state.clientId = ym_id;
      ym_state.lines = [];
      ym_render();
    } else if (ym_act === "reset") {
      localStorage.removeItem(YM_KEY);
      ym_state = ym_seed();
      ym_render();
    }
  });

  document.body.addEventListener("change", function (ym_ev) {
    var ym_el = ym_ev.target.closest("[data-act]");
    if (!ym_el) return;
    if (ym_el.getAttribute("data-act") === "stylist") {
      ym_state.lines[parseInt(ym_el.getAttribute("data-index"), 10)].stylistId = ym_el.value;
      ym_save();
    } else if (ym_el.getAttribute("data-act") === "client") {
      ym_state.clientId = ym_el.value;
      ym_save();
    }
  });

  document.body.addEventListener("input", function (ym_ev) {
    if (ym_ev.target.id === "ym-query") {
      ym_state.query = ym_ev.target.value;
      var ym_grid = document.querySelector(".grid");
      if (!ym_grid) return;
      ym_save();
      var ym_html = ym_registerHtml();
      var ym_wrap = document.createElement("div");
      ym_wrap.innerHTML = ym_html;
      var ym_next = ym_wrap.querySelector(".grid");
      ym_grid.innerHTML = ym_next.innerHTML;
    }
  });

  document.getElementById("ym-pay-form").addEventListener("submit", function (ym_ev) {
    ym_ev.preventDefault();
    ym_completeSale();
  });

  ym_applySkin(localStorage.getItem("kuexa-skin") || "atelier");
  ym_clock();
  setInterval(ym_clock, 30000);
  ym_render();
})();
