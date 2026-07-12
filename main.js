/* ============================================================
   Callan Jackson — portfolio interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile toggle ---------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  function setMenu(open) {
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () {
    setMenu(!links.classList.contains('open'));
  });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 0.08) + 's';
      ro.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Active nav link via section observer ---------- */
  var sections = ['about', 'skills', 'work', 'contact'].map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);
  var navAnchors = {};
  links.querySelectorAll('a[href^="#"]').forEach(function (a) {
    navAnchors[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          Object.values(navAnchors).forEach(function (a) { a.classList.remove('active'); });
          var active = navAnchors[e.target.id];
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { so.observe(s); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('.stat__num');
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = +el.dataset.count, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1100, 1);
          el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.dataset.count; });
  }

  /* ---------- Hero flight-path canvas ---------- */
  var canvas = document.getElementById('flightCanvas');
  if (!canvas || reduce) return;
  var ctx = canvas.getContext('2d');
  var w, h, dpr, stars = [], flights = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildScene();
  }

  function buildScene() {
    // starfield
    stars = [];
    var count = Math.round((w * h) / 14000);
    for (var i = 0; i < count; i++) {
      stars.push({ x: rand(0, w), y: rand(0, h), r: rand(0.3, 1.4), a: rand(0.15, 0.7), tw: rand(0.002, 0.01), p: rand(0, 6.28) });
    }
    // flight arcs
    flights = [];
    var n = Math.max(3, Math.round(w / 420));
    for (var j = 0; j < n; j++) flights.push(makeFlight(rand(0, 1)));
  }

  function makeFlight(progress) {
    var fromLeft = Math.random() > 0.5;
    var y0 = rand(h * 0.12, h * 0.85);
    var y1 = y0 + rand(-h * 0.25, h * 0.25);
    var x0 = fromLeft ? -rand(40, 160) : w + rand(40, 160);
    var x1 = fromLeft ? w + rand(40, 160) : -rand(40, 160);
    var lift = rand(60, 200) * (Math.random() > 0.5 ? 1 : -1);
    return {
      x0: x0, y0: y0, x1: x1, y1: y1,
      cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 - lift,
      t: progress, speed: rand(0.00018, 0.00045),
      hue: Math.random() > 0.5 ? 'rgba(255,138,61,' : 'rgba(79,209,255,'
    };
  }

  function bez(p, a, c, b) {
    var m = 1 - p;
    return m * m * a + 2 * m * p * c + p * p * b;
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);

    // stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = s.a + Math.sin(now * s.tw + s.p) * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(200,215,245,' + Math.max(0, tw) + ')';
      ctx.fill();
    }

    // flights
    for (var k = 0; k < flights.length; k++) {
      var f = flights[k];
      f.t += f.speed * 16;
      if (f.t >= 1) { flights[k] = makeFlight(0); continue; }

      // trailing path
      ctx.beginPath();
      var steps = 28, started = false;
      var tailStart = Math.max(0, f.t - 0.5);
      for (var st = 0; st <= steps; st++) {
        var p = tailStart + (f.t - tailStart) * (st / steps);
        var x = bez(p, f.x0, f.cx, f.x1);
        var y = bez(p, f.y0, f.cy, f.y1);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, f.hue + '0)');
      grad.addColorStop(1, f.hue + '0.55)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // plane head
      var hx = bez(f.t, f.x0, f.cx, f.x1);
      var hy = bez(f.t, f.y0, f.cy, f.y1);
      ctx.beginPath();
      ctx.arc(hx, hy, 2.6, 0, 6.2832);
      ctx.fillStyle = f.hue + '1)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, 6.2832);
      ctx.fillStyle = f.hue + '0.12)';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt); rt = setTimeout(resize, 150);
  });
  resize();
  requestAnimationFrame(draw);
})();
