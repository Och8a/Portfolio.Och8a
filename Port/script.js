/* ============================================================
   Och8a.mov · interacciones
   Cada bloque corre dentro de safe(): si uno falla, el resto sigue funcionando.
   ============================================================ */
window.__och = true; // avisa al HTML de que este archivo sí cargó

(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const mq = q => (window.matchMedia ? window.matchMedia(q) : { matches: false });
  const reduceMotion = mq('(prefers-reduced-motion: reduce)');
  const finePointer  = mq('(hover: hover) and (pointer: fine)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const hasIO = 'IntersectionObserver' in window;
  const safe = (name, fn) => { try { fn(); } catch (err) { console.error('[portafolio] ' + name, err); } };

  // ===== Pantalla de carga =====
  const loader = $('#loader'), pct = $('#pct');
  const waiting = [];          // tareas que esperan a que termine la pantalla de carga
  let loaderDone = false;
  const onReady = fn => (loaderDone ? safe('onReady', fn) : waiting.push(fn));
  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    if (loader) loader.classList.add('done');
    root.classList.add('ready');
    waiting.splice(0).forEach(fn => safe('onReady', fn));
  }
  safe('carga', () => {
    setTimeout(finishLoader, 3000); // seguro: la página nunca queda bloqueada
    if (!loader || !pct) return finishLoader();
    const MIN = reduceMotion.matches ? 0 : 1000, t0 = performance.now();
    let fontsReady = !(document.fonts && document.fonts.ready);
    if (!fontsReady) document.fonts.ready.then(() => { fontsReady = true; }, () => { fontsReady = true; });
    const step = now => {
      const p = MIN ? Math.min(1, (now - t0) / MIN) : 1;
      let n = Math.round(100 * (1 - Math.pow(1 - p, 3)));
      if (!fontsReady && n > 96) n = 96;          // espera a las tipografías
      pct.textContent = n + '%';
      if (n >= 100) setTimeout(finishLoader, 200); else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  // ===== Luz que sigue al cursor (solo con mouse; en pantallas táctiles queda fija) =====
  safe('luz', () => {
    const glow = $('#glow');
    if (!glow || !finePointer.matches || reduceMotion.matches) return;
    let x = 0, y = 0, queued = false;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; glow.style.transform = `translate3d(${x}px,${y}px,0)`; });
    }, { passive: true });
  });

  // ===== Barra de progreso del scroll =====
  safe('progreso', () => {
    const bar = $('#progress');
    if (!bar) return;
    let queued = false;
    const update = () => {
      queued = false;
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    update();
  });

  // ===== Menú móvil =====
  safe('menu', () => {
    const nav = $('#nav'), burger = $('#burger');
    if (!nav || !burger) return;
    const set = open => {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    burger.addEventListener('click', () => set(!nav.classList.contains('open')));
    $$('#menu a').forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('click', e => { if (!nav.contains(e.target)) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    addEventListener('resize', () => { if (innerWidth > 860) set(false); });
  });

  // ===== Sección activa en el menú =====
  safe('seccion-activa', () => {
    if (!hasIO) return;
    const links = $$('#menu a[href^="#"]');
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      const a = byId.get(e.target.id);
      if (a) a.setAttribute('aria-current', 'true');
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', ...byId.keys()].map(id => document.getElementById(id)).filter(Boolean).forEach(el => io.observe(el));
  });

  // ===== Aparecer al hacer scroll =====
  safe('reveal', () => {
    const els = $$('.reveal');
    if (!hasIO || reduceMotion.matches) return els.forEach(el => el.classList.add('in'));
    const io = new IntersectionObserver((entries, obs) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
  });

  // ===== Pausar el halo de la portada cuando no se ve =====
  safe('portada', () => {
    const hero = $('.hero');
    if (!hero || !hasIO) return;
    new IntersectionObserver(([e]) => hero.classList.toggle('is-off', !e.isIntersecting)).observe(hero);
  });

  // ===== Adelantos en silencio dentro de las tarjetas =====
  // Se reproducen solo mientras la tarjeta se ve, y se cargan bajo demanda (no pesan al abrir la página).
  let previews = { block() {}, unblock() {} };
  safe('adelantos', () => {
    const cards = $$('.card[data-preview]');
    if (!cards.length || saveData) return;
    const vid = c => $('video', c);
    const start = c => {
      const v = vid(c);
      if (!v || !v.paused) return;
      if (!v.getAttribute('src')) v.src = c.dataset.preview;
      v.muted = true; // requisito de autoplay en Chrome y Safari
      const p = v.play();
      if (p && p.then) p.then(() => v.classList.add('on'), () => {});
    };
    const stop = c => { const v = vid(c); if (v) { v.pause(); v.classList.remove('on'); } };

    // Con "reducir movimiento" (ajuste de accesibilidad del sistema) nada se reproduce solo:
    // el adelanto corre únicamente cuando el visitante pasa el mouse o enfoca la tarjeta.
    if (reduceMotion.matches) {
      cards.forEach(c => {
        c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') start(c); });
        c.addEventListener('pointerleave', () => stop(c));
        c.addEventListener('focusin', () => start(c));
        c.addEventListener('focusout', () => stop(c));
      });
      previews = { block() { cards.forEach(stop); }, unblock() {} };
      return;
    }

    if (!hasIO) return;
    const seen = new Set();
    let blocked = false;
    const sync = () => cards.forEach(c => (seen.has(c) && !blocked && !document.hidden ? start(c) : stop(c)));
    const steps = Array.from({ length: 11 }, (_, i) => i / 10);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const card = e.target.closest('.card');
        const enough = e.isIntersecting && (e.intersectionRatio >= 0.55 || e.intersectionRect.height >= innerHeight * 0.5);
        if (enough) seen.add(card); else seen.delete(card);
      });
      sync();
    }, { threshold: steps });
    cards.forEach(c => io.observe($('.media', c)));
    document.addEventListener('visibilitychange', sync);
    previews = { block() { blocked = true; sync(); }, unblock() { blocked = false; sync(); } };
  });

  // ===== Visor de video =====
  safe('visor', () => {
    const lb = $('#lb');
    const pieces = $$('.card[data-src], .card[data-yt]');
    const counter = $('#work-count');
    if (counter) counter.textContent = pieces.length;
    if (!lb || !pieces.length) return;

    const panel = $('#lb-panel'), stage = $('#lb-stage'), kicker = $('#lb-kicker'), title = $('#lb-title'),
          desc = $('#lb-desc'), tags = $('#lb-tags'), more = $('#lb-more'), count = $('#lb-count');
    const hasModal = typeof lb.showModal === 'function';
    let current = -1, opener = -1, isOpen = false, pushed = false, closeTimer = 0;

    const copyInto = (to, from) => { to.textContent = ''; if (from) from.childNodes.forEach(n => to.appendChild(n.cloneNode(true))); };
    // Acepta el ID solo o cualquier link de YouTube (youtu.be, watch?v=, shorts/, embed/)
    const youtubeId = (v = '') => { const m = String(v).trim().match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : String(v).trim(); };
    const hashOf = card => '#video-' + card.id;

    function unmount() {
      const v = $('video', stage);
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); } // corta la descarga
      stage.textContent = '';
    }

    function showError(card) {
      stage.textContent = '';
      const box = document.createElement('div');
      box.className = 'lb-error';
      const p = document.createElement('p');
      p.textContent = 'No se pudo cargar el video. Revisa tu conexión e inténtalo de nuevo.';
      const row = document.createElement('div');
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'btn btn-sm'; retry.textContent = 'Reintentar';
      retry.addEventListener('click', () => mount(card));
      const open = document.createElement('a');
      open.className = 'btn btn-sm ghost'; open.textContent = 'Abrir el archivo';
      open.href = card.dataset.src || card.dataset.yt || '#'; open.target = '_blank'; open.rel = 'noopener';
      row.append(retry, open);
      box.append(p, row);
      stage.appendChild(box);
    }

    function mount(card) {
      unmount();
      const tall = card.classList.contains('tall');
      panel.classList.toggle('is-tall', tall);
      panel.classList.toggle('is-wide', !tall);

      if (card.dataset.yt) { // video alojado en YouTube
        const id = youtubeId(card.dataset.yt);
        if (!/^[\w-]{11}$/.test(id)) return showError(card);
        const params = new URLSearchParams({ autoplay: 1, rel: 0, playsinline: 1 });
        // YouTube exige saber desde qué página se incrusta (si no, da el "Error 153")
        if (location.protocol.startsWith('http')) params.set('origin', location.origin);
        const f = document.createElement('iframe');
        f.src = `https://www.youtube.com/embed/${id}?${params}`;
        f.title = title.textContent || 'Video';
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        f.allowFullscreen = true;
        stage.appendChild(f);
        return;
      }

      const v = document.createElement('video');
      v.controls = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('controlslist', 'nodownload');
      if (card.dataset.poster) v.poster = card.dataset.poster;
      v.addEventListener('error', () => showError(card), { once: true });
      v.src = card.dataset.src;
      stage.appendChild(v);
      const p = v.play(); // el clic del visitante permite reproducir con sonido
      if (p && p.catch) p.catch(() => {});
    }

    function fill(card) {
      copyInto(kicker, $('.kicker', card));
      copyInto(title, $('h3', card));
      copyInto(desc, $('.desc', card));
      tags.textContent = '';
      $$('.tags li', card).forEach(li => tags.appendChild(li.cloneNode(true)));
      const m = $('.more', card);
      if (m) { more.href = m.href; copyInto(more, m); more.hidden = false; }
      else { more.hidden = true; more.removeAttribute('href'); }
    }

    function show(i, { replace = false } = {}) {
      current = (i + pieces.length) % pieces.length;
      const card = pieces[current];
      fill(card);
      count.textContent = `${current + 1} / ${pieces.length}`;
      mount(card);
      if (replace) { try { history.replaceState({ lb: card.id }, '', hashOf(card)); } catch (e) { /* file:// */ } }
    }

    function openAt(i, { fromHistory = false, fromLoad = false } = {}) {
      if (isOpen) return show(i, { replace: true });
      clearTimeout(closeTimer);
      lb.classList.remove('is-closing');
      isOpen = true;
      show(i);
      root.classList.add('lb-open');
      previews.block();
      if (hasModal) { if (!lb.open) lb.showModal(); } else lb.setAttribute('open', '');
      panel.focus({ preventScroll: true });
      // El botón "atrás" del navegador (o del teléfono) cierra el visor en vez de salir de la página
      if (fromHistory) pushed = true;
      else if (!fromLoad) {
        try { history.pushState({ lb: pieces[current].id }, '', hashOf(pieces[current])); pushed = true; } catch (e) { pushed = false; }
      }
    }

    function closeLb({ fromHistory = false } = {}) {
      if (!isOpen) return;
      isOpen = false;
      const wasPushed = pushed;
      pushed = false;
      const finish = () => {
        lb.classList.remove('is-closing');
        unmount();
        if (hasModal) { if (lb.open) lb.close(); } else lb.removeAttribute('open');
        root.classList.remove('lb-open');
        previews.unblock();
        const card = pieces[current], link = card && $('.media', card);
        if (link) {
          link.focus({ preventScroll: true });
          if (current !== opener) card.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        }
      };
      if (reduceMotion.matches) finish();
      else { lb.classList.add('is-closing'); closeTimer = setTimeout(finish, 200); }
      if (!fromHistory) {
        if (wasPushed) { try { history.back(); } catch (e) { /* nada */ } }
        else { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ } }
      }
    }

    const go = d => { if (isOpen) show(current + d, { replace: true }); };

    // Abrir desde las tarjetas (sin JS, el enlace abre el archivo MP4 directamente)
    pieces.forEach((card, i) => {
      const link = $('.media', card);
      link.addEventListener('click', e => {
        if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // permite "abrir en pestaña nueva"
        e.preventDefault();
        opener = i; openAt(i);
      });
      card.addEventListener('click', e => { // toda la tarjeta es clicable, salvo sus enlaces
        if (e.target.closest('a, button')) return;
        opener = i; openAt(i);
      });
    });

    $('#lb-prev').addEventListener('click', () => go(-1));
    $('#lb-next').addEventListener('click', () => go(1));
    $('#lb-close').addEventListener('click', () => closeLb());

    // Clic en el fondo oscuro: solo si el clic empezó y terminó fuera del video
    let downOutside = false;
    lb.addEventListener('pointerdown', e => { downOutside = e.target === lb || e.target === panel; });
    lb.addEventListener('click', e => { if (downOutside && (e.target === lb || e.target === panel)) closeLb(); });

    lb.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      const onMedia = t instanceof HTMLMediaElement;               // con el video enfocado, las flechas avanzan/retroceden el video
      const onControl = t instanceof HTMLElement && t.closest('button, a, input, select, textarea');
      const v = $('video', stage);
      if (e.key === 'ArrowRight' && !onMedia) { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft' && !onMedia) { e.preventDefault(); go(-1); }
      else if ((e.key === ' ' || e.key === 'k' || e.key === 'K') && !onMedia && !onControl && v) { e.preventDefault(); if (v.paused) v.play().catch(() => {}); else v.pause(); }
      else if ((e.key === 'm' || e.key === 'M') && !onMedia && v) v.muted = !v.muted;
      else if ((e.key === 'f' || e.key === 'F') && !onMedia && v) {
        if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
    });

    lb.addEventListener('cancel', e => { e.preventDefault(); closeLb(); }); // tecla Esc
    lb.addEventListener('close', () => { if (isOpen) closeLb(); });

    addEventListener('popstate', e => {
      const id = e.state && e.state.lb;
      if (isOpen && !id) return closeLb({ fromHistory: true });
      const i = id ? pieces.findIndex(c => c.id === id) : -1;
      if (i > -1) { if (isOpen) show(i); else { opener = i; openAt(i, { fromHistory: true }); } }
    });

    // Enlace directo a una pieza: tusitio.com/#video-redman
    const indexFromHash = () => {
      const m = /^#video-([\w-]+)$/.exec(location.hash);
      return m ? pieces.findIndex(c => c.id === m[1]) : -1;
    };
    const openFromHash = () => { const i = indexFromHash(); if (i > -1 && !isOpen) { opener = i; openAt(i, { fromLoad: true }); } };
    onReady(openFromHash);
    addEventListener('hashchange', () => { if (loaderDone) openFromHash(); });
  });

  // ===== Reloj de Colombia =====
  safe('reloj', () => {
    const clock = $('#clock');
    if (!clock) return;
    const fmt = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
    const tick = () => { clock.textContent = fmt.format(new Date()); setTimeout(tick, 60000 - (Date.now() % 60000) + 50); };
    tick();
  });
})();
