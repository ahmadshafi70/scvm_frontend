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
  return 'var(--accent)';
}

function getFillColor(value) {
  if (value > 90) return 'rgba(239, 68, 68, 0.2)';
  if (value > 80) return 'rgba(249, 115, 22, 0.22)';
  return 'rgba(59, 130, 246, 0.2)';
}

function clamp(min, max, v) {
  return Math.max(min, Math.min(max, v));
}

function createTrend(seed, amp = 8.5, noisePower = 2.8) {
  return Array.from({ length: 22 }, (_, i) => {
    const wave = Math.sin((i + seed) * 0.62) * amp;
    const wave2 = Math.cos(i * 0.38) * (amp * 0.24);
    const noise = Math.random() * noisePower - (noisePower / 2);
    return clamp(5, 98, Math.round(seed + wave + wave2 + noise));
  });
}

function toPoints(series, width, height, pad = 0) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  return series.map((v, i) => {
    const x = pad + (i / (series.length - 1)) * (width - pad * 2);
    const y = pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  });
}

function linePathFromPoints(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function areaPathFromLine(linePath, points, baseY) {
  if (!points.length || !linePath) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L${last[0]},${baseY} L${first[0]},${baseY} Z`;
}

function buildCurve(seed) {
  const sparkW = 128;
  const sparkH = 30;
  const hoverW = 260;
  const hoverH = 56;

  const trend = createTrend(seed);

  const sparkPoints = toPoints(trend.slice(-12), sparkW, sparkH, 1);
  const hoverPoints = toPoints(trend, hoverW, hoverH, 1);

  const sparkLine = linePathFromPoints(sparkPoints);
  const hoverLine = linePathFromPoints(hoverPoints);

  return {
    sparkLine,
    sparkArea: areaPathFromLine(sparkLine, sparkPoints, sparkH - 1),
    hoverLine,
    hoverArea: areaPathFromLine(hoverLine, hoverPoints, hoverH - 1)
  };
}

function cardTemplate(metric, idx) {
  const stroke = getColor(metric.value);
  const fill = getFillColor(metric.value);
  const curves = buildCurve(metric.value);

  return `<article class="card" data-index="${idx}">
      <div class="card-top"><span class="label">${metric.label}</span><span class="status-dot" style="background:${stroke}"></span></div>
      <div class="value-row">
        <div class="value">${metric.value}<span class="unit">${metric.unit}</span></div>
        <svg class="sparkline" viewBox="0 0 128 30" preserveAspectRatio="none" role="img" aria-label="sparkline">
          <path class="curve-area" fill="${fill}" d="${curves.sparkArea}" />
          <path class="curve-main" stroke="${stroke}" d="${curves.sparkLine}" />
        </svg>
      </div>
      <div class="progress-meta"><span>Utilization</span><span class="percent">${metric.value}%</span></div>
      <div class="progress"><div class="progress-fill" style="background:${stroke}; width:${metric.value}%"></div></div>
      <div class="hover-panel">
        <div class="live"><span class="pulse"></span>Live Telemetry</div>
        <div class="hover-value">${metric.value}<span class="unit">${metric.unit}</span></div>
        <svg class="hover-chart" viewBox="0 0 260 56" preserveAspectRatio="none" role="img" aria-label="telemetry chart">
          <path class="curve-area" fill="rgba(255,255,255,0.16)" d="${curves.hoverArea}" />
          <path class="curve-main" d="${curves.hoverLine}" />
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
    const stroke = getColor(metric.value);
    const fill = getFillColor(metric.value);
    const curves = buildCurve(metric.value);

    $(this).find('.value').html(`${metric.value}<span class="unit">${metric.unit}</span>`);
    $(this).find('.hover-value').html(`${metric.value}<span class="unit">${metric.unit}</span>`);
    $(this).find('.percent').text(`${metric.value}%`);
    $(this).find('.status-dot').css({ background: stroke });
    $(this).find('.progress-fill').css({ width: `${metric.value}%`, background: stroke });

    $(this).find('.sparkline .curve-main').attr({ d: curves.sparkLine, stroke });
    $(this).find('.sparkline .curve-area').attr({ d: curves.sparkArea, fill });

    $(this).find('.hover-chart .curve-main').attr({ d: curves.hoverLine });
    $(this).find('.hover-chart .curve-area').attr({ d: curves.hoverArea });
  });
}

$(function () {
  renderCards();
  setInterval(tick, 2800);
});
