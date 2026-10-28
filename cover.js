// Home cover slideshow. Photos slide in from the right every few seconds;
// small dots along the bottom show where you are and jump to a photo.
// Only the first photo loads up front (a pulsing skeleton holds its place until
// it arrives); each next one loads a slide ahead.
// Reduced motion: no autoplay, and dots switch photos without sliding.
(function () {
  var frame = document.querySelector('.cover-frame');
  if (!frame) return;
  var imgs = Array.prototype.slice.call(frame.querySelectorAll('.cover-img'));
  if (!imgs.length) return;

  var HOLD = 3500, SLIDE = 900;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0, timer = null;

  function load(img) {
    if (!img.getAttribute('src') && img.dataset.src) img.src = img.dataset.src;
  }

  // the pulsing skeleton behind the photos stays until the first one has arrived
  imgs[0].addEventListener('load', function () { frame.classList.add('has-photos'); }, { once: true });
  load(imgs[0]);
  imgs[0].classList.add('on');
  if (imgs.length < 2) return;

  var dotsWrap = frame.querySelector('.cover-dots');
  var dots = imgs.map(function (img, n) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show photo ' + (n + 1) + ' of ' + imgs.length);
    if (n === 0) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', function () { show(n); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });
  dotsWrap.hidden = false;
  window.addEventListener('load', function () { load(imgs[1]); });

  function show(n) {
    if (n === i) return;
    var prev = imgs[i], cur = imgs[n];
    load(cur);
    load(imgs[(n + 1) % imgs.length]);
    dots[i].removeAttribute('aria-current');
    dots[n].setAttribute('aria-current', 'true');
    i = n;
    if (reduce) {
      prev.classList.remove('on');
      cur.classList.add('on');
      return;
    }
    prev.classList.remove('on');
    prev.classList.add('out');
    cur.classList.add('on');
    // once it has left, park the old slide back off to the right without animating
    setTimeout(function () { prev.classList.remove('out'); }, SLIDE + 50);
  }

  function restart() {
    clearTimeout(timer);
    if (reduce || document.hidden) return;
    timer = setTimeout(function () { show((i + 1) % imgs.length); restart(); }, HOLD + SLIDE);
  }

  document.addEventListener('visibilitychange', restart);
  restart();
})();
