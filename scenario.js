window.SCENARIO = {
  prompt: 'Name the yak to shave…',
  decision: 'Should I rewrite the renderer in Rust?',
  factors: [
    { label: 'Perf gain',           weight: 0.80, score:  0.80, note: '2–3× on the hot path, measured.' },
    { label: 'Rewrite cost',        weight: 0.85, score: -0.60, note: 'Six weeks, if nothing lies to me.' },
    { label: 'Borrow-checker pain', weight: 0.50, score: -0.50, note: 'Weeks 2–4 will be a fight.' },
    { label: 'Hiring signal',       weight: 0.40, score:  0.60, note: '"We rewrote it in Rust" opens doors.' },
    { label: 'Fun',                 weight: 0.80, score:  0.80, note: 'The real reason. Admit it.' }
  ],
  seedLog: [
    { kind: 'note', text: 'build log opened. stakes: one renderer.' }
  ]
};

window.SKIN_CONFIG = {
  domain: 'makerlog.ai',
  tagline: 'Build in the open, prove it.',
  forSaleUrl: '#',
  scenario: window.SCENARIO,
  renderExtra: function (root, api) {
    root.innerHTML =
      '<div class="sk-term">' +
        '<div class="sk-term-cmd">$ field --watch</div>' +
        '<pre class="sk-term-body" data-testid="term-body"></pre>' +
        '<p class="sk-term-foot">drag a weight. the field recomputes. no excuses.</p>' +
      '</div>';

    var bodyEl = root.querySelector('[data-testid="term-body"]');

    function sgn(n) { return (n < 0 ? '−' : '+') + Math.abs(Math.round(n * 100) / 100).toFixed(2); }
    function pad(s, w) { s = String(s); while (s.length < w) s += ' '; return s; }
    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function render() {
      if (!api.verdict || !api.factors.length) {
        bodyEl.textContent = 'waiting on decompose…';
        return;
      }
      var p = api.project();
      var band = p.band.label;
      var bandCls = { 'GO': 'v-go', 'HOLD': 'v-hold', 'NO-GO': 'v-nogo' }[band] || 'v-hold';
      var toGo = 0.34 - p.score;
      var margin = toGo > 0 ? sgn(toGo) + ' to GO' : sgn(-toGo) + ' past GO';

      function pull(cmp) {
        var c = api.factors.filter(function (f) { return cmp(f.weight * f.score); });
        c.sort(function (a, b) { return Math.abs(b.weight * b.score) - Math.abs(a.weight * a.score); });
        return c[0];
      }
      var drag = pull(function (v) { return v < 0; });
      var lift = pull(function (v) { return v > 0; });

      var lines =
        '<span class="k">verdict   </span><span class="' + bandCls + '">' + pad(band, 8) + '</span>' +
        '<span class="k">score </span>' + sgn(p.score) + '\n' +
        '<span class="k">margin    </span>' + margin + '\n' +
        '<span class="k">drag      </span>' + (drag ? esc(drag.label) + ' (' + Math.round(drag.weight * 100) + '% × ' + sgn(drag.score) + ')' : '—') + '\n' +
        '<span class="k">lift      </span>' + (lift ? esc(lift.label) + ' (' + Math.round(lift.weight * 100) + '% × ' + sgn(lift.score) + ')' : '—');
      bodyEl.innerHTML = lines;
    }

    render();
    api.el.addEventListener('input', render);
    api.el.addEventListener('click', function () { setTimeout(render, 0); });
  }
};
