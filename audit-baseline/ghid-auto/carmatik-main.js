(function () {
    'use strict';

    // Mobile nav drawer (carmatik.ro style)
    var openBtn = document.querySelector('[data-menu-open]');
    var closeBtn = document.querySelector('[data-menu-close]');
    var nav = document.querySelector('[data-nav]');
    var backdrop = document.querySelector('[data-backdrop]');

    function setMenu(open) {
        if (!nav) { return; }
        nav.classList.toggle('open', open);
        if (backdrop) { backdrop.classList.toggle('active', open); }
        document.body.classList.toggle('no-scroll', open);
        if (openBtn) { openBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    }

    if (openBtn) { openBtn.addEventListener('click', function () { setMenu(true); }); }
    if (closeBtn) { closeBtn.addEventListener('click', function () { setMenu(false); }); }
    if (backdrop) { backdrop.addEventListener('click', function () { setMenu(false); }); }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { setMenu(false); }
    });

    // TOC scroll-spy
    var toc = document.querySelector('[data-toc]');
    if (toc && 'IntersectionObserver' in window) {
        var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
        var map = {};
        var sections = [];
        links.forEach(function (link) {
            var id = link.getAttribute('href').slice(1);
            var el = document.getElementById(id);
            if (el) { map[id] = link; sections.push(el); }
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    links.forEach(function (l) { l.classList.remove('active'); });
                    var active = map[entry.target.id];
                    if (active) { active.classList.add('active'); }
                }
            });
        }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

        sections.forEach(function (s) { observer.observe(s); });
    }

    // GTM event tracking — CTA buttons (WhatsApp/insurance), car cards and
    // "mașini" links. Any element with data-gtm fires an event named after it;
    // its other data-* attributes become the event params.
    window.dataLayer = window.dataLayer || [];
    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-gtm]');
        if (!el) { return; }
        // Prefix "guide_" so guide events are unmistakable in GA4/GTM.
        var payload = { event: 'guide_' + el.getAttribute('data-gtm').replace(/-/g, '_') };
        Array.prototype.forEach.call(el.attributes, function (attr) {
            if (attr.name.indexOf('data-') === 0 && attr.name !== 'data-gtm') {
                payload[attr.name.slice(5).replace(/-/g, '_')] = attr.value;
            }
        });
        window.dataLayer.push(payload);
    });

    // Search autocomplete — dropdown of matching articles on every search box.
    var suggestUrl = window.GHID_SUGGEST_URL;
    if (suggestUrl) {
        var esc = function (s) {
            var d = document.createElement('div');
            d.textContent = s == null ? '' : s;
            return d.innerHTML;
        };
        Array.prototype.forEach.call(document.querySelectorAll('form[role="search"]'), function (form) {
            var input = form.querySelector('input[type="search"]');
            if (!input) { return; }
            input.setAttribute('autocomplete', 'off');
            // Dropdown lives on <body> so no ancestor's overflow:hidden can clip it.
            var box = document.createElement('div');
            box.className = 'ac-results';
            box.setAttribute('role', 'listbox');
            document.body.appendChild(box);
            var items = [], active = -1, timer, lastQ = null;

            function place() {
                var r = form.getBoundingClientRect();
                box.style.left = (r.left + window.pageXOffset) + 'px';
                box.style.top = (r.bottom + window.pageYOffset + 6) + 'px';
                box.style.width = r.width + 'px';
            }
            function close() { box.classList.remove('open'); box.innerHTML = ''; items = []; active = -1; }
            function highlight() {
                items.forEach(function (it, i) { it.classList.toggle('active', i === active); });
            }
            function render(results, q) {
                if (!results.length) { close(); return; }
                box.innerHTML = results.map(function (r) {
                    return '<a class="ac-item" role="option" href="' + r.url + '" ' +
                        'data-gtm="suggest-select" data-query="' + esc(q) + '" data-source="autocomplete">' +
                        '<span class="ac-dot" style="--accent:' + esc(r.color) + '"></span>' +
                        '<span class="ac-body"><span class="ac-title">' + esc(r.title) + '</span>' +
                        '<span class="ac-cat">' + esc(r.category) + '</span></span></a>';
                }).join('');
                items = Array.prototype.slice.call(box.querySelectorAll('.ac-item'));
                active = -1;
                place();
                box.classList.add('open');
            }
            input.addEventListener('input', function () {
                var q = input.value.trim();
                if (q === lastQ) { return; }
                lastQ = q;
                clearTimeout(timer);
                if (q.length < 2) { close(); return; }
                timer = setTimeout(function () {
                    fetch(suggestUrl + '?q=' + encodeURIComponent(q))
                        .then(function (r) { return r.json(); })
                        .then(function (d) { if (input.value.trim() === q) { render(d.results || [], q); } })
                        .catch(function () { close(); });
                }, 180);
            });
            input.addEventListener('keydown', function (e) {
                if (!box.classList.contains('open')) { return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, items.length - 1); highlight(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); highlight(); }
                else if (e.key === 'Enter' && active >= 0 && items[active]) { e.preventDefault(); window.location = items[active].href; }
                else if (e.key === 'Escape') { close(); }
            });
            input.addEventListener('focus', function () { if (box.innerHTML) { place(); box.classList.add('open'); } });
            document.addEventListener('click', function (e) {
                if (!form.contains(e.target) && !box.contains(e.target)) { close(); }
            });
            window.addEventListener('resize', function () { if (box.classList.contains('open')) { place(); } });
            window.addEventListener('scroll', function () { if (box.classList.contains('open')) { place(); } }, true);
        });
    }
    // Calculator impozit: arată doar câmpurile relevante și cere rezultatul de la server
    // (același view, fragmentul _impozit_result) la fiecare modificare.
    var calc = document.querySelector('[data-calc]');
    if (calc && window.fetch) {
        var out = document.querySelector('[data-calc-result]');
        var timer = null;
        var ctrl = null;
        document.documentElement.classList.add('js-calc');

        var syncFields = function () {
            var v = calc.elements.vehicul.value;
            var p = calc.elements.propulsie.value;
            var e = calc.elements.euro.value;
            var usesCc = v !== 'remorca' && !(p === 'electric' && v !== 'tractor');
            var show = {
                cc: usesCc,
                propulsion: v !== 'remorca' && v !== 'tractor',
                euro: usesCc && v !== 'tractor' && p !== 'hibrid' && p !== 'hibrid_50',
                trailer: v === 'remorca'
            };
            show.year = show.euro && e === 'nu_stiu';
            Array.prototype.forEach.call(calc.querySelectorAll('[data-show]'), function (el) {
                el.hidden = !show[el.getAttribute('data-show')];
            });
        };

        var update = function () {
            syncFields();
            var params = new URLSearchParams(new FormData(calc));
            var url = calc.getAttribute('action').split('#')[0] + '?' + params.toString();
            if (ctrl) { ctrl.abort(); }
            ctrl = 'AbortController' in window ? new AbortController() : null;
            fetch(url, { headers: { 'X-Requested-With': 'fetch' }, signal: ctrl ? ctrl.signal : undefined })
                .then(function (r) { return r.text(); })
                .then(function (html) {
                    out.innerHTML = html;
                    if (window.history && history.replaceState) { history.replaceState(null, '', url); }
                })
                .catch(function () {});
        };

        calc.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(update, 250); });
        calc.addEventListener('change', function () { clearTimeout(timer); update(); });
        calc.addEventListener('submit', function (e) { e.preventDefault(); update(); });
        syncFields();
    }
})();
