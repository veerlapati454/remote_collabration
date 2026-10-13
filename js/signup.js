// STACKLY — signup.js
// Live-filtered name, company, email validation, team size, password rules + strength meter,
// confirm-match check, terms gate, show/hide toggles, success state, then redirect to login.
(function () {
  'use strict';
  var form = document.getElementById('signupForm');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var nameEl = $('fullName'), companyEl = $('company'), emailEl = $('email');
  var passEl = $('password'), confirmEl = $('confirmPassword'), agreeEl = $('agreeTerms');
  var sizesEl = $('sizes'), btn = $('signupBtn'), meter = $('meter'), meterText = $('meterText');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

  /* ---------- Hints: remember default copy so it can be restored ---------- */
  var hints = {};
  [].forEach.call(form.querySelectorAll('.hint'), function (h) {
    hints[h.getAttribute('data-for')] = { el: h, text: h.textContent };
  });
  var keyOf = function (el) { return el.id || el.name; };
  function wrapOf(el) { return el.closest('.field') || el.closest('.terms-wrap') || el.closest('.sizes'); }

  function setState(el, key, message) {
    var wrap = wrapOf(el), h = hints[key], ok = !message;
    wrap.classList.toggle('invalid', !ok);
    wrap.classList.toggle('valid', ok && el.type !== 'checkbox' && el.type !== 'radio' && el.value !== '');
    if (el.setAttribute) el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    h.el.textContent = ok ? h.text : message;
    return ok;
  }

  /* ---------- Rules ---------- */
  var rules = {
    fullName: function () {
      var v = nameEl.value.trim();
      if (!v) return 'Please enter your full name.';
      if (!/^[A-Za-z]+( [A-Za-z]+)*$/.test(v) || v.replace(/ /g, '').length < 2) return 'Use letters only (at least 2).';
      return '';
    },
    company: function () {
      var v = companyEl.value.trim();
      if (!v) return 'Please enter your company or team name.';
      if (v.length < 2) return 'Name must be at least 2 characters.';
      if (!/^[A-Za-z0-9][A-Za-z0-9 &.,'()-]*$/.test(v)) return 'Name contains invalid characters.';
      return '';
    },
    email: function () {
      var v = emailEl.value.trim();
      if (!v) return 'Please enter your email address.';
      if (!EMAIL.test(v)) return 'Please enter a valid email, e.g. you@company.com.';
      return '';
    },
    size: function () { return form.querySelector('input[name="size"]:checked') ? '' : 'Please select your team size.'; },
    password: function () {
      var p = passEl.value;
      if (!p) return 'Please create a password.';
      if (p.length < 8) return 'Password must be at least 8 characters.';
      if (!/[a-z]/.test(p) || !/[A-Z]/.test(p)) return 'Include both upper and lower case letters.';
      if (!/\d/.test(p)) return 'Include at least one number.';
      return '';
    },
    confirmPassword: function () {
      if (!confirmEl.value) return 'Please re-enter your password.';
      if (confirmEl.value !== passEl.value) return 'Passwords do not match.';
      return '';
    },
    agreeTerms: function () { return agreeEl.checked ? '' : 'You must accept the terms to create an account.'; }
  };
  var els = { fullName: nameEl, company: companyEl, email: emailEl, size: sizesEl, password: passEl, confirmPassword: confirmEl, agreeTerms: agreeEl };
  function check(key) { return setState(els[key], key, rules[key]()); }

  ['fullName', 'company', 'email', 'password', 'confirmPassword', 'agreeTerms'].forEach(function (key) {
    var el = els[key];
    el.addEventListener('blur', function () { check(key); });
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
      if (wrapOf(el).classList.contains('invalid')) check(key);
      if (key === 'password' && confirmEl.value) check('confirmPassword');
    });
  });
  [].forEach.call(form.querySelectorAll('input[name="size"]'), function (r) {
    r.addEventListener('change', function () { check('size'); });
  });

  /* ---------- Live input filtering ---------- */
  nameEl.addEventListener('input', function () {
    nameEl.value = nameEl.value.replace(/[^A-Za-z ]/g, '').replace(/^ +/, '').replace(/ {2,}/g, ' ');
  });
  nameEl.addEventListener('blur', function () {
    nameEl.value = nameEl.value.trim().toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    check('fullName');
  });
  emailEl.addEventListener('input', function () { emailEl.value = emailEl.value.replace(/\s/g, ''); });

  /* ---------- Password show / hide ---------- */
  [].forEach.call(form.querySelectorAll('.eye'), function (eye) {
    eye.addEventListener('click', function () {
      var input = $(eye.getAttribute('data-target')), show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.innerHTML = '<i class="fa-solid ' + (show ? 'fa-eye-slash' : 'fa-eye') + '"></i>';
      eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      input.focus();
    });
  });

  /* ---------- Strength meter + live checklist ---------- */
  var labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  var colors = ['', '#e5484d', '#b9770e', '#4a9d55', '#2fae66'];
  var ruleEls = {};
  [].forEach.call(document.querySelectorAll('#checks span'), function (s) { ruleEls[s.getAttribute('data-r')] = s; });
  passEl.addEventListener('input', function () {
    var p = passEl.value;
    var len = p.length >= 8, mixed = /[a-z]/.test(p) && /[A-Z]/.test(p), num = /\d/.test(p), sym = /[^A-Za-z0-9]/.test(p);
    ruleEls.len.classList.toggle('ok', len);
    ruleEls.case.classList.toggle('ok', mixed);
    ruleEls.num.classList.toggle('ok', num);
    var s = 0;
    if (p) {
      s = 1;
      if (len) s = 2;
      if (len && mixed && num) s = 3;
      if (len && mixed && num && sym && p.length >= 10) s = 4;
    }
    meter.setAttribute('data-s', s);
    meterText.textContent = labels[s];
    meterText.style.color = colors[s];
  });

  /* ---------- Submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(els).forEach(function (key) {
      if (!check(key) && !firstBad) firstBad = key;
    });
    if (firstBad) {
      var w = wrapOf(els[firstBad]);
      w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake');
      var focusEl = firstBad === 'size' ? form.querySelector('input[name="size"]') : els[firstBad];
      focusEl.focus({ preventScroll: true });
      w.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    btn.disabled = true;
    btn.classList.add('loading');

    /* Replace this timer with a real sign-up request to your backend. */
    setTimeout(function () {
      btn.classList.remove('loading');
      btn.classList.add('success');
      setTimeout(function () { window.location.href = './login.html'; }, 1000);
    }, 900);
  });

  /* ---------- Count-up stats ---------- */
  [].forEach.call(document.querySelectorAll('.lg-stats b'), function (el, i) {
    if (reduce) return;
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', start = null;
    el.textContent = '0' + suf;
    function step(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / 1500), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 900 + i * 150);
  });

  /* ---------- Parallax on the setup card (desktop only) ---------- */
  var panel = $('brandPanel'), setup = $('setup');
  var canHover = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (panel && setup && canHover && !reduce) {
    panel.addEventListener('mousemove', function (e) {
      var r = panel.getBoundingClientRect();
      setup.style.transform = 'translate(' + (((e.clientX - r.left) / r.width - 0.5) * -14) + 'px,' + (((e.clientY - r.top) / r.height - 0.5) * -12) + 'px)';
    });
    panel.addEventListener('mouseleave', function () { setup.style.transform = ''; });
  }
})();