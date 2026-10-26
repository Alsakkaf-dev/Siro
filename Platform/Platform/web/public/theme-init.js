(function () {
  var d = document.documentElement;
  try {
    var t = localStorage.getItem('platform.theme');
    if (t === 'system') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t !== 'light' && t !== 'dark') t = 'light';
    d.setAttribute('data-theme', t);
    var a = localStorage.getItem('platform.accent');
    if (a && /^[a-z]{3,10}$/.test(a) && a !== 'indigo') d.setAttribute('data-accent', a);
    if (localStorage.getItem('platform.motion') === 'off') d.setAttribute('data-motion', 'off');
  } catch (e) {
    d.setAttribute('data-theme', 'light');
  }
})();
