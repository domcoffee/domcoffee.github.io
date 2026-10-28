// Skeleton loading. While a photo is still on its way, its frame pulses (a flat
// color, no gradient) and the photo fades in once it arrives. Photos that are
// already loaded are left alone, and without this script photos just appear.
(function () {
  var imgs = document.querySelectorAll('.ph img, .pf img');
  Array.prototype.forEach.call(imgs, function (img) {
    if (!img.getAttribute('src') || (img.complete && img.naturalWidth)) return;
    var box = img.closest('.ph, .pf');
    box.classList.add('is-loading');
    img.classList.add('sk-wait');
    function done() {
      box.classList.remove('is-loading');
      img.classList.add('sk-in');
      img.classList.remove('sk-wait');
    }
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
})();
