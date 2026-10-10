(function () {
  var desktop = document.getElementById('desktop');
  var wins = Array.prototype.slice.call(document.querySelectorAll('.win'));
  var tasks = document.getElementById('tasks');
  var menu = document.getElementById('menu');
  var startBtn = document.getElementById('start');
  var mq = window.matchMedia('(min-width: 1000px)');
  var z = 10;

  // Skill meters
  document.querySelectorAll('.meter').forEach(function (m) {
    var lvl = parseInt(m.getAttribute('data-level'), 10) || 0;
    for (var i = 0; i < 10; i++) {
      var seg = document.createElement('i');
      if (i < lvl) seg.className = 'on';
      m.appendChild(seg);
    }
    m.setAttribute('role', 'img');
    m.setAttribute('aria-label', lvl + ' / 10');
  });

  function layout() {
    if (mq.matches) {
      var scale = Math.min(1, desktop.clientWidth / 1280);
      wins.forEach(function (w) {
        w.style.left = Math.round(+w.dataset.x * scale) + 'px';
        w.style.top = w.dataset.y + 'px';
      });
    } else {
      wins.forEach(function (w) { w.style.left = ''; w.style.top = ''; });
    }
  }

  // Make the desktop tall enough to scroll to the lowest open window
  function fitDesktop() {
    if (!mq.matches) { desktop.style.minHeight = ''; return; }
    var bottom = 0;
    wins.forEach(function (w) {
      if (w.hidden || w.classList.contains('min')) return;
      bottom = Math.max(bottom, w.offsetTop + w.offsetHeight);
    });
    desktop.style.minHeight = Math.max(window.innerHeight, bottom + 60) + 'px';
  }

  function focusWin(w) {
    z += 1;
    w.style.zIndex = z;
    wins.forEach(function (o) { o.classList.toggle('active', o === w); });
    renderTasks();
    fitDesktop();
  }

  function openWin(id) {
    var w = document.getElementById(id);
    if (!w) return;
    w.hidden = false;
    w.classList.remove('min');
    focusWin(w);
    syncVideos(w);
    if (!mq.matches) w.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function syncVideos(w) {
    var off = w.hidden || w.classList.contains('min');
    w.querySelectorAll('video[autoplay]').forEach(function (v) { if (off) v.pause(); else v.play().catch(function () {}); });
  }

  function closeWin(w) { w.hidden = true; w.classList.remove('active'); renderTasks(); syncVideos(w); }
  function minWin(w) {
    if (!mq.matches) { closeWin(w); return; }
    w.classList.add('min'); w.classList.remove('active'); renderTasks(); syncVideos(w);
  }

  function renderTasks() {
    tasks.innerHTML = '';
    wins.forEach(function (w) {
      if (w.hidden) return;
      var b = document.createElement('button');
      b.className = 'btn task' + (w.classList.contains('active') && !w.classList.contains('min') ? ' on' : '');
      b.textContent = w.querySelector('.ttl').textContent;
      b.addEventListener('click', function () {
        if (w.classList.contains('active') && !w.classList.contains('min')) minWin(w);
        else openWin(w.id);
      });
      tasks.appendChild(b);
    });
  }

  // Window controls + dragging
  wins.forEach(function (w) {
    w.addEventListener('pointerdown', function () { if (!w.classList.contains('active')) focusWin(w); });
    var c = w.querySelector('.close'); if (c) c.addEventListener('click', function () { closeWin(w); });
    var m = w.querySelector('.min'); if (m) m.addEventListener('click', function () { minWin(w); });
    var ok = w.querySelector('.close-btn'); if (ok) ok.addEventListener('click', function () { closeWin(w); });

    var bar = w.querySelector('.titlebar');
    bar.addEventListener('pointerdown', function (e) {
      if (!mq.matches || e.target.closest('button')) return;
      var sx = e.clientX, sy = e.clientY, ox = w.offsetLeft, oy = w.offsetTop;
      w.classList.add('dragging');
      bar.setPointerCapture(e.pointerId);
      function move(ev) {
        var nx = ox + ev.clientX - sx, ny = oy + ev.clientY - sy;
        nx = Math.max(-w.offsetWidth + 80, Math.min(nx, desktop.clientWidth - 80));
        ny = Math.max(0, ny);
        w.style.left = nx + 'px'; w.style.top = ny + 'px';
      }
      function up() {
        w.classList.remove('dragging');
        fitDesktop();
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
      }
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
    });
  });

  document.querySelectorAll('[data-open]').forEach(function (el) {
    el.addEventListener('click', function () { openWin(el.getAttribute('data-open')); toggleMenu(false); });
  });

  function toggleMenu(show) {
    menu.hidden = !show;
    startBtn.setAttribute('aria-expanded', String(show));
  }
  startBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(menu.hidden); });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) toggleMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleMenu(false); });

  // Renders feed: likes, double-click to like, videos
  function setLike(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }
  document.querySelectorAll('.post').forEach(function (post) {
    var btn = post.querySelector('.like');
    var media = post.querySelector('.post-media');
    var burst = post.querySelector('.burst');
    btn.addEventListener('click', function () { setLike(btn, btn.getAttribute('aria-pressed') !== 'true'); });
    media.addEventListener('dblclick', function () {
      setLike(btn, true);
      burst.classList.remove('pop'); void burst.offsetWidth; burst.classList.add('pop');
    });
  });
  // Respect reduced-motion: don't autoplay the loop, show controls instead
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.post-media video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; });
  }

  // Clock
  var clock = document.getElementById('clock');
  function tick() { clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  tick(); setInterval(tick, 15000);

  // English / French
  var langBtn = document.getElementById('lang');
  var nodes = document.querySelectorAll('[data-fr]');
  nodes.forEach(function (el) { el.setAttribute('data-en', el.textContent); });
  var lang = 'en';
  langBtn.addEventListener('click', function () {
    lang = lang === 'en' ? 'fr' : 'en';
    nodes.forEach(function (el) { el.textContent = el.getAttribute('data-' + lang); });
    document.documentElement.lang = lang;
    langBtn.textContent = lang === 'en' ? 'FR' : 'EN';
    langBtn.setAttribute('aria-label', lang === 'en' ? 'Lire en français' : 'Read in English');
    renderTasks();
  });

  // Boot
  layout();
  var wasDesk = mq.matches;
  window.addEventListener('resize', function () { if (mq.matches !== wasDesk) { wasDesk = mq.matches; layout(); } fitDesktop(); });
  wins.forEach(function (w, i) {
    if (w.hidden) return;
    w.style.zIndex = ++z;
    w.classList.add('boot');
    w.style.animationDelay = (i * 0.08) + 's';
  });
  focusWin(document.getElementById('w-about'));
})();