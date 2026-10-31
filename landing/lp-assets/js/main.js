/* ParcOS landing: JS minimal, fără dependențe. Telemetrie zero-dependency & POST /api/lead. */
(function () {
  'use strict';
  var WA_NUMBER = '40758511040';

  /* An curent în footer */
  var an = document.getElementById('an');
  if (an) an.textContent = String(new Date().getFullYear());

  /* 1) Video decorativ din hero, încărcat leneș, DUPĂ load.
        Nu se încarcă la: prefers-reduced-motion, Save-Data, conexiune 2G/3G,
        ecrane mici cu conexiune necunoscută. Posterul static rămâne mereu. */
  function shouldLoadVideo() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c) {
      if (c.saveData) return false;
      if (/(^|-)?(slow-2g|2g|3g)$/.test(c.effectiveType || '')) return false;
    }
    return true;
  }

  function loadVideo() {
    var v = document.querySelector('.showroom-video');
    if (!v || !shouldLoadVideo()) return;
    var canWebm = v.canPlayType('video/webm; codecs="vp9"');
    var src = canWebm ? v.getAttribute('data-src-webm') : v.getAttribute('data-src-mp4');
    if (!src) return;
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.src = src;
    v.addEventListener('playing', function () { v.classList.add('is-playing'); }, { once: true });
    var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) tryPlay(); else v.pause(); });
      }, { threshold: 0.15 }).observe(v);
    } else {
      tryPlay();
    }
  }
  if (document.readyState === 'complete') setTimeout(loadVideo, 300);
  else window.addEventListener('load', function () { setTimeout(loadVideo, 300); });

  /* 1b) Prețuri: toggle lunar/anual + contorul de locuri „Parc Fondator”.
        Singura sursă pentru numărul de locuri: atributul data-locuri-ramase de pe <section id="pret"> din index.html. */
  var pret = document.getElementById('pret');
  if (pret) {
    var btns = pret.querySelectorAll('.bill-btn');
    var setBill = function (mode) {
      var k = mode === 'anual' ? 'data-a' : 'data-m';
      pret.querySelectorAll('[data-m]').forEach(function (el) { var t = el.getAttribute(k); if (t) el.textContent = t; });
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-bill') === mode)); });
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { setBill(b.getAttribute('data-bill')); }); });

    var left = parseInt(pret.getAttribute('data-locuri-ramase'), 10);
    var total = parseInt(pret.getAttribute('data-locuri-total'), 10) || 10;
    var until = pret.getAttribute('data-fondator-pana'); // AAAA-LL-ZZ, inclusiv (ora României)
    var expired = until ? Date.now() > new Date(until + 'T23:59:59+02:00').getTime() : false;
    var leftEl = pret.querySelector('[data-founder-left]');
    var box = pret.querySelector('.founder');
    if (leftEl && !isNaN(left)) {
      if (expired || left <= 0) {
        leftEl.textContent = expired ? 'Oferta de fondator s-a încheiat.' : 'Toate cele ' + total + ' locuri de fondator s-au ocupat.';
        if (box) box.classList.add('is-closed');
        var ctaT = pret.querySelector('[data-founder-cta-text]');
        if (ctaT) ctaT.textContent = 'Pornește testul de 14 zile';
      } else {
        leftEl.textContent = left === 1 ? 'Mai este 1 loc din ' + total + '.' : 'Mai sunt ' + left + ' locuri din ' + total + '.';
      }
    }
  }

  /* 2) Telemetrie pasivă vizitatori & tracking CTA (Wave 2, zero dependențe) */
  function detectTrafficSource() {
    try {
      var search = window.location.search;
      var src = null;
      if (typeof URLSearchParams !== 'undefined') {
        var params = new URLSearchParams(search);
        src = params.get('src') || params.get('utm_source');
      } else {
        var m = search.match(/[?&](?:src|utm_source)=([^&#]+)/);
        if (m) src = decodeURIComponent(m[1]);
      }
      if (src) return src.toLowerCase();
      var ref = (document.referrer || '').toLowerCase();
      if (!ref) return 'direct';
      if (ref.indexOf('olx') !== -1) return 'olx';
      if (ref.indexOf('autovit') !== -1) return 'autovit';
      if (ref.indexOf('google') !== -1) return 'google';
      if (ref.indexOf('facebook') !== -1 || ref.indexOf('fb.com') !== -1 || ref.indexOf('fb.me') !== -1) return 'facebook';
      if (ref.indexOf('instagram') !== -1) return 'instagram';
      if (ref.indexOf('tiktok') !== -1) return 'tiktok';
      return 'direct';
    } catch (e) {
      return 'direct';
    }
  }

  function sendTrafficBeacon(eventType, extra) {
    try {
      var src = detectTrafficSource();
      var payload = JSON.stringify({
        eventType: eventType || 'pageview',
        dealerSlug: 'parcos',
        pagePath: window.location.pathname || '/',
        referrer: document.referrer || '',
        source: src,
        metadata: extra || {}
      });
      var url = '/api/telemetry/traffic-event';
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(url, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }

  // Expunere opțională pentru inspecție / teste QA
  try {
    window.sendTrafficBeacon = sendTrafficBeacon;
    window.detectTrafficSource = detectTrafficSource;
  } catch (e) {}

  // Înregistrare automată pageview la nivel de sesiune tab
  try {
    if (!sessionStorage.getItem('parcos_lp_viewed')) {
      sendTrafficBeacon('pageview');
      sessionStorage.setItem('parcos_lp_viewed', '1');
    }
  } catch (e) {
    sendTrafficBeacon('pageview');
  }

  // Click listeners pe toate butoanele de acțiune (WhatsApp & Telefon)
  document.addEventListener('click', function (ev) {
    try {
      var target = ev.target;
      var el = null;
      if (target && target.closest) {
        el = target.closest('[data-wa], a[href*="wa.me"], a[href^="tel:"]');
      } else {
        while (target && target !== document) {
          if (target.matches && (target.matches('[data-wa]') || target.matches('a[href*="wa.me"]') || target.matches('a[href^="tel:"]'))) {
            el = target;
            break;
          }
          target = target.parentElement;
        }
      }
      if (!el) return;
      var href = el.getAttribute('href') || '';
      var isWa = el.hasAttribute('data-wa') || href.indexOf('wa.me') !== -1;
      var isTel = href.indexOf('tel:') === 0;

      if (isWa) {
        sendTrafficBeacon('click_whatsapp', {
          ctaText: (el.textContent || '').trim().slice(0, 60),
          href: href
        });
      } else if (isTel) {
        sendTrafficBeacon('click_phone', {
          ctaText: (el.textContent || '').trim().slice(0, 60),
          href: href
        });
      }
    } catch (e) {}
  });

  /* 3) Formular lead → POST /api/lead; dacă endpoint-ul eșuează, deschidem WhatsApp cu datele completate. */
  var form = document.getElementById('lead-form');
  if (form) {
    var statusEl = document.getElementById('form-status');
    var btn = form.querySelector('button[type=submit]');

    var setStatus = function (msg, cls) {
      if (statusEl) {
        statusEl.textContent = msg;
        statusEl.className = 'form-status' + (cls ? ' ' + cls : '');
      }
    };
    var normPhone = function (t) { return (t || '').replace(/[\s.\-()]/g, ''); };
    var validPhone = function (t) { return /^(\+?40|0040|0)7\d{8}$|^(\+?40|0040|0)[23]\d{8}$/.test(normPhone(t)); };

    var waFallback = function (d) {
      var txt = 'Bună ziua! Aș vrea detalii despre ParcOS.\nNume: ' + d.nume + '\nTelefon: ' + d.telefon + (d.parc ? '\nParc: ' + d.parc : '');
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(txt);
      setStatus('Nu am putut trimite formularul. Îți deschidem WhatsApp cu datele completate.', 'err');
      // Notă: cu 'noopener' window.open întoarce mereu null, așa că setăm opener=null manual.
      var w = window.open(url, '_blank');
      if (w) { try { w.opener = null; } catch (e) {} }
      else { window.location.href = url; } // popup blocat: navigăm direct
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nume = form.nume.value.trim();
      var telefon = form.telefon.value.trim();
      var parc = form.parc.value.trim();
      var ok = true;
      [form.nume, form.telefon, form.consent].forEach(function (el) { el.removeAttribute('aria-invalid'); });
      if (nume.length < 2) { form.nume.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!validPhone(telefon)) { form.telefon.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!form.consent.checked) { form.consent.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!ok) {
        setStatus('Completează numele, un număr de telefon valid și bifează acordul.', 'err');
        var first = form.querySelector('[aria-invalid=true]');
        if (first) first.focus();
        return;
      }
      if (form.website.value) { setStatus('Mulțumim! Te sunăm în curând.', 'ok'); return; } // honeypot

      var data = { nume: nume, telefon: normPhone(telefon), parc: parc, consent: true, sursa: 'parcos.ro', website: '' };
      btn.disabled = true;
      setStatus('Se trimite…');
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);

      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined,
        credentials: 'omit'
      }).then(function (r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        setStatus('Mulțumim, ' + nume.split(' ')[0] + '! Te sunăm în curând.', 'ok');
        form.reset();
        sendTrafficBeacon('submit_lead', { name: data.nume, phone: data.telefon });
      }).catch(function () {
        clearTimeout(timer);
        waFallback(data);
      }).then(function () { btn.disabled = false; });
    });
  }

  /* 1c) Video Player Switcher: Spot Comercial (1 min) vs Tur Complet (6 min) */
  window.switchParcosVideo = function (type) {
    var v = document.getElementById('parcos-showcase-video');
    var s = document.getElementById('parcos-video-source');
    var bShort = document.getElementById('tab-short');
    var bFull = document.getElementById('tab-full');
    if (!v || !s) return;
    var targetSrc = type === 'full'
      ? '/lp-assets/video/parcos-explicativ-notebooklm.mp4?v=20261031_1210'
      : '/lp-assets/video/parcos-commercial-short.mp4?v=20261031_1235';
    if (s.getAttribute('src') === targetSrc) return;
    s.setAttribute('src', targetSrc);
    v.load();
    v.play().catch(function () {});
    if (bShort && bFull) {
      bShort.classList.toggle('is-active', type === 'short');
      bShort.setAttribute('aria-selected', String(type === 'short'));
      bFull.classList.toggle('is-active', type === 'full');
      bFull.setAttribute('aria-selected', String(type === 'full'));
    }
  };

})();
