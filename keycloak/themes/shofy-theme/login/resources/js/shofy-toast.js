(function () {
  var DURATION = 5000;

  var ICONS = {
    error:   '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
    warning: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
    success: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
    info:    '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>',
  };

  var TITLES = window.SHOFY_TOAST_TITLES || {
    error: 'Error', warning: 'Warning', success: 'Success', info: 'Notice',
  };

  function getContainer() {
    var el = document.getElementById('shofy-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'shofy-toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  function dismiss(toast) {
    toast.classList.add('shofy-toast-out');
    toast.addEventListener('animationend', function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
  }

  window.shofyToast = function (type, message) {
    if (!message || !message.trim()) return;
    type = ['error', 'warning', 'success', 'info'].indexOf(type) >= 0 ? type : 'info';

    var toast = document.createElement('div');
    toast.className = 'shofy-toast shofy-toast-' + type;

    var progress = document.createElement('div');
    progress.className = 'shofy-toast-progress';
    progress.style.animationDuration = DURATION + 'ms';

    toast.innerHTML =
      '<span class="shofy-toast-icon">' + (ICONS[type] || ICONS.info) + '</span>' +
      '<div class="shofy-toast-body">' +
        '<div class="shofy-toast-title">' + TITLES[type] + '</div>' +
        '<div class="shofy-toast-message">' + message + '</div>' +
      '</div>' +
      '<button class="shofy-toast-close" aria-label="Close">' +
        '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>' +
      '</button>';

    toast.appendChild(progress);
    getContainer().appendChild(toast);

    var timer = setTimeout(function () { dismiss(toast); }, DURATION);
    toast.querySelector('.shofy-toast-close').addEventListener('click', function () {
      clearTimeout(timer);
      dismiss(toast);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    var alerts = document.querySelectorAll('.shofy-alert');
    alerts.forEach(function (el) {
      var type = 'info';
      var cls = el.className;
      if (cls.indexOf('error') >= 0) type = 'error';
      else if (cls.indexOf('warning') >= 0) type = 'warning';
      else if (cls.indexOf('success') >= 0) type = 'success';
      var text = el.innerText.trim();
      if (text) window.shofyToast(type, text);
    });

    var fieldErrors = document.querySelectorAll('.shofy-field-error');
    var seen = {};
    fieldErrors.forEach(function (el) {
      if (el.style.display === 'none') return;
      var text = el.innerText.trim();
      if (text && !seen[text]) {
        seen[text] = true;
        window.shofyToast('error', text);
      }
    });
  });
})();
