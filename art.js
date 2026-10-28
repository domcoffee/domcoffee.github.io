// Art cards. Clicking a work lifts it out of the gallery, grows it to a readable
// size in the middle of the screen, and flips it over to its statement (with a
// mini version of the piece on the back). The ← → buttons or arrow keys step to
// the previous or next work without flipping back (they stop at the first and
// last work; no wrap-around). Clicking the card, the backdrop, the close button,
// or pressing Escape flips it back into the spot of whichever work is showing.
// The picture on the back opens a full-screen zoom view: click or tap to zoom in
// where you point, drag to move around, scroll or pinch to zoom further.
// The statement text lives in each card's <figcaption>, so it is in the page
// for screen readers and search even without this script.
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.art-card'));
  if (!cards.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ease = 'cubic-bezier(0.32,0.72,0,1)';
  var total = String(cards.length).padStart(2, '0');
  var open = null;

  function box(el) {
    var r = el.getBoundingClientRect();
    return { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' };
  }
  function target() {
    var w = Math.min(920, window.innerWidth - 32);
    var h = Math.min(window.innerWidth < 720 ? window.innerHeight - 96 : 540, window.innerHeight - 64);
    return { left: (window.innerWidth - w) / 2 + 'px', top: (window.innerHeight - h) / 2 + 'px', width: w + 'px', height: h + 'px' };
  }

  // put one work's picture, number, and statement onto the open card
  function fill(layer, card) {
    var img = card.querySelector('img');
    var src = img.currentSrc || img.src;
    layer.querySelector('.flip-front img').src = src;
    var mini = layer.querySelector('.flip-mini img');
    mini.src = src;
    mini.alt = img.alt;
    var text = layer.querySelector('.flip-text');
    text.innerHTML = '<p class="flip-kick">' + card.getAttribute('data-n') + ' / ' + total + '</p>';
    Array.prototype.forEach.call(card.querySelector('.art-info').children, function (c) { text.appendChild(c.cloneNode(true)); });
    text.scrollTop = 0;
    layer.querySelector('.flip-card').setAttribute('aria-label', img.alt);
    var i = cards.indexOf(card);
    layer.querySelector('.flip-prev').disabled = i === 0;
    layer.querySelector('.flip-next').disabled = i === cards.length - 1;
  }

  function show(card) {
    if (open) return;
    var btn = card.querySelector('.art-flip');
    var layer = document.createElement('div');
    layer.className = 'flip-layer';
    layer.innerHTML =
      '<div class="flip-backdrop"></div>' +
      '<div class="flip-card" role="dialog" aria-modal="true" tabindex="-1">' +
        '<div class="flip-inner">' +
          '<div class="flip-face flip-front"><img alt=""></div>' +
          '<div class="flip-face flip-back">' +
            '<div class="flip-mini"><button type="button" class="flip-zoom" aria-label="Zoom in on the picture"><img alt=""></button><span class="zoom-badge" aria-hidden="true">+</span></div>' +
            '<div class="flip-text"></div>' +
            '<div class="flip-foot">' +
              '<button type="button" class="flip-close" aria-label="Flip back">↻ Flip back</button>' +
              '<div class="flip-nav">' +
                '<button type="button" class="flip-prev" aria-label="Previous work">←</button>' +
                '<button type="button" class="flip-next" aria-label="Next work">→</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    fill(layer, card);
    var dialog = layer.querySelector('.flip-card');
    document.body.appendChild(layer);
    document.body.classList.add('flip-open');

    var from = box(btn), to = target();
    card.classList.add('is-out');
    open = { card: card, btn: btn, layer: layer, dialog: dialog };

    Object.assign(dialog.style, to);
    if (reduce) {
      layer.classList.add('in');
    } else {
      dialog.animate([from, to], { duration: 650, easing: ease });
      layer.querySelector('.flip-inner').animate(
        [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
        { duration: 650, easing: ease, fill: 'forwards' }
      );
      requestAnimationFrame(function () { layer.classList.add('in'); });
    }
    layer.querySelector('.flip-close').focus({ preventScroll: true });

    layer.querySelector('.flip-backdrop').addEventListener('click', hide);
    // a mouse click on ← → hands focus back to the card, so the arrow keys that follow don't
    // light up the button with the keyboard focus ring (keyboard presses keep focus on the button)
    function nav(dir) {
      return function (e) {
        step(dir);
        if (e.detail) dialog.focus({ preventScroll: true });
      };
    }
    layer.querySelector('.flip-prev').addEventListener('click', nav(-1));
    layer.querySelector('.flip-next').addEventListener('click', nav(1));
    layer.querySelector('.flip-zoom').addEventListener('click', function () { zoomIn(open); });
    dialog.addEventListener('click', function (e) {
      if (e.target.closest('.flip-nav') || e.target.closest('.flip-mini')) return;
      if (!e.target.closest('.flip-text') || e.target.closest('.flip-close')) hide();
    });
  }

  // previous / next work on the open card; stops at either end
  function step(dir) {
    if (!open || open.closing || open.stepping || zoom) return;
    var next = cards[cards.indexOf(open.card) + dir];
    if (!next) return;
    var o = open;
    o.card.classList.remove('is-out');
    next.classList.add('is-out');
    o.card = next;
    o.btn = next.querySelector('.art-flip');
    var parts = [o.layer.querySelector('.flip-mini'), o.layer.querySelector('.flip-text')];
    if (reduce) { fill(o.layer, next); return; }
    o.stepping = true;
    var out = parts.map(function (el) {
      return el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-24 * dir) + 'px)' }],
        { duration: 160, easing: 'ease-in', fill: 'forwards' });
    });
    out[0].finished.then(function () {
      fill(o.layer, next);
      out.forEach(function (a) { a.cancel(); });
      parts.forEach(function (el) {
        el.animate([{ opacity: 0, transform: 'translateX(' + (24 * dir) + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, easing: ease });
      });
      o.stepping = false;
    }, function () { o.stepping = false; });
  }

  function hide() {
    if (!open || open.closing || zoom) return;
    var o = open;
    o.closing = true;
    function done() {
      o.layer.remove();
      o.card.classList.remove('is-out');
      document.body.classList.remove('flip-open');
      o.btn.focus({ preventScroll: true });
      open = null;
    }
    o.layer.classList.remove('in');
    // after stepping, the work to fly back to may be off screen: unlock the page scroll and
    // bring it into view first, so the card lands on it
    document.body.classList.remove('flip-open');
    o.btn.scrollIntoView({ block: 'center', behavior: 'instant' });
    if (reduce) { done(); return; }
    var from = box(o.dialog), to = box(o.btn);
    var inner = o.layer.querySelector('.flip-inner');
    inner.getAnimations().forEach(function (a) { a.cancel(); });
    inner.animate([{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(0deg)' }], { duration: 560, easing: ease, fill: 'forwards' });
    o.dialog.animate([from, to], { duration: 560, easing: ease, fill: 'forwards' }).finished.then(done, done);
  }

  // Zoom view. The picture is laid out to fit the screen at scale 1, then moved with
  // translate(tx, ty) scale(s) from its top-left corner. A tap (no drag) zooms in where
  // you pointed, or back out if already zoomed; one pointer drags, two pinch.
  var zoom = null;
  var MAX = 5;

  function zoomIn(o) {
    if (!o || o.closing || o.stepping || zoom) return;
    var mini = o.layer.querySelector('.flip-mini img');
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var z = document.createElement('div');
    z.className = 'zoom-layer';
    z.setAttribute('role', 'dialog');
    z.setAttribute('aria-modal', 'true');
    z.setAttribute('aria-label', mini.alt + ', zoomed');
    z.innerHTML =
      '<div class="zoom-backdrop"></div>' +
      '<img class="zoom-img" alt="" draggable="false">' +
      '<button type="button" class="zoom-close">Close ✕</button>' +
      '<p class="zoom-hint">' + (coarse ? 'Tap or pinch to zoom, drag to move' : 'Click or scroll to zoom, drag to move, Esc to close') + '</p>';
    var img = z.querySelector('.zoom-img');
    img.src = mini.currentSrc || mini.src;
    img.alt = mini.alt;
    document.body.appendChild(z);

    var st = { s: 1, tx: 0, ty: 0, left: 0, top: 0, w: 0, h: 0 };
    zoom = { layer: z, img: img, mini: mini, st: st, o: o };

    zoom.fit = function () {
      var r = mini.naturalWidth && mini.naturalHeight ? mini.naturalWidth / mini.naturalHeight : 1;
      var bw = window.innerWidth - 32, bh = window.innerHeight - 112;
      var w = Math.min(bw, bh * r), h = w / r;
      st.w = w; st.h = h; st.left = (window.innerWidth - w) / 2; st.top = (window.innerHeight - h) / 2;
      Object.assign(img.style, { left: st.left + 'px', top: st.top + 'px', width: w + 'px', height: h + 'px' });
    };
    // keep the picture centered while it is smaller than the screen, and its edges
    // from leaving gaps once it is bigger
    function clamp(s, tx, ty) {
      var vw = window.innerWidth, vh = window.innerHeight;
      var sw = st.w * s, sh = st.h * s;
      tx = sw <= vw ? (st.w - sw) / 2 : Math.min(-st.left, Math.max(vw - st.left - sw, tx));
      ty = sh <= vh ? (st.h - sh) / 2 : Math.min(-st.top, Math.max(vh - st.top - sh, ty));
      return [tx, ty];
    }
    zoom.set = function (s, tx, ty, animate) {
      s = Math.max(1, Math.min(MAX, s));
      var c = clamp(s, tx, ty);
      st.s = s; st.tx = c[0]; st.ty = c[1];
      img.classList.toggle('glide', !!animate && !reduce);
      img.style.transform = 'translate(' + st.tx + 'px,' + st.ty + 'px) scale(' + s + ')';
      z.classList.toggle('zoomed', s > 1.01);
    };
    // new scale s with the screen point (cx, cy) staying put under the pointer
    function about(s, cx, cy, animate) {
      s = Math.max(1, Math.min(MAX, s));
      var px = (cx - st.left - st.tx) / st.s, py = (cy - st.top - st.ty) / st.s;
      zoom.set(s, cx - st.left - px * s, cy - st.top - py * s, animate);
    }
    zoom.fit();
    zoom.set(1, 0, 0);

    var pts = new Map(), moved = 0, last = null, pinch = null, downOnImg = false;
    z.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.zoom-close')) return;
      z.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { moved = 0; last = { x: e.clientX, y: e.clientY }; downOnImg = e.target === img; }
      if (pts.size === 2) {
        var p = Array.from(pts.values());
        pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), s: st.s };
        moved = 99;
      }
      img.classList.remove('glide');
    });
    z.addEventListener('pointermove', function (e) {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) {
        var p = Array.from(pts.values());
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        about(pinch.s * d / pinch.d, (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
        return;
      }
      if (pts.size !== 1 || !last) return;
      var dx = e.clientX - last.x, dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      last = { x: e.clientX, y: e.clientY };
      if (st.s > 1 && moved > 4) { z.classList.add('dragging'); zoom.set(st.s, st.tx + dx, st.ty + dy); }
    });
    function lift(e) {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      z.classList.remove('dragging');
      if (pts.size === 1) { var p = pts.values().next().value; last = { x: p.x, y: p.y }; pinch = null; return; }
      if (pts.size) return;
      pinch = null;
      if (e.type === 'pointercancel' || moved > 6) return;
      // a tap: outside the picture at full view closes, otherwise zoom in or out
      // (pointer capture makes the up event's target the layer, so use where it went down)
      if (st.s > 1.01) zoom.set(1, 0, 0, true);
      else if (downOnImg) about(Math.max(2.5, Math.min(MAX, (mini.naturalWidth || 0) / st.w)), e.clientX, e.clientY, true);
      else zoomOut();
    }
    z.addEventListener('pointerup', lift);
    z.addEventListener('pointercancel', lift);
    z.addEventListener('wheel', function (e) {
      e.preventDefault();
      img.classList.remove('glide');
      about(st.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), e.clientX, e.clientY);
    }, { passive: false });
    z.querySelector('.zoom-close').addEventListener('click', zoomOut);

    z.querySelector('.zoom-close').focus({ preventScroll: true });
    if (reduce) { z.classList.add('in'); return; }
    var m = mini.getBoundingClientRect();
    img.animate([
      { transform: 'translate(' + (m.left - st.left) + 'px,' + (m.top - st.top) + 'px) scale(' + m.width / st.w + ')' },
      { transform: 'translate(0px,0px) scale(1)' }
    ], { duration: 520, easing: ease });
    requestAnimationFrame(function () { z.classList.add('in'); });
  }

  function zoomOut() {
    if (!zoom || zoom.closing) return;
    var zz = zoom;
    zz.closing = true;
    function done() {
      zz.layer.remove();
      zoom = null;
      var b = zz.o.layer.querySelector('.flip-zoom');
      if (b) b.focus({ preventScroll: true });
    }
    zz.layer.classList.remove('in');
    if (reduce) { done(); return; }
    var st = zz.st, m = zz.mini.getBoundingClientRect();
    zz.img.classList.remove('glide');
    zz.img.animate([
      { transform: 'translate(' + st.tx + 'px,' + st.ty + 'px) scale(' + st.s + ')' },
      { transform: 'translate(' + (m.left - st.left) + 'px,' + (m.top - st.top) + 'px) scale(' + m.width / st.w + ')' }
    ], { duration: 420, easing: ease, fill: 'forwards' }).finished.then(done, done);
  }

  cards.forEach(function (card) {
    card.querySelector('.art-flip').addEventListener('click', function () { show(card); });
  });
  document.addEventListener('keydown', function (e) {
    if (zoom) { if (e.key === 'Escape') zoomOut(); return; }
    if (!open) return;
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
  window.addEventListener('resize', function () {
    if (open && !open.closing) Object.assign(open.dialog.style, target());
    if (zoom) { zoom.fit(); zoom.set(1, 0, 0); }
  });
})();
