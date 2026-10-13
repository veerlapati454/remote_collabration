// STACKLY — login.js
// Email validation, password rules + strength meter, show/hide toggle, caps-lock warning,
// loading/success states, role-based redirect, and animated workspace preview.
(function () {
  'use strict';
  var form = document.getElementById('loginForm');
  if (!form) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var btn = document.getElementById('loginBtn');
  var caps = document.getElementById('capsWarn');
  var seg = document.getElementById('seg');
  var strength = document.getElementById('strength');
  var EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

  /* Prefill remembered email */
  try {
    var saved = localStorage.getItem('rememberedEmail');
    if (saved) { emailInput.value = saved; document.getElementById('rememberMe').checked = true; }
  } catch (e) {}

  /* Role toggle: slide the thumb */
  [].forEach.call(form.querySelectorAll('input[name="role"]'), function (r) {
    r.addEventListener('change', function () { seg.setAttribute('data-role', r.value); });
  });

  /* Password show / hide */
  var eye = form.querySelector('.eye');
  eye.addEventListener('click', function () {
    var show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    eye.innerHTML = '<i class="fa-solid ' + (show ? 'fa-eye-slash' : 'fa-eye') + '"></i>';
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    passwordInput.focus();
  });

  /* Caps Lock warning */
  function checkCaps(e) { if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock'); }
  passwordInput.addEventListener('keyup', checkCaps);
  passwordInput.addEventListener('keydown', checkCaps);
  passwordInput.addEventListener('blur', function () { caps.hidden = true; });

  /* Password strength meter (visual only) */
  passwordInput.addEventListener('input', function () {
    var v = passwordInput.value, s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
    strength.setAttribute('data-s', v ? Math.max(1, s) : 0);
  });

  /* Validation with inline hints */
  var hints = {};
  [].forEach.call(form.querySelectorAll('.hint'), function (h) {
    hints[h.getAttribute('data-for')] = { el: h, text: h.textContent };
  });
  function setState(input, message) {
    var wrap = input.closest('.field'), h = hints[input.id], ok = !message;
    wrap.classList.toggle('invalid', !ok);
    wrap.classList.toggle('valid', ok && input.value !== '');
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    h.el.textContent = ok ? h.text : message;
    return ok;
  }
  function checkEmail() {
    var v = emailInput.value.trim();
    if (!v) return setState(emailInput, 'Please enter your email address.');
    if (!EMAIL.test(v)) return setState(emailInput, 'Please enter a valid email, e.g. you@company.com.');
    return setState(emailInput, '');
  }
  function checkPassword() {
    var v = passwordInput.value;
    if (!v) return setState(passwordInput, 'Please enter your password.');
    if (v.length < 6) return setState(passwordInput, 'Password must be at least 6 characters.');
    return setState(passwordInput, '');
  }
  emailInput.addEventListener('blur', checkEmail);
  passwordInput.addEventListener('blur', checkPassword);
  emailInput.addEventListener('input', function () { if (emailInput.closest('.field').classList.contains('invalid')) checkEmail(); });
  passwordInput.addEventListener('input', function () { if (passwordInput.closest('.field').classList.contains('invalid')) checkPassword(); });

  function shake(input) {
    var w = input.closest('.field');
    w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake');
  }

  /* Submit */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var okE = checkEmail(), okP = checkPassword();
    if (!okE || !okP) {
      var first = !okE ? emailInput : passwordInput;
      shake(first); first.focus();
      return;
    }
    var role = form.querySelector('input[name="role"]:checked').value;
    var email = emailInput.value.trim();

    btn.classList.add('loading');
    btn.disabled = true;

    try {
      localStorage.setItem('user', JSON.stringify({ email: email, role: role }));
      localStorage.setItem('isAuthenticated', 'true');
      if (document.getElementById('rememberMe').checked) localStorage.setItem('rememberedEmail', email);
      else localStorage.removeItem('rememberedEmail');
    } catch (err) {}

    /* Replace this timer with a real authentication request to your backend. */
    setTimeout(function () {
      btn.classList.remove('loading');
      btn.classList.add('done');
      btn.innerHTML = '<span class="lbl"><i class="fa-solid fa-circle-check"></i> Signing you in...</span>';
      setTimeout(function () {
        window.location.href = role === 'admin' ? './admin-dashboard.html' : './user-dashboard.html';
      }, 600);
    }, 900);
  });

  /* Count-up stats on the brand panel */
  [].forEach.call(document.querySelectorAll('.lg-stats b'), function (el, i) {
    if (reduce) return;
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', dec = parseInt(el.dataset.dec || '0', 10);
    var start = null, delay = 900 + i * 150, dur = 1600;
    el.textContent = (0).toFixed(dec) + suf;
    function step(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * eased).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, delay);
  });

  /* Live chat preview: typing indicator, then a message, on a loop */
  var msgs = document.getElementById('msgs');
  if (msgs) {
    var script = [
      { who: 'AR', cls: 'a1', t: 'Launch deck is ready for review' },
      { who: 'DS', cls: 'a2', t: 'Nice! Pinning feedback in the doc' },
      { me: true, t: 'Great, shipping to staging at 3pm' },
      { who: 'PN', cls: 'a3', t: 'QA signed off on all 12 tasks' },
      { me: true, t: 'Perfect. Thanks, team!' }
    ];
    var idx = 0;
    function add(m) {
      var d = document.createElement('div');
      d.className = 'msg' + (m.me ? ' me' : '');
      d.innerHTML = (m.me ? '' : '<span class="av ' + m.cls + '">' + m.who + '</span>') + '<div class="b"></div>';
      d.querySelector('.b').textContent = m.t;
      msgs.appendChild(d);
      while (msgs.children.length > 4) msgs.removeChild(msgs.firstChild);
    }
    function next() {
      var m = script[idx % script.length]; idx++;
      var typing = document.createElement('div');
      typing.className = 'typing'; typing.innerHTML = '<i></i><i></i><i></i>';
      msgs.appendChild(typing);
      while (msgs.children.length > 4) msgs.removeChild(msgs.firstChild);
      setTimeout(function () {
        if (typing.parentNode) msgs.removeChild(typing);
        add(m);
        setTimeout(next, 1800);
      }, 1100);
    }
    if (reduce) { script.slice(0, 3).forEach(add); }
    else { add(script[0]); idx = 1; setTimeout(next, 1800); }
  }

  /* Subtle parallax on the workspace preview (desktop only) */
  var panel = document.getElementById('brandPanel');
  var mock = document.getElementById('mock');
  var canHover = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (panel && mock && canHover && !reduce) {
    panel.addEventListener('mousemove', function (e) {
      var r = panel.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      mock.style.transform = 'translate(' + (x * -18) + 'px,' + (y * -14) + 'px)';
    });
    panel.addEventListener('mouseleave', function () { mock.style.transform = ''; });
  }
})();