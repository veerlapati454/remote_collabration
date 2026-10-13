// CONTACT PAGE SCRIPT (header, mobile menu, smooth scroll, form validation and animations)
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
document.querySelectorAll('.ccard').forEach((card) => {
  card.addEventListener('click', (e) => {
    if (window.matchMedia('(hover: none)').matches && !e.target.closest('a')) card.classList.toggle('flipped');
  });
});

// ---------- FAQ: one open at a time ----------
const faqItems = Array.from(document.querySelectorAll('.faq details'));
faqItems.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) faqItems.forEach((o) => { if (o !== d) o.open = false; });
}));

// ---------- CONTACT FORM VALIDATION ----------
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  const f = {
    name: $('name'), email: $('email'), phone: $('phone'), company: $('company'),
    subject: $('subject'), message: $('message-box'), consent: $('consent')
  };
  const rules = {
    name(v) {
      v = v.trim();
      if (!v) return 'Please enter your full name.';
      if (v.length < 2) return 'Name must be at least 2 characters.';
      if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(v)) return 'Name can only contain letters, spaces, . \' and -.';
      return '';
    },
    email(v) {
      v = v.trim();
      if (!v) return 'Please enter your email address.';
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(v)) return 'Enter a valid email, e.g. you@company.com.';
      return '';
    },
    phone(v) {
      v = v.trim();
      if (!v) return 'Please enter your phone number.';
      if (!/^\d+$/.test(v)) return 'Phone number can only contain digits.';
      if (v.length !== 10) return 'Phone number must be exactly 10 digits.';
      if (!/^[6-9]/.test(v)) return 'Enter a valid Indian mobile number (starts with 6, 7, 8 or 9).';
      if (/^(\d)\1{9}$/.test(v)) return 'Please enter a real phone number.';
      return '';
    },
    company(v) {
      v = v.trim();
      if (v && v.length < 2) return 'Company name must be at least 2 characters.';
      if (v && !/^[A-Za-z0-9][A-Za-z0-9\s&.,'()-]*$/.test(v)) return 'Company name contains invalid characters.';
      return '';
    },
    subject(v) { return v ? '' : 'Please choose a topic.'; },
    message(v) {
      v = v.trim();
      if (!v) return 'Please write your message.';
      if (v.length < 20) return 'Message must be at least 20 characters (' + v.length + '/20).';
      if (v.length > 500) return 'Message cannot exceed 500 characters.';
      return '';
    },
    consent() { return f.consent.checked ? '' : 'Please accept to continue.'; }
  };

  function setState(key, msg) {
    const wrap = f[key].closest('.field');
    const err = $('e-' + key);
    const filled = key === 'consent' ? f[key].checked : f[key].value.trim() !== '';
    err.textContent = msg;
    wrap.classList.toggle('invalid', !!msg);
    wrap.classList.toggle('valid', !msg && filled && key !== 'consent');
    f[key].setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) f[key].setAttribute('aria-describedby', 'e-' + key);
  }
  function check(key) { const m = rules[key](key === 'consent' ? '' : f[key].value); setState(key, m); return !m; }

  // Phone: digits only while typing / pasting
  f.phone.addEventListener('input', () => { f.phone.value = f.phone.value.replace(/\D/g, '').slice(0, 10); });
  // Name: block digits and symbols while typing
  f.name.addEventListener('input', () => { f.name.value = f.name.value.replace(/[^A-Za-z\s.'-]/g, ''); });

  // Message counter
  const cnt = $('cnt');
  f.message.addEventListener('input', () => { cnt.textContent = f.message.value.length; });

  // Live validation: on blur, then on every input once touched
  Object.keys(f).forEach((key) => {
    const ev = key === 'consent' || key === 'subject' ? 'change' : 'input';
    f[key].addEventListener('blur', () => { f[key].dataset.touched = '1'; check(key); });
    f[key].addEventListener(ev, () => { if (f[key].dataset.touched || f[key].closest('.field').classList.contains('invalid')) check(key); });
  });

  // Submit
  const btn = $('sendBtn');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.website && form.website.value) return; // honeypot (bots)
    let firstBad = null;
    Object.keys(f).forEach((key) => { f[key].dataset.touched = '1'; if (!check(key) && !firstBad) firstBad = f[key]; });
    if (firstBad) {
      firstBad.focus({ preventScroll: true });
      firstBad.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      if (window.gsap && !reducedMotion) gsap.fromTo(firstBad.closest('.field'), { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' });
      return;
    }
    btn.disabled = true; btn.textContent = 'Sending...';
    // Replace this timeout with a real fetch() to your backend / form service.
    setTimeout(() => {
      $('okName').textContent = f.name.value.trim().split(/\s+/)[0];
      $('formFields').style.display = 'none';
      $('formOk').style.display = 'block';
      if (window.gsap && !reducedMotion) {
        gsap.from('#formOk > *', { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
        gsap.from('#formOk .tick', { scale: 0, rotate: -90, duration: 0.7, ease: 'back.out(2.5)' });
      }
      btn.disabled = false; btn.textContent = 'Send message';
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 900);
  });

  // Send another
  $('againBtn').addEventListener('click', () => {
    form.reset(); cnt.textContent = '0';
    Object.keys(f).forEach((key) => {
      delete f[key].dataset.touched;
      const w = f[key].closest('.field'); w.classList.remove('invalid', 'valid');
      $('e-' + key).textContent = '';
    });
    $('formOk').style.display = 'none';
    $('formFields').style.display = 'block';
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();


// ---------- MAP: keep page scroll smooth over the iframe ----------
(function () {
  const shield = document.getElementById('mapShield');
  if (!shield) return;
  const frame = shield.parentElement;
  const unlock = () => shield.classList.add('off');
  const lock = () => shield.classList.remove('off');
  shield.addEventListener('click', unlock);
  shield.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unlock(); } });
  frame.addEventListener('mouseleave', lock);
  document.addEventListener('touchstart', (e) => { if (!frame.contains(e.target)) lock(); }, { passive: true });
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

    // Contact flip cards: staggered rise
    gsap.from('.ccard', { y: 60, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.cc-grid', start: 'top 85%' } });

    // Form fields cascade in
    gsap.from('#formFields .field, #formFields .row2, #formFields .btn', { y: 24, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '#contactForm', start: 'top 80%', once: true } });

    // Side image: wipe reveal + parallax
    const fs = document.querySelector('.form-side');
    if (fs) {
      gsap.fromTo(fs, { clipPath: 'inset(0 0 100% 0 round 24px)' }, { clipPath: 'inset(0 0 0% 0 round 24px)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: fs, start: 'top 88%', once: true } });
      gsap.fromTo(fs.querySelector('img'), { scale: 1.2 }, { scale: 1, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: fs, start: 'top 88%', once: true } });
    }

    // Map + visit card
    gsap.fromTo('.map-frame', { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.map-grid', start: 'top 85%', once: true } });
    gsap.from('.visit .vi', { x: 30, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.visit', start: 'top 85%', once: true } });

    // Team: rise + avatar pop
    gsap.from('.member', { y: 70, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.team', start: 'top 85%' } });
    gsap.from('.member img', { scale: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.team', start: 'top 85%' } });

    // Process: line draws while scrolling, steps rise, dots pop
    const steps = document.querySelector('.steps');
    if (steps) {
      gsap.to('#stepsFill', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true } });
      gsap.from('.step', { y: 40, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out', scrollTrigger: { trigger: steps, start: 'top 85%' } });
      gsap.from('.step .dot', { scale: 0, duration: 0.6, stagger: 0.2, ease: 'back.out(2.5)', scrollTrigger: { trigger: steps, start: 'top 85%' } });
    }

    // Footer columns rise
    gsap.from('.footer-top > div', { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: 'footer', start: 'top 85%' } });
  }
}

// Recalculate trigger positions once everything has loaded
window.addEventListener('load', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });