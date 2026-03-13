const volumeData = {
  'asyn-rep-volume': {
    label: 'Asyn-Rep-Volume',
    stats: [
      ['Active Session', '0'],
      ['Volume Block Size', '<span class="badge badge--amber">512</span>'],
      ['Volume Size (GiB)', '<span class="badge badge--blue">10</span>'],
      ['Volume Type', 'Mirror'],
      ['Encryption', 'No']
    ]
  },
  'gold-tier-db': {
    label: 'Gold-Tier-DB',
    stats: [
      ['Active Session', '2'],
      ['Volume Block Size', '<span class="badge badge--amber">1024</span>'],
      ['Volume Size (GiB)', '<span class="badge badge--blue">250</span>'],
      ['Volume Type', 'Synchronous'],
      ['Encryption', 'AES-256']
    ]
  },
  'backup-archive-01': {
    label: 'Backup-Archive-01',
    stats: [
      ['Active Session', '1'],
      ['Volume Block Size', '<span class="badge badge--amber">4096</span>'],
      ['Volume Size (GiB)', '<span class="badge badge--blue">2048</span>'],
      ['Volume Type', 'Cold Backup'],
      ['Encryption', 'No']
    ]
  }
};

let mappingRows = [
  { name: 'async-rep-local-img-0', type: 'Synchronous', status: 'ok', percent: 98 },
  { name: 'async-rep-local-img-2', type: 'Synchronous', status: 'warn', percent: 64 },
  { name: 'gold-tier-img-4', type: 'Asynchronous', status: 'ok', percent: 88 }
];

let sortState = { key: null, asc: true };

function renderStats(volumeKey) {
  const data = volumeData[volumeKey];
  document.getElementById('volumeName').textContent = data.label;
  document.getElementById('statusVolumeName').textContent = data.label;

  document.getElementById('stats').innerHTML = data.stats
    .map(([label, value]) => `
      <div class="stat">
        <div class="stat__label">${label}</div>
        <div class="stat__value">${value}</div>
      </div>`)
    .join('');
}

function renderMappings(filterText = '') {
  const tbody = document.querySelector('#mappingTable tbody');
  let rows = [...mappingRows].filter((r) =>
    r.name.toLowerCase().includes(filterText.toLowerCase())
  );

  if (sortState.key) {
    rows.sort((a, b) => {
      let x = a[sortState.key];
      let y = b[sortState.key];
      if (typeof x === 'string') {
        x = x.toLowerCase();
        y = y.toLowerCase();
      }
      if (x < y) return sortState.asc ? -1 : 1;
      if (x > y) return sortState.asc ? 1 : -1;
      return 0;
    });
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${row.name}</td>
        <td>${row.type}</td>
        <td><span class="status-dot ${row.status}"></span></td>
        <td>
          <div>${row.percent}%</div>
          <div class="progress"><span style="width:${row.percent}%"></span></div>
        </td>
      </tr>`
    )
    .join('');
}

function bindEvents() {
  document.querySelectorAll('.nav__section').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-open');
      document.getElementById(btn.dataset.target).classList.toggle('is-open');
    });
  });

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.querySelector('.layout').classList.toggle('sidebar-collapsed');
  });

  document.getElementById('volumeSelect').addEventListener('change', (e) => {
    renderStats(e.target.value);
  });

  document.getElementById('mappingFilter').addEventListener('input', (e) => {
    renderMappings(e.target.value);
  });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortState.key === key) {
        sortState.asc = !sortState.asc;
      } else {
        sortState.key = key;
        sortState.asc = true;
      }
      renderMappings(document.getElementById('mappingFilter').value);
    });
  });
}

renderStats('asyn-rep-volume');
renderMappings();
bindEvents();
