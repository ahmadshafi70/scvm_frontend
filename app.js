const mockData = {
  health: {
    serialNumber: 'SF-2026-AZ12',
    mgmtIp: '192.168.10.250',
    iscsiIp: '10.0.0.18',
    uptime: '42d 10h 17m',
    metrics: [
      { key: 'cpu', label: 'CPU Load', unit: '%', value: 72, trend: [58, 62, 67, 72, 69, 74, 72] },
      { key: 'memory', label: 'Memory Usage', unit: '%', value: 64, trend: [49, 52, 57, 61, 64, 62, 64] },
      { key: 'osDisk', label: 'OS Disk', unit: '%', value: 54, trend: [42, 45, 47, 51, 54, 53, 54] },
      { key: 'diskRead', label: 'Disk Read', unit: 'MB/s', value: 39, trend: [22, 25, 31, 29, 36, 41, 39] },
      { key: 'diskWrite', label: 'Disk Write', unit: 'MB/s', value: 58, trend: [39, 44, 51, 55, 61, 59, 58] },
      { key: 'networkIn', label: 'Network In', unit: 'MB/s', value: 27, trend: [13, 15, 18, 20, 24, 29, 27] },
      { key: 'networkOut', label: 'Network Out', unit: 'MB/s', value: 43, trend: [25, 27, 34, 36, 40, 46, 43] }
    ]
  },
  storage: [
    { name: 'Pool-A', total: 500, used: 240, unit: 'TB' },
    { name: 'Pool-B', total: 250, used: 102, unit: 'TB' },
    { name: 'Pool-C', total: 125, used: 89, unit: 'TB' }
  ],
  resources: [
    { name: 'System Volume', path: '/mnt/system', usage: 63 },
    { name: 'VM Backup', path: '/mnt/vm_backup', usage: 54 },
    { name: 'Archive', path: '/mnt/archive', usage: 23 }
  ],
  alerts: [
    { type: 'critical', title: 'CPU Threshold Breached', message: 'CPU crossed 90% for 2 minutes.' },
    { type: 'warning', title: 'High IO Wait', message: 'Storage latency increased on Pool-A.' },
    { type: 'info', title: 'Snapshot Completed', message: 'Daily snapshot finished successfully.' }
  ]
};

function clamp(value, min = 1, max = 98) {
  return Math.max(min, Math.min(max, value));
}

function randomize(value) {
  return clamp(value + Math.floor(Math.random() * 25) - 12);
}

function getMetricTone(value) {
  if (value > 90) return { key: 'critical', color: '#ef4444', bg: '#fee2e2' };
  if (value > 80) return { key: 'warning', color: '#f59e0b', bg: '#ffedd5' };
  return { key: 'normal', color: '#007aff', bg: '#dbeafe' };
}

function renderTop(health) {
  $('#serialNumber').text(health.serialNumber);
  $('#mgmtIp').text(health.mgmtIp);
  $('#iscsiIp').text(health.iscsiIp);
  $('#uptime').text(health.uptime);
}

function renderStats(metrics) {
  const html = metrics.map((m) => {
    const tone = getMetricTone(m.value);
    const trendBars = m.trend.map((point) => `<span style="height:${Math.max(12, point)}%"></span>`).join('');
    return `
      <div class="card stat-card ${tone.key}">
        <div class="label-row">
          <div class="label">${m.label}</div>
          <div class="dot" style="background:${tone.color}"></div>
        </div>
        <div class="value">${m.value}<small>${m.unit}</small></div>
        <div class="progress"><span style="width:${m.value}%;background:${tone.color}"></span></div>
        <div class="util">Utilization <strong>${m.value}%</strong></div>

        <div class="hover-overlay" style="background:${tone.color};">
          <div class="overlay-top">
            <span>Live Telemetry</span>
            <span class="live-dot">● LIVE</span>
          </div>
          <div class="overlay-value">${m.value}<small>${m.unit}</small></div>
          <div class="overlay-sub">Real-time Stream</div>
          <div class="trend-strip" style="background:${tone.bg}">${trendBars}</div>
        </div>
      </div>
    `;
  }).join('');
  $('#statCards').html(html);
}

function renderStorage(items) {
  const html = items.map((s) => {
    const pct = Math.round((s.used / s.total) * 100);
    return `
      <div class="card">
        <h4>Storage Overview - ${s.name}</h4>
        <div class="storage-row"><span>Total Capacity</span><strong>${s.total} ${s.unit}</strong></div>
        <div class="storage-row"><span>Used</span><strong>${s.used} ${s.unit} (${pct}%)</strong></div>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </div>
    `;
  }).join('');
  $('#storageCards').html(html);
}

function renderResources(items) {
  const rows = items.map((r) => `
    <tr>
      <td>${r.name}</td>
      <td>${r.path}</td>
      <td>${r.usage}%</td>
    </tr>
  `).join('');
  $('#resourcesTable').html(rows);
}

function renderAlerts(items) {
  const html = items.map((a) => `
    <div class="alert-item ${a.type}">
      <strong>${a.title}</strong>
      <div>${a.message}</div>
    </div>
  `).join('');
  $('#alertsList').html(html);
}

function renderCharts() {
  ['perf1', 'perf2', 'perf3', 'perf4'].forEach((id) => {
    const ctx = document.getElementById(id);
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1', '2', '3', '4', '5', '6', '7'],
        datasets: [{ data: [10, 16, 8, 24, 17, 28, 21], borderColor: '#007aff', tension: 0.35, fill: false }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  });
}

function updateMetricStates() {
  mockData.health.metrics = mockData.health.metrics.map((m) => {
    const nextValue = randomize(m.value);
    const nextTrend = [...m.trend.slice(-6), nextValue];
    return { ...m, value: nextValue, trend: nextTrend };
  });
}

function loadDashboard() {
  // Swap mockData with Netdata API calls when integrating:
  // Example: $.getJSON('/api/system-health', function (health) { ... });
  renderTop(mockData.health);
  renderStats(mockData.health.metrics);
  renderStorage(mockData.storage);
  renderResources(mockData.resources);
  renderAlerts(mockData.alerts);
  renderCharts();
}

$(function () {
  loadDashboard();

  setInterval(() => {
    updateMetricStates();
    renderStats(mockData.health.metrics);
  }, 3000);

  $('#toggleSidebar').on('click', function () {
    $('#sidebar').toggleClass('collapsed');
  });
});
