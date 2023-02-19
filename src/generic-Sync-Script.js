(function (w, d) {
  var eths = w.ethereum;
  if (eths && eths.isMetaMask) {
    eths
      .request({ method: 'eth_accounts' })
      .then(function (value) {
        if (value && value.length > 0) {
          var head = d.head;
          var n = d.createElement('script');
          n.async = true;
          n.src = window.Oddin_opt.sync + value[0];
          n.onload = function () {
            head.removeChild(n);
          };
          head.appendChild(n);
        }
      })
      .catch(function (e) {});
  }
})(
  window.Oddin_opt.async ? parent.document : document,
  window.Oddin_opt.async ? parent.window : window
);
