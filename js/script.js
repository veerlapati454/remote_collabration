// Scroll-to-top-on-refresh is handled by the inline script in <head> of index.html.

// ---------- IMAGE FALLBACK (if an online image fails, keep a clean tinted block) ----------
document.querySelectorAll('img[src^="http"]').forEach((img) => {
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
});

// ---------- SPLIT HEADINGS INTO WORDS ----------
document.querySelectorAll('.split').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w) => '<span class="w" aria-hidden="true"><span>' + w + '</span></span>').join(' ');
});

// ---------- PRELOADER (replace the whole old PRELOADER block in script.js) ----------
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) { document.documentElement.classList.remove('is-loading'); return; }
  const fill = document.getElementById('preloaderFill');
  const percent = document.getElementById('preloaderPercent');
  const status = document.getElementById('plStatus');
  const checks = Array.from(preloader.querySelectorAll('.pl-checks li'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let loaded = document.readyState === 'complete';
  window.addEventListener('load', () => { loaded = true; });
  const MAX_WAIT = 4500, t0 = Date.now();
  const ready = () => loaded || Date.now() - t0 > MAX_WAIT;

  const MESSAGES = [[0, 'Creating your workspace'], [30, 'Inviting your teammates'], [62, 'Syncing your tools'], [90, 'Ready to collaborate']];
  const CHECK_AT = [28, 60, 88];
  let msgIdx = -1;

  function setStatus(text) {
    if (!status) return;
    if (!window.gsap || reduced) { status.textContent = text; return; }
    gsap.to(status, { opacity: 0, y: -6, duration: 0.15, onComplete: () => {
      status.textContent = text;
      gsap.fromTo(status, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25 });
    } });
  }
  function updateBar(v) {
    const r = Math.round(v);
    if (fill) fill.style.width = r + '%';
    if (percent) percent.textContent = r + '%';
    let idx = 0;
    MESSAGES.forEach((m, i) => { if (r >= m[0]) idx = i; });
    if (idx !== msgIdx) { msgIdx = idx; setStatus(MESSAGES[idx][1]); }
    checks.forEach((li, i) => li.classList.toggle('done', r >= CHECK_AT[i]));
  }
  function reveal() {
    document.documentElement.classList.remove('is-loading');
    preloader.style.display = 'none';
    window.playHeroEntrance && window.playHeroEntrance();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  if (!window.gsap || reduced) {
    updateBar(100);
    const done = () => { preloader.style.transition = 'opacity .4s'; preloader.style.opacity = '0'; setTimeout(reveal, 400); };
    if (ready()) done(); else { window.addEventListener('load', done); setTimeout(done, MAX_WAIT); }
    return;
  }

  // ----- scene intro: core, connection lines draw out, teammates join, badges pop -----
  const lines = preloader.querySelectorAll('.pl-line');
  const nodes = preloader.querySelectorAll('.pl-node');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.pl-core', { scale: 0.4, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' })
    .from('.pl-ring', { opacity: 0, scale: 0.8, duration: 0.7 }, 0.1)
    .from(lines, { strokeDashoffset: 1, duration: 0.8, stagger: 0.12, ease: 'power2.out' }, 0.3)
    .from(nodes, { scale: 0, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2)' }, 0.5)
    .from('.pl-badge', { scale: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(3)' }, '-=0.3')
    .from('.pl-status, .pl-checks, .preloader-progress, .preloader-percent', { y: 14, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.6);

  // gentle floating of teammates
  nodes.forEach((n, i) => gsap.to(n, { y: i % 2 ? 6 : -6, duration: 1.8 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 }));
  gsap.to('.pl-core', { scale: 1.04, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.9 });

  // "messages" travelling from each teammate to the core
  const g = document.getElementById('plPackets');
  if (g) lines.forEach((ln, i) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', '3.2'); c.setAttribute('class', 'pl-packet'); g.appendChild(c);
    const x2 = +ln.getAttribute('x2'), y2 = +ln.getAttribute('y2'), x1 = +ln.getAttribute('x1'), y1 = +ln.getAttribute('y1');
    const p = { t: 0 };
    gsap.set(c, { opacity: 0 });
    gsap.to(p, { t: 1, duration: 1.5 + i * 0.25, ease: 'power1.inOut', repeat: -1, delay: 1.1 + i * 0.35,
      onUpdate: () => {
        c.setAttribute('cx', x2 + (x1 - x2) * p.t); c.setAttribute('cy', y2 + (y1 - y2) * p.t);
        c.style.opacity = Math.sin(Math.PI * p.t);
      } });
  });

  const progress = { val: 0 };
  function exitPreloader() {
    const clip = { r: 150 };
    gsap.timeline({ onComplete: reveal })
      .to('.preloader-content', { opacity: 0, scale: 0.94, y: -16, duration: 0.4, ease: 'power2.in' }, 0)
      .to(clip, {
        r: 0, duration: 0.85, ease: 'power3.inOut',
        onUpdate: () => {
          const v = 'circle(' + clip.r + '% at 50% 50%)';
          preloader.style.clipPath = v; preloader.style.webkitClipPath = v;
        }
      }, 0.15);
  }
  function finish() {
    gsap.to(progress, { val: 100, duration: 0.4, ease: 'power1.out', onUpdate: () => updateBar(progress.val), onComplete: () => setTimeout(exitPreloader, 250) });
  }
  updateBar(0);
  gsap.to(progress, {
    val: 90, duration: 2.2, ease: 'power2.out', delay: 0.4,
    onUpdate: () => updateBar(progress.val),
    onComplete: () => {
      if (ready()) { finish(); return; }
      const c = setInterval(() => { if (ready()) { clearInterval(c); finish(); } }, 100);
    }
  });
})();

// ---------- HEADER (always sticky; gains a solid background after scrolling) ----------
const header = document.getElementById('site-header');
function onScrollHeader() { header.classList.toggle('solid', window.scrollY > 40); }
window.addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

// ---------- SCROLL PROGRESS BAR ----------
const bar = document.getElementById('scrollBar');
function updateBar() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
}
window.addEventListener('scroll', updateBar, { passive: true });
updateBar();

// ---------- MOBILE NAV ----------
const navToggle = document.getElementById('navToggle');
const navClose = document.getElementById('navClose');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});
navClose.addEventListener('click', () => { navLinks.classList.remove('open'); document.body.style.overflow = ''; });
navLinks.querySelectorAll('a').forEach((l) => l.addEventListener('click', () => { navLinks.classList.remove('open'); document.body.style.overflow = ''; }));

// ---------- FEATURE CARDS: tap to flip on touch devices ----------
document.querySelectorAll('.fcard').forEach((card) => {
  card.addEventListener('click', () => {
    if (window.matchMedia('(hover: none)').matches) card.classList.toggle('flipped');
  });
});

// ---------- TESTIMONIAL SLIDER ----------
(function () {
  const slides = Array.from(document.querySelectorAll('.qs'));
  const dots = Array.from(document.querySelectorAll('.q-dots button'));
  if (!slides.length) return;
  let i = 0, timer;
  function show(n) {
    const prev = slides[i];
    i = (n + slides.length) % slides.length;
    const next = slides[i];
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    if (prev === next) return;
    if (window.gsap) {
      gsap.to(prev, { opacity: 0, y: -16, duration: 0.35, onComplete: () => { prev.classList.remove('active'); gsap.set(prev, { clearProps: 'all' }); } });
      next.classList.add('active');
      gsap.fromTo(next, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.3, clearProps: 'transform' });
    } else { prev.classList.remove('active'); next.classList.add('active'); }
  }
  function auto() { clearInterval(timer); timer = setInterval(() => show(i + 1), 5500); }
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); auto(); }));
  auto();
})();

// ---------- MAGNETIC BUTTONS ----------
if (window.gsap && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}

// ---------- SMOOTH SCROLL (Lenis + ScrollTrigger) ----------
let lenis = null;
if (window.Lenis && window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0 }); }
  }));
  // pause smooth scroll while the preloader or mobile menu locks the page
  const lock = () => { (document.documentElement.classList.contains('is-loading') || document.body.style.overflow === 'hidden') ? lenis.stop() : lenis.start(); };
  new MutationObserver(lock).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(lock).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  lock();
}

// ---------- GSAP ----------
if (window.gsap) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (!reduced) {
    const hero = document.querySelector('.hero');

    // Hero orbs: slow drifting + scroll parallax + mouse movement
    gsap.utils.toArray('.hero-bg .orb').forEach((o, i) => {
      gsap.to(o, { x: (i % 2 ? -1 : 1) * 60, y: (i % 2 ? 1 : -1) * 50, duration: 6 + i * 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
    gsap.to('.hero-bg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

    // Floating chips
    gsap.utils.toArray('.float-chip').forEach((c, i) => {
      gsap.to(c, { y: i % 2 ? 14 : -14, duration: 2.4 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    // Hero entrance (runs after the preloader)
    window.playHeroEntrance = function () {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero .pill', { y: 20, opacity: 0, duration: 0.6 })
        .from('.hero-heading .w > span', { yPercent: 110, duration: 0.9, stagger: 0.08 }, '-=0.3')
        .from('.hero .lead, .hero .btn-row, .hero .hero-proof', { y: 26, opacity: 0, duration: 0.7, stagger: 0.12 }, '-=0.5')
        .fromTo('.hero-card', { clipPath: 'inset(0 0 100% 0 round 24px)', y: 40 }, { clipPath: 'inset(0 0 0% 0 round 24px)', y: 0, duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath' }, '-=0.6')
        .from('.hero-card img', { scale: 1.12, duration: 1.6, ease: 'power2.out' }, '<')
        .from('.float-chip', { scale: 0, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(2)' }, '-=0.4');
    };
    if (!document.getElementById('preloader')) window.playHeroEntrance();

    // Split heading word reveal on scroll (hero heading handled by entrance)
    gsap.utils.toArray('.split').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.from(el.querySelectorAll('.w > span'), { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } });
    });

    // Fade + slide reveal
    gsap.utils.toArray('.js-reveal').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.from(el, { y: 34, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
    });

    // Images: clean wipe reveal from the top, with a gentle settle (no 3D, no parallax)
    gsap.utils.toArray('.side-image').forEach((frame) => {
      const img = frame.querySelector('img');
      const r = frame.classList.contains('portrait') ? 20 : 20;
      gsap.fromTo(frame, { clipPath: 'inset(0 0 100% 0 round ' + r + 'px)' }, { clipPath: 'inset(0 0 0% 0 round ' + r + 'px)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath',
        scrollTrigger: { trigger: frame, start: 'top 88%', once: true } });
      if (img) gsap.from(img, { scale: 1.15, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: frame, start: 'top 88%', once: true } });
    });

    // Feature cards: soft staggered rise (the hover flip stays)
    gsap.utils.toArray('.fcard').forEach((el) => {
      const idx = Array.from(el.parentNode.children).indexOf(el) % 4;
      gsap.from(el, { y: 50, opacity: 0, duration: 0.8, delay: idx * 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    // Use-case cards + pricing cards stagger
    gsap.from('.uc', { y: 60, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out', clearProps: 'transform',
      scrollTrigger: { trigger: '.uc-grid', start: 'top 85%' } });
    gsap.from('.price', { y: 70, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.price-grid', start: 'top 85%' } });

    // Steps: line draws while scrolling, dots pop in
    const steps = document.querySelector('.steps');
    if (steps) {
      gsap.to('#stepsFill', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true } });
      gsap.from('.step', { y: 40, opacity: 0, duration: 0.8, stagger: 0.25, ease: 'power3.out', scrollTrigger: { trigger: steps, start: 'top 85%' } });
      gsap.from('.step .dot', { scale: 0, duration: 0.6, stagger: 0.25, ease: 'back.out(2.5)', scrollTrigger: { trigger: steps, start: 'top 85%' } });
    }

    // Stats count-up
    gsap.utils.toArray('.stats-row .stat').forEach((s, i) => {
      gsap.from(s, { y: 40, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 90%' } });
      const el = s.querySelector('.num');
      const end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', dec = parseInt(el.dataset.dec || '0', 10);
      const c = { val: 0 };
      gsap.to(c, { val: end, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: s, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = c.val.toFixed(dec) + suffix; } });
    });

    // Mini-stats pop
    gsap.from('.mini-stat', { scale: 0.85, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.mini-stats', start: 'top 88%' } });

    // Footer columns rise
    gsap.from('.footer-top > div', { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: 'footer', start: 'top 85%' } });
  }
}

// Recalculate trigger positions once every image/font has loaded (fixes offsets on mobile)
window.addEventListener('load', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });