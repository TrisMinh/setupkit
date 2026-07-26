let apps = [];
let presets = [];
let categoryIcons = {};
let catalogCategories = [];
let catalogTags = [];
let tagMetadata = new Map();

// Chỉ mục tra cứu O(1) - dựng một lần sau khi tải catalog.
let appIndex = new Map();
let pkgIndex = new Map();
let tagCounts = new Map();
let searchIndex = null;

const state = {
  selected: new Set(),
  installed: new Map(),
  installLocations: new Map(),
  simulated: new Set(),
  installProgress: new Map(),
  terminalLines: [],
  terminalLineCount: 0,
  terminalOpen: false,
  terminalCommand: '',
  activePreset: 'developer-core',
  category: 'all',
  tags: new Set(),
  query: '',
  source: 'all',
  status: 'all',
  running: false,
  scanning: false,
  currentId: '',
  done: new Set(),
  failed: new Set(),
  wingetAvailable: false,
  wingetVersion: '',
  logs: ['[sẵn sàng] Đang kiểm tra các ứng dụng đã có trên máy.']
};

const els = {
  catalog: document.getElementById('catalog'),
  catalogCount: document.getElementById('catalogCount'),
  installedSummary: document.getElementById('installedSummary'),
  category: document.getElementById('categorySelect'),
  source: document.getElementById('sourceSelect'),
  status: document.getElementById('statusSelect'),
  tagFilterBar: document.getElementById('tagFilterBar'),
  tagReset: document.getElementById('tagResetBtn'),
  activeFilterSummary: document.getElementById('activeFilterSummary'),
  search: document.getElementById('searchInput'),
  searchClear: document.getElementById('searchClear'),
  queue: document.getElementById('queueList'),
  queueStatus: document.getElementById('queueStatus'),
  terminalPanel: document.getElementById('terminalPanel'),
  terminalToggle: document.getElementById('terminalToggleBtn'),
  terminalClose: document.getElementById('terminalCloseBtn'),
  terminalClear: document.getElementById('terminalClearBtn'),
  terminalCopy: document.getElementById('terminalCopyBtn'),
  terminalCount: document.getElementById('terminalCount'),
  terminalCommand: document.getElementById('terminalCommand'),
  terminalOutput: document.getElementById('terminalOutput'),
  progressWrap: document.getElementById('progressWrap'),
  progressBar: document.getElementById('progressBar'),
  progressText: document.getElementById('progressText'),
  progressPercent: document.getElementById('progressPercent'),
  install: document.getElementById('installBtn'),
  exportQueue: document.getElementById('exportQueueBtn'),
  exportProfile: document.getElementById('exportProfileBtn'),
  queueCount: document.getElementById('queueCount'),
  installedCount: document.getElementById('installedCount'),
  largeAppCount: document.getElementById('largeAppCount'),
  navQueueCount: document.getElementById('navQueueCount'),
  dockCount: document.getElementById('dockCount'),
  dockSubtext: document.getElementById('dockSubtext'),
  selectionDock: document.getElementById('selectionDock'),
  presets: document.getElementById('presetList'),
  presetPrev: document.getElementById('presetPrev'),
  presetNext: document.getElementById('presetNext'),
  planSummary: document.getElementById('planSummary'),
  realMode: document.getElementById('realMode'),
  realModeWarning: document.getElementById('realModeWarning'),
  modeLabel: document.getElementById('modeLabel'),
  log: document.getElementById('logBox'),
  clearLogs: document.getElementById('clearLogsBtn'),
  detailDialog: document.getElementById('detailDialog'),
  detailName: document.getElementById('detailName'),
  detailDescription: document.getElementById('detailDescription'),
  detailState: document.getElementById('detailState'),
  detailVersion: document.getElementById('detailVersion'),
  detailPackage: document.getElementById('detailPackage'),
  detailSource: document.getElementById('detailSource'),
  detailPublisher: document.getElementById('detailPublisher'),
  detailType: document.getElementById('detailType'),
  detailSize: document.getElementById('detailSize'),
  detailTags: document.getElementById('detailTags'),
  detailRequiresItem: document.getElementById('detailRequiresItem'),
  detailRequires: document.getElementById('detailRequires'),
  detailRisk: document.getElementById('detailRisk'),
  detailLocation: document.getElementById('detailLocation'),
  detailInstallTargetItem: document.getElementById('detailInstallTargetItem'),
  detailInstallTarget: document.getElementById('detailInstallTarget'),
  commandSection: document.getElementById('commandSection'),
  commandPreview: document.getElementById('commandPreview'),
  detailAction: document.getElementById('detailAction'),
  detailOpen: document.getElementById('detailOpenBtn'),
  detailFolder: document.getElementById('detailFolderBtn'),
  detailChooseLocation: document.getElementById('detailChooseLocationBtn'),
  detailResetLocation: document.getElementById('detailResetLocationBtn'),
  theme: document.getElementById('themeBtn'),
  rescan: document.getElementById('rescanBtn'),
  systemReady: document.getElementById('systemReady'),
  toastRegion: document.getElementById('toastRegion')
};

let detailAppId = '';
let dialogClosing = false;

/* ---------------------------------------------------------------- helpers */

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Chuẩn hóa cho tìm kiếm: thường hóa + bỏ dấu tiếng Việt ("may ao" khớp "máy ảo").
function normalizeSearch(value) {
  return String(value ?? '')
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replaceAll('đ', 'd');
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const idle = window.requestIdleCallback
  ? (fn) => window.requestIdleCallback(fn, { timeout: 1500 })
  : (fn) => window.setTimeout(fn, 250);

// Gom nhiều lần gọi trong cùng một frame thành một lần ghi DOM duy nhất.
function rafBatch(run) {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      run();
    });
  };
}

function appIcon(app) {
  return categoryIcons[app.cat] || 'ph-package';
}

function appIconMarkup(app) {
  if (app.logo) {
    return `<img class="app-logo" src="./assets/apps/${escapeHtml(app.logo)}" alt="" loading="lazy" decoding="async">`;
  }
  return `<i class="ph ${appIcon(app)}" aria-hidden="true"></i>`;
}

function commandFor(app) {
  const source = app.source === 'msstore' ? 'msstore' : 'winget';
  const silent = app.source === 'msstore' ? '' : ' --silent';
  const installLocation = state.installLocations.get(app.id);
  const location = installLocation && app.source !== 'msstore'
    ? ` --location "${installLocation.replaceAll('"', '\\"')}"`
    : '';
  return `winget install --id ${app.pkg} --exact --source ${source}${silent}${location} --accept-package-agreements --accept-source-agreements --disable-interactivity`;
}

function installLocationLabel(app) {
  if (app.source === 'msstore') return 'Do Microsoft Store quản lý';
  return state.installLocations.get(app.id) || 'Mặc định của nhà phát hành, xác nhận sau khi cài';
}

function appById(id) {
  return appIndex.get(id);
}

function appByPackage(packageId) {
  return pkgIndex.get(packageId) || pkgIndex.get(String(packageId ?? '').toLowerCase());
}

function dependencyIdsFor(app, collected = new Set()) {
  for (const dependencyId of app?.requires || []) {
    if (collected.has(dependencyId)) continue;
    collected.add(dependencyId);
    dependencyIdsFor(appById(dependencyId), collected);
  }
  return collected;
}

function sortByInstallOrder(list) {
  return [...list].sort((left, right) => (
    Number(left.installOrder || 999) - Number(right.installOrder || 999)
    || Number(left.order || 999) - Number(right.order || 999)
    || left.name.localeCompare(right.name, 'vi')
  ));
}

function tagLabel(tagId) {
  return tagMetadata.get(tagId)?.label || tagId;
}

function selectedApps() {
  return sortByInstallOrder(apps.filter((app) => state.selected.has(app.id)));
}

/* ---------------------------------------------------------------- catalog */

async function loadCatalog() {
  const response = await fetch('./catalog.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Không tải được catalog (${response.status}).`);
  const catalog = await response.json();
  if (catalog.schemaVersion !== 3 || !Array.isArray(catalog.apps) || !catalog.apps.length) {
    throw new Error('Catalog không đúng schema hoặc đang trống.');
  }

  apps = catalog.apps;
  presets = catalog.plans || [];
  catalogCategories = catalog.categories || [];
  catalogTags = catalog.tags || [];
  categoryIcons = Object.fromEntries(catalogCategories.map((category) => [category.name, category.icon]));
  tagMetadata = new Map(catalogTags.map((tag) => [tag.id, tag]));

  appIndex = new Map(apps.map((app) => [app.id, app]));
  pkgIndex = new Map();
  for (const app of apps) {
    pkgIndex.set(app.pkg, app);
    pkgIndex.set(app.pkg.toLowerCase(), app);
  }
  tagCounts = new Map(catalogTags.map((tag) => [tag.id, 0]));
  for (const app of apps) {
    for (const tag of app.tags) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
  searchIndex = null;

  els.planSummary.textContent = `${presets.length} cấu hình theo vai trò, có thể chỉnh sửa sau`;

  const defaultPlan = presets.find((plan) => plan.id === state.activePreset) || presets[0];
  state.activePreset = defaultPlan?.id || '';
  state.selected = new Set(defaultPlan?.apps.filter((id) => appById(id)) || []);

  // Dựng chỉ mục tìm kiếm khi máy rảnh để lần gõ đầu tiên không bị khựng.
  idle(buildSearchIndex);
}

function buildSearchIndex() {
  // Chưa có catalog thì chưa dựng index (tránh race khi người dùng gõ sớm).
  if (searchIndex || !apps.length) return;
  searchIndex = new Map();
  for (const app of apps) {
    const tagLabels = app.tags.map(tagLabel).join(' ');
    searchIndex.set(app.id, normalizeSearch([
      app.name,
      app.pkg,
      app.cat,
      app.publisher,
      app.type,
      app.desc,
      app.tags.join(' '),
      tagLabels
    ].join(' ')));
  }
}

function appStatus(app) {
  if (state.currentId === app.id && state.running) return 'installing';
  if (state.failed.has(app.id)) return 'review';
  if (state.installed.has(app.id)) return 'installed';
  if (state.simulated.has(app.id)) return 'simulated';
  if (state.selected.has(app.id)) return 'selected';
  return 'available';
}

function statusMeta(status) {
  const map = {
    installing: { label: 'Đang cài', className: 'warning', icon: 'ph-arrow-clockwise', spin: true },
    installed: { label: 'Đã cài', className: 'success', icon: 'ph-check-circle' },
    simulated: { label: 'Mô phỏng xong', className: '', icon: 'ph-flask' },
    review: { label: 'Cần xử lý', className: 'danger', icon: 'ph-warning-circle' },
    selected: { label: 'Đã chọn', className: '', icon: 'ph-check-circle' },
    available: { label: 'Chưa cài', className: '', icon: 'ph-circle' }
  };
  return map[status];
}

function filteredApps() {
  const query = normalizeSearch(state.query.trim());
  if (query) buildSearchIndex();
  return apps.filter((app) => {
    const matchesQuery = !query || Boolean(searchIndex?.get(app.id)?.includes(query));
    if (!matchesQuery) return false;
    const matchesCategory = state.category === 'all' || app.categoryId === state.category;
    if (!matchesCategory) return false;
    const matchesTags = state.tags.size === 0 || [...state.tags].every((tag) => app.tags.includes(tag));
    if (!matchesTags) return false;
    const matchesSource = state.source === 'all' || app.source === state.source;
    if (!matchesSource) return false;
    return state.status === 'all'
      || (state.status === 'installed' && state.installed.has(app.id))
      || (state.status === 'available' && !state.installed.has(app.id))
      || (state.status === 'selected' && state.selected.has(app.id));
  });
}

/* -------------------------------------------------------------- renderers */

function renderCategories() {
  els.category.innerHTML = [
    '<option value="all">Tất cả danh mục</option>',
    ...catalogCategories.map((category) => (
      `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`
    ))
  ].join('');
  els.category.value = state.category;
}

function renderTags() {
  els.tagFilterBar.innerHTML = catalogTags.map((tag) => {
    const active = state.tags.has(tag.id);
    const count = tagCounts.get(tag.id) || 0;
    return `
      <button
        class="tag-filter-button ${active ? 'active' : ''}"
        data-tag="${escapeHtml(tag.id)}"
        type="button"
        aria-pressed="${active}"
        title="${count} ứng dụng"
      >
        <i class="ph ${escapeHtml(tag.icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(tag.label)}</span>
        <small>${count}</small>
      </button>
    `;
  }).join('');
  els.tagReset.hidden = state.tags.size === 0;
}

function renderFilterSummary() {
  const parts = [];
  if (state.category !== 'all') {
    parts.push(catalogCategories.find((category) => category.id === state.category)?.name);
  }
  if (state.tags.size) parts.push([...state.tags].map(tagLabel).join(' + '));
  if (state.source !== 'all') parts.push(state.source === 'msstore' ? 'Microsoft Store' : 'WinGet');
  if (state.status !== 'all') {
    parts.push({ installed: 'Đã cài', available: 'Chưa cài', selected: 'Đang chọn' }[state.status]);
  }
  els.activeFilterSummary.textContent = parts.filter(Boolean).length
    ? `Đang lọc: ${parts.filter(Boolean).join(' / ')}`
    : 'Có thể chọn nhiều tag để thu hẹp danh sách. Nhấn / để tìm nhanh.';
}

function presetButtonHTML(preset) {
  const pendingCount = preset.apps.filter((id) => !state.installed.has(id)).length;
  const installedCount = preset.apps.length - pendingCount;
  const largeCount = preset.apps.map(appById).filter((app) => app?.size === 'large').length;
  return `
    <button class="preset-button ${state.activePreset === preset.id ? 'active' : ''}" data-preset="${preset.id}" type="button" title="${escapeHtml(preset.desc)}">
      <span class="preset-icon" aria-hidden="true"><i class="ph ${preset.icon}"></i></span>
      <span class="preset-copy">
        <strong>${escapeHtml(preset.name)}</strong>
        <span class="preset-description">${escapeHtml(preset.desc)}</span>
        <span class="preset-count">${pendingCount} cần cài${installedCount ? `, ${installedCount} đã có` : ''}${largeCount ? `, ${largeCount} app lớn` : ''}</span>
      </span>
    </button>
  `;
}

function renderPresets() {
  els.presets.innerHTML = presets.map(presetButtonHTML).join('');
  updatePresetNav();
}

function updatePresetActive() {
  els.presets.querySelectorAll('.preset-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.preset === state.activePreset);
  });
}

function updatePresetNav() {
  if (!els.presetPrev || !els.presetNext) return;
  const list = els.presets;
  const overflow = list.scrollWidth > list.clientWidth + 4;
  els.presetPrev.hidden = !overflow;
  els.presetNext.hidden = !overflow;
  if (!overflow) return;
  els.presetPrev.disabled = list.scrollLeft <= 2;
  els.presetNext.disabled = list.scrollLeft >= list.scrollWidth - list.clientWidth - 2;
}

function installedActions(app) {
  const details = state.installed.get(app.id);
  const name = escapeHtml(app.name);
  return `
    <button class="small-icon-button" data-open="${app.id}" type="button" aria-label="Mở ${name}" title="${details?.canLaunch ? 'Mở ứng dụng' : 'Windows chưa cung cấp lối tắt'}" ${details?.canLaunch ? '' : 'disabled'}>
      <i class="ph ph-arrow-square-out" aria-hidden="true"></i>
    </button>
    <button class="small-icon-button" data-folder="${app.id}" type="button" aria-label="Mở thư mục ${name}" title="${details?.canOpenFolder ? 'Mở thư mục cài đặt' : 'Windows không công khai thư mục'}" ${details?.canOpenFolder ? '' : 'disabled'}>
      <i class="ph ph-folder-open" aria-hidden="true"></i>
    </button>
  `;
}

function cardHTML(app) {
  const selected = state.selected.has(app.id);
  const details = state.installed.get(app.id);
  const status = appStatus(app);
  const cardClass = status === 'installed' ? 'installed' : status === 'review' ? 'app-review' : '';
  const name = escapeHtml(app.name);
  const version = details?.version ? `Phiên bản ${escapeHtml(details.version)}` : 'Đã phát hiện trên Windows';
  const visibleTags = app.tags.slice(0, 3).map((tag) => (
    `<span class="app-tag">${escapeHtml(tagLabel(tag))}</span>`
  )).join('');
  const actions = details
    ? `${installedActions(app)}
      <button class="small-icon-button detail-button" data-detail="${app.id}" type="button" aria-label="Xem chi tiết ${name}" title="Xem chi tiết">
        <i class="ph ph-info" aria-hidden="true"></i>
      </button>`
    : `<button
        class="select-button ${selected ? 'selected' : ''}"
        data-toggle="${app.id}"
        type="button"
        aria-pressed="${selected}"
        aria-label="${selected ? `Bỏ ${name} khỏi gói cài đặt` : `Thêm ${name} vào gói cài đặt`}"
        title="${selected ? 'Bỏ khỏi gói' : 'Thêm vào gói'}"
        ${state.scanning || state.running ? 'disabled' : ''}
      >
        <i class="ph ${selected ? 'ph-check' : 'ph-plus'}" aria-hidden="true"></i>
      </button>
      <button class="small-icon-button detail-button" data-detail="${app.id}" type="button" aria-label="Xem chi tiết ${name}" title="Xem chi tiết">
        <i class="ph ph-info" aria-hidden="true"></i>
      </button>`;

  return `
    <article class="app-card ${selected ? 'selected' : ''} ${cardClass}" data-app="${app.id}" tabindex="0" role="button" aria-label="Chi tiết ${name}">
      <span class="app-icon" aria-hidden="true">${appIconMarkup(app)}</span>
      <div class="app-info">
        <div class="app-name-row">
          <span class="app-name">${name}</span>
          <span class="source-label">${app.source === 'msstore' ? 'Store' : 'winget'}</span>
        </div>
        <p class="app-desc">${escapeHtml(app.desc)}</p>
        <div class="app-meta-row">
          <span class="app-type">${escapeHtml(app.type)}</span>
          ${app.size === 'large' ? '<span class="app-size-label"><i class="ph ph-hard-drives" aria-hidden="true"></i>App lớn</span>' : ''}
          ${visibleTags}
        </div>
        ${details ? `<div class="app-install-meta"><i class="ph ph-check-circle" aria-hidden="true"></i><span>${version}</span></div>` : ''}
      </div>
      <div class="app-card-actions ${details ? 'installed-actions' : ''}">
        ${actions}
      </div>
    </article>
  `;
}

function renderCatalog() {
  const list = filteredApps();
  els.catalogCount.innerHTML = `<strong>${list.length}</strong> / ${apps.length} ứng dụng phù hợp`;
  els.installedSummary.textContent = state.scanning
    ? 'Đang quét Registry, Start Menu và winget'
    : `${state.installed.size} ứng dụng đã cài trên máy`;
  els.searchClear.classList.toggle('visible', Boolean(state.query));
  renderFilterSummary();

  if (!list.length) {
    els.catalog.innerHTML = `
      <div class="empty-state">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ph-magnifying-glass"></i></span>
          <h3>Không tìm thấy ứng dụng</h3>
          <p>Thử từ khóa ngắn hơn hoặc đặt lại bộ lọc.</p>
          <button class="button empty-action" data-clear-filters type="button">Đặt lại bộ lọc</button>
        </div>
      </div>
    `;
    return;
  }

  els.catalog.innerHTML = list.map(cardHTML).join('');
}

// Cập nhật một card tại chỗ khi chọn/bỏ chọn - không rebuild cả lưới 440 card.
function updateCardToggle(id) {
  if (state.status === 'selected') {
    // Bộ lọc "Đang chọn" thay đổi danh sách hiển thị, cần render lại toàn bộ.
    renderCatalog();
    return;
  }
  const card = els.catalog.querySelector(`[data-app="${id}"]`);
  if (!card) return;
  const selected = state.selected.has(id);
  const app = appById(id);
  const name = app?.name || '';
  card.classList.toggle('selected', selected);
  const button = card.querySelector('[data-toggle]');
  if (!button) return;
  button.classList.toggle('selected', selected);
  button.setAttribute('aria-pressed', String(selected));
  button.setAttribute('aria-label', selected ? `Bỏ ${name} khỏi gói cài đặt` : `Thêm ${name} vào gói cài đặt`);
  button.title = selected ? 'Bỏ khỏi gói' : 'Thêm vào gói';
  const icon = button.querySelector('.ph');
  if (icon) icon.className = `ph ${selected ? 'ph-check' : 'ph-plus'}`;
}

// Thay hẳn một card (dùng khi trạng thái cài đặt thay đổi sau khi cài xong).
function refreshCatalogCard(id) {
  const card = els.catalog.querySelector(`[data-app="${id}"]`);
  const app = appById(id);
  if (!card || !app) return;
  card.outerHTML = cardHTML(app);
}

function overallProgress(selected) {
  if (!selected.length) return 0;
  const total = selected.reduce((sum, app) => {
    if (state.installed.has(app.id) || state.simulated.has(app.id)) return sum + 100;
    if (state.failed.has(app.id)) return sum + 100;
    return sum + Number(state.installProgress.get(app.id)?.percent || 0);
  }, 0);
  return Math.round(total / selected.length);
}

function queueProgressMarkup(app) {
  const item = state.installProgress.get(app.id);
  if (!item) return '';
  const percent = Math.max(0, Math.min(100, Number(item.percent) || 0));
  const installing = state.running && state.currentId === app.id && !item.error && percent < 100;
  return `
    <div class="queue-progress-row ${item.error ? 'error' : ''} ${percent === 100 && !item.error ? 'complete' : ''} ${installing ? 'installing' : ''}">
      <div class="queue-progress-copy">
        <span data-progress-phase>${escapeHtml(item.phase || 'Đang chuẩn bị')}</span>
        <strong data-progress-percent>${percent}%</strong>
      </div>
      <div class="queue-progress-track" role="progressbar" aria-label="Tiến trình ${escapeHtml(app.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <span class="queue-progress-bar" data-progress-fill="${percent}"></span>
      </div>
    </div>
  `;
}

function queueItemHTML(app) {
  const status = appStatus(app);
  const meta = statusMeta(status);
  const details = state.installed.get(app.id);
  const installLocation = state.installLocations.get(app.id);
  const name = escapeHtml(app.name);
  const locationRow = details ? `
    <div class="queue-location-row">
      <i class="ph ph-folder-open" aria-hidden="true"></i>
      <div class="queue-location-copy">
        <strong>Thư mục hiện tại</strong>
        <span title="${escapeHtml(details.installDirectory || 'Windows không công khai vị trí cài đặt')}">${escapeHtml(details.installDirectory || 'Windows không công khai vị trí cài đặt')}</span>
      </div>
    </div>
  ` : `
    <div class="queue-location-row">
      <i class="ph ${app.source === 'msstore' ? 'ph-storefront' : 'ph-folder-notch'}" aria-hidden="true"></i>
      <div class="queue-location-copy">
        <strong>Vị trí cài đặt</strong>
        <span title="${escapeHtml(installLocationLabel(app))}">${escapeHtml(installLocationLabel(app))}</span>
      </div>
      <div class="queue-location-actions">
        ${installLocation ? `
          <button class="button location-button" data-location-reset="${app.id}" type="button" ${state.running ? 'disabled' : ''}>
            Mặc định
          </button>
        ` : ''}
        ${app.source !== 'msstore' ? `
          <button class="button location-button" data-location="${app.id}" type="button" ${state.running ? 'disabled' : ''}>
            ${installLocation ? 'Đổi' : 'Chọn thư mục'}
          </button>
        ` : ''}
      </div>
    </div>
  `;
  return `
    <div class="queue-item" data-queue-app="${app.id}">
      <span class="queue-item-icon" aria-hidden="true">${appIconMarkup(app)}</span>
      <div class="queue-item-info">
        <strong>${name}</strong>
        <span>${details?.version ? `Đã cài phiên bản ${escapeHtml(details.version)}` : escapeHtml(app.pkg)}</span>
      </div>
      <div class="queue-item-actions">
        <span class="status-label ${meta.className}">
          <i class="ph ${meta.icon} ${meta.spin ? 'is-spinning' : ''}" aria-hidden="true"></i>${meta.label}
        </span>
        ${details ? installedActions(app) : ''}
        <button class="small-icon-button" data-detail="${app.id}" type="button" aria-label="Xem chi tiết ${name}" title="Xem chi tiết">
          <i class="ph ph-info" aria-hidden="true"></i>
        </button>
        <button class="small-icon-button" data-remove="${app.id}" type="button" aria-label="Bỏ ${name}" title="Bỏ khỏi gói" ${state.running ? 'disabled' : ''}>
          <i class="ph ph-trash" aria-hidden="true"></i>
        </button>
      </div>
      ${locationRow}
      ${queueProgressMarkup(app)}
    </div>
  `;
}

function applyProgressFill(scope) {
  scope.querySelectorAll('[data-progress-fill]').forEach((bar) => {
    bar.style.setProperty('--progress-scale', String(Number(bar.dataset.progressFill || 0) / 100));
  });
}

// Trạng thái tổng: nút cài, progress tổng, nhãn trạng thái. Gọi được liên tục, rẻ.
function renderRunStatus() {
  const selected = selectedApps();
  const pending = selected.filter((app) => !state.installed.has(app.id));
  const processed = selected.filter((app) => state.done.has(app.id) || state.failed.has(app.id)).length;
  const progress = overallProgress(selected);

  els.install.disabled = state.running || state.scanning || pending.length === 0;
  const installHTML = state.running
    ? '<i class="ph ph-arrow-clockwise is-spinning" aria-hidden="true"></i>Đang cài đặt'
    : els.realMode.checked
      ? `<i class="ph ph-download-simple" aria-hidden="true"></i>Cài ${pending.length} ứng dụng`
      : `<i class="ph ph-flask" aria-hidden="true"></i>Mô phỏng ${pending.length} ứng dụng`;
  // Chỉ ghi DOM khi nội dung đổi để icon xoay không bị reset mỗi tick tiến trình.
  if (els.install.dataset.html !== installHTML) {
    els.install.dataset.html = installHTML;
    els.install.innerHTML = installHTML;
  }
  els.progressWrap.classList.toggle('visible', state.running || state.installProgress.size > 0);
  els.progressBar.style.setProperty('--progress-scale', String(progress / 100));
  els.progressBar.classList.toggle('complete', progress === 100 && !state.running && state.failed.size === 0);
  els.progressPercent.textContent = `${progress}%`;
  els.progressText.textContent = state.running
    ? `Đang xử lý ${Math.min(processed + 1, selected.length)} trên ${selected.length}`
    : state.simulated.size
      ? `Đã mô phỏng ${state.simulated.size} ứng dụng, máy chưa thay đổi`
      : state.done.size || state.failed.size
        ? `Đã xử lý ${processed} trên ${selected.length}`
        : 'Chưa bắt đầu';

  let statusClass = 'status-label';
  let statusHTML = '<i class="ph ph-list-checks" aria-hidden="true"></i>Sẵn sàng';
  if (state.running) {
    statusClass = 'status-label warning';
    statusHTML = '<i class="ph ph-arrow-clockwise is-spinning" aria-hidden="true"></i>Đang chạy';
  } else if (state.failed.size) {
    statusClass = 'status-label danger';
    statusHTML = `<i class="ph ph-warning-circle" aria-hidden="true"></i>${state.failed.size} cần xử lý`;
  } else if (selected.length && pending.length === 0) {
    statusClass = 'status-label success';
    statusHTML = '<i class="ph ph-check-circle" aria-hidden="true"></i>Đã cài';
  } else if (state.simulated.size) {
    statusHTML = '<i class="ph ph-flask" aria-hidden="true"></i>Mô phỏng xong';
  }
  if (els.queueStatus.dataset.html !== statusHTML) {
    els.queueStatus.dataset.html = statusHTML;
    els.queueStatus.className = statusClass;
    els.queueStatus.innerHTML = statusHTML;
  }
}

function renderQueue() {
  const selected = selectedApps();
  const pending = selected.filter((app) => !state.installed.has(app.id));
  const largeCount = pending.filter((app) => app.size === 'large').length;

  els.queueCount.textContent = selected.length;
  els.installedCount.textContent = `${state.installed.size} ứng dụng`;
  els.largeAppCount.textContent = largeCount;
  els.navQueueCount.textContent = selected.length;
  els.dockCount.textContent = `${selected.length} ứng dụng đã chọn`;
  els.dockSubtext.textContent = selected.length
    ? `${pending.length} ứng dụng còn cần cài${largeCount ? `, gồm ${largeCount} app lớn` : ''}`
    : 'Chọn ứng dụng hoặc workstation plan';
  els.selectionDock.hidden = selected.length === 0;
  els.exportQueue.disabled = selected.length === 0;
  els.exportProfile.disabled = selected.length === 0;
  els.modeLabel.textContent = els.realMode.checked ? 'Cài đặt thật bằng winget' : 'Chỉ mô phỏng, không thay đổi máy';
  els.realModeWarning.classList.toggle('visible', els.realMode.checked);
  renderRunStatus();

  if (!selected.length) {
    els.queue.innerHTML = `
      <div class="empty-state">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ph-package"></i></span>
          <h3>Gói cài đặt đang trống</h3>
          <p>Ứng dụng đã có trên máy sẽ không bị thêm lại vào gói.</p>
          <button class="button primary empty-action" data-view-target="catalog" type="button">
            <i class="ph ph-squares-four" aria-hidden="true"></i>Chọn ứng dụng
          </button>
        </div>
      </div>
    `;
    return;
  }

  els.queue.innerHTML = selected.map(queueItemHTML).join('');
  applyProgressFill(els.queue);
}

// Cập nhật tiến trình một app tại chỗ - giữ nguyên DOM để thanh chạy mượt.
function updateQueueProgressRow(app) {
  const row = els.queue.querySelector(`[data-queue-app="${app.id}"]`);
  if (!row) return;

  const chip = row.querySelector('.status-label');
  if (chip) {
    const status = appStatus(app);
    // Chỉ ghi DOM khi trạng thái đổi để icon xoay không bị reset mỗi tick.
    if (chip.dataset.status !== status) {
      const meta = statusMeta(status);
      chip.dataset.status = status;
      chip.className = `status-label ${meta.className}`;
      chip.innerHTML = `<i class="ph ${meta.icon} ${meta.spin ? 'is-spinning' : ''}" aria-hidden="true"></i>${meta.label}`;
    }
  }

  const item = state.installProgress.get(app.id);
  if (!item) return;
  let progressRow = row.querySelector('.queue-progress-row');
  if (!progressRow) {
    row.insertAdjacentHTML('beforeend', queueProgressMarkup(app));
    applyProgressFill(row);
    return;
  }
  const percent = Math.max(0, Math.min(100, Number(item.percent) || 0));
  const installing = state.running && state.currentId === app.id && !item.error && percent < 100;
  progressRow.classList.toggle('error', Boolean(item.error));
  progressRow.classList.toggle('complete', percent === 100 && !item.error);
  progressRow.classList.toggle('installing', installing);
  const phase = progressRow.querySelector('[data-progress-phase]');
  if (phase) phase.textContent = item.phase || 'Đang chuẩn bị';
  const percentEl = progressRow.querySelector('[data-progress-percent]');
  if (percentEl) percentEl.textContent = `${percent}%`;
  const track = progressRow.querySelector('.queue-progress-track');
  if (track) track.setAttribute('aria-valuenow', String(percent));
  const bar = progressRow.querySelector('.queue-progress-bar');
  if (bar) bar.style.setProperty('--progress-scale', String(percent / 100));
}

const renderLog = rafBatch(() => {
  els.log.textContent = state.logs.slice(-160).join('\n');
  els.log.scrollTop = els.log.scrollHeight;
});

function renderTerminalChrome() {
  els.terminalPanel.hidden = !state.terminalOpen;
  els.terminalToggle.setAttribute('aria-expanded', String(state.terminalOpen));
  els.terminalToggle.classList.toggle('primary', state.terminalOpen);
  els.terminalCommand.textContent = state.terminalCommand || 'Chưa có lệnh nào được chạy';
  const lineCount = state.terminalLineCount;
  els.terminalCount.textContent = lineCount > 999 ? '999+' : lineCount;
  els.terminalCount.hidden = lineCount === 0;
}

const renderTerminalOutput = rafBatch(() => {
  const output = els.terminalOutput;
  const nearBottom = output.scrollTop + output.clientHeight >= output.scrollHeight - 60;
  output.textContent = state.terminalLines.length
    ? state.terminalLines.join('')
    : 'Terminal sẽ hiển thị command, stdout và stderr khi bắt đầu cài.';
  const lineCount = state.terminalLineCount;
  els.terminalCount.textContent = lineCount > 999 ? '999+' : lineCount;
  els.terminalCount.hidden = lineCount === 0;
  if (nearBottom) output.scrollTop = output.scrollHeight;
});

function renderTerminal() {
  renderTerminalChrome();
  renderTerminalOutput();
}

function renderAll() {
  renderPresets();
  renderTags();
  renderCatalog();
  renderQueue();
  renderLog();
  renderTerminal();
}

/* ---------------------------------------------------------------- actions */

function toggleApp(id) {
  const app = appById(id);
  if (!app || state.running || state.scanning) return;

  // App đã cài và không nằm trong gói: mở chi tiết thay vì thêm lại.
  // Nếu đang nằm trong gói (vd. vừa cài xong) thì vẫn cho phép bỏ ra.
  if (state.installed.has(id) && !state.selected.has(id)) {
    showToast(app.name, 'Ứng dụng này đã có trên máy. Bạn có thể mở app hoặc thư mục cài đặt.', 'ph-check-circle');
    openDetail(id);
    return;
  }

  const changedIds = [id];
  if (state.selected.has(id)) {
    state.selected.delete(id);
    state.done.delete(id);
    state.failed.delete(id);
    state.simulated.delete(id);
    state.installProgress.delete(id);
    addLog(`[lựa chọn] Đã bỏ ${app.name} khỏi gói cài đặt.`);
  } else {
    state.selected.add(id);
    const dependencies = [...dependencyIdsFor(app)]
      .filter((dependencyId) => !state.installed.has(dependencyId) && !state.selected.has(dependencyId));
    dependencies.forEach((dependencyId) => state.selected.add(dependencyId));
    changedIds.push(...dependencies);
    addLog(`[lựa chọn] Đã thêm ${app.name}${dependencies.length ? ` cùng ${dependencies.length} công cụ nên có trước` : ''} vào gói cài đặt.`);
    if (dependencies.length) {
      showToast(
        app.name,
        `Đã thêm kèm ${dependencies.map((dependencyId) => appById(dependencyId)?.name).filter(Boolean).join(', ')}.`,
        'ph-git-merge'
      );
    }
  }
  state.activePreset = '';
  updatePresetActive();
  changedIds.forEach(updateCardToggle);
  renderQueue();
}

function applyPreset(id) {
  const preset = presets.find((item) => item.id === id);
  if (!preset || state.running || state.scanning) return;

  let added = 0;
  let skipped = 0;
  const planAppIds = new Set(preset.apps);
  preset.apps.forEach((appId) => {
    dependencyIdsFor(appById(appId)).forEach((dependencyId) => planAppIds.add(dependencyId));
  });
  const nextSelection = new Set();
  planAppIds.forEach((appId) => {
    if (state.installed.has(appId)) {
      skipped += 1;
      return;
    }
    nextSelection.add(appId);
    added += 1;
  });
  state.selected = nextSelection;
  state.done.clear();
  state.failed.clear();
  state.simulated.clear();
  state.installProgress.clear();
  state.activePreset = id;
  addLog(`[workstation plan] ${preset.name}: chọn ${added}, bỏ qua ${skipped} ứng dụng đã cài.`);
  showToast(
    preset.name,
    added
      ? `Đã chọn ${added} ứng dụng${skipped ? `, bỏ qua ${skipped} ứng dụng đã có` : ''}.`
      : skipped
        ? 'Tất cả ứng dụng trong gói đã có trên máy.'
        : 'Tất cả ứng dụng trong gói đã được chọn.',
    'ph-check-circle'
  );
  renderAll();
}

function clearFilters() {
  state.query = '';
  state.category = 'all';
  state.tags.clear();
  state.source = 'all';
  state.status = 'all';
  els.search.value = '';
  els.category.value = state.category;
  els.source.value = state.source;
  els.status.value = state.status;
  renderTags();
  renderCatalog();
}

/* ----------------------------------------------------------------- dialog */

function openDetail(id) {
  const app = appById(id);
  if (!app) return;

  const details = state.installed.get(id);
  const simulated = state.simulated.has(id);
  detailAppId = id;
  els.detailName.textContent = app.name;
  els.detailDescription.textContent = app.desc;
  els.detailState.textContent = details ? 'Đã cài trên máy' : simulated ? 'Chỉ mô phỏng, chưa cài' : 'Chưa cài';
  els.detailVersion.textContent = details?.version || (details ? 'Windows không cung cấp' : 'Chưa có');
  els.detailPackage.textContent = app.pkg;
  els.detailSource.textContent = app.source === 'msstore' ? 'Microsoft Store' : 'Windows Package Manager';
  els.detailPublisher.textContent = app.publisher;
  els.detailType.textContent = app.type;
  els.detailSize.textContent = app.size === 'large'
    ? 'Lớn, nên kiểm tra dung lượng trống'
    : 'Thông thường';
  els.detailTags.innerHTML = app.tags.map((tag) => (
    `<span class="detail-tag"><i class="ph ${escapeHtml(tagMetadata.get(tag)?.icon || 'ph-tag')}" aria-hidden="true"></i>${escapeHtml(tagLabel(tag))}</span>`
  )).join('');
  const requiredApps = app.requires.map(appById).filter(Boolean);
  els.detailRequiresItem.hidden = requiredApps.length === 0;
  els.detailRequires.textContent = requiredApps.map((item) => item.name).join(', ');
  els.detailRisk.textContent = app.risk;
  els.detailLocation.textContent = details?.installDirectory
    || (details ? 'Windows không công khai vị trí cài đặt' : 'Chưa cài đặt');
  els.detailInstallTargetItem.hidden = Boolean(details);
  els.detailInstallTarget.textContent = installLocationLabel(app);
  els.commandPreview.textContent = commandFor(app);
  els.commandSection.hidden = Boolean(details);
  els.detailAction.hidden = Boolean(details);
  els.detailOpen.hidden = !details;
  els.detailFolder.hidden = !details;
  els.detailChooseLocation.hidden = Boolean(details) || app.source === 'msstore';
  els.detailResetLocation.hidden = Boolean(details) || !state.installLocations.has(id);
  els.detailChooseLocation.disabled = state.running;
  els.detailResetLocation.disabled = state.running;
  els.detailOpen.disabled = Boolean(details && !details.canLaunch);
  els.detailFolder.disabled = Boolean(details && !details.canOpenFolder);
  els.detailOpen.title = details?.canLaunch ? 'Mở ứng dụng' : 'Windows chưa cung cấp lối tắt';
  els.detailFolder.title = details?.canOpenFolder ? 'Mở thư mục cài đặt' : 'Windows không công khai thư mục';

  if (!details) {
    const selected = state.selected.has(id);
    els.detailAction.className = `button ${selected ? 'danger' : 'primary'}`;
    els.detailAction.innerHTML = selected
      ? '<i class="ph ph-trash" aria-hidden="true"></i>Bỏ khỏi gói'
      : '<i class="ph ph-plus" aria-hidden="true"></i>Thêm vào gói';
  }
  if (!els.detailDialog.open) {
    dialogClosing = false;
    els.detailDialog.classList.remove('closing');
    els.detailDialog.showModal();
  }
}

function closeDetail() {
  if (!els.detailDialog.open || dialogClosing) return;
  dialogClosing = true;
  els.detailDialog.classList.add('closing');
  window.setTimeout(() => {
    els.detailDialog.close();
    els.detailDialog.classList.remove('closing');
    dialogClosing = false;
    detailAppId = '';
  }, 130);
}

/* ------------------------------------------------------------ log & toast */

function addLog(message) {
  const stamp = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  state.logs.push(`[${stamp}] ${message}`);
  if (state.logs.length > 400) state.logs.splice(0, state.logs.length - 400);
  renderLog();
}

function toastVariant(icon) {
  if (icon.includes('warning')) return 'warn';
  if (icon.includes('check') || icon.includes('flask')) return 'success';
  return '';
}

function dismissToast(toast) {
  if (toast.dataset.leaving) return;
  toast.dataset.leaving = '1';
  window.clearTimeout(Number(toast.dataset.timer || 0));
  toast.classList.add('toast-leave');
  window.setTimeout(() => toast.remove(), 220);
}

function showToast(title, message, icon = 'ph-info') {
  while (els.toastRegion.children.length >= 4) {
    els.toastRegion.firstElementChild.remove();
  }
  const toast = document.createElement('div');
  toast.className = `toast ${toastVariant(icon)}`;
  const iconElement = document.createElement('i');
  iconElement.className = `ph ${icon}`;
  iconElement.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div');
  const heading = document.createElement('strong');
  const body = document.createElement('span');
  heading.textContent = title;
  body.textContent = message;
  copy.append(heading, body);
  toast.append(iconElement, copy);
  toast.title = 'Nhấn để đóng';
  toast.addEventListener('click', () => dismissToast(toast));
  els.toastRegion.appendChild(toast);
  toast.dataset.timer = String(window.setTimeout(() => dismissToast(toast), 4200));
}

function setSystemStatus(kind, text, icon, spin = false) {
  els.systemReady.className = `system-ready${kind ? ` ${kind}` : ''}`;
  els.systemReady.innerHTML = `<i class="ph ${icon}${spin ? ' is-spinning' : ''}" aria-hidden="true"></i>${escapeHtml(text)}`;
}

/* ------------------------------------------------------------ native flow */

async function scanInstalled({ showFeedback = true, pruneSelection = false } = {}) {
  if (!window.setupkitNative || state.scanning || state.running) return;

  state.scanning = true;
  els.rescan.disabled = true;
  els.rescan.querySelector('.ph')?.classList.add('is-spinning');
  setSystemStatus('scanning', 'Đang quét ứng dụng trên máy', 'ph-arrow-clockwise', true);
  renderAll();

  try {
    const result = await window.setupkitNative.scanInstalled();
    const nextInstalled = new Map();
    result.apps.forEach((details) => {
      if (!details.installed) return;
      const app = appByPackage(details.packageId);
      if (app) nextInstalled.set(app.id, details);
    });
    state.installed = nextInstalled;

    if (pruneSelection) {
      nextInstalled.forEach((_details, id) => {
        state.selected.delete(id);
        state.done.delete(id);
        state.failed.delete(id);
        state.simulated.delete(id);
        state.installProgress.delete(id);
      });
    }

    const wingetNote = state.wingetAvailable
      ? `winget${state.wingetVersion ? ` ${state.wingetVersion}` : ''} sẵn sàng`
      : 'Chế độ cài thật không khả dụng';
    setSystemStatus(state.wingetAvailable ? '' : 'warning', `${wingetNote}, ${nextInstalled.size} app đã cài`, state.wingetAvailable ? 'ph-check-circle' : 'ph-warning-circle');
    addLog(`[quét máy] Phát hiện ${nextInstalled.size}/${apps.length} ứng dụng trong danh mục đã được cài.`);
    if (showFeedback) {
      showToast('Đã quét lại máy', `Tìm thấy ${nextInstalled.size} ứng dụng đã cài trong danh mục.`, 'ph-check-circle');
    }
  } catch (error) {
    setSystemStatus('warning', 'Không thể quét ứng dụng', 'ph-warning-circle');
    addLog(`[lỗi quét máy] ${error.message || 'Không đọc được Registry và Start Menu.'}`);
    showToast('Không thể quét ứng dụng', 'SetupKit chưa đọc được trạng thái cài đặt trên Windows.', 'ph-warning-circle');
  } finally {
    state.scanning = false;
    els.rescan.disabled = false;
    els.rescan.querySelector('.ph')?.classList.remove('is-spinning');
    renderAll();
  }
}

async function openInstalledApp(id) {
  const app = appById(id);
  if (!app || !window.setupkitNative) return;
  try {
    const result = await window.setupkitNative.openApp(app.pkg);
    if (!result.ok) throw new Error(result.error);
    addLog(`[mở ứng dụng] Đã yêu cầu Windows mở ${app.name}.`);
    showToast(app.name, 'Đã gửi yêu cầu mở ứng dụng.', 'ph-check-circle');
  } catch (error) {
    addLog(`[lỗi mở ứng dụng] ${app.name}: ${error.message}`);
    showToast(`Không thể mở ${app.name}`, error.message || 'Windows không cung cấp lối tắt.', 'ph-warning-circle');
  }
}

async function openInstallFolder(id) {
  const app = appById(id);
  if (!app || !window.setupkitNative) return;
  try {
    const result = await window.setupkitNative.openAppFolder(app.pkg);
    if (!result.ok) throw new Error(result.error);
    addLog(`[mở thư mục] Đã mở thư mục cài đặt của ${app.name}.`);
  } catch (error) {
    addLog(`[lỗi mở thư mục] ${app.name}: ${error.message}`);
    showToast(`Không thể mở thư mục ${app.name}`, error.message || 'Windows không công khai vị trí cài đặt.', 'ph-warning-circle');
  }
}

async function chooseInstallLocation(id) {
  const app = appById(id);
  if (!app || state.running) return;
  if (!window.setupkitNative?.chooseInstallLocation) {
    showToast('Không thể chọn thư mục', 'Cầu nối native của SetupKit chưa sẵn sàng.', 'ph-warning-circle');
    return;
  }

  try {
    const result = await window.setupkitNative.chooseInstallLocation(app.pkg);
    if (result.cancelled) return;
    if (!result.ok) throw new Error(result.error);
    state.installLocations.set(id, result.location);
    addLog(`[vị trí cài] ${app.name}: ${result.location}`);
    showToast(app.name, 'Đã dùng thư mục tùy chỉnh. Package có thể bỏ qua nếu không hỗ trợ.', 'ph-folder-plus');
    renderQueue();
    if (detailAppId === id && els.detailDialog.open) openDetail(id);
  } catch (error) {
    showToast(`Không thể đổi vị trí ${app.name}`, error.message || 'Windows không cho phép dùng thư mục này.', 'ph-warning-circle');
  }
}

async function resetInstallLocation(id) {
  const app = appById(id);
  if (!app || state.running) return;
  try {
    if (window.setupkitNative?.resetInstallLocation) {
      await window.setupkitNative.resetInstallLocation(app.pkg);
    }
    state.installLocations.delete(id);
    addLog(`[vị trí cài] ${app.name}: trở về mặc định của nhà phát hành.`);
    renderQueue();
    if (detailAppId === id && els.detailDialog.open) openDetail(id);
  } catch (error) {
    showToast(`Không thể đặt lại ${app.name}`, error.message || 'Không thể cập nhật vị trí cài đặt.', 'ph-warning-circle');
  }
}

/* --------------------------------------------------------------- terminal */

function appendTerminal(text, stream = 'stdout') {
  if (!text) return;
  const prefix = stream === 'stderr' ? '[stderr] ' : '';
  const normalized = `${prefix}${text}`;
  state.terminalLines.push(normalized);
  state.terminalLineCount += (normalized.match(/\n/g) || []).length;
  const combined = state.terminalLines.join('');
  if (combined.length > 120000) {
    state.terminalLines = [combined.slice(-100000)];
    state.terminalLineCount = (state.terminalLines[0].match(/\n/g) || []).length;
  } else if (state.terminalLines.length > 700) {
    state.terminalLines = state.terminalLines.slice(-600);
    state.terminalLineCount = (state.terminalLines.join('').match(/\n/g) || []).length;
  }
  renderTerminalOutput();
}

function setTerminalOpen(open) {
  state.terminalOpen = open;
  renderTerminalChrome();
  if (open) {
    els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
  }
}

async function copyTerminal() {
  const output = state.terminalLines.join('');
  if (!output) return;
  try {
    await navigator.clipboard.writeText(output);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = output;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  showToast('Đã sao chép terminal', 'Command và đầu ra đã được đưa vào clipboard.', 'ph-check-circle');
}

/* ---------------------------------------------------------------- install */

function setProgress(app, percent, phase, message = '', error = false) {
  const previous = state.installProgress.get(app.id);
  const normalized = Math.max(0, Math.min(100, Number(percent) || 0));
  const monotonicPercent = error ? normalized : Math.max(Number(previous?.percent || 0), normalized);
  state.installProgress.set(app.id, {
    percent: monotonicPercent,
    phase,
    message,
    error
  });
  updateQueueProgressRow(app);
  renderRunStatus();
}

async function simulateOne(app) {
  const stages = [
    { percent: 10, phase: 'Kiểm tra package ID', delay: 260 },
    { percent: 38, phase: 'Mô phỏng tìm gói', delay: 330 },
    { percent: 66, phase: 'Mô phỏng tải xuống', delay: 360 },
    { percent: 88, phase: 'Mô phỏng cài đặt', delay: 330 },
    { percent: 100, phase: 'Mô phỏng hoàn tất', delay: 180 }
  ];
  for (const stage of stages) {
    setProgress(app, stage.percent, stage.phase, 'Không có thay đổi nào được thực hiện trên máy.');
    appendTerminal(`[mô phỏng] ${app.name}: ${stage.phase} (${stage.percent}%)\n`, 'system');
    await wait(stage.delay);
  }
  state.simulated.add(app.id);
  state.done.add(app.id);
  addLog(`[mô phỏng] ${app.name}: hoàn tất mô phỏng, ứng dụng chưa được cài.`);
}

async function runInstallPlan() {
  const pending = sortByInstallOrder(apps.filter((app) => state.selected.has(app.id) && !state.installed.has(app.id)));
  if (!pending.length || state.running || state.scanning) return;

  const realInstall = els.realMode.checked;
  state.running = true;
  state.currentId = '';
  state.done.clear();
  state.failed.clear();
  state.simulated.clear();
  state.installProgress.clear();
  state.terminalLines = [];
  state.terminalLineCount = 0;
  state.terminalOpen = true;
  state.terminalCommand = '';
  appendTerminal(`[SetupKit] Bắt đầu ${realInstall ? 'cài đặt thật' : 'mô phỏng'} ${pending.length} ứng dụng.\n`, 'system');
  addLog(`[phiên] ${realInstall ? 'Cài thật' : 'Mô phỏng'} ${pending.length} ứng dụng.`);
  switchView('queue');
  renderAll();

  for (const app of pending) {
    state.currentId = app.id;
    state.terminalCommand = commandFor(app);
    if (!realInstall) appendTerminal(`> [mô phỏng] ${state.terminalCommand}\n`, 'command');
    renderTerminalChrome();
    setProgress(app, 2, realInstall ? 'Đang chuẩn bị cài đặt' : 'Đang chuẩn bị mô phỏng');
    addLog(`[kiểm tra] ${app.name}: nguồn=${app.source}; gói=${app.pkg}`);

    if (realInstall && window.setupkitNative) {
      try {
        const result = await window.setupkitNative.runWinget(app.pkg);
        if (result.cancelled) {
          state.failed.add(app.id);
          setProgress(app, 0, 'Đã hủy', 'Người dùng không xác nhận lệnh winget.', true);
          addLog(`[đã hủy] ${app.name}: người dùng không xác nhận cài đặt.`);
        } else if (result.ok) {
          const details = result.details || {
            packageId: app.pkg,
            installed: true,
            version: '',
            installDirectory: '',
            canLaunch: false,
            canOpenFolder: false,
            detectedBy: ['winget-install-result']
          };
          state.installed.set(app.id, details);
          state.done.add(app.id);
          setProgress(app, 100, 'Đã cài đặt', 'Windows đã hoàn tất cài đặt.');
          addLog(`[đã cài] ${app.name}: winget exitCode=${result.code}.`);
          if (result.requestedLocation && result.locationHonored === false) {
            addLog(`[vị trí cài] ${app.name}: bộ cài đã dùng vị trí mặc định thay vì ${result.requestedLocation}.`);
            appendTerminal(`[SetupKit] Cảnh báo: package không dùng thư mục đã chọn. Vị trí thực tế: ${details.installDirectory || 'Windows không công khai'}.\n`, 'system');
            showToast(app.name, 'Bộ cài không hỗ trợ vị trí tùy chỉnh và đã dùng thư mục mặc định.', 'ph-warning-circle');
          }
        } else {
          state.failed.add(app.id);
          setProgress(app, 100, 'Cài đặt thất bại', result.error || `winget exitCode=${result.code}`, true);
          addLog(`[lỗi] ${app.name}: ${result.error || `winget exitCode=${result.code}`}`);
        }
      } catch (error) {
        state.failed.add(app.id);
        setProgress(app, 100, 'Không thể chạy winget', error.message || 'Lỗi không xác định.', true);
        addLog(`[lỗi] ${app.name}: ${error.message || 'Không thể gọi winget.'}`);
      }
    } else if (realInstall) {
      state.failed.add(app.id);
      setProgress(app, 100, 'Đã chặn', 'Cầu nối native không khả dụng.', true);
      addLog(`[đã chặn] ${app.name}: cầu nối native không khả dụng.`);
    } else {
      await simulateOne(app);
    }

    state.currentId = '';
    refreshCatalogCard(app.id);
    renderQueue();
    await wait(160);
  }

  state.running = false;
  const successCount = state.done.size;
  appendTerminal(`[SetupKit] Kết thúc. Thành công: ${successCount}, lỗi: ${state.failed.size}.\n`, 'system');
  addLog(`[tóm tắt] ${realInstall ? 'Đã cài' : 'Đã mô phỏng'}=${successCount}; lỗi=${state.failed.size}.`);
  renderAll();

  if (!realInstall) {
    showToast('Mô phỏng đã hoàn tất', `${successCount} ứng dụng được mô phỏng. Máy chưa có thay đổi nào.`, 'ph-flask');
  } else if (state.failed.size) {
    showToast('Đã chạy xong gói cài đặt', `${successCount} đã cài, ${state.failed.size} cần kiểm tra.`, 'ph-warning-circle');
  } else {
    showToast('Cài đặt hoàn tất', `${successCount} ứng dụng đã được cài. Dùng nút Mở hoặc Thư mục để truy cập.`, 'ph-check-circle');
  }
}

function exportProfile() {
  const selected = selectedApps();
  if (!selected.length) return;

  const profile = {
    schemaVersion: 3,
    profileName: 'SetupKit Developer Workstation',
    exportedAt: new Date().toISOString(),
    policy: {
      source: 'legitimate-winget-and-msstore',
      manualInstallers: false,
      mode: els.realMode.checked ? 'install' : 'simulation'
    },
    apps: selected.map((app) => ({
      id: app.id,
      name: app.name,
      publisher: app.publisher,
      type: app.type,
      category: app.categoryId,
      tags: app.tags,
      source: app.source,
      packageId: app.pkg,
      installOrder: app.installOrder,
      requires: app.requires,
      alreadyInstalled: state.installed.has(app.id),
      installLocation: state.installLocations.get(app.id) || null,
      command: commandFor(app)
    }))
  };
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'setupkit-profile.json';
  anchor.click();
  URL.revokeObjectURL(url);
  addLog('[hồ sơ] Đã xuất setupkit-profile.json.');
  showToast('Đã xuất hồ sơ', 'Tệp setupkit-profile.json đã được lưu.', 'ph-check-circle');
}

/* ------------------------------------------------------------------ views */

function switchView(view) {
  const target = document.getElementById(`page-${view}`);
  if (!target) return;

  document.querySelectorAll('.page').forEach((page) => {
    page.classList.toggle('active', page === target);
  });
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  target.querySelector('h1')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (view === 'catalog') updatePresetNav();
}

/* ------------------------------------------------------------------ theme */

function updateThemeButton() {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  els.theme.innerHTML = `<i class="ph ${dark ? 'ph-sun' : 'ph-moon'}" aria-hidden="true"></i>`;
  els.theme.setAttribute('aria-label', dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
  els.theme.title = dark ? 'Giao diện sáng' : 'Giao diện tối';
}

function toggleTheme() {
  const currentDark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const next = currentDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('setupkit-theme', next);
  } catch {
    // Không lưu được cũng không sao - theme vẫn đổi trong phiên này.
  }
  updateThemeButton();
  els.theme.classList.remove('theme-spin');
  void els.theme.offsetWidth;
  els.theme.classList.add('theme-spin');
}

function initializeTheme() {
  // theme-init.js đã áp dataset.theme từ trước khi CSS render.
  updateThemeButton();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!document.documentElement.dataset.theme) updateThemeButton();
  });
}

/* ----------------------------------------------------------------- events */

function handleActionClick(event) {
  const open = event.target.closest('[data-open]');
  const folder = event.target.closest('[data-folder]');
  const detail = event.target.closest('[data-detail]');
  if (open && !open.disabled) openInstalledApp(open.dataset.open);
  if (folder && !folder.disabled) openInstallFolder(folder.dataset.folder);
  if (detail) openDetail(detail.dataset.detail);
}

// Cuộn ngang bằng con lăn chuột cho các dải cuộn ngang.
function enableWheelScroll(el, onScroll) {
  el.addEventListener('wheel', (event) => {
    if (!event.deltaY || event.deltaX) return;
    if (el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft += event.deltaY;
    event.preventDefault();
  }, { passive: false });
  if (onScroll) {
    let pending = false;
    el.addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(() => {
        pending = false;
        onScroll();
      });
    }, { passive: true });
  }
}

let searchTimer = 0;
function scheduleSearchRender() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(renderCatalog, 90);
}

function bindEvents() {
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  document.body.addEventListener('click', (event) => {
    const viewTarget = event.target.closest('[data-view-target]');
    if (viewTarget) switchView(viewTarget.dataset.viewTarget);
  });

  els.presets.addEventListener('click', (event) => {
    const button = event.target.closest('[data-preset]');
    if (button) applyPreset(button.dataset.preset);
  });
  enableWheelScroll(els.presets, updatePresetNav);
  els.presetPrev?.addEventListener('click', () => {
    els.presets.scrollBy({ left: -els.presets.clientWidth * 0.8, behavior: 'smooth' });
  });
  els.presetNext?.addEventListener('click', () => {
    els.presets.scrollBy({ left: els.presets.clientWidth * 0.8, behavior: 'smooth' });
  });
  window.addEventListener('resize', updatePresetNav);

  els.catalog.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-toggle]');
    const clear = event.target.closest('[data-clear-filters]');
    if (toggle) toggleApp(toggle.dataset.toggle);
    if (clear) clearFilters();
    handleActionClick(event);
    // Nhấn vào thân card (không phải nút) sẽ mở chi tiết.
    if (!event.target.closest('button')) {
      const card = event.target.closest('[data-app]');
      if (card) openDetail(card.dataset.app);
    }
  });
  els.catalog.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.matches?.('[data-app]')) {
      event.preventDefault();
      openDetail(event.target.dataset.app);
    }
  });

  els.queue.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove]');
    const location = event.target.closest('[data-location]');
    const resetLocation = event.target.closest('[data-location-reset]');
    if (remove) toggleApp(remove.dataset.remove);
    if (location) chooseInstallLocation(location.dataset.location);
    if (resetLocation) resetInstallLocation(resetLocation.dataset.locationReset);
    handleActionClick(event);
  });

  els.search.addEventListener('input', (event) => {
    state.query = event.target.value;
    els.searchClear.classList.toggle('visible', Boolean(state.query));
    scheduleSearchRender();
  });
  els.search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.search.value) {
      event.stopPropagation();
      state.query = '';
      els.search.value = '';
      renderCatalog();
    }
  });
  els.searchClear.addEventListener('click', () => {
    state.query = '';
    els.search.value = '';
    els.search.focus();
    renderCatalog();
  });
  els.category.addEventListener('change', (event) => {
    state.category = event.target.value;
    renderCatalog();
  });
  els.tagFilterBar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    const tag = button.dataset.tag;
    if (state.tags.has(tag)) state.tags.delete(tag);
    else state.tags.add(tag);
    renderTags();
    renderCatalog();
  });
  enableWheelScroll(els.tagFilterBar);
  els.tagReset.addEventListener('click', () => {
    state.tags.clear();
    renderTags();
    renderCatalog();
  });
  els.source.addEventListener('change', (event) => {
    state.source = event.target.value;
    renderCatalog();
  });
  els.status.addEventListener('change', (event) => {
    state.status = event.target.value;
    renderCatalog();
  });

  els.realMode.addEventListener('change', () => {
    addLog(`[chế độ] ${els.realMode.checked ? 'Đã bật cài đặt thật bằng winget.' : 'Đã chuyển về mô phỏng, máy sẽ không thay đổi.'}`);
    renderQueue();
  });
  els.install.addEventListener('click', runInstallPlan);
  els.exportQueue.addEventListener('click', exportProfile);
  els.exportProfile.addEventListener('click', exportProfile);
  els.rescan.addEventListener('click', () => scanInstalled({ showFeedback: true, pruneSelection: false }));
  els.terminalToggle.addEventListener('click', () => setTerminalOpen(!state.terminalOpen));
  els.terminalClose.addEventListener('click', () => setTerminalOpen(false));
  els.terminalClear.addEventListener('click', () => {
    state.terminalLines = [];
    state.terminalLineCount = 0;
    state.terminalCommand = '';
    renderTerminal();
  });
  els.terminalCopy.addEventListener('click', copyTerminal);
  els.clearLogs.addEventListener('click', () => {
    state.logs = ['[sẵn sàng] Nhật ký đã được xóa.'];
    renderLog();
    showToast('Đã xóa nhật ký', 'Phiên hiện tại đã được làm sạch.', 'ph-check-circle');
  });

  document.getElementById('reviewSelectionBtn').addEventListener('click', () => switchView('queue'));
  document.getElementById('dialogCloseBtn').addEventListener('click', closeDetail);
  document.getElementById('dialogCancelBtn').addEventListener('click', closeDetail);
  els.detailAction.addEventListener('click', () => {
    if (dialogClosing) return;
    if (detailAppId) toggleApp(detailAppId);
    closeDetail();
  });
  els.detailOpen.addEventListener('click', () => {
    if (detailAppId) openInstalledApp(detailAppId);
  });
  els.detailFolder.addEventListener('click', () => {
    if (detailAppId) openInstallFolder(detailAppId);
  });
  els.detailChooseLocation.addEventListener('click', () => {
    if (detailAppId) chooseInstallLocation(detailAppId);
  });
  els.detailResetLocation.addEventListener('click', () => {
    if (detailAppId) resetInstallLocation(detailAppId);
  });
  els.detailDialog.addEventListener('cancel', (event) => {
    // Đóng bằng Esc cũng chạy animation thay vì biến mất đột ngột.
    event.preventDefault();
    closeDetail();
  });
  els.detailDialog.addEventListener('click', (event) => {
    // Enter/Space trên nút bên trong dialog sinh click ảo tại (0,0) - bỏ qua.
    if (event.detail === 0) return;
    // Chỉ đóng khi bấm vào backdrop (target là chính dialog, ngoài nội dung).
    if (event.target !== els.detailDialog) return;
    const rect = els.detailDialog.getBoundingClientRect();
    const outside = event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom;
    if (outside) closeDetail();
  });
  els.theme.addEventListener('click', toggleTheme);

  // Phím tắt: "/" hoặc Ctrl+K để tìm kiếm nhanh.
  document.addEventListener('keydown', (event) => {
    const isSearchKey = event.key === '/'
      || (event.ctrlKey && (event.key === 'k' || event.key === 'K'));
    if (!isSearchKey) return;
    const target = event.target;
    const typing = target instanceof HTMLElement && (
      target.tagName === 'INPUT'
      || target.tagName === 'TEXTAREA'
      || target.tagName === 'SELECT'
      || target.isContentEditable
    );
    if (typing && !event.ctrlKey) return;
    if (els.detailDialog.open) return;
    event.preventDefault();
    switchView('catalog');
    els.search.focus();
    els.search.select();
  });
}

/* ------------------------------------------------------------- native init */

function subscribeToProgress() {
  if (!window.setupkitNative?.onInstallProgress) return;
  window.setupkitNative.onInstallProgress((payload) => {
    const app = appByPackage(payload.packageId);
    if (!app) return;
    setProgress(app, payload.percent, payload.phase, payload.message, Boolean(payload.error));
  });
}

function subscribeToTerminal() {
  if (!window.setupkitNative?.onTerminalOutput) return;
  window.setupkitNative.onTerminalOutput((payload) => {
    const app = appByPackage(payload.packageId);
    if (!app) return;
    if (payload.stream === 'command') {
      state.terminalCommand = payload.text.trim().replace(/^>\s*/, '');
      state.terminalOpen = true;
      renderTerminalChrome();
    }
    appendTerminal(payload.text, payload.stream);
  });
}

async function initializeNative() {
  if (!window.setupkitNative) {
    setSystemStatus('warning', 'Chỉ có thể mô phỏng', 'ph-warning-circle');
    els.realMode.checked = false;
    els.realMode.disabled = true;
    els.rescan.disabled = true;
    renderQueue();
    addLog('[hệ thống] Cầu nối native không khả dụng. Không thể đọc trạng thái cài đặt.');
    return;
  }

  subscribeToProgress();
  subscribeToTerminal();
  try {
    const [list, system] = await Promise.all([
      window.setupkitNative.listAllowlist(),
      window.setupkitNative.checkSystem()
    ]);
    const catalogPackages = new Set(apps.map((app) => app.pkg.toLocaleLowerCase('en-US')));
    const nativePackages = new Set(list.map((packageId) => packageId.toLocaleLowerCase('en-US')));
    const missingFromNative = apps.filter((app) => !nativePackages.has(app.pkg.toLocaleLowerCase('en-US')));
    const unknownToCatalog = list.filter((packageId) => !catalogPackages.has(packageId.toLocaleLowerCase('en-US')));
    if (missingFromNative.length || unknownToCatalog.length) {
      els.realMode.checked = false;
      els.realMode.disabled = true;
      setSystemStatus('warning', 'Catalog và allowlist chưa đồng bộ', 'ph-warning-circle');
      addLog(`[an toàn] Đã khóa cài thật: thiếu ${missingFromNative.length}, dư ${unknownToCatalog.length} package ID trong allowlist native.`);
      renderQueue();
      return;
    }
    state.wingetAvailable = Boolean(system.wingetAvailable);
    state.wingetVersion = system.wingetVersion || '';
    addLog(`[hệ thống] WebView2 native đang hoạt động. ${list.length} package ID đã được cho phép.`);

    if (!state.wingetAvailable) {
      els.realMode.checked = false;
      els.realMode.disabled = true;
      addLog('[hệ thống] Không tìm thấy winget. Vẫn có thể quét app đã cài nhưng không thể cài thật.');
    } else {
      addLog(`[hệ thống] winget${state.wingetVersion ? ` ${state.wingetVersion}` : ''} đã sẵn sàng.`);
    }
    await scanInstalled({ showFeedback: false, pruneSelection: true });
  } catch (error) {
    setSystemStatus('warning', 'Không đọc được trạng thái máy', 'ph-warning-circle');
    addLog(`[hệ thống] ${error.message || 'Không thể khởi tạo cầu nối native.'}`);
    els.realMode.checked = false;
    els.realMode.disabled = true;
    renderQueue();
  }
}

async function boot() {
  initializeTheme();
  bindEvents();
  try {
    await loadCatalog();
    renderCategories();
    renderAll();
    await initializeNative();
  } catch (error) {
    setSystemStatus('warning', 'Không tải được catalog', 'ph-warning-circle');
    els.realMode.checked = false;
    els.realMode.disabled = true;
    els.rescan.disabled = true;
    els.catalogCount.textContent = 'Catalog không khả dụng';
    els.presets.innerHTML = '';
    els.catalog.innerHTML = `
      <div class="empty-state">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ph-warning-circle"></i></span>
          <h3>Không thể tải danh mục ứng dụng</h3>
          <p>${escapeHtml(error.message || 'Catalog không hợp lệ.')}</p>
        </div>
      </div>
    `;
    addLog(`[catalog] ${error.message || 'Không thể tải catalog.'}`);
    renderLog();
  }
}

boot();
