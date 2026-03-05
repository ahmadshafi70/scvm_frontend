(function initDollarFallback() {
  if (window.jQuery) return;

  function Dollar(elements) {
    this.elements = elements;
  }

  Dollar.prototype.html = function (content) {
    this.elements.forEach((el) => { el.innerHTML = content; });
    return this;
  };
  Dollar.prototype.text = function (content) {
    this.elements.forEach((el) => { el.textContent = content; });
    return this;
  };
  Dollar.prototype.each = function (cb) {
    this.elements.forEach((el, i) => cb.call(el, i, el));
    return this;
  };
  Dollar.prototype.data = function (key) {
    return this.elements[0]?.dataset?.[key];
  };
  Dollar.prototype.find = function (selector) {
    return new Dollar(this.elements.flatMap((el) => Array.from(el.querySelectorAll(selector))));
  };
  Dollar.prototype.css = function (styles) {
    this.elements.forEach((el) => Object.entries(styles).forEach(([k, v]) => { el.style[k] = v; }));
    return this;
  };
  Dollar.prototype.attr = function (attrs) {
    this.elements.forEach((el) => Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)));
    return this;
  };

  window.$ = function (selector) {
    if (typeof selector === 'function') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', selector);
      } else {
        selector();
      }
      return;
    }
    if (selector instanceof Element) return new Dollar([selector]);
    return new Dollar(Array.from(document.querySelectorAll(selector)));
  };
})();

const metrics = [
  { label: 'CPU Load', unit: '%', value: 62 },
  { label: 'Memory Usage', unit: '%', value: 78 },
  { label: 'OS Disk', unit: '%', value: 91 },
  { label: 'Network In', unit: 'MB/s', value: 44 },
  { label: 'Network Out', unit: 'MB/s', value: 86 },
  { label: 'Disk Write', unit: 'MB/s', value: 33 }
];

function getColor(value) {
  if (value > 90) return 'var(--critical)';
  if (value > 80) return 'var(--warn)';
  return 'var(--ok)';
}

function clamp(min, max, v) {
  return Math.max(min, Math.min(max, v));
}

function createTrend(seed, phaseOffset = 0, amp = 8.5, noisePower = 3.2) {
  return Array.from({ length: 22 }, (_, i) => {
    const wave = Math.sin((i + seed + phaseOffset) * 0.62) * amp;
    const wave2 = Math.cos((i + phaseOffset) * 0.38) * (amp * 0.24);
    const noise = Math.random() * noisePower - (noisePower / 2);
    return clamp(5, 98, Math.round(seed + wave + wave2 + noise));
  });
}

function polylinePoints(series, width, height) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  return series.map((v, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

function buildCurve(seed) {
  const main = createTrend(seed);
  return {
    sparkMain: polylinePoints(main.slice(-12), 128, 30),
    hoverMain: polylinePoints(main, 260, 56)
  };
}

function cardTemplate(metric, idx) {
  const color = getColor(metric.value);
  const curves = buildCurve(metric.value);

  return `<article class="card" data-index="${idx}">
      <div class="card-top"><span class="label">${metric.label}</span><span class="status-dot" style="background:${color}"></span></div>
      <div class="value-row">
        <div class="value">${metric.value}<span class="unit">${metric.unit}</span></div>
        <svg class="sparkline" viewBox="0 0 128 30" preserveAspectRatio="none">
          <polyline class="curve-main" stroke="${color}" points="${curves.sparkMain}" />
        </svg>
      </div>
      <div class="progress-meta"><span>Utilization</span><span class="percent">${metric.value}%</span></div>
      <div class="progress"><div class="progress-fill" style="background:${color}; width:${metric.value}%"></div></div>
      <div class="hover-panel">
        <div class="live"><span class="pulse"></span>Live Telemetry</div>
        <div class="hover-value">${metric.value}<span class="unit">${metric.unit}</span></div>
        <svg class="hover-chart" viewBox="0 0 260 56" preserveAspectRatio="none">
          <polyline class="curve-main" points="${curves.hoverMain}" />
        </svg>
      </div>
    </article>`;
}

function renderCards() {
  $('#healthCards').html(metrics.map(cardTemplate).join(''));
}

function tick() {
  metrics.forEach((m) => {
    const next = m.value + Math.round(Math.random() * 8 - 4);
    m.value = clamp(5, 99, next);
  });

  $('.card').each(function () {
    const index = Number($(this).data('index'));
    const metric = metrics[index];
    const color = getColor(metric.value);
    const curves = buildCurve(metric.value);

    $(this).find('.value').html(`${metric.value}<span class="unit">${metric.unit}</span>`);
    $(this).find('.hover-value').html(`${metric.value}<span class="unit">${metric.unit}</span>`);
    $(this).find('.percent').text(`${metric.value}%`);
    $(this).find('.status-dot').css({ background: color });
    $(this).find('.progress-fill').css({ width: `${metric.value}%`, background: color });

    $(this).find('.sparkline .curve-main').attr({ points: curves.sparkMain, stroke: color });
    $(this).find('.hover-chart .curve-main').attr({ points: curves.hoverMain });
  });
}

$(function () {
  renderCards();
  setInterval(tick, 2800);
});
