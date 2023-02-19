(function (document, int_window) {
  var options = window.Oddin_opt;
  if (typeof int_window.Oddin === 'undefined') {
    int_window.Oddin = {
      ready: false,
      startTime: new Date().getTime(),
      _register: function (f) {
        if (
          document.readyState === 'loaded' ||
          document.readyState === 'interactive' ||
          document.readyState === 'complete'
        ) {
          /*setTimeout(function(){f();}, 50);*/
          f();
        } else if (document.addEventListener) {
          addReadyEventListener(document, 'DOMContentLoaded', f);
          addReadyEventListener(int_window, 'load', f);
        } else {
          addReadyEventListener(document, 'onreadystatechange', f);
          addReadyEventListener(int_window, 'load', f);
        }
      },
    };
  }
  if (options.enabled) {
    int_window.Oddin._register(
      handle.bind(null, int_window.Oddin, options.cid, options)
    );
  }
  function addReadyEventListener(obj, event, f) {
    obj.addEventListener(
      event,
      function eload() {
        obj.removeEventListener(event, eload, false);
        f();
      },
      false
    );
  }
  function getArticle(options) {
    var res = null;
    var cls_whitelist = options.articleElements.whitelist;
    for (var i in cls_whitelist) {
      if (cls_whitelist[i].HtmlId) {
        res = document.getElementById(cls_whitelist[i].HtmlId);
        if (res) return [res, cls_whitelist[i].Tags];
      }
      if (cls_whitelist[i].Class) {
        res = document.getElementsByClassName(cls_whitelist[i].Class)[0];
        if (res) return [res, cls_whitelist[i].Tags];
      }
    }
    if (
      (res === null ||
        (cls_whitelist.length > 0 && cls_whitelist[0].HtmlId === null)) &&
      options.insideIframe
    ) {
      var b = document.getElementsByTagName('body')[0];
      var n_d = 0;
      for (var c = 0; c < b.children.length; c++) {
        if (
          b.children[c].tagName !== 'SCRIPT' &&
          b.children[c].tagName !== 'NOSCRIPT' &&
          b.children[c].tagName !== 'IFRAME' &&
          b.children[c].tagName !== 'INS' &&
          b.children[c].tagName !== 'TEMPLATE' &&
          b.children[c].tagName === 'IMG' &&
          !b.children[c].classList.contains('tracking')
        ) {
          if (
            b.children[c].tagName === 'DIV' ||
            b.children[c].tagName === 'SPAN'
          ) {
            n_d++;
            if (n_d > 2) return null;
          } else {
            return null;
          }
        }
      }
      return [b, ['p']];
    }
    return [res, ['p']];
  }
  function getNode(node, tags, options) {
    if (!node) {
      return null;
    }
    var defaultTags = ['p'];
    var noSizeTags = ['br'];
    var currentTag =
      tags && tags.length > 0 ? tags : [options.tagName] || defaultTags;
    var parags = node.querySelectorAll(currentTag);
    if (parags.length >= options.paragraphNum) {
      var j = 0;
      for (var i = 0; i < parags.length; i++) {
        var noSize =
          noSizeTags.filter(function (x) {
            return currentTag.indexOf(x) !== -1;
          }).length > 0;
        if (noSize || (parags[i] && parags[i].offsetWidth >= 256)) {
          j++;
        }
        if (j === options.paragraphNum) {
          return parags[i];
        }
      }
      return null;
    } else {
      if (parags.length > 0) {
        return parags[parags.length - 1];
      }
      return node;
    }
  }
  function createWrapper(content, csslink) {
    var bodyStyle = 'margin: 0px;padding: 0px;';
    var wrapperBody = '<body>' + content + '</body>';
    return (
      '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link href=' +
      csslink +
      ' rel="stylesheet"/><title>Oddin UAH</title><style>body{' +
      bodyStyle +
      '}</style></head>' +
      wrapperBody +
      '</html>'
    );
  }
  function fitIframeSize(spanId) {
    var ifrmId = 'oddin_content_ifrm' + spanId;
    var ifrm = document.getElementById(ifrmId);

    var win = ifrm.contentWindow;
    var doc = win.document;
    var html = doc.documentElement;

    if (html) {
      var contentElement = ifrm.contentDocument.getElementById('oddin-content');
      if (contentElement) {
        ifrm.style.height = contentElement.scrollHeight + 8 + 'px';
      }
    }
  }
  function createIframeContent(
    parent,
    width,
    height,
    spanId,
    innerContent,
    csslink
  ) {
    var ifrmId = 'oddin_content_ifrm' + spanId;
    var ifrm = document.getElementById(ifrmId);
    if (!ifrm || ifrm === undefined || ifrm === null)
      ifrm = document.createElement('iframe');
    ifrm.setAttribute('id', ifrmId);
    ifrm.scrolling = 'no';
    ifrm.frameborder = '0';
    ifrm.marginwidth = '0';
    ifrm.marginheight = '0';
    ifrm.style.cssText =
      'position:relative;margin:0 auto;border:0px;display:inline-block;text-align:center;vertical-align:middle;max-width:unset;max-height:unset;width:' +
      '100%!important;height:' +
      (height > 1 ? height + 'px' : 'auto') +
      '!important;';
    parent.appendChild(ifrm);
    var doc = ifrm.contentWindow.document;
    var content = createWrapper(innerContent, csslink);
    doc.open('text/html', 'replace');
    doc.write(content);
    doc.close();
    if (height <= 1) {
      ifrm.addEventListener(
        'load',
        requestAnimationFrame.bind(this, fitIframeSize.bind(this, spanId))
      );
      int_window.addEventListener(
        'resize',
        requestAnimationFrame.bind(this, fitIframeSize.bind(this, spanId))
      );
    }
  }
  function getScript(url) {
    var head = document.head;
    var n = document.createElement('script');
    n.async = true;
    n.src = url;
    n.onload = function () {
      head.removeChild(n);
    };
    head.appendChild(n);
  }
  function oddinSync(syncEndpoint) {
    var eths = int_window.ethereum;
    if (eths && eths.isMetaMask) {
      eths
        .request({ method: 'eth_accounts' })
        .then(function (value) {
          if (value && value.length > 0) getScript(syncEndpoint + value[0]);
        })
        .catch(function (e) {});
    }
  }
  function handle(it, uid, options) {
    if (uid === -1 || it.ready) return;
    it.ready = true;
    var i = new Date().getTime();
    var start = getArticle(options);
    if (!start) {
      return;
    }
    var p = getNode(start[0], start[1], options);
    if (!p) {
      return;
    }
    // var offsetW = p.offsetWidth;
    var adspot = document.createElement('div');
    adspot.setAttribute('id', 'oddin_content_' + i);
    adspot.style.cssText =
      'position:relative; overflow:hidden;text-align:center;clear:both;width:100%';
    if (p === document.body) {
      p.insertAdjacentElement('afterbegin', adspot);
    } else {
      p.parentNode.insertBefore(adspot, p.nextSibling);
    }
    createIframeContent(
      adspot,
      options.width,
      options.height,
      i,
      options.content,
      options.csslink
    );
    oddinSync(options.sync);
  }
})(
  window.Oddin_opt.async ? parent.document : document,
  window.Oddin_opt.async ? parent.window : window
);
