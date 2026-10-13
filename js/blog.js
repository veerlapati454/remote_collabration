// BLOG PAGE SCRIPT (header, mobile menu, smooth scroll, filter, newsletter and animations)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- IMAGE FALLBACK ----------
document.querySelectorAll('img[src^="http"]').forEach((img) => {
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
});

// ---------- SPLIT HEADINGS INTO WORDS ----------
document.querySelectorAll('.split').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w) => '<span class="w" aria-hidden="true"><span>' + w + '</span></span>').join(' ');
});

// ---------- HEADER ----------
const header = document.getElementById('site-header');
function onScrollHeader() { header.classList.toggle('solid', window.scrollY > 40); }
window.addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

// ---------- SCROLL PROGRESS BAR ----------
const progressBar = document.getElementById('scrollBar');
function updateProgress() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

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

// ---------- TAP TO FLIP ON TOUCH DEVICES ----------
document.querySelectorAll('.tcard').forEach((card) => {
  card.addEventListener('click', (e) => {
    if (window.matchMedia('(hover: none)').matches && !e.target.closest('a')) card.classList.toggle('flipped');
  });
});

// ---------- ARTICLE FILTER ----------
(function () {
  const btns = Array.from(document.querySelectorAll('.fbtn'));
  const posts = Array.from(document.querySelectorAll('.post'));
  if (!btns.length) return;
  btns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    btns.forEach((x) => x.classList.toggle('active', x === b));
    posts.forEach((p) => {
      const show = f === 'all' || p.dataset.cat === f;
      if (show) {
        p.classList.remove('hide');
        if (window.gsap && !reducedMotion) gsap.fromTo(p, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' });
      } else p.classList.add('hide');
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }));
})();

// ---------- NEWSLETTER FORM ----------
(function () {
  const form = document.getElementById('nlForm');
  if (!form) return;
  const email = document.getElementById('nlEmail');
  const ok = document.getElementById('nlOk');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    email.style.outline = valid ? 'none' : '2px solid #ff8a80';
    if (!valid) return;
    ok.style.display = 'block';
    form.reset();
    if (window.gsap && !reducedMotion) gsap.from(ok, { y: 14, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
  });
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
if (window.Lenis && window.gsap && !reducedMotion) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0 }); }
  }));
  const lock = () => { document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start(); };
  new MutationObserver(lock).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  lock();
}

// ---------- GSAP ----------
if (window.gsap) {
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (!reducedMotion) {
    const hero = document.querySelector('.page-hero');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Hero orbs drift + scroll parallax
    gsap.utils.toArray('.page-hero .orb').forEach((o, i) => {
      gsap.to(o, { x: (i % 2 ? -1 : 1) * 60, y: (i % 2 ? 1 : -1) * 50, duration: 6 + i * 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
    gsap.to('.page-hero .hero-bg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

    // Floating chips
    gsap.utils.toArray('.page-hero .float-chip').forEach((c, i) => {
      gsap.to(c, { y: i % 2 ? 14 : -14, duration: 2.4 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    // Hero entrance
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.crumbs', { y: 20, opacity: 0, duration: 0.6 })
      .from('.ph-title .w > span', { yPercent: 110, duration: 0.9, stagger: 0.08 }, '-=0.3')
      .from('.ph-lead, .page-hero .btn-row', { y: 26, opacity: 0, duration: 0.7, stagger: 0.12 }, '-=0.5')
      .fromTo('.page-hero .hero-card', { clipPath: 'inset(0 0 100% 0 round 24px)', y: 40 }, { clipPath: 'inset(0 0 0% 0 round 24px)', y: 0, duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath' }, '-=1')
      .from('.page-hero .hero-card img', { scale: 1.12, duration: 1.6, ease: 'power2.out' }, '<')
      .from('.page-hero .float-chip', { scale: 0, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(2)' }, '-=0.5')
      .from('.est-badge', { scale: 0, rotate: -90, duration: 0.8, ease: 'back.out(2)' }, '-=0.5');

    // Hero mouse parallax (desktop only)
    if (canHover && hero) {
      const vx = gsap.quickTo('.ph-visual', 'x', { duration: 0.8, ease: 'power3.out' });
      const vy = gsap.quickTo('.ph-visual', 'y', { duration: 0.8, ease: 'power3.out' });
      const chips = gsap.utils.toArray('.page-hero .float-chip').map((c) => gsap.quickTo(c, 'x', { duration: 1, ease: 'power3.out' }));
      hero.addEventListener('mousemove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        vx(nx * 20); vy(ny * 16);
        chips.forEach((fn, i) => fn(-nx * (26 + i * 8)));
      });
    }

    // Split heading reveal on scroll
    gsap.utils.toArray('.split').forEach((el) => {
      if (el.closest('.page-hero')) return;
      gsap.from(el.querySelectorAll('.w > span'), { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } });
    });

    // Fade + slide reveal
    gsap.utils.toArray('.js-reveal').forEach((el) => {
      gsap.from(el, { y: 34, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
    });

    // Featured image: wipe reveal + parallax
    const fi = document.querySelector('.feat-img');
    if (fi) {
      gsap.fromTo(fi, { clipPath: 'inset(0 0 100% 0 round 24px)' }, { clipPath: 'inset(0 0 0% 0 round 24px)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: fi, start: 'top 88%', once: true } });
      gsap.fromTo(fi.querySelector('img'), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: fi, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    // Topic flip cards: staggered rise
    gsap.from('.tcard', { y: 60, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.tp-grid', start: 'top 85%' } });

    // Article cards: staggered rise + image parallax
    gsap.utils.toArray('.post').forEach((p, i) => {
      gsap.from(p, { y: 60, opacity: 0, duration: 0.8, delay: (i % 3) * 0.1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: p, start: 'top 92%', once: true } });
    });

    // Stats count-up
    gsap.utils.toArray('.stats-row .stat').forEach((s, i) => {
      gsap.from(s, { y: 40, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 90%' } });
      const el = s.querySelector('.num');
      const end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', dec = parseInt(el.dataset.dec || '0', 10);
      const c = { val: 0 };
      gsap.to(c, { val: end, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: s, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = c.val.toFixed(dec) + suffix; } });
    });

    // Authors: rise + avatar pop
    gsap.from('.author', { y: 70, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.authors', start: 'top 85%' } });
    gsap.from('.author img', { scale: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.authors', start: 'top 85%' } });

    // Footer columns rise
    gsap.from('.footer-top > div', { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: 'footer', start: 'top 85%' } });
  }
}

// Recalculate trigger positions once everything has loaded
window.addEventListener('load', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });