/* Mise 1918 — logika her, XP, odznaků a kvízu */
(function () {
  'use strict';
  var D = window.DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- uložený postup ---------- */
  var KEY = 'mise1918-v1';
  var state = { xp: 0, badges: {}, done: {}, quizBest: {} };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) state = Object.assign(state, saved); } catch (e) {}
  delete state.sound;
  if (typeof state.quizBest !== 'object') state.quizBest = {}; // starší uložení mělo jedno číslo pro oba režimy
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- konfety ---------- */
  var cv = $('#confetti'), cx = cv.getContext('2d'), parts = [], raf = null;
  function sizeCanvas() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }
  sizeCanvas(); addEventListener('resize', sizeCanvas);
  function confetti(n) {
    if (reduced) return;
    var cols = ['#E63B2E', '#2251D1', '#FFFFFF', '#FFD23F', '#22B07D', '#FFB3C7'];
    for (var i = 0; i < (n || 140); i++) {
      parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .55, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 6,
        s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length], life: 0 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    var dpr = devicePixelRatio;
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(function (p) { return p.life < 220 && p.y < innerHeight + 40; });
    parts.forEach(function (p) {
      p.life++; p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      cx.save(); cx.translate(p.x * dpr, p.y * dpr); cx.rotate(p.r);
      cx.fillStyle = p.c; cx.strokeStyle = '#16120E'; cx.lineWidth = 1.5 * dpr;
      cx.fillRect(-p.s * dpr / 2, -p.s * dpr / 4, p.s * dpr, p.s * dpr / 2);
      cx.strokeRect(-p.s * dpr / 2, -p.s * dpr / 4, p.s * dpr, p.s * dpr / 2);
      cx.restore();
    });
    raf = parts.length ? requestAnimationFrame(tick) : null;
    if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
  }

  /* ---------- toasty, XP, odznaky ---------- */
  var toasts = $('#toasts');
  function toast(html, cls, ms) {
    var t = document.createElement('div');
    t.className = 'toast ' + (cls || '');
    t.innerHTML = html;
    toasts.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, ms || 2600);
  }
  var RANKS = [
    { xp: 0, n: 'Rekrut' }, { xp: 100, n: 'Vojín' }, { xp: 250, n: 'Legionář' },
    { xp: 450, n: 'Důstojník' }, { xp: 700, n: 'Diplomat' }, { xp: 1000, n: 'Generál' }
  ];
  function rankOf(xp) { var r = RANKS[0]; RANKS.forEach(function (k) { if (xp >= k.xp) r = k; }); return r; }

  function addXP(n) {
    if (!n) return;
    var before = rankOf(state.xp).n;
    state.xp += n; save(); paintHud();
    var pill = $('#passBtn'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    toast('<span>+' + n + ' XP ⭐</span>', 'toast--xp', 1200);
    var after = rankOf(state.xp).n;
    if (after !== before) setTimeout(function () { toast('<span class="toast__ico">🎖️</span><span>Povýšení!<small>Teď jsi: ' + after + '</small></span>'); }, 600);
  }
  // XP za konkrétní úkol se připíše jen poprvé (opakování ani reset hry je nepřidá)
  function earn(key, n) {
    if (state.done[key]) return;
    state.done[key] = 1;
    addXP(n);
  }
  function award(id) {
    if (state.badges[id]) return;
    var b = D.badges.filter(function (x) { return x.id === id; })[0];
    state.badges[id] = Date.now(); save(); paintHud();
    toast('<span class="toast__ico">' + b.icon + '</span><span>Nový odznak: ' + b.name + '<small>' + b.desc + '</small></span>', '', 3600);
    confetti(160);
  }
  function paintHud() {
    $('#xpNum').textContent = state.xp;
    var got = Object.keys(state.badges).length;
    $('#badgeNum').textContent = got;
    $('#badgeTotal').textContent = D.badges.length;
    $$('#missionGrid a').forEach(function (a) { a.classList.toggle('is-done', !!state.badges[a.dataset.badge]); });
    // pas
    var r = rankOf(state.xp), idx = RANKS.indexOf(r), next = RANKS[idx + 1];
    $('#passXp').textContent = state.xp;
    $('#passRank').textContent = r.n;
    $('#rankFill').style.width = next ? ((state.xp - r.xp) / (next.xp - r.xp) * 100) + '%' : '100%';
    $('#rankNext').textContent = next ? 'Do hodnosti ' + next.n + ' zbývá ' + (next.xp - state.xp) + ' XP.' : 'Nejvyšší hodnost! Klobouk dolů, generále.';
    $('#badgeList').innerHTML = D.badges.map(function (b) {
      return '<li class="' + (state.badges[b.id] ? 'got' : '') + '"><span class="b-ico">' + b.icon + '</span><b>' + b.name + '</b><small>' + b.desc + '</small></li>';
    }).join('');
  }

  /* pas legionáře */
  var pass = $('#pass'), lastFocus = null;
  function openPass() { lastFocus = document.activeElement; paintHud(); pass.hidden = false; $('.drawer__x', pass).focus(); }
  function closePass() { pass.hidden = true; if (lastFocus) lastFocus.focus(); }
  $('#passBtn').addEventListener('click', openPass);
  $$('[data-open-pass]').forEach(function (b) { b.addEventListener('click', openPass); });
  $$('[data-close]', pass).forEach(function (b) { b.addEventListener('click', closePass); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!pass.hidden) closePass(); if (!$('#diploma').hidden) $('#diploma').hidden = true; } });
  $('#resetAll').addEventListener('click', function () {
    state.xp = 0; state.badges = {}; state.done = {}; state.quizBest = {}; save(); paintHud();
    toast('<span class="toast__ico">🧹</span><span>Postup vymazán.</span>');
  });

  /* ---------- scroll: progress, navigace, reveal ---------- */
  var bar = $('#scrollBar'), navLinks = $$('.nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    var cur = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    timelineFill();
  }
  addEventListener('scroll', onScroll, { passive: true });

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observe(el) { if (io && !reduced) io.observe(el); else el.classList.add('is-in'); }

  /* obrázky: když se nenačtou, ukáže se iniciála */
  function imgFallback(img) {
    img.addEventListener('error', function () {
      var s = document.createElement('span');
      s.style.cssText = 'display:grid;place-items:center;width:100%;height:100%;min-height:80px;font-size:2.4rem;font-weight:800;background:#FFEFD2;color:#16120E';
      s.textContent = (img.alt || '?').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('');
      img.replaceWith(s);
    }, { once: true });
  }

  /* ---------- věk státu ---------- */
  (function () {
    var start = new Date(1918, 9, 28), now = new Date();
    var years = now.getFullYear() - 1918;
    var anniv = new Date(now.getFullYear(), 9, 28);
    if (now < anniv) { years--; anniv = new Date(now.getFullYear() - 1, 9, 28); }
    var days = Math.floor((now - anniv) / 864e5);
    $('#ageYears').textContent = years;
    $('#ageDays').textContent = days;
    $('#yearNow').textContent = now.getFullYear();
    void start;
  })();

  /* ---------- 01 zahřívačka ---------- */
  (function () {
    var list, i, score, locked;
    var card = $('#wCard'), end = $('#wEnd'), btns = $$('#wBtns .tf');
    function start() { list = shuffle(D.warmup); i = 0; score = 0; end.hidden = true; card.hidden = false; $('#wBtns').hidden = false; show(); }
    function show() {
      locked = false;
      var it = list[i];
      $('#wNum').textContent = (i + 1) + ' / ' + list.length;
      $('#wScore').textContent = score;
      $('#wText').textContent = it.s;
      $('#wFb').hidden = true;
      $('#wStamp').className = 'wcard__stamp';
      btns.forEach(function (b) { b.disabled = false; });
      card.classList.remove('fly-left', 'fly-right', 'pop-in'); void card.offsetWidth; card.classList.add('pop-in');
    }
    function answer(v) {
      if (locked) return; locked = true;
      var it = list[i], ok = v === it.a;
      if (ok) { score++; earn('w:' + D.warmup.indexOf(it), 10); }
      $('#wScore').textContent = score;
      var st = $('#wStamp'); st.textContent = ok ? 'Správně!' : 'Vedle!'; st.className = 'wcard__stamp show ' + (ok ? 'ok' : 'bad');
      $('#wExpl').innerHTML = '<b>' + (it.a ? 'PRAVDA. ' : 'LEŽ. ') + '</b>' + it.e;
      $('#wFb').hidden = false;
      btns.forEach(function (b) { b.disabled = true; });
      $('#wNext').focus({ preventScroll: true });
    }
    function next() {
      card.classList.add(Math.random() > .5 ? 'fly-right' : 'fly-left');
      setTimeout(function () {
        i++;
        if (i < list.length) return show();
        card.hidden = true; $('#wBtns').hidden = true; end.hidden = false;
        $('#wEndScore').textContent = score;
        var r = score >= 7 ? ['🏆', 'Wow! Jsi připraven(a) na všechno. Teď to ještě obhaj v dalších misích.'] :
                score >= 4 ? ['👍', 'Dobrý základ. Na zbytek přijdeš během cesty.'] :
                             ['🌱', 'Nevadí! Právě proto tu jsme. Po misích to bude jiná.'];
        $('#wEndEmoji').textContent = r[0]; $('#wEndText').textContent = r[1];
        award('warmup');
      }, reduced ? 0 : 380);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { answer(b.dataset.tf === 'true'); }); });
    $('#wNext').addEventListener('click', next);
    $('#wAgain').addEventListener('click', start);
    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input, textarea')) return;
      var r = $('#zahrivacka').getBoundingClientRect();
      if (r.top > innerHeight * .5 || r.bottom < innerHeight * .5) return;
      if (e.key === 'ArrowLeft' && !locked) { e.preventDefault(); answer(false); }
      if (e.key === 'ArrowRight' && !locked) { e.preventDefault(); answer(true); }
    });
    start();
  })();

  /* ---------- 02 domino ---------- */
  (function () {
    var row = $('#dominoRow'), info = $('#dominoInfo'), next = 0;
    function build() {
      next = 0;
      row.innerHTML = D.dominoes.map(function (d, i) {
        var dots = ''; for (var k = 0; k < i + 1; k++) dots += '<i></i>';
        return '<button class="dom' + (i === 0 ? ' is-next' : '') + '" type="button" data-i="' + i + '" aria-label="Kostka ' + (i + 1) + ': ' + d.t + '"><span class="dom__n">' + (i + 1) + '</span><span class="dom__dots">' + dots + '</span><span class="dom__d">' + d.d + '</span></button>';
      }).join('');
      info.innerHTML = '<p>👆 Začni první kostkou vlevo.</p>';
      $('#dominoReset').hidden = true;
    }
    row.addEventListener('click', function (e) {
      var b = e.target.closest('.dom'); if (!b) return;
      var i = +b.dataset.i;
      if (i !== next) { info.innerHTML = '<p>✋ Pozor! Domino padá popořadě – klikni na kostku č. ' + (next + 1) + '.</p>'; return; }
      b.classList.remove('is-next'); b.classList.add('is-fallen');
      var d = D.dominoes[i];
      info.innerHTML = '<p><b>' + d.d + ' · ' + d.t + '</b>' + d.x + '</p>';
      earn('dom:' + i, 5);
      next++;
      if (next < D.dominoes.length) row.children[next].classList.add('is-next');
      else { $('#dominoReset').hidden = false; award('domino'); }
    });
    $('#dominoReset').addEventListener('click', build);
    build();
  })();

  /* ---------- 03 odboj ---------- */
  $$('.switch__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.switch__btn').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
      $$('.resist').forEach(function (p) { p.hidden = p.dataset.panel !== b.dataset.switch; if (!p.hidden) p.classList.add('is-in'); });
     
    });
  });

  (function () {
    var stops = D.train, pos = -1;
    var ol = $('#trainStops'), loco = $('#trainLoco'), fill = $('#trainFill'), card = $('#trainCard'), go = $('#trainGo');
    ol.innerHTML = '<li class="is-done"><span>Start</span></li>' + stops.map(function (s) { return '<li><span>' + s.p + '</span></li>'; }).join('');
    var n = stops.length;
    go.addEventListener('click', function () {
      if (pos >= n - 1) { pos = -1; loco.style.left = '0%'; fill.style.width = '0%'; $$('li', ol).forEach(function (li, k) { li.classList.toggle('is-done', k === 0); }); go.textContent = 'Jeď dál 🚂'; card.innerHTML = '<p class="train__hint">Znovu na trať! Klikni na <b>Jeď dál</b>.</p>'; return; }
      pos++;
      var pct = (pos + 1) / n * 100;
      loco.style.left = pct + '%'; fill.style.width = pct + '%';
      loco.classList.add('moving'); setTimeout(function () { loco.classList.remove('moving'); }, 1100);
            ol.children[pos + 1].classList.add('is-done');
      var s = stops[pos];
      card.innerHTML = '<h4>' + s.icon + ' ' + s.t + '<span class="when">' + s.d + '</span></h4><p>' + s.x + '</p>';
      earn('train:' + pos, 5);
      if (pos === n - 1) { go.textContent = 'Znovu ↻'; award('train'); }
    });
  })();

  /* ---------- 04 časová osa ---------- */
  var tl = $('#timeline'), tlFill;
  tl.innerHTML = D.timeline.map(function (t, i) {
    return '<li class="' + (i % 2 ? 'right' : '') + (t.hi ? ' hi' : '') + '"><span class="tl__dot" aria-hidden="true">' + t.e + '</span><div class="tl__box"><time>' + t.y + '</time><h3>' + t.t + '</h3><p>' + t.x + '</p></div></li>';
  }).join('');
  tlFill = document.createElement('span'); tlFill.className = 'tl__fill'; tl.prepend(tlFill);
  $$('li', tl).forEach(function (li) { li.classList.add('reveal'); observe(li); });
  function timelineFill() {
    var r = tl.getBoundingClientRect();
    var p = Math.min(Math.max((innerHeight * .6 - r.top) / r.height, 0), 1);
    tlFill.style.height = (p * 100) + '%';
  }

  (function () {
    var list = $('#orderList'), msg = $('#orderMsg'), items, dragEl = null;
    function fresh() {
      var pick = shuffle(D.timeline.map(function (t, i) { return i; })).slice(0, 6);
      var sorted = pick.slice().sort(function (a, b) { return a - b; });
      do { items = shuffle(pick); } while (items.join() === sorted.join());
      render(); msg.textContent = '';
    }
    function render(showYears) {
      list.innerHTML = items.map(function (idx, k) {
        var t = D.timeline[idx];
        return '<li class="order__item" draggable="true" data-idx="' + idx + '"><span class="grip" aria-hidden="true">⠿</span><span class="txt">' + t.e + ' ' + t.t + '</span>' +
          (showYears ? '<span class="yr">' + t.y + '</span>' : '') +
          '<span class="arrows"><button type="button" data-mv="-1" aria-label="Posunout nahoru"' + (k === 0 ? ' disabled' : '') + '>▲</button><button type="button" data-mv="1" aria-label="Posunout dolů"' + (k === items.length - 1 ? ' disabled' : '') + '>▼</button></span></li>';
      }).join('');
    }
    function readOrder() { items = $$('.order__item', list).map(function (li) { return +li.dataset.idx; }); }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mv]'); if (!b) return;
      readOrder();
      var li = b.closest('li'), k = $$('.order__item', list).indexOf(li), to = k + (+b.dataset.mv);
      var t = items[k]; items[k] = items[to]; items[to] = t;
      render();
      var btn = $$('.order__item', list)[to].querySelector('[data-mv="' + b.dataset.mv + '"]');
      if (btn && !btn.disabled) btn.focus(); else $$('.order__item', list)[to].querySelector('button:not([disabled])').focus();
    });
    list.addEventListener('dragstart', function (e) { dragEl = e.target.closest('.order__item'); if (dragEl) { dragEl.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; } });
    list.addEventListener('dragend', function () { if (dragEl) dragEl.classList.remove('dragging'); dragEl = null; readOrder(); render(); });
    list.addEventListener('dragover', function (e) {
      e.preventDefault(); if (!dragEl) return;
      var after = $$('.order__item:not(.dragging)', list).filter(function (li) { var r = li.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; })[0];
      if (after) list.insertBefore(dragEl, after); else list.appendChild(dragEl);
    });
    $('#orderCheck').addEventListener('click', function () {
      readOrder();
      var sorted = items.slice().sort(function (a, b) { return a - b; });
      render(true);
      var okCount = 0;
      $$('.order__item', list).forEach(function (li, k) { var ok = items[k] === sorted[k]; if (ok) okCount++; li.classList.add(ok ? 'ok' : 'bad'); });
      if (okCount === items.length) { msg.textContent = '🎉 Perfektní! Jsi kronikář.'; earn('order', 30); award('order'); }
      else { msg.textContent = '🤔 Správně ' + okCount + ' z ' + items.length + '. Data už vidíš – zkus to opravit!'; }
    });
    $('#orderNew').addEventListener('click', fresh);
    fresh();
  })();

  /* ---------- 05 lidé ---------- */
  $$('.hcard').forEach(function (c) { c.addEventListener('click', function () { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); }); });

  (function () {
    var grid = $('#pxGrid'), open = [], pairs = 0, moves = 0, busy = false;
    function build() {
      open = []; pairs = 0; moves = 0; busy = false; stats();
      var cards = [];
      D.pexeso.forEach(function (p) { cards.push({ id: p.id, kind: 'face', p: p }); cards.push({ id: p.id, kind: 'clue', p: p }); });
      grid.innerHTML = shuffle(cards).map(function (c) {
        var back = c.kind === 'face'
          ? '<img src="assets/img/' + c.p.img + '.jpg" alt="' + c.p.name + '">' + c.p.name
          : c.p.clue;
        return '<button class="px" type="button" data-id="' + c.id + '" aria-label="Skrytá karta"><span class="px__in"><span class="px__f" aria-hidden="true">★</span><span class="px__b ' + (c.kind === 'clue' ? 'clue' : '') + '">' + back + '</span></span></button>';
      }).join('');
      $$('img', grid).forEach(imgFallback);
    }
    function stats() { $('#pxMoves').textContent = moves; $('#pxPairs').textContent = pairs; }
    grid.addEventListener('click', function (e) {
      var c = e.target.closest('.px'); if (!c || busy || c.classList.contains('is-open') || c.classList.contains('is-match')) return;
      c.classList.add('is-open'); c.setAttribute('aria-label', c.querySelector('.px__b').textContent); open.push(c);
      if (open.length < 2) return;
      moves++; busy = true;
      var a = open[0], b = open[1];
      if (a.dataset.id === b.dataset.id) {
        setTimeout(function () { a.classList.add('is-match'); b.classList.add('is-match'); a.classList.remove('is-open'); b.classList.remove('is-open'); open = []; busy = false; pairs++; stats(); earn('px:' + a.dataset.id, 10);
          if (pairs === D.pexeso.length) { award('pexeso'); toast('<span class="toast__ico">🧠</span><span>Hotovo za ' + moves + ' tahů!</span>'); } }, 400);
      } else {
        setTimeout(function () { a.classList.add('is-wrong'); b.classList.add('is-wrong'); }, 500);
        setTimeout(function () { [a, b].forEach(function (x) { x.classList.remove('is-open', 'is-wrong'); x.setAttribute('aria-label', 'Skrytá karta'); }); open = []; busy = false; }, 1100);
      }
      stats();
    });
    $('#pxReset').addEventListener('click', build);
    build();
  })();

  /* ---------- 06 den D ---------- */
  (function () {
    var tabs = $('#dayTabs'), cur = 0, seen = {}, timer = null;
    var ticks = '';
    for (var k = 0; k < 12; k++) { var a = k * 30 * Math.PI / 180; ticks += '<line x1="' + (100 + Math.sin(a) * 78) + '" y1="' + (100 - Math.cos(a) * 78) + '" x2="' + (100 + Math.sin(a) * 88) + '" y2="' + (100 - Math.cos(a) * 88) + '"/>'; }
    $('#clkTicks').innerHTML = ticks;
    tabs.innerHTML = D.day.map(function (d, i) { return '<button class="day__tab" type="button" role="tab" id="dt' + i + '" aria-selected="false" aria-controls="dayPanel">' + d.icon + ' ' + d.time + '</button>'; }).join('');
    var hourRot = 0;
    function show(i, quiet) {
      cur = i; seen[i] = true;
      var d = D.day[i];
      $$('.day__tab', tabs).forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.classList.toggle('seen', !!seen[k]); });
      $('#dayPanel').setAttribute('aria-labelledby', 'dt' + i);
      $('#dayIcon').textContent = d.icon; $('#dayTitle').textContent = d.title; $('#dayText').textContent = d.text; $('#dayFact').textContent = d.fact;
      var p = $('#dayPanel'); p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap');
      // hodinová ručička se otáčí vždy dopředu
      var target = (d.clock % 12) * 30;
      while (target < hourRot) target += 360;
      hourRot = target;
      $('#clkH').style.transform = 'rotate(' + hourRot + 'deg)';
      $('#clkM').style.transform = 'rotate(' + (hourRot * 12) + 'deg)';
      var n = Object.keys(seen).length;
      $('#daySeen').textContent = 'Viděno ' + n + ' / ' + D.day.length;
      if (!quiet)
      if (!quiet) earn('day:' + i, 5);
      if (n === D.day.length) award('day');
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.day__tab'); if (!b) return; stop(); show($$('.day__tab', tabs).indexOf(b)); });
    tabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); stop();
      var n = (cur + (e.key === 'ArrowRight' ? 1 : -1) + D.day.length) % D.day.length;
      show(n); $$('.day__tab', tabs)[n].focus();
    });
    var play = $('#dayPlay');
    function stop() { clearInterval(timer); timer = null; play.textContent = '▶ Přehrát den'; }
    play.addEventListener('click', function () {
      if (timer) return stop();
      play.textContent = '⏸ Pozastavit';
      show(0);
      timer = setInterval(function () { if (cur >= D.day.length - 1) return stop(); show(cur + 1); }, 5200);
    });
    show(0, true);
  })();

  /* ---------- 07 šifra ---------- */
  (function () {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lvl = 0, done = false;
    var range = $('#cRange'), outer = $('#wheelOuter'), inner = $('#wheelInner');
    var step = 360 / 26;
    function letters(el) { el.innerHTML = A.split('').map(function (c, i) { return '<span style="transform:rotate(' + (i * step) + 'deg)">' + c + '</span>'; }).join(''); }
    letters(outer); letters(inner);
    function shiftText(t, k) { return t.replace(/[A-Z]/g, function (c) { return A[(A.indexOf(c) + k + 26) % 26]; }); }
    // porovnání bez diakritiky, velikosti písmen a nadbytečných mezer
    function norm(t) { return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]+/g, ' ').trim(); }
    var form = $('#cForm'), ans = $('#cAns'), hint = $('#cHint'), hinted = false;
    function load() {
      done = false; hinted = false;
      var c = D.ciphers[lvl];
      $('#cLvl').textContent = lvl + 1;
      $('#cEnc').textContent = shiftText(c.plain, c.shift);
      $('#cClue').innerHTML = c.clue;
      range.value = 0; update();
      ans.value = ''; ans.disabled = false; ans.classList.remove('solved');
      $('button', form).disabled = false;
      hint.hidden = lvl === 0;
      $('#cMsg').textContent = lvl === 0 ? 'Tip: každé písmeno je v abecedě posunuté o stejný počet míst. Tak šifroval už Julius Caesar.' : 'Další zpráva! Klíč je tentokrát jiný.';
    }
    function update() {
      var k = +range.value;
      $('#wheelKey').textContent = k;
      inner.style.transform = 'rotate(' + (k * step) + 'deg)';
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (done) return;
      var c = D.ciphers[lvl];
      if (!norm(ans.value)) { ans.focus(); return; }
      if (norm(ans.value) !== c.plain) {
        $('#cMsg').textContent = '❌ Tohle ještě nedává smysl. Zkontroluj klíč a písmena.';
        ans.classList.remove('wrong'); void ans.offsetWidth; ans.classList.add('wrong');
        return;
      }
      done = true; ans.value = c.plain; ans.disabled = true; ans.classList.add('solved'); $('button', form).disabled = true; hint.hidden = true;
      earn('cipher:' + lvl, hinted ? 10 : 20);
      $('#cMsg').textContent = '✅ Rozluštěno! Klíč byl ' + c.shift + '.';
      setTimeout(function () {
        if (lvl < D.ciphers.length - 1) { lvl++; load(); }
        else { $('#cMsg').innerHTML = '🕵️ Všechny tři zprávy rozluštěny! Maffie by tě brala všemi deseti. <button class="linklike" type="button" id="cRestart">Hrát znovu</button>'; award('cipher'); }
      }, 1800);
    });
    hint.addEventListener('click', function () {
      hinted = true; hint.hidden = true;
      $('#cMsg').innerHTML = '🔑 Klíč je <b>' + D.ciphers[lvl].shift + '</b>. Přepiš zprávu podle kolečka.';
    });
    range.addEventListener('input', update);
    $('#cMinus').addEventListener('click', function () { range.value = (+range.value + 25) % 26; update(); });
    $('#cPlus').addEventListener('click', function () { range.value = (+range.value + 1) % 26; update(); });
    $('#cMsg').addEventListener('click', function (e) { if (e.target.id === 'cRestart') { lvl = 0; load(); } });
    load();
  })();

  /* ---------- 08 vlajka ---------- */
  (function () {
    var flag = $('#flag'), btn = $('#flagBtn'), on = false;
    btn.addEventListener('click', function () {
      on = !on;
      flag.classList.toggle('has-wedge', on);
      $('#flagYr').textContent = on ? '1920' : '1918';
      $('#flagNote').textContent = on
        ? 'Modrá a klín jsou podle zákona z 30. 3. 1920. Modrou se často vysvětluje Morava a Slovensko – a díky ní už si vlajku nikdo nespletl s polskou.'
        : 'Bílá a červená pocházejí z erbu Čech.';
      btn.textContent = on ? '↺ Zpět na rok 1918' : 'Přidat modrý klín ➜';
     
      if (on) { award('flag'); earn('flag', 10); }
    });
  })();

  /* ---------- 09 mýty ---------- */
  (function () {
    var box = $('#myths'), flipped = {};
    box.innerHTML = D.myths.map(function (m, i) {
      return '<button class="myth reveal" type="button" aria-pressed="false" data-i="' + i + '"><span class="myth__in">' +
        '<span class="myth__f"><span class="myth__tag">Mýtus #' + (i + 1) + '</span><span class="myth__txt">„' + m.m + '“</span><span class="myth__hint">Klikni pro pravdu ↻</span></span>' +
        '<span class="myth__b"><span class="myth__tag">Ve skutečnosti</span><span class="myth__txt">' + m.t + '</span><span class="myth__hint">Klikni zpět ↻</span></span>' +
        '</span></button>';
    }).join('');
    $$('.myth', box).forEach(function (b) {
      observe(b);
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on);
        if (on && !flipped[b.dataset.i]) { flipped[b.dataset.i] = true; earn('myth:' + b.dataset.i, 5); if (Object.keys(flipped).length === D.myths.length) award('myths'); }
      });
    });
  })();

  /* ---------- 10 kvíz ---------- */
  (function () {
    var q = { mode: 'full', list: [], i: 0, correct: 0, pts: 0, streak: 0, log: [], jokers: {}, locked: false, timer: null, t0: 0 };
    var TIME = 20;
    var keys = 'ABCD';
    function screen(id) { ['#qStart', '#qPlay', '#qEnd'].forEach(function (s) { $(s).hidden = s !== id; }); }

    $$('.mode').forEach(function (b) { b.addEventListener('click', function () { start(b.dataset.mode); }); });
    function start(mode) {
      q.mode = mode;
      var all = shuffle(D.quiz);
      q.list = mode === 'fast' ? all.slice(0, 15) : all;
      q.i = 0; q.correct = 0; q.pts = 0; q.streak = 0; q.log = []; q.jokers = { j50: 1, jHint: 1, jSkip: 1 };
      $('#qT').textContent = q.list.length;
      $('#qTimer').hidden = mode !== 'fast';
      ['j50', 'jHint', 'jSkip'].forEach(function (j) { $('#' + j).disabled = false; });
      screen('#qPlay');
      ask();
      $('#kviz').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }
    function ask() {
      q.locked = false;
      var it = q.list[q.i];
      $('#qN').textContent = q.i + 1;
      $('#qProg').style.width = (q.i / q.list.length * 100) + '%';
      $('#qScore').textContent = q.pts;
      $('#qQ').textContent = it.q;
      var img = $('#qImg');
      if (it.img) { img.src = 'assets/img/' + it.img + '.jpg'; img.alt = 'Portrét k otázce'; img.hidden = false; img.onerror = function () { img.hidden = true; }; }
      else img.hidden = true;
      var order = it.tf ? it.o.map(function (_, k) { return k; }) : shuffle(it.o.map(function (_, k) { return k; }));
      $('#qOpts').innerHTML = order.map(function (k, n) { return '<button class="opt" type="button" data-k="' + k + '"><span class="opt__k">' + keys[n] + '</span><span>' + it.o[k] + '</span></button>'; }).join('');
      $('#qHint').hidden = true; $('#qFb').hidden = true;
      $('#jSkip').disabled = !q.jokers.jSkip || q.i === q.list.length - 1;
      $('#j50').disabled = !q.jokers.j50 || it.o.length < 4;
      $('#jHint').disabled = !q.jokers.jHint;
      var c = $('#qCard'); c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap');
      keepInView();
      if (q.mode === 'fast') runTimer();
    }
    // na mobilu po kliknutí na „Další“ vrátí horní okraj kvízu do obrazu
    function keepInView() {
      var r = $('#quiz').getBoundingClientRect();
      if (r.top < 0) window.scrollBy({ top: r.top - 90, behavior: reduced ? 'auto' : 'smooth' });
    }
    function runTimer() {
      clearInterval(q.timer);
      q.t0 = Date.now();
      var bar = $('#qTimerBar'), wrap = $('#qTimer');
      wrap.classList.remove('low');
      q.timer = setInterval(function () {
        var left = TIME - (Date.now() - q.t0) / 1000;
        bar.style.transform = 'scaleX(' + Math.max(left / TIME, 0) + ')';
        wrap.classList.toggle('low', left < 6);
        if (left <= 0) { clearInterval(q.timer); answer(-1); }
      }, 100);
    }
    function answer(k) {
      if (q.locked) return; q.locked = true;
      clearInterval(q.timer);
      var it = q.list[q.i], ok = k === it.a;
      $$('.opt', $('#qOpts')).forEach(function (b) {
        b.disabled = true;
        var bk = +b.dataset.k;
        if (bk === it.a) b.classList.add('ok');
        else if (bk === k) b.classList.add('bad');
      });
      var gain = 0;
      if (ok) {
        q.correct++; q.streak++;
        var mult = q.streak >= 5 ? 3 : q.streak >= 3 ? 2 : 1;
        gain = 10 * mult;
        if (q.mode === 'fast') gain += Math.max(0, Math.round(TIME - (Date.now() - q.t0) / 1000));
        q.pts += gain;
      } else { q.streak = 0; }
      var combo = $('#qCombo');
      if (q.streak >= 3) { combo.hidden = false; $('#qComboN').textContent = q.streak >= 5 ? 3 : 2; combo.style.animation = 'none'; void combo.offsetWidth; combo.style.animation = ''; }
      else combo.hidden = true;
      $('#qScore').textContent = q.pts;
      var praise = ['Výborně!', 'Přesně tak!', 'Bingo!', 'Správně!', 'Jako z učebnice!'];
      $('#qVerdict').textContent = ok ? '✅ ' + praise[Math.floor(Math.random() * praise.length)] + (gain ? ' +' + gain + ' bodů' : '') : (k === -1 ? '⏰ Čas vypršel!' : '❌ Tentokrát ne.');
      $('#qExpl').innerHTML = (ok ? '' : 'Správně je: <b>' + it.o[it.a] + '</b>. ') + it.e;
      $('#qFb').hidden = false;
      $('#qNext').textContent = q.i === q.list.length - 1 ? 'Zobrazit výsledek 🏁' : 'Další otázka →';
      $('#qNext').focus({ preventScroll: true });
      ['j50', 'jHint', 'jSkip'].forEach(function (j) { $('#' + j).disabled = true; });
      q.log.push({ q: it.q, ok: ok, right: it.o[it.a], given: k >= 0 ? it.o[k] : '(nic)' });
    }
    $('#qOpts').addEventListener('click', function (e) { var b = e.target.closest('.opt'); if (b && !b.disabled) answer(+b.dataset.k); });
    $('#qNext').addEventListener('click', function () { q.i++; if (q.i < q.list.length) ask(); else finish(); });
    document.addEventListener('keydown', function (e) {
      if ($('#qPlay').hidden || e.target.matches('input')) return;
      var r = $('#quiz').getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var n = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()];
      if (n !== undefined && !q.locked) { var b = $$('.opt', $('#qOpts'))[n]; if (b && !b.disabled && !b.classList.contains('gone')) answer(+b.dataset.k); }
    });

    $('#j50').addEventListener('click', function () {
      q.jokers.j50 = 0; this.disabled = true;
      var it = q.list[q.i];
      var wrong = shuffle($$('.opt', $('#qOpts')).filter(function (b) { return +b.dataset.k !== it.a; })).slice(0, 2);
      wrong.forEach(function (b) { b.disabled = true; b.classList.add('gone'); });
    });
    $('#jHint').addEventListener('click', function () {
      q.jokers.jHint = 0; this.disabled = true;
      var h = $('#qHint'); h.textContent = q.list[q.i].h; h.hidden = false;
    });
    $('#jSkip').addEventListener('click', function () {
      q.jokers.jSkip = 0;
      var it = q.list.splice(q.i, 1)[0]; q.list.push(it);
      toast('<span>⏭ Otázka odložena na konec.</span>', 'toast--xp', 1500);
      ask();
    });

    var lastResult = null;
    function finish() {
      clearInterval(q.timer);
      screen('#qEnd');
      keepInView();
      var pct = q.correct / q.list.length;
      var R = pct >= .9 ? ['🏛️', 'Prezident', 'Neuvěřitelné! Tohle by podepsal i Masaryk. Jsi expert na rok 1918.'] :
              pct >= .7 ? ['🎩', 'Diplomat', 'Skvělá práce! Pár detailů uteklo, ale máš to v malíčku.'] :
              pct >= .45 ? ['🎖️', 'Legionář', 'Dobrý výkon! Projdi si odpovědi a příště to dáš ještě líp.'] :
                           ['🪖', 'Rekrut', 'Začátek je za tebou. Vrať se do misí a zkus to znovu – jde to!'];
      $('#qRankIco').textContent = R[0]; $('#qRank').textContent = R[1]; $('#qEndText').textContent = R[2];
      $('#qFinal').textContent = q.correct; $('#qFinalT').textContent = q.list.length;
      $('#qReview').hidden = true;
      $('#qReview').innerHTML = q.log.map(function (l) {
        return '<li class="' + (l.ok ? 'ok' : 'bad') + '">' + (l.ok ? '✅ ' : '❌ ') + l.q + '<small>Tvoje odpověď: ' + l.given + (l.ok ? '' : ' · Správně: ' + l.right) + '</small></li>';
      }).join('');
      lastResult = { score: q.correct, total: q.list.length, rank: R[1] };
      // z kvízu jde do XP jen zlepšení oproti nejlepšímu výsledku (rekord zvlášť pro každý režim)
      var best = state.quizBest[q.mode] || 0, gain = Math.max(0, q.pts - best);
      if (gain) { state.quizBest[q.mode] = q.pts; addXP(gain); }
      else toast('<span>Pro další XP překonej svůj rekord ' + best + ' bodů v ' + (q.mode === 'fast' ? 'rychlém' : 'plném') + ' kvízu.</span>', 'toast--xp', 2600);
      award('quiz');
      if (pct >= .9) award('perfect');
      confetti(pct >= .7 ? 260 : 120);
    }
    $('#qAgain').addEventListener('click', function () { screen('#qStart'); });
    $('#qReviewBtn').addEventListener('click', function () { var r = $('#qReview'); r.hidden = !r.hidden; });

    // diplom
    var dm = $('#diploma');
    $('#dMake').addEventListener('click', function () {
      if (!lastResult) return;
      var name = $('#dName').value.trim() || 'Statečný rekrut';
      $('#dpName').textContent = name;
      $('#dpScore').textContent = lastResult.score; $('#dpTotal').textContent = lastResult.total; $('#dpRank').textContent = lastResult.rank;
      $('#dpDate').textContent = new Date().toLocaleDateString('cs-CZ');
      dm.hidden = false; $('#dPrint').focus();
    });
    $('#dName').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#dMake').click(); });
    $('#dPrint').addEventListener('click', function () { window.print(); });
    $('#dClose').addEventListener('click', function () { dm.hidden = true; });
    dm.addEventListener('click', function (e) { if (e.target === dm) dm.hidden = true; });
  })();

  /* ---------- start ---------- */
  $$('.reveal').forEach(observe);
  $$('img').forEach(imgFallback);
  paintHud();
  onScroll();
})();
