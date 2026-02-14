(function () {
  document.querySelectorAll('.bar[data-value]').forEach((el) => {
    const val = Number(el.getAttribute('data-value') || 0);
    el.style.setProperty('--v', Math.max(0, Math.min(100, val)));
  });

  const ns = 'http://www.w3.org/2000/svg';
  function drawChart(host) {
    const values = (host.dataset.values || '').split(',').map(Number).filter((n) => !Number.isNaN(n));
    if (values.length < 2) return;
    const xTicks = (host.dataset.xticks || '').split(',').filter(Boolean);
    const yMax = Number(host.dataset.ymax || Math.max(...values));
    const w = host.clientWidth || 420;
    const h = host.clientHeight || 150;
    const m = { l: 34, r: 8, t: 6, b: host.classList.contains('small-chart') ? 14 : 28 };

    host.innerHTML = '';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    const plotW = w - m.l - m.r;
    const plotH = h - m.t - m.b;

    [0, .5, 1].forEach((f) => {
      const y = m.t + plotH * f;
      const ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', m.l); ln.setAttribute('x2', m.l + plotW);
      ln.setAttribute('y1', y); ln.setAttribute('y2', y);
      ln.setAttribute('class', 'rechart-grid');
      svg.appendChild(ln);
    });

    xTicks.forEach((t, i) => {
      const x = m.l + (plotW * i / Math.max(1, xTicks.length - 1));
      const gl = document.createElementNS(ns, 'line');
      gl.setAttribute('x1', x); gl.setAttribute('x2', x);
      gl.setAttribute('y1', m.t); gl.setAttribute('y2', m.t + plotH);
      gl.setAttribute('class', 'rechart-grid');
      svg.appendChild(gl);

      if (!host.classList.contains('small-chart')) {
        const tx = document.createElementNS(ns, 'text');
        tx.setAttribute('x', x); tx.setAttribute('y', h - 6);
        tx.setAttribute('text-anchor', 'middle');
        tx.setAttribute('class', 'rechart-tick');
        tx.textContent = t;
        svg.appendChild(tx);
      }
    });

    const axisX = document.createElementNS(ns, 'line');
    axisX.setAttribute('x1', m.l); axisX.setAttribute('x2', m.l + plotW);
    axisX.setAttribute('y1', m.t + plotH); axisX.setAttribute('y2', m.t + plotH);
    axisX.setAttribute('class', 'rechart-axis'); svg.appendChild(axisX);

    const axisY = document.createElementNS(ns, 'line');
    axisY.setAttribute('x1', m.l); axisY.setAttribute('x2', m.l);
    axisY.setAttribute('y1', m.t); axisY.setAttribute('y2', m.t + plotH);
    axisY.setAttribute('class', 'rechart-axis'); svg.appendChild(axisY);

    const path = document.createElementNS(ns, 'path');
    const d = values.map((v, i) => {
      const x = m.l + (plotW * i / (values.length - 1));
      const y = m.t + (1 - (v / yMax)) * plotH;
      return `${i ? 'L' : 'M'}${x},${y}`;
    }).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('class', 'rechart-line');
    svg.appendChild(path);

    host.appendChild(svg);
  }

  const chartHosts = [...document.querySelectorAll('.chart-host')];
  chartHosts.forEach(drawChart);

  setInterval(() => {
    document.querySelectorAll('.small-chart').forEach((host) => {
      const arr = host.dataset.values.split(',').map(Number);
      arr.push(Math.max(5000, Math.min(15000, arr[arr.length - 1] + (Math.random() * 1000 - 500))));
      arr.shift();
      host.dataset.values = arr.map((n) => Math.round(n)).join(',');
      drawChart(host);
    });
  }, 1500);

  const track = document.getElementById('quickTrack');
  if (track) {
    const cards = [...track.querySelectorAll('.q')];
    let index = 0;
    const visible = 6;
    const render = () => cards.forEach((c, i) => { c.style.display = (i >= index && i < index + visible) ? 'block' : 'none'; });
    document.querySelector('.car-btn.prev')?.addEventListener('click', () => { index = Math.max(0, index - 1); render(); });
    document.querySelector('.car-btn.next')?.addEventListener('click', () => { index = Math.min(cards.length - visible, index + 1); render(); });
    render();
  }



  const healthCard = document.querySelector('.metrics');
  const barsView = healthCard?.querySelector('.view-bars');
  const gaugeView = healthCard?.querySelector('.view-gauge');
  document.querySelectorAll('.health-toggle .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.health-toggle .toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const gauge = btn.dataset.view === 'gauge';
      if (barsView && gaugeView) {
        barsView.hidden = gauge;
        gaugeView.hidden = !gauge;
      }
    });
  });

  window.addEventListener('resize', () => chartHosts.forEach(drawChart));
})();
