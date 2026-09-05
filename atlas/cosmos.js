/* Author: Yogabrata Mukhopadhyay
   Organization: Brahmexa
   Copyright (c) 2026 Brahmexa. All rights reserved. */

(function () {
  "use strict";
  var canvas = document.getElementById("cosmos");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var stars = [];
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ymStarFill(alpha) {
    var ym_light = document.documentElement.getAttribute("data-theme") === "light";
    return ym_light ? "rgba(15, 23, 42, " + alpha + ")" : "rgba(226, 232, 240, " + alpha + ")";
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: Math.floor((canvas.width * canvas.height) / 8500) }, function () {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.5 + 0.2,
        s: Math.random() * 0.018 + 0.004,
      };
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(function (st) {
      if (!reduced) {
        st.a += st.s * (Math.random() > 0.5 ? 1 : -1);
        if (st.a < 0.12) st.a = 0.12;
        if (st.a > 0.9) st.a = 0.9;
      }
      ctx.beginPath();
      ctx.fillStyle = ymStarFill(st.a);
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!reduced) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();
