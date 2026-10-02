/* Author: Yogabrata Mukhopadhyay | Organization: Brahmexa | Copyright: Copyright (c) 2026 Brahmexa. All rights reserved. */
// API location. Local development serves the page from the API itself (same origin).
// The published page on yogabrata.com talks to the production API below.
// Override for testing with ?api=https://host (remembered in this browser).
(function () {
  var PRODUCTION_API = "https://divine-api.brahmexa.com";
  var params = new URLSearchParams(location.search);
  var override = params.get("api");
  try {
    if (override === "reset") localStorage.removeItem("divine.api");
    else if (override) localStorage.setItem("divine.api", override);
  } catch (e) { /* storage unavailable */ }
  var saved = null;
  try { saved = localStorage.getItem("divine.api"); } catch (e) { saved = null; }
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  window.DIVINE_API = (saved || (local ? "" : PRODUCTION_API)).replace(/\/$/, "");
})();
