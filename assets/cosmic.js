(function () {
  'use strict';
  var canvas = document.getElementById('cosmos');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var stars = [];
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
      st.a += st.s * (Math.random() > 0.5 ? 1 : -1);
      if (st.a < 0.12) st.a = 0.12;
      if (st.a > 0.9) st.a = 0.9;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(226, 232, 240, ' + st.a + ')';
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize();
  draw();
})();
