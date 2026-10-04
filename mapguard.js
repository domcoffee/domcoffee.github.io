// Click-to-interact guard for the embedded coffee map. Until the map is
// clicked, a cover sits over the iframe so scrolling the page never gets
// caught by the map. It re-arms when the pointer leaves the map (desktop),
// or on a tap outside it or when it scrolls out of view (touch).
(function () {
  var frames = document.querySelectorAll('.embed.map, .home-map');
  if (!frames.length) return;
  var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>';

  Array.prototype.forEach.call(frames, function (wrap) {
    var guard = document.createElement('button');
    guard.type = 'button';
    guard.className = 'map-guard';
    guard.setAttribute('aria-label', 'Interact with the map');
    guard.innerHTML = '<span class="map-guard-msg">' + icon + '<span>' + (touch ? 'Tap' : 'Click') + ' to interact</span></span>';
    wrap.appendChild(guard);

    var arm = function () { wrap.classList.remove('map-live'); };
    guard.addEventListener('click', function () {
      wrap.classList.add('map-live');
      var f = wrap.querySelector('iframe');
      if (f) f.focus();
    });

    if (touch) {
      document.addEventListener('touchstart', function (e) {
        if (!wrap.contains(e.target)) arm();
      }, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) arm();
        }).observe(wrap);
      }
    } else {
      wrap.addEventListener('mouseleave', arm);
    }
  });
})();
