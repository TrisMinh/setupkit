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
let localizeFrame = 0;

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
  activePreset: '',
  category: 'all',
  tags: new Set(),
  query: '',
  source: 'all',
  status: 'all',
  sort: 'smart',
  updateQuery: '',
  versionQuery: '',
  versionScope: 'installed',
  versionAppId: '',
  selectedVersion: '',
  versionLoadingId: '',
  versionRecords: new Map(),
  viewMode: 'grid',
  running: false,
  scanning: false,
  updatesScanning: false,
  currentId: '',
  busyId: '',
  operation: '',
  stopRequested: false,
  done: new Set(),
  failed: new Set(),
  wingetAvailable: false,
  wingetVersion: '',
  wingetChecked: false,
  logs: ['[sẵn sàng] Đang kiểm tra các ứng dụng đã có trên máy.']
};

const els = {
  catalog: document.getElementById('catalog'),
  catalogCount: document.getElementById('catalogCount'),
  installedSummary: document.getElementById('installedSummary'),
  viewModes: document.getElementById('viewModes'),
  categoryDropdown: document.getElementById('categoryDropdown'),
  sourceDropdown: document.getElementById('sourceDropdown'),
  statusDropdown: document.getElementById('statusDropdown'),
  sortDropdown: document.getElementById('sortDropdown'),
  tagFilterBar: document.getElementById('tagFilterBar'),
  tagReset: document.getElementById('tagResetBtn'),
  activeFilterSummary: document.getElementById('activeFilterSummary'),
  searchField: document.querySelector('.search-field'),
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
  stopBtn: document.getElementById('stopBtn'),
  retryFailed: document.getElementById('retryFailedBtn'),
  exportQueue: document.getElementById('exportQueueBtn'),
  exportProfile: document.getElementById('exportProfileBtn'),
  importProfile: document.getElementById('importProfileBtn'),
  importProfileInput: document.getElementById('importProfileInput'),
  selectAll: document.getElementById('selectAllBtn'),
  clearSelection: document.getElementById('clearSelectionBtn'),
  wingetMissingBanner: document.getElementById('wingetMissingBanner'),
  wingetRecheck: document.getElementById('wingetRecheckBtn'),
  wingetInstall: document.getElementById('wingetInstallBtn'),
  queueCount: document.getElementById('queueCount'),
  installedCount: document.getElementById('installedCount'),
  largeAppCount: document.getElementById('largeAppCount'),
  navQueueCount: document.getElementById('navQueueCount'),
  dockCount: document.getElementById('dockCount'),
  dockSubtext: document.getElementById('dockSubtext'),
  selectionDock: document.getElementById('selectionDock'),
  presets: document.getElementById('presetList'),
  workspaces: document.getElementById('workspaceList'),
  presetPrev: document.getElementById('presetPrev'),
  presetNext: document.getElementById('presetNext'),
  planSummary: document.getElementById('planSummary'),
  workspaceSummary: document.getElementById('workspaceSummary'),
  navWorkspaceCount: document.getElementById('navWorkspaceCount'),
  navUpdateCount: document.getElementById('navUpdateCount'),
  navVersionCount: document.getElementById('navVersionCount'),
  updatesSearch: document.getElementById('updatesSearchInput'),
  updatesList: document.getElementById('updatesList'),
  updatesStatus: document.getElementById('updatesStatus'),
  updatesCount: document.getElementById('updatesCount'),
  updatesDetectedCount: document.getElementById('updatesDetectedCount'),
  updatesModeLabel: document.getElementById('updatesModeLabel'),
  scanUpdates: document.getElementById('scanUpdatesBtn'),
  updateAll: document.getElementById('updateAllBtn'),
  versionSearch: document.getElementById('versionSearchInput'),
  versionScope: document.getElementById('versionScope'),
  versionAppList: document.getElementById('versionAppList'),
  versionAppStatus: document.getElementById('versionAppStatus'),
  loadVersions: document.getElementById('loadVersionsBtn'),
  versionDetailStatus: document.getElementById('versionDetailStatus'),
  versionSelectedCard: document.getElementById('versionSelectedCard'),
  versionList: document.getElementById('versionList'),
  installVersion: document.getElementById('installVersionBtn'),
  reinstallVersion: document.getElementById('reinstallVersionBtn'),
  realMode: document.getElementById('realMode'),
  realModeWarning: document.getElementById('realModeWarning'),
  modeLabel: document.getElementById('modeLabel'),
  log: document.getElementById('logBox'),
  clearLogs: document.getElementById('clearLogsBtn'),
  detailDialog: document.getElementById('detailDialog'),
  detailIcon: document.getElementById('detailIcon'),
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
  detailUpgrade: document.getElementById('detailUpgradeBtn'),
  detailUninstall: document.getElementById('detailUninstallBtn'),
  workspaceDialog: document.getElementById('workspaceDialog'),
  workspaceDetailIcon: document.getElementById('workspaceDetailIcon'),
  workspaceDetailName: document.getElementById('workspaceDetailName'),
  workspaceDetailDescription: document.getElementById('workspaceDetailDescription'),
  workspaceDetailCount: document.getElementById('workspaceDetailCount'),
  workspaceDetailPending: document.getElementById('workspaceDetailPending'),
  workspaceDetailInstalled: document.getElementById('workspaceDetailInstalled'),
  workspaceDetailSources: document.getElementById('workspaceDetailSources'),
  workspaceDetailListSummary: document.getElementById('workspaceDetailListSummary'),
  workspaceDetailApps: document.getElementById('workspaceDetailApps'),
  workspaceCommandSection: document.getElementById('workspaceCommandSection'),
  workspaceCommandPreview: document.getElementById('workspaceCommandPreview'),
  workspaceDetailQueue: document.getElementById('workspaceDetailQueueBtn'),
  workspaceDetailApply: document.getElementById('workspaceDetailApplyBtn'),
  actionConfirmDialog: document.getElementById('actionConfirmDialog'),
  actionConfirmIcon: document.getElementById('actionConfirmIcon'),
  actionConfirmTitle: document.getElementById('actionConfirmTitle'),
  actionConfirmMessage: document.getElementById('actionConfirmMessage'),
  actionConfirmCommand: document.getElementById('actionConfirmCommand'),
  actionConfirmNote: document.getElementById('actionConfirmNote'),
  actionConfirmCancel: document.getElementById('actionConfirmCancelBtn'),
  actionConfirmRun: document.getElementById('actionConfirmRunBtn'),
  theme: document.getElementById('themeBtn'),
  rescan: document.getElementById('rescanBtn'),
  systemReady: document.getElementById('systemReady'),
  toastRegion: document.getElementById('toastRegion'),
  statusWinget: document.getElementById('statusWinget'),
  statusWingetText: document.getElementById('statusWingetText'),
  statusInstalledText: document.getElementById('statusInstalledText'),
  statusSelectedText: document.getElementById('statusSelectedText'),
  statusTerminalBtn: document.getElementById('statusTerminalBtn'),
  statusTerminalCount: document.getElementById('statusTerminalCount')
};

let detailAppId = '';
let dialogClosing = false;
let workspaceDetailId = '';
let workspaceDialogClosing = false;
let actionConfirmResolve = null;
let actionConfirmClosing = false;

/* ------------------------------------------------------------- dropdown */

// Dropdown tùy chỉnh thay cho <select> gốc: đồng bộ theme, điều khiển được
// bằng bàn phím (mũi tên, Enter, Esc, Home/End) và đóng khi bấm ra ngoài.
const openDropdowns = new Set();

function createDropdown(container, { options, value, onChange, statusDot = false }) {
  const label = container.dataset.dropdownLabel || '';
  let items = [...options];
  let current = value;
  let focusIndex = -1;

  container.classList.toggle('has-status-dot', statusDot);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'dropdown-toggle';
  toggle.setAttribute('aria-haspopup', 'listbox');
  toggle.setAttribute('aria-expanded', 'false');
  if (label) toggle.setAttribute('aria-label', label);

  const valueEl = document.createElement('span');
  valueEl.className = 'dropdown-value';
  const marker = document.createElement('span');
  marker.className = 'dropdown-marker';
  marker.setAttribute('aria-hidden', 'true');
  const markerIcon = document.createElement('i');
  markerIcon.className = 'ph ph-list';
  marker.append(markerIcon);
  const caret = document.createElement('i');
  caret.className = 'ph ph-caret-down dropdown-caret';
  caret.setAttribute('aria-hidden', 'true');
  toggle.append(marker, valueEl, caret);

  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  menu.setAttribute('role', 'listbox');
  if (label) menu.setAttribute('aria-label', label);
  menu.hidden = true;

  container.append(toggle, menu);

  const itemFor = (val) => items.find((item) => item.value === val);
  const labelFor = (val) => itemFor(val)?.label || '';

  function renderMenu() {
    menu.innerHTML = '';
    items.forEach((item, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'dropdown-option';
      option.setAttribute('role', 'option');
      option.dataset.value = item.value;
      if (item.tone) option.dataset.tone = item.tone;
      option.classList.toggle('selected', item.value === current);
      option.classList.toggle('focused', index === focusIndex);
      option.setAttribute('aria-selected', String(item.value === current));
      const itemMarker = document.createElement('span');
      itemMarker.className = 'dropdown-marker';
      itemMarker.setAttribute('aria-hidden', 'true');
      if (item.icon) {
        const icon = document.createElement('i');
        icon.className = `ph ${item.icon}`;
        itemMarker.append(icon);
      }
      const text = document.createElement('span');
      text.className = 'dropdown-option-text';
      text.textContent = item.label;
      const check = document.createElement('i');
      check.className = 'ph ph-check';
      check.setAttribute('aria-hidden', 'true');
      option.append(itemMarker, text, check);
      option.addEventListener('click', () => {
        select(item.value);
        close();
        toggle.focus();
      });
      menu.appendChild(option);
    });
  }

  function updateToggle() {
    const item = itemFor(current);
    const labelText = item?.label || '';
    valueEl.textContent = labelText;
    toggle.title = label ? `${label}: ${labelText}` : labelText;
    toggle.dataset.tone = item?.tone || '';
    markerIcon.className = `ph ${item?.icon || 'ph-list'}`;
  }

  function select(next, { silent = false } = {}) {
    if (next === current) return;
    current = next;
    updateToggle();
    if (!silent) onChange(current);
  }

  function open() {
    if (!menu.hidden) return;
    openDropdowns.forEach((other) => other.close());
    focusIndex = Math.max(0, items.findIndex((item) => item.value === current));
    renderMenu();
    menu.hidden = false;
    container.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    openDropdowns.add(api);
    menu.querySelector('.focused')?.scrollIntoView({ block: 'nearest' });
  }

  function close() {
    if (menu.hidden) return;
    menu.hidden = true;
    container.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    openDropdowns.delete(api);
  }

  function moveFocus(delta) {
    if (menu.hidden) {
      open();
      return;
    }
    focusIndex = (focusIndex + delta + items.length) % items.length;
    menu.querySelectorAll('.dropdown-option').forEach((option, index) => {
      option.classList.toggle('focused', index === focusIndex);
    });
    menu.querySelector('.focused')?.scrollIntoView({ block: 'nearest' });
  }

  toggle.addEventListener('click', () => {
    if (menu.hidden) open();
    else close();
  });
  container.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(-1); }
    else if (event.key === 'Home' && !menu.hidden) { event.preventDefault(); moveFocus(-focusIndex); }
    else if (event.key === 'End' && !menu.hidden) { event.preventDefault(); moveFocus(items.length - 1 - focusIndex); }
    else if ((event.key === 'Enter' || event.key === ' ') && !menu.hidden) {
      event.preventDefault();
      const item = items[focusIndex];
      if (item) select(item.value);
      close();
      toggle.focus();
    } else if (event.key === 'Escape' && !menu.hidden) {
      event.stopPropagation();
      close();
      toggle.focus();
    }
  });

  const api = {
    get value() { return current; },
    set(next, opts) { select(next, opts); },
    setOptions(nextItems) {
      items = [...nextItems];
      if (!items.some((item) => item.value === current)) current = items[0]?.value;
      updateToggle();
      if (!menu.hidden) renderMenu();
    },
    close
  };
  updateToggle();
  return api;
}

// Đóng dropdown khi bấm ra ngoài.
document.addEventListener('pointerdown', (event) => {
  if (!openDropdowns.size) return;
  if (!event.target.closest('.dropdown')) {
    openDropdowns.forEach((dropdown) => dropdown.close());
  }
});

let categoryDropdown = null;
let sourceDropdown = null;
let statusDropdown = null;
let sortDropdown = null;

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

function compactSearch(value) {
  return normalizeSearch(value).replace(/[^a-z0-9]+/g, '');
}

const SEARCH_ALIASES = new Map(Object.entries({
  ai: 'artificial intelligence machine learning llm openai claude codex cursor qoder ollama lm studio',
  android: 'mobile emulator adb apk google android studio',
  archive: 'zip unzip compress extract sevenzip nanazip winrar',
  browser: 'chrome edge firefox brave vivaldi opera floorp arc duckduckgo librewolf tor',
  cloud: 'aws azure google cloud gcloud doctl flyctl heroku terraform opentofu pulumi',
  db: 'database sql mysql postgresql postgres sqlite mongodb redis neo4j dbeaver datagrip pgadmin',
  database: 'db sql mysql postgresql postgres sqlite mongodb redis neo4j dbeaver datagrip pgadmin',
  docker: 'container containers kubernetes k8s podman rancher desktop docker desktop',
  editor: 'ide code editor vscode cursor zed sublime neovim jetbrains',
  game: 'gaming steam epic gog battle net bnet ea ubisoft riot valorant minecraft roblox',
  git: 'version control github gitlab sourcetree gitkraken git extensions',
  ide: 'code editor vscode visual studio jetbrains intellij pycharm webstorm rider goland clion',
  js: 'javascript typescript node npm pnpm yarn bun deno frontend backend',
  k8s: 'kubernetes kubectl helm kustomize minikube kind k3d',
  node: 'nodejs javascript typescript npm pnpm yarn bun deno',
  office: 'word excel powerpoint outlook teams microsoft 365 document spreadsheet presentation',
  python: 'py pip conda miniconda jupyter ruff spyder pycharm ai machine learning',
  remote: 'ssh ftp sftp vpn remote desktop anydesk teamviewer tailscale wireguard zerotier',
  shell: 'terminal powershell pwsh windows terminal alacritty wezterm warp nushell',
  terminal: 'shell cli command line powershell windows terminal alacritty wezterm warp',
  vpn: 'tailscale wireguard openvpn nordvpn protonvpn mullvad zerotier warp windscribe expressvpn hma surfshark pia private internet access cyberghost ipvanish tunnelbear hideme hide me vpn unlimited adguard vpn',
  vs: 'visual studio vscode visualstudiocode visual studio code microsoft visual studio',
  vsc: 'visual studio code vscode visualstudiocode',
  vscode: 'visual studio code vsc microsoft visualstudiocode'
}));

function acronymFor(value) {
  return normalizeSearch(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('');
}

function searchAliasesFor(app) {
  const aliases = new Set();
  const lowerName = normalizeSearch(app.name);
  const lowerPackage = normalizeSearch(app.pkg);
  aliases.add(acronymFor(app.name));
  aliases.add(compactSearch(app.name));
  aliases.add(compactSearch(app.pkg));
  if (lowerName.includes('visual studio code')) aliases.add('vscode vsc vs code');
  if (lowerName.includes('visual studio')) aliases.add('vs visualstudio');
  if (lowerName.includes('node')) aliases.add('js javascript typescript npm');
  if (lowerName.includes('python')) aliases.add('py pip ai');
  if (lowerPackage.includes('postgresql')) aliases.add('postgres database db sql');
  if (lowerPackage.includes('mongodb')) aliases.add('mongo database db nosql');
  if (lowerPackage.includes('sqlite')) aliases.add('database db sql');
  return [...aliases].filter(Boolean).join(' ');
}

function expandQueryTokens(query) {
  return normalizeSearch(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => {
      const alias = SEARCH_ALIASES.get(token);
      return [token, compactSearch(token), ...(alias ? normalizeSearch(alias).split(/[^a-z0-9]+/).filter(Boolean) : [])];
    });
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

function currentLanguage() {
  return window.SetupKitI18n?.getLanguage?.() || 'en';
}

function uiText(vi, en) {
  return currentLanguage() === 'vi' ? vi : en;
}

function scheduleLocalize() {
  if (!window.SetupKitI18n || localizeFrame) return;
  localizeFrame = window.requestAnimationFrame(() => {
    localizeFrame = 0;
    window.SetupKitI18n?.localize(document.body);
  });
}

function displayCategoryName(category) {
  if (!category) return '';
  if (currentLanguage() === 'vi') return category.name;
  const labels = {
    'ide-code': 'IDE & Code',
    'languages-runtime': 'Languages & Runtime',
    'build-package': 'Build & Package',
    'terminal-git': 'Terminal & Git',
    cli: 'CLI',
    'devops-cloud': 'DevOps & Cloud',
    'database-api': 'Database & API',
    'ai-code': 'AI Coding',
    'network-security': 'Network & Security',
    'office-work': 'Office & Work',
    'communication-social': 'Communication & Social',
    browser: 'Browser',
    utilities: 'Utilities',
    'design-media': 'Design & Media',
    'game-dev': 'Game & Game Dev'
  };
  return category.en || category.nameEn || labels[category.id] || category.name;
}

function displayTagLabel(tagId) {
  const tag = tagMetadata.get(tagId);
  if (!tag) return tagId;
  if (currentLanguage() === 'vi') return tag.label;
  const labels = {
    code: 'Code',
    cli: 'CLI',
    language: 'Language',
    network: 'Network',
    security: 'Security',
    productivity: 'Productivity',
    social: 'Social',
    browser: 'Browser',
    remote: 'Remote',
    mobile: 'Mobile',
    data: 'Data',
    utility: 'Utility',
    terminal: 'Terminal',
    editor: 'Editor',
    runtime: 'Runtime',
    design: 'Design',
    database: 'Database',
    cloud: 'Cloud',
    container: 'Container',
    devops: 'DevOps',
    git: 'Git',
    ide: 'IDE',
    package: 'Package',
    'package-manager': 'Package',
    office: 'Office',
    media: 'Media',
    game: 'Game',
    api: 'API',
    ai: 'AI',
    javascript: 'JavaScript',
    python: 'Python',
    dotnet: '.NET',
    java: 'Java',
    go: 'Go',
    rust: 'Rust',
    cpp: 'C/C++',
    kubernetes: 'Kubernetes',
    data: 'Data'
  };
  return tag.en || tag.labelEn || labels[tag.id] || tag.label;
}

function displayAppDescription(app) {
  if (currentLanguage() === 'vi') return app.desc;
  const source = app.source === 'msstore' ? 'Microsoft Store' : 'winget';
  const category = displayCategoryName(catalogCategories.find((item) => item.id === app.categoryId)) || app.cat;
  return `${category} package from ${source}.`;
}

function displayPresetDescription(preset) {
  if (currentLanguage() === 'vi') return preset.desc || preset.description;
  const count = preset.apps?.length || 0;
  return `${count} reviewed apps for this workspace.`;
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

function upgradeCommandFor(app) {
  const source = app.source === 'msstore' ? 'msstore' : 'winget';
  const silent = app.source === 'msstore' ? '' : ' --silent';
  return `winget upgrade --id ${app.pkg} --exact --source ${source}${silent} --accept-package-agreements --accept-source-agreements --disable-interactivity`;
}

function uninstallCommandFor(app) {
  const source = app.source === 'msstore' ? '' : ' --source winget';
  return `winget uninstall --id ${app.pkg} --exact${source} --accept-source-agreements`;
}

function installLocationLabel(app) {
  if (app.source === 'msstore') return 'Do Microsoft Store quản lý';
  return state.installLocations.get(app.id) || 'Mặc định của nhà phát hành, xác nhận sau khi cài';
}

function appById(id) {
  return appIndex.get(id);
}

function presetById(id) {
  return presets.find((item) => item.id === id);
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

function workspaceAppsFor(preset) {
  const ids = new Set(preset?.apps || []);
  for (const appId of preset?.apps || []) {
    dependencyIdsFor(appById(appId)).forEach((dependencyId) => ids.add(dependencyId));
  }
  return sortByInstallOrder([...ids].map(appById).filter(Boolean));
}

function allUpdateApps() {
  return [...apps]
    .filter((app) => state.installed.get(app.id)?.updateAvailable)
    .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
}

function updateApps() {
  const query = state.updateQuery.trim();
  return allUpdateApps().filter((app) => !query || appMatchesQuery(app, query));
}

function versionEligibleApps() {
  const query = state.versionQuery.trim();
  const installedWingetCount = apps.filter((app) => app.source === 'winget' && state.installed.has(app.id)).length;
  const scope = state.versionScope === 'installed' && installedWingetCount === 0 ? 'all' : state.versionScope;
  return [...apps]
    .filter((app) => app.source === 'winget')
    .filter((app) => {
      if (scope === 'installed') return state.installed.has(app.id);
      if (scope === 'missing') return !state.installed.has(app.id);
      return true;
    })
    .filter((app) => !query || appMatchesQuery(app, query))
    .sort((left, right) => {
      const leftInstalled = state.installed.has(left.id) ? 0 : 1;
      const rightInstalled = state.installed.has(right.id) ? 0 : 1;
      return leftInstalled - rightInstalled
        || left.name.localeCompare(right.name, 'vi');
    });
}

function ensureVersionSelection() {
  const list = versionEligibleApps();
  if (state.versionAppId && list.some((app) => app.id === state.versionAppId)) return;
  const preferred = list[0]
    || apps.find((app) => app.source === 'winget' && state.installed.has(app.id))
    || apps.find((app) => app.source === 'winget');
  state.versionAppId = preferred?.id || '';
  state.selectedVersion = '';
}

function tagLabel(tagId) {
  return displayTagLabel(tagId);
}

function selectedApps() {
  return sortByInstallOrder(apps.filter((app) => state.selected.has(app.id)));
}

// Chỉ lưu selection trong lúc người dùng thao tác; khi mở app mới luôn bắt đầu trống.
const SELECTION_KEY = 'setupkit-selection';

function persistSelection() {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify([...state.selected]));
  } catch {
    // Không lưu được cũng không sao.
  }
}

function clearPersistedSelection() {
  try {
    localStorage.removeItem(SELECTION_KEY);
  } catch {
    // Không xóa được cũng không ảnh hưởng phiên hiện tại.
  }
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

  els.planSummary.textContent = `${Math.min(4, presets.length)} workspace nổi bật`;
  if (els.workspaceSummary) els.workspaceSummary.textContent = `${presets.length} workspace theo vai trò và lĩnh vực`;
  if (els.navWorkspaceCount) els.navWorkspaceCount.textContent = presets.length;

  clearPersistedSelection();
  state.activePreset = '';
  state.selected = new Set();

  // Dựng chỉ mục tìm kiếm khi máy rảnh để lần gõ đầu tiên không bị khựng.
  idle(buildSearchIndex);
}

function buildSearchIndex() {
  // Chưa có catalog thì chưa dựng index (tránh race khi người dùng gõ sớm).
  if (searchIndex || !apps.length) return;
  searchIndex = new Map();
  for (const app of apps) {
    const tagLabels = app.tags.map(tagLabel).join(' ');
    const haystack = normalizeSearch([
      app.name,
      app.pkg,
      app.cat,
      app.publisher,
      app.type,
      app.desc,
      app.tags.join(' '),
      tagLabels,
      searchAliasesFor(app)
    ].join(' '));
    searchIndex.set(app.id, {
      haystack,
      compact: compactSearch(haystack),
      name: normalizeSearch(app.name),
      pkg: normalizeSearch(app.pkg)
    });
  }
}

function appMatchesQuery(app, query) {
  if (!query) return true;
  buildSearchIndex();
  const record = searchIndex?.get(app.id);
  if (!record) return false;
  const queryCompact = compactSearch(query);
  if (record.compact.includes(queryCompact)) return true;
  return expandQueryTokens(query).every((variants) => (
    variants.some((variant) => variant && (
      record.haystack.includes(variant) || record.compact.includes(compactSearch(variant))
    ))
  ));
}

function queryRelevance(app, query) {
  if (!query) return 0;
  const record = searchIndex?.get(app.id);
  if (!record) return 0;
  const normalized = normalizeSearch(query);
  const compact = compactSearch(query);
  let score = 0;
  if (record.name === normalized) score += 120;
  if (record.name.startsWith(normalized)) score += 80;
  if (record.pkg === normalized) score += 75;
  if (record.pkg.includes(normalized)) score += 45;
  if (record.compact.startsWith(compact)) score += 32;
  for (const variants of expandQueryTokens(query)) {
    if (variants.some((variant) => record.name.includes(variant))) score += 12;
    if (variants.some((variant) => record.pkg.includes(variant))) score += 10;
    if (variants.some((variant) => record.haystack.includes(variant))) score += 4;
  }
  return score;
}

function statusRank(app) {
  if (state.running && state.currentId === app.id) return 0;
  if (state.failed.has(app.id)) return 1;
  if (state.selected.has(app.id)) return 2;
  const details = state.installed.get(app.id);
  if (details?.updateAvailable) return 3;
  if (!details) return 4;
  return 5;
}

function appSortValue(app, sort) {
  const details = state.installed.get(app.id);
  const pending = !details;
  const large = app.size === 'large';
  const sourceRank = app.source === 'winget' ? 0 : 1;
  const order = Number(app.installOrder || 999) * 1000 + Number(app.order || 999);
  const values = {
    smart: statusRank(app) * 100000 + order,
    installOrder: order,
    name: app.name.toLocaleLowerCase('vi'),
    category: `${app.cat}|${app.name.toLocaleLowerCase('vi')}`,
    status: `${statusRank(app)}|${app.name.toLocaleLowerCase('vi')}`,
    source: `${sourceRank}|${app.name.toLocaleLowerCase('vi')}`,
    size: `${large ? 0 : 1}|${app.name.toLocaleLowerCase('vi')}`,
    pending: `${pending ? 0 : 1}|${app.name.toLocaleLowerCase('vi')}`
  };
  return values[sort] ?? values.smart;
}

function compareApps(left, right, query = '') {
  if (query) {
    const relevance = queryRelevance(right, query) - queryRelevance(left, query);
    if (relevance) return relevance;
  }
  const leftValue = appSortValue(left, state.sort);
  const rightValue = appSortValue(right, state.sort);
  if (typeof leftValue === 'number' && typeof rightValue === 'number' && leftValue !== rightValue) {
    return leftValue - rightValue;
  }
  const valueCompare = String(leftValue).localeCompare(String(rightValue), 'vi', { numeric: true });
  if (valueCompare) return valueCompare;
  return left.name.localeCompare(right.name, 'vi');
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
  const filtered = apps.filter((app) => {
    if (!appMatchesQuery(app, query)) return false;
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
  return filtered.sort((left, right) => compareApps(left, right, query));
}

/* -------------------------------------------------------------- renderers */

function renderCategories() {
  categoryDropdown?.setOptions([
    { value: 'all', label: 'Tất cả danh mục', icon: 'ph-squares-four', tone: 'neutral' },
    ...catalogCategories.map((category) => ({
      value: category.id,
      label: displayCategoryName(category),
      icon: category.icon || 'ph-folder',
      tone: 'accent'
    }))
  ]);
  categoryDropdown?.set(state.category, { silent: true });
}

function renderFilterDropdowns() {
  const isVi = currentLanguage() === 'vi';
  renderCategories();
  sourceDropdown?.setOptions([
    { value: 'all', label: isVi ? 'Tất cả nguồn' : 'All sources', icon: 'ph-stack', tone: 'neutral' },
    { value: 'winget', label: isVi ? 'Chỉ winget' : 'winget only', icon: 'ph-terminal-window', tone: 'accent' },
    { value: 'msstore', label: isVi ? 'Chỉ Microsoft Store' : 'Microsoft Store only', icon: 'ph-storefront', tone: 'store' }
  ]);
  sourceDropdown?.set(state.source, { silent: true });
  statusDropdown?.setOptions([
    { value: 'all', label: isVi ? 'Mọi tình trạng' : 'Any status', icon: 'ph-circles-three', tone: 'neutral' },
    { value: 'installed', label: isVi ? 'Đã cài trên máy' : 'Installed on this machine', icon: 'ph-check-circle', tone: 'success' },
    { value: 'available', label: isVi ? 'Chưa cài' : 'Not installed', icon: 'ph-download-simple', tone: 'muted' },
    { value: 'selected', label: isVi ? 'Đang chọn' : 'Selected', icon: 'ph-stack', tone: 'accent' }
  ]);
  statusDropdown?.set(state.status, { silent: true });
  sortDropdown?.setOptions([
    { value: 'smart', label: sortLabel('smart'), icon: 'ph-sparkle', tone: 'accent' },
    { value: 'installOrder', label: sortLabel('installOrder'), icon: 'ph-sort-ascending', tone: 'neutral' },
    { value: 'name', label: sortLabel('name'), icon: 'ph-text-aa', tone: 'neutral' },
    { value: 'category', label: sortLabel('category'), icon: 'ph-folders', tone: 'accent' },
    { value: 'status', label: sortLabel('status'), icon: 'ph-traffic-signal', tone: 'success' },
    { value: 'source', label: sortLabel('source'), icon: 'ph-git-branch', tone: 'store' },
    { value: 'size', label: sortLabel('size'), icon: 'ph-hard-drives', tone: 'warning' },
    { value: 'pending', label: sortLabel('pending'), icon: 'ph-download-simple', tone: 'muted' }
  ]);
  sortDropdown?.set(state.sort, { silent: true });
}

function renderTags() {
  els.tagFilterBar.innerHTML = catalogTags.map((tag) => {
    const active = state.tags.has(tag.id);
    const count = tagCounts.get(tag.id) || 0;
    const label = displayTagLabel(tag.id);
    return `
      <button
        class="tag-filter-button ${active ? 'active' : ''}"
        data-tag="${escapeHtml(tag.id)}"
        type="button"
        aria-pressed="${active}"
        title="${count} ứng dụng"
      >
        <i class="ph ${escapeHtml(tag.icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(label)}</span>
        <small>${count}</small>
      </button>
    `;
  }).join('');
  els.tagReset.hidden = state.tags.size === 0;
}

function sortLabel(value) {
  const labels = currentLanguage() === 'vi'
    ? {
        smart: 'Thông minh',
        installOrder: 'Thứ tự cài',
        name: 'Tên A-Z',
        category: 'Danh mục',
        status: 'Tình trạng',
        source: 'Nguồn cài',
        size: 'App lớn trước',
        pending: 'Chưa cài trước'
      }
    : {
        smart: 'Smart',
        installOrder: 'Install order',
        name: 'Name A-Z',
        category: 'Category',
        status: 'Status',
        source: 'Source',
        size: 'Large apps first',
        pending: 'Not installed first'
      };
  return labels[value] || labels.smart;
}

function statusFilterLabel(value) {
  const labels = currentLanguage() === 'vi'
    ? { installed: 'Đã cài', available: 'Chưa cài', selected: 'Đang chọn' }
    : { installed: 'Installed', available: 'Not installed', selected: 'Selected' };
  return labels[value] || '';
}

function renderFilterSummary() {
  const parts = [];
  if (state.category !== 'all') {
    parts.push(displayCategoryName(catalogCategories.find((category) => category.id === state.category)));
  }
  if (state.tags.size) parts.push([...state.tags].map(tagLabel).join(' + '));
  if (state.source !== 'all') parts.push(state.source === 'msstore' ? 'Microsoft Store' : 'WinGet');
  if (state.status !== 'all') {
    parts.push(statusFilterLabel(state.status));
  }
  if (state.sort !== 'smart') {
    parts.push(currentLanguage() === 'vi' ? `Sắp xếp: ${sortLabel(state.sort)}` : `Sort: ${sortLabel(state.sort)}`);
  }
  els.activeFilterSummary.textContent = parts.filter(Boolean).length
    ? (currentLanguage() === 'vi'
        ? `Đang lọc: ${parts.filter(Boolean).join(' / ')}`
        : `Filtering: ${parts.filter(Boolean).join(' / ')}`)
    : (currentLanguage() === 'vi'
        ? 'Có thể chọn nhiều tag để thu hẹp danh sách. Nhấn / để tìm nhanh.'
        : 'Select multiple tags to narrow the list. Press / to search.');
}

function presetButtonHTML(preset) {
  const pendingCount = preset.apps.filter((id) => !state.installed.has(id)).length;
  const installedCount = preset.apps.length - pendingCount;
  const largeCount = preset.apps.map(appById).filter((app) => app?.size === 'large').length;
  const previewApps = preset.apps.map(appById).filter(Boolean);
  const previewMarkup = previewApps.map((app) => `
    <span class="workspace-app-tile" title="${escapeHtml(app.name)}">
      ${appIconMarkup(app)}
    </span>
  `).join('');
  return `
    <button class="preset-button ${state.activePreset === preset.id ? 'active' : ''}" data-preset="${preset.id}" type="button" title="${escapeHtml(displayPresetDescription(preset))}">
      <span class="preset-icon" aria-hidden="true"><i class="ph ${preset.icon}"></i></span>
      <span class="preset-copy">
        <strong>${escapeHtml(preset.name)}</strong>
        <span class="preset-description">${escapeHtml(displayPresetDescription(preset))}</span>
        <span class="preset-count">${pendingCount} cần cài${installedCount ? `, ${installedCount} đã có` : ''}${largeCount ? `, ${largeCount} app lớn` : ''}</span>
      </span>
      <span class="workspace-preview" aria-hidden="true">
        <span class="workspace-app-rail">${previewMarkup}</span>
      </span>
    </button>
  `;
}

function workspaceCardHTML(preset) {
  const pendingCount = preset.apps.filter((id) => !state.installed.has(id)).length;
  const installedCount = preset.apps.length - pendingCount;
  const largeCount = preset.apps.map(appById).filter((app) => app?.size === 'large').length;
  const previewApps = preset.apps.map(appById).filter(Boolean);
  const previewMarkup = previewApps.map((app) => `
    <span class="workspace-app-tile" title="${escapeHtml(app.name)}">
      ${appIconMarkup(app)}
    </span>
  `).join('');
  return `
    <article class="workspace-card ${state.activePreset === preset.id ? 'active' : ''}" data-workspace="${escapeHtml(preset.id)}" tabindex="0">
      <div class="workspace-card-heading">
        <span class="preset-icon" aria-hidden="true"><i class="ph ${escapeHtml(preset.icon)}"></i></span>
        <div class="workspace-card-title">
          <strong>${escapeHtml(preset.name)}</strong>
          <span>${escapeHtml(displayPresetDescription(preset))}</span>
        </div>
        <button class="workspace-open-button" data-workspace-detail="${escapeHtml(preset.id)}" type="button" aria-label="Xem chi tiết ${escapeHtml(preset.name)}" title="Xem chi tiết workspace">
          <i class="ph ph-arrow-up-right" aria-hidden="true"></i>
        </button>
      </div>
      <div class="workspace-preview workspace-preview-large" aria-label="Các ứng dụng trong workspace">
        <div class="workspace-app-rail" tabindex="0">${previewMarkup}</div>
      </div>
      <div class="workspace-card-footer">
        <span><strong>${previewApps.length}</strong> ứng dụng</span>
        <span>${pendingCount} cần cài${installedCount ? ` · ${installedCount} đã có` : ''}${largeCount ? ` · ${largeCount} app lớn` : ''}</span>
      </div>
      <button class="button workspace-apply-button" data-workspace-apply="${escapeHtml(preset.id)}" type="button">
        <i class="ph ph-plus-circle" aria-hidden="true"></i>
        Dùng workspace này
      </button>
    </article>
  `;
}

function renderPresets() {
  const preview = presets.slice(0, 4);
  els.presets.innerHTML = preview.map(presetButtonHTML).join('');
  if (els.workspaces) {
    els.workspaces.innerHTML = presets.map(workspaceCardHTML).join('');
  }
  updatePresetNav();
}

function updatePresetActive() {
  els.presets.querySelectorAll('.preset-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.preset === state.activePreset);
  });
  els.workspaces?.querySelectorAll('.workspace-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.workspace === state.activePreset);
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
        <p class="app-desc">${escapeHtml(displayAppDescription(app))}</p>
        <div class="app-meta-row">
          <span class="app-type">${escapeHtml(app.type)}</span>
          ${app.size === 'large' ? '<span class="app-size-label"><i class="ph ph-hard-drives" aria-hidden="true"></i>App lớn</span>' : ''}
          ${visibleTags}
        </div>
        ${details ? `<div class="app-install-meta ${details.updateAvailable ? 'has-update' : ''}"><i class="ph ${details.updateAvailable ? 'ph-arrow-circle-up' : 'ph-check-circle'}" aria-hidden="true"></i><span>${details.updateAvailable ? 'Có bản cập nhật mới' : version}</span></div>` : ''}
      </div>
      <div class="app-card-actions ${details ? 'installed-actions' : ''}">
        ${actions}
      </div>
    </article>
  `;
}

/* --------------------------------------------------------- kiểu hiển thị */
const VIEW_MODES = ['grid', 'list', 'icon'];
const SORT_MODES = ['smart', 'installOrder', 'name', 'category', 'status', 'source', 'size', 'pending'];

function applyViewMode() {
  els.catalog.className = `app-grid mode-${state.viewMode}`;
}

function renderViewModes() {
  els.viewModes.querySelectorAll('[data-mode]').forEach((button) => {
    const active = button.dataset.mode === state.viewMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setViewMode(mode) {
  if (!VIEW_MODES.includes(mode)) return;
  state.viewMode = mode;
  try {
    localStorage.setItem('setupkit-view', mode);
  } catch {
    // Không lưu được cũng không sao.
  }
  applyViewMode();
  renderViewModes();
}

function initViewMode() {
  let saved = 'grid';
  try {
    const value = localStorage.getItem('setupkit-view');
    if (VIEW_MODES.includes(value)) saved = value;
  } catch {
    // localStorage không khả dụng.
  }
  state.viewMode = saved;
  applyViewMode();
  renderViewModes();
}

function setSortMode(mode, { render = true } = {}) {
  if (!SORT_MODES.includes(mode)) return;
  state.sort = mode;
  try {
    localStorage.setItem('setupkit-sort', mode);
  } catch {
    // Không lưu được cũng không sao.
  }
  sortDropdown?.set(mode, { silent: true });
  if (render) renderCatalog();
}

function initSortMode() {
  let saved = 'smart';
  try {
    const value = localStorage.getItem('setupkit-sort');
    if (SORT_MODES.includes(value)) saved = value;
  } catch {
    // localStorage không khả dụng.
  }
  state.sort = saved;
}

function updateSearchAffordance() {
  const hasQuery = Boolean(state.query.trim());
  els.searchClear.classList.toggle('visible', hasQuery);
  els.searchField?.classList.toggle('is-active', hasQuery);
}

function renderCatalog() {
  applyViewMode();
  const list = filteredApps();
  els.catalogCount.innerHTML = `<strong>${list.length}</strong> / ${apps.length} ứng dụng phù hợp`;
  els.installedSummary.textContent = state.scanning
    ? 'Đang quét Registry, Start Menu và winget'
    : `${state.installed.size} ứng dụng đã cài trên máy`;
  updateSearchAffordance();
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
    scheduleLocalize();
    return;
  }

  els.catalog.innerHTML = list.map(cardHTML).join('');
  scheduleLocalize();
}

// Cập nhật một card tại chỗ khi chọn/bỏ chọn - không rebuild cả lưới 450 card.
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

function updateStatusMeta(app) {
  const details = state.installed.get(app.id);
  if (state.running && state.currentId === app.id) {
    return { label: 'Đang cập nhật', className: 'warning', icon: 'ph-arrow-clockwise', spin: true };
  }
  if (state.failed.has(app.id)) {
    return { label: 'Cần kiểm tra', className: 'danger', icon: 'ph-warning-circle' };
  }
  if (details?.updateAvailable) {
    return { label: 'Có update', className: 'warning', icon: 'ph-arrow-circle-up' };
  }
  return { label: 'Mới nhất', className: 'success', icon: 'ph-check-circle' };
}

function updateItemHTML(app) {
  const details = state.installed.get(app.id);
  const meta = updateStatusMeta(app);
  return `
    <div class="queue-item update-item" data-update-app="${app.id}">
      <span class="queue-item-icon" aria-hidden="true">${appIconMarkup(app)}</span>
      <div class="queue-item-info">
        <strong>${escapeHtml(app.name)}</strong>
        <span>${escapeHtml(details?.version ? `Đang cài ${details.version}` : app.pkg)}</span>
      </div>
      <div class="queue-item-actions">
        <span class="status-label ${meta.className}">
          <i class="ph ${meta.icon} ${meta.spin ? 'is-spinning' : ''}" aria-hidden="true"></i>${meta.label}
        </span>
        <button class="button compact update" data-update-single="${escapeHtml(app.id)}" type="button" ${state.running || state.scanning || state.updatesScanning || state.busyId ? 'disabled' : ''}>
          <i class="ph ph-arrow-circle-up" aria-hidden="true"></i>
          Cập nhật
        </button>
        <button class="button compact" data-detail="${escapeHtml(app.id)}" type="button">
          <i class="ph ph-info" aria-hidden="true"></i>
          Chi tiết
        </button>
      </div>
      <div class="update-command" title="${escapeHtml(upgradeCommandFor(app))}">${escapeHtml(upgradeCommandFor(app))}</div>
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

  els.install.disabled = state.running || state.scanning || Boolean(state.busyId) || pending.length === 0;
  if (els.stopBtn) {
    els.stopBtn.hidden = !state.running;
    els.stopBtn.disabled = state.stopRequested;
  }
  if (els.retryFailed) {
    els.retryFailed.hidden = state.running || state.failed.size === 0;
    els.retryFailed.disabled = state.scanning || Boolean(state.busyId);
  }
  const installHTML = state.running
    ? `<i class="ph ph-arrow-clockwise is-spinning" aria-hidden="true"></i>${state.operation === 'upgrade' ? 'Đang cập nhật' : 'Đang cài đặt'}`
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
  const updates = allUpdateApps();

  els.queueCount.textContent = selected.length;
  els.installedCount.textContent = `${state.installed.size} ứng dụng`;
  els.largeAppCount.textContent = largeCount;
  els.navQueueCount.textContent = selected.length;
  if (els.navWorkspaceCount) els.navWorkspaceCount.textContent = presets.length;
  if (els.navUpdateCount) els.navUpdateCount.textContent = updates.length;
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
  renderStatusBar();

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
    scheduleLocalize();
    return;
  }

  els.queue.innerHTML = selected.map(queueItemHTML).join('');
  applyProgressFill(els.queue);
  scheduleLocalize();
}

function renderUpdates() {
  if (!els.updatesList) return;
  const totalUpdates = allUpdateApps();
  const updates = updateApps();
  const hasQuery = Boolean(state.updateQuery.trim());
  const unavailable = !window.setupkitNative || !state.wingetAvailable;
  const busy = state.running || state.scanning || state.updatesScanning || Boolean(state.busyId);

  els.navUpdateCount.textContent = totalUpdates.length;
  els.updatesCount.textContent = updates.length;
  els.updatesDetectedCount.textContent = hasQuery
    ? `${updates.length}/${totalUpdates.length} ứng dụng`
    : `${totalUpdates.length} ứng dụng`;
  els.updateAll.disabled = unavailable || busy || updates.length === 0 || typeof window.setupkitNative?.upgradeApps !== 'function';
  els.scanUpdates.disabled = unavailable || busy || typeof window.setupkitNative?.scanUpdates !== 'function';
  els.updatesModeLabel.textContent = unavailable
    ? 'Cần winget'
    : state.updatesScanning
      ? 'Đang quét'
      : state.running
        ? state.operation === 'upgrade' ? 'Đang cập nhật' : 'Đang bận'
        : totalUpdates.length
          ? 'Có thể chạy'
          : 'Đã mới nhất';

  let statusClass = 'status-label';
  let statusHTML = '<i class="ph ph-check-circle" aria-hidden="true"></i>Đã mới nhất';
  if (state.updatesScanning) {
    statusClass = 'status-label warning';
    statusHTML = '<i class="ph ph-arrow-clockwise is-spinning" aria-hidden="true"></i>Đang quét';
  } else if (state.running) {
    statusClass = 'status-label warning';
    statusHTML = state.operation === 'upgrade'
      ? '<i class="ph ph-arrow-clockwise is-spinning" aria-hidden="true"></i>Đang cập nhật'
      : '<i class="ph ph-arrow-clockwise is-spinning" aria-hidden="true"></i>Đang bận';
  } else if (unavailable) {
    statusClass = 'status-label danger';
    statusHTML = '<i class="ph ph-warning-circle" aria-hidden="true"></i>Không khả dụng';
  } else if (totalUpdates.length) {
    statusClass = 'status-label warning';
    statusHTML = `<i class="ph ph-arrow-circle-up" aria-hidden="true"></i>${hasQuery ? `${updates.length}/${totalUpdates.length}` : totalUpdates.length} có update`;
  }
  els.updatesStatus.className = statusClass;
  els.updatesStatus.innerHTML = statusHTML;

  if (!updates.length) {
    const emptyTitle = totalUpdates.length && hasQuery
      ? 'Không tìm thấy app update'
      : 'Chưa có ứng dụng cần cập nhật';
    const emptyCopy = totalUpdates.length && hasQuery
      ? 'Thử từ khóa ngắn hơn hoặc xóa ô tìm kiếm để xem toàn bộ app có update.'
      : 'Bấm quét update để hỏi lại winget khi cần kiểm tra phiên bản mới.';
    els.updatesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ${totalUpdates.length && hasQuery ? 'ph-magnifying-glass' : 'ph-check-circle'}"></i></span>
          <h3>${escapeHtml(emptyTitle)}</h3>
          <p>${escapeHtml(emptyCopy)}</p>
          <button class="button primary empty-action" id="emptyScanUpdatesBtn" type="button" ${els.scanUpdates.disabled ? 'disabled' : ''}>
            <i class="ph ph-arrow-clockwise" aria-hidden="true"></i>Quét update
          </button>
        </div>
      </div>
    `;
    scheduleLocalize();
    return;
  }

  els.updatesList.innerHTML = updates.map(updateItemHTML).join('');
  applyProgressFill(els.updatesList);
  scheduleLocalize();
}

function renderVersionAppList() {
  if (!els.versionAppList) return;
  ensureVersionSelection();
  const list = versionEligibleApps();
  const installedWinget = apps.filter((app) => app.source === 'winget' && state.installed.has(app.id)).length;
  const missingWinget = apps.filter((app) => app.source === 'winget' && !state.installed.has(app.id)).length;
  const allWinget = installedWinget + missingWinget;
  const effectiveScope = state.versionScope === 'installed' && installedWinget === 0 ? 'all' : state.versionScope;
  els.navVersionCount.textContent = installedWinget || allWinget;
  els.versionAppStatus.innerHTML = `<i class="ph ph-package" aria-hidden="true"></i>${list.length} app`;
  els.versionScope?.querySelectorAll('[data-version-scope]').forEach((button) => {
    const scope = button.dataset.versionScope;
    const active = scope === effectiveScope;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    const count = scope === 'installed' ? installedWinget : scope === 'missing' ? missingWinget : allWinget;
    button.title = `${button.textContent.trim()}: ${count} app`;
  });

  if (!list.length) {
    const emptyText = state.versionScope === 'installed'
      ? 'Chưa phát hiện app winget nào đã cài. Bấm Tất cả hoặc quét lại máy.'
      : state.versionScope === 'missing'
        ? 'Không còn app winget nào chưa cài trong catalog.'
        : 'Rollback version cũ không áp dụng cho Microsoft Store app.';
    els.versionAppList.innerHTML = `
      <div class="empty-state version-empty">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ph-magnifying-glass"></i></span>
          <h3>Không tìm thấy app winget</h3>
          <p>${escapeHtml(emptyText)}</p>
        </div>
      </div>
    `;
    return;
  }

  els.versionAppList.innerHTML = list.map((app) => {
    const details = state.installed.get(app.id);
    const active = app.id === state.versionAppId;
    return `
      <button class="version-app-row ${active ? 'active' : ''}" data-version-app="${escapeHtml(app.id)}" type="button">
        <span class="version-app-icon" aria-hidden="true">${appIconMarkup(app)}</span>
        <span class="version-app-copy">
          <strong>${escapeHtml(app.name)}</strong>
          <span>${escapeHtml(details?.version ? `Đang cài ${details.version}` : app.pkg)}</span>
        </span>
        <i class="ph ${details ? 'ph-check-circle' : 'ph-download-simple'}" aria-hidden="true"></i>
      </button>
    `;
  }).join('');
}

function renderVersionDetail() {
  if (!els.versionSelectedCard) return;
  ensureVersionSelection();
  const app = appById(state.versionAppId);
  const details = app ? state.installed.get(app.id) : null;
  const record = app ? state.versionRecords.get(app.id) : null;
  const loading = Boolean(app && state.versionLoadingId === app.id);
  const unavailable = !window.setupkitNative || !state.wingetAvailable || !app || app.source !== 'winget';
  const busy = state.running || state.scanning || state.updatesScanning || Boolean(state.busyId);
  const selectedVersion = state.selectedVersion;
  const canInstall = Boolean(app && selectedVersion && !unavailable && !busy && typeof window.setupkitNative?.installVersion === 'function');

  els.loadVersions.disabled = unavailable || busy || loading || typeof window.setupkitNative?.listPackageVersions !== 'function';
  els.installVersion.disabled = !canInstall;
  els.reinstallVersion.disabled = !canInstall || !details;

  els.versionSelectedCard.innerHTML = app ? `
    <span class="version-selected-icon" aria-hidden="true">${appIconMarkup(app)}</span>
    <span class="version-selected-copy">
      <strong>${escapeHtml(app.name)}</strong>
      <span>${escapeHtml(app.pkg)}</span>
    </span>
    <span class="version-current">
      <i class="ph ${details ? 'ph-check-circle' : 'ph-download-simple'}" aria-hidden="true"></i>
      ${escapeHtml(details?.version ? `Hiện tại ${details.version}` : 'Chưa cài trên máy')}
    </span>
  ` : `
    <div class="empty-state version-empty">
      <div class="empty-content">
        <span class="empty-icon" aria-hidden="true"><i class="ph ph-package"></i></span>
        <h3>Chọn một ứng dụng</h3>
        <p>Danh sách bên trái chỉ gồm app nguồn winget.</p>
      </div>
    </div>
  `;

  let statusClass = 'status-label';
  let statusHTML = '<i class="ph ph-clock" aria-hidden="true"></i>Chưa tải';
  if (loading) {
    statusClass = 'status-label warning';
    statusHTML = '<i class="ph ph-arrow-clockwise is-spinning" aria-hidden="true"></i>Đang tải';
  } else if (unavailable) {
    statusClass = 'status-label danger';
    statusHTML = '<i class="ph ph-warning-circle" aria-hidden="true"></i>Không khả dụng';
  } else if (record?.ok) {
    statusClass = 'status-label success';
    statusHTML = `<i class="ph ph-check-circle" aria-hidden="true"></i>${record.versions.length} version`;
  } else if (record?.error) {
    statusClass = 'status-label danger';
    statusHTML = '<i class="ph ph-warning-circle" aria-hidden="true"></i>Lỗi';
  }
  els.versionDetailStatus.className = statusClass;
  els.versionDetailStatus.innerHTML = statusHTML;

  if (!app) {
    els.versionList.innerHTML = '';
    return;
  }
  if (loading) {
    els.versionList.innerHTML = `
      <div class="empty-state version-empty">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ph-arrow-clockwise is-spinning"></i></span>
          <h3>Đang tải version</h3>
          <p>SetupKit đang hỏi manifest winget của ${escapeHtml(app.name)}.</p>
        </div>
      </div>
    `;
    return;
  }
  if (!record) {
    els.versionList.innerHTML = `
      <div class="empty-state version-empty">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ph-download-simple"></i></span>
          <h3>Chưa tải danh sách version</h3>
          <p>Bấm Tải version để xem các bản mà winget còn giữ trong manifest.</p>
        </div>
      </div>
    `;
    return;
  }
  if (!record.ok) {
    els.versionList.innerHTML = `
      <div class="empty-state version-empty">
        <div class="empty-content">
          <span class="empty-icon" aria-hidden="true"><i class="ph ph-warning-circle"></i></span>
          <h3>Không lấy được version</h3>
          <p>${escapeHtml(record.error || 'Package này không công bố version cũ trong winget.')}</p>
        </div>
      </div>
    `;
    return;
  }

  els.versionList.innerHTML = record.versions.map((version, index) => {
    const current = details?.version && version === details.version;
    const selected = version === selectedVersion;
    return `
      <button class="version-row ${selected ? 'active' : ''} ${current ? 'current' : ''}" data-version="${escapeHtml(version)}" type="button">
        <span>
          <strong>${escapeHtml(version)}</strong>
          <small>${current ? 'Đang cài trên máy' : index === 0 ? 'Mới nhất trong manifest' : 'Version cũ'}</small>
        </span>
        <i class="ph ${selected ? 'ph-check-circle' : 'ph-circle'}" aria-hidden="true"></i>
      </button>
    `;
  }).join('');
}

function renderVersions() {
  renderVersionAppList();
  renderVersionDetail();
  scheduleLocalize();
}

// Cập nhật tiến trình một app tại chỗ - giữ nguyên DOM để thanh chạy mượt.
function updateQueueProgressRow(app) {
  const rows = [
    els.queue?.querySelector(`[data-queue-app="${app.id}"]`),
    els.updatesList?.querySelector(`[data-update-app="${app.id}"]`)
  ].filter(Boolean);
  if (!rows.length) return;

  rows.forEach((row) => {
    const chip = row.querySelector('.status-label');
    if (chip) {
      const status = row.matches('[data-update-app]') ? `update:${updateStatusMeta(app).label}` : appStatus(app);
      // Chỉ ghi DOM khi trạng thái đổi để icon xoay không bị reset mỗi tick.
      if (chip.dataset.status !== status) {
        const meta = row.matches('[data-update-app]') ? updateStatusMeta(app) : statusMeta(appStatus(app));
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
  });
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
  renderStatusBar();
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

// Thanh trạng thái dưới cùng - hiện ở mọi tab, cập nhật liên tục và rẻ.
function renderStatusBar() {
  if (!els.statusWinget) return;
  const native = Boolean(window.setupkitNative);
  let cls = 'status-item status-winget';
  let text;
  if (state.scanning) {
    cls += ' scanning';
    text = 'Đang quét ứng dụng trên máy...';
  } else if (!native) {
    cls += ' warn';
    text = 'Chế độ mô phỏng - không có cầu nối native';
  } else if (state.wingetAvailable) {
    cls += ' ok';
    text = `winget${state.wingetVersion ? ` ${state.wingetVersion}` : ''} sẵn sàng`;
  } else {
    cls += ' warn';
    text = 'Không tìm thấy winget - chỉ mô phỏng';
  }
  els.statusWinget.className = cls;
  els.statusWingetText.textContent = text;
  els.statusInstalledText.textContent = `${state.installed.size} đã cài`;
  els.statusSelectedText.textContent = `${state.selected.size} đang chọn`;
  const lineCount = state.terminalLineCount;
  els.statusTerminalCount.textContent = lineCount > 999 ? '999+' : String(lineCount);
  els.statusTerminalCount.hidden = lineCount === 0;
  els.statusTerminalBtn.classList.toggle('active', state.terminalOpen);
  scheduleLocalize();
}

function renderAll() {
  renderPresets();
  renderTags();
  renderCatalog();
  renderUpdates();
  renderVersions();
  renderQueue();
  renderLog();
  renderTerminal();
  renderStatusBar();
  renderWingetBanner();
}

window.addEventListener('setupkit:languagechange', () => {
  renderFilterDropdowns();
  updateThemeButton();
  renderAll();
  window.SetupKitI18n?.localize(document.body);
});

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
  persistSelection();
  updatePresetActive();
  if (['smart', 'status', 'pending'].includes(state.sort)) {
    renderCatalog();
  } else {
    changedIds.forEach(updateCardToggle);
  }
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
  persistSelection();
  renderAll();
}

function clearFilters() {
  state.query = '';
  state.category = 'all';
  state.tags.clear();
  state.source = 'all';
  state.status = 'all';
  els.search.value = '';
  updateSearchAffordance();
  categoryDropdown?.set('all', { silent: true });
  sourceDropdown?.set('all', { silent: true });
  statusDropdown?.set('all', { silent: true });
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
  els.detailIcon.innerHTML = appIconMarkup(app);
  els.detailName.textContent = app.name;
  els.detailDescription.textContent = displayAppDescription(app);
  els.detailState.textContent = details
    ? (details.updateAvailable ? 'Đã cài, có bản cập nhật' : 'Đã cài trên máy')
    : simulated ? 'Chỉ mô phỏng, chưa cài' : 'Chưa cài';
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
  els.detailUninstall.hidden = !details;
  els.detailUpgrade.hidden = !(details && details.updateAvailable);
  const opBusy = Boolean(state.running || state.scanning || state.busyId);
  els.detailUninstall.disabled = opBusy;
  els.detailUpgrade.disabled = opBusy;
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

function workspaceAppRowHTML(app) {
  const details = state.installed.get(app.id);
  const selected = state.selected.has(app.id);
  const status = details
    ? (details.updateAvailable ? 'Đã cài, có cập nhật' : 'Đã cài')
    : selected ? 'Đang trong gói' : 'Chưa cài';
  const statusIcon = details
    ? (details.updateAvailable ? 'ph-arrow-circle-up' : 'ph-check-circle')
    : selected ? 'ph-stack' : 'ph-download-simple';
  return `
    <button class="workspace-detail-app" data-workspace-app-detail="${escapeHtml(app.id)}" type="button">
      <span class="workspace-detail-app-icon" aria-hidden="true">${appIconMarkup(app)}</span>
      <span class="workspace-detail-app-copy">
        <strong>${escapeHtml(app.name)}</strong>
        <span>${escapeHtml(app.pkg)}</span>
      </span>
      <span class="workspace-detail-app-meta">
        <span>${escapeHtml(app.type)}</span>
        <strong><i class="ph ${statusIcon}" aria-hidden="true"></i>${escapeHtml(status)}</strong>
      </span>
    </button>
  `;
}

function openWorkspaceDetail(id) {
  const preset = presetById(id);
  if (!preset) return;

  const workspaceApps = workspaceAppsFor(preset);
  const pendingApps = workspaceApps.filter((app) => !state.installed.has(app.id));
  const installedCount = workspaceApps.length - pendingApps.length;
  const wingetCount = workspaceApps.filter((app) => app.source !== 'msstore').length;
  const storeCount = workspaceApps.length - wingetCount;
  const largeCount = workspaceApps.filter((app) => app.size === 'large').length;

  workspaceDetailId = id;
  els.workspaceDetailIcon.innerHTML = `<i class="ph ${escapeHtml(preset.icon || 'ph-stack')}" aria-hidden="true"></i>`;
  els.workspaceDetailName.textContent = preset.name;
  els.workspaceDetailDescription.textContent = displayPresetDescription(preset);
  els.workspaceDetailCount.textContent = `${workspaceApps.length} ứng dụng${largeCount ? `, ${largeCount} app lớn` : ''}`;
  els.workspaceDetailPending.textContent = pendingApps.length
    ? `${pendingApps.length} cần cài`
    : 'Đã đủ trên máy';
  els.workspaceDetailInstalled.textContent = installedCount
    ? `${installedCount} đã phát hiện`
    : 'Chưa phát hiện app nào';
  els.workspaceDetailSources.textContent = [
    wingetCount ? `${wingetCount} WinGet` : '',
    storeCount ? `${storeCount} Store` : ''
  ].filter(Boolean).join(', ') || 'Không có';
  els.workspaceDetailListSummary.textContent = pendingApps.length
    ? `${pendingApps.length} app sẽ được đưa vào gói`
    : 'Không còn app mới cần cài';
  els.workspaceDetailApps.innerHTML = workspaceApps.map(workspaceAppRowHTML).join('');
  els.workspaceCommandSection.hidden = pendingApps.length === 0;
  els.workspaceCommandPreview.textContent = pendingApps.map(commandFor).join('\n');
  els.workspaceDetailApply.disabled = Boolean(state.running || state.scanning);
  els.workspaceDetailQueue.disabled = state.selected.size === 0;

  if (!els.workspaceDialog.open) {
    workspaceDialogClosing = false;
    els.workspaceDialog.classList.remove('closing');
    els.workspaceDialog.showModal();
  }
}

function closeWorkspaceDetail({ immediate = false } = {}) {
  if (!els.workspaceDialog.open || workspaceDialogClosing) return;
  if (immediate) {
    els.workspaceDialog.close();
    els.workspaceDialog.classList.remove('closing');
    workspaceDialogClosing = false;
    workspaceDetailId = '';
    return;
  }
  workspaceDialogClosing = true;
  els.workspaceDialog.classList.add('closing');
  window.setTimeout(() => {
    els.workspaceDialog.close();
    els.workspaceDialog.classList.remove('closing');
    workspaceDialogClosing = false;
    workspaceDetailId = '';
  }, 130);
}

function closeActionConfirm(confirmed) {
  if (!els.actionConfirmDialog?.open || actionConfirmClosing) return;
  actionConfirmClosing = true;
  const resolve = actionConfirmResolve;
  actionConfirmResolve = null;
  els.actionConfirmDialog.classList.add('closing');
  window.setTimeout(() => {
    els.actionConfirmDialog.close();
    els.actionConfirmDialog.classList.remove('closing');
    actionConfirmClosing = false;
    resolve?.(confirmed);
  }, 120);
}

function requestActionConfirm({
  title,
  message,
  command,
  note = uiText('SetupKit chỉ chạy package ID nằm trong catalog đã duyệt.', 'SetupKit only runs package IDs from the reviewed catalog.'),
  confirmLabel = uiText('Xác nhận', 'Confirm'),
  icon = 'ph-warning-circle',
  tone = 'warning'
}) {
  if (!els.actionConfirmDialog) return Promise.resolve(true);
  if (actionConfirmResolve) {
    actionConfirmResolve(false);
    actionConfirmResolve = null;
  }

  els.actionConfirmDialog.dataset.tone = tone;
  els.actionConfirmIcon.innerHTML = `<i class="ph ${escapeHtml(icon)}" aria-hidden="true"></i>`;
  els.actionConfirmTitle.textContent = title;
  els.actionConfirmMessage.textContent = message;
  els.actionConfirmCommand.textContent = command;
  els.actionConfirmNote.querySelector('span').textContent = note;
  els.actionConfirmRun.innerHTML = `<i class="ph ph-check" aria-hidden="true"></i>${escapeHtml(confirmLabel)}`;
  els.actionConfirmRun.className = 'button primary';
  actionConfirmClosing = false;
  els.actionConfirmDialog.classList.remove('closing');
  els.actionConfirmDialog.showModal();
  els.actionConfirmCancel.focus({ preventScroll: true });
  return new Promise((resolve) => {
    actionConfirmResolve = resolve;
  });
}

async function confirmInstallApp(app) {
  const installLocation = state.installLocations.get(app.id);
  const note = installLocation && app.source !== 'msstore'
    ? uiText('Trình cài đặt có thể bỏ qua thư mục tùy chỉnh nếu package không hỗ trợ.', 'The installer may ignore a custom folder if the package does not support it.')
    : uiText('URL tùy ý và script tải ngoài luôn bị chặn.', 'External URLs and unknown scripts stay blocked.');
  return requestActionConfirm({
    title: uiText(`Cài ${app.name}`, `Install ${app.name}`),
    message: uiText('SetupKit sẽ chạy đúng lệnh winget bên dưới.', 'SetupKit will run the exact winget command below.'),
    command: commandFor(app),
    note,
    confirmLabel: uiText('Chạy lệnh winget', 'Run winget command'),
    icon: 'ph-download-simple',
    tone: 'success'
  });
}

function confirmSingleOperation(app, kind) {
  if (kind === 'upgrade') {
    return requestActionConfirm({
      title: uiText(`Cập nhật ${app.name}`, `Update ${app.name}`),
      message: uiText('Chỉ package này được cập nhật qua catalog đã duyệt.', 'Only this reviewed package will be updated.'),
      command: upgradeCommandFor(app),
      note: uiText('SetupKit dùng winget upgrade và giữ nguyên phạm vi trong allowlist.', 'SetupKit uses winget upgrade and keeps the scope inside the allowlist.'),
      confirmLabel: uiText('Cập nhật', 'Update'),
      icon: 'ph-arrow-circle-up',
      tone: 'success'
    });
  }
  return requestActionConfirm({
    title: uiText(`Gỡ ${app.name}`, `Uninstall ${app.name}`),
    message: uiText('Ứng dụng sẽ bị xóa khỏi máy. Với VPN, cửa sổ gỡ riêng có thể xuất hiện để tắt service hoặc driver.', 'The app will be removed from this machine. VPN uninstallers may open their own window to stop services or drivers.'),
    command: uninstallCommandFor(app),
    note: uiText('SetupKit không ép chế độ silent khi gỡ để uninstaller của nhà phát hành có thể hỏi xác nhận cần thiết.', 'SetupKit does not force silent uninstall so the publisher uninstaller can ask for required confirmation.'),
    confirmLabel: uiText('Gỡ cài đặt', 'Uninstall'),
    icon: 'ph-trash-simple',
    tone: 'danger'
  });
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
  let shouldRefreshUpdates = false;
  els.rescan.disabled = true;
  els.rescan.querySelector('.ph')?.classList.add('is-spinning');
  setSystemStatus('scanning', 'Đang quét ứng dụng trên máy', 'ph-arrow-clockwise', true);
  renderAll();

  try {
    const result = await window.setupkitNative.scanInstalled();
    const nextInstalled = applyInstalledResult(result, { pruneSelection });
    shouldRefreshUpdates = Boolean(state.wingetAvailable && window.setupkitNative?.scanUpdates);

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
    if (shouldRefreshUpdates) refreshUpdateAvailability();
  }
}

function applyInstalledResult(result, { pruneSelection = false } = {}) {
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
    persistSelection();
  }
  return nextInstalled;
}

async function refreshUpdateAvailability() {
  if (!window.setupkitNative?.scanUpdates || state.updatesScanning || state.running) return;
  state.updatesScanning = true;
  try {
    const result = await window.setupkitNative.scanUpdates();
    applyInstalledResult(result);
    const updateCount = result.apps.filter((details) => details.installed && details.updateAvailable).length;
    if (updateCount) {
      addLog(`[cập nhật] Phát hiện ${updateCount} ứng dụng có bản mới.`);
    } else {
      addLog('[cập nhật] Không phát hiện ứng dụng cần cập nhật.');
    }
    renderCatalog();
    renderUpdates();
    renderQueue();
    renderStatusBar();
  } catch (error) {
    addLog(`[cập nhật] Không kiểm tra được bản cập nhật: ${error.message || 'winget upgrade không khả dụng.'}`);
  } finally {
    state.updatesScanning = false;
    renderUpdates();
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
  if (!pending.length || state.running || state.scanning || state.busyId) return;

  const realInstall = els.realMode.checked;
  state.running = true;
  state.operation = realInstall ? 'install' : 'simulate';
  state.stopRequested = false;
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

  let stopped = false;
  for (const app of pending) {
    if (state.stopRequested) {
      stopped = true;
      appendTerminal('[SetupKit] Đã dừng theo yêu cầu. Các ứng dụng còn lại chưa được xử lý.\n', 'system');
      addLog('[dừng] Hàng đợi dừng lại, còn lại chưa xử lý.');
      break;
    }
    state.currentId = app.id;
    state.terminalCommand = commandFor(app);
    if (!realInstall) appendTerminal(`> [mô phỏng] ${state.terminalCommand}\n`, 'command');
    renderTerminalChrome();
    setProgress(app, 2, realInstall ? 'Đang chuẩn bị cài đặt' : 'Đang chuẩn bị mô phỏng');
    addLog(`[kiểm tra] ${app.name}: nguồn=${app.source}; gói=${app.pkg}`);

    if (realInstall && window.setupkitNative) {
      try {
        const confirmed = await confirmInstallApp(app);
        if (!confirmed) {
          state.failed.add(app.id);
          setProgress(app, 0, 'Đã hủy', 'Người dùng không xác nhận lệnh winget.', true);
          addLog(`[đã hủy] ${app.name}: người dùng không xác nhận cài đặt.`);
          continue;
        }
        const runner = window.setupkitNative.runWingetConfirmed || window.setupkitNative.runWinget;
        const result = await runner(app.pkg);
        if (result.ok) {
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
  state.operation = '';
  state.stopRequested = false;
  const successCount = state.done.size;
  appendTerminal(`[SetupKit] Kết thúc. Thành công: ${successCount}, lỗi: ${state.failed.size}.\n`, 'system');
  addLog(`[tóm tắt] ${realInstall ? 'Đã cài' : 'Đã mô phỏng'}=${successCount}; lỗi=${state.failed.size}${stopped ? '; đã dừng giữa chừng' : ''}.`);
  renderAll();

  if (stopped) {
    showToast('Đã dừng gói cài đặt', `${successCount} xong, ${state.failed.size} lỗi. Các ứng dụng còn lại chưa chạy.`, 'ph-hand-palm');
  } else if (!realInstall) {
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

// Nhập hồ sơ JSON: thay danh sách đang chọn bằng ứng dụng trong tệp (chỉ nhận
// package ID đã có trong danh mục đã duyệt), tự bỏ qua app đã cài.
function applyImportedProfile(profile) {
  if (!profile || typeof profile !== 'object' || !Array.isArray(profile.apps)) {
    throw new Error('Tệp không đúng định dạng hồ sơ SetupKit.');
  }
  const wanted = [];
  const unknown = [];
  for (const entry of profile.apps) {
    const app = (entry.id && appById(entry.id)) || (entry.packageId && appByPackage(entry.packageId));
    if (app) wanted.push(app.id);
    else unknown.push(entry.id || entry.packageId || entry.name || 'không rõ');
  }
  if (!wanted.length) {
    throw new Error('Không có ứng dụng nào trong hồ sơ khớp danh mục hiện tại.');
  }

  const expanded = new Set();
  wanted.forEach((id) => {
    expanded.add(id);
    dependencyIdsFor(appById(id)).forEach((dependencyId) => expanded.add(dependencyId));
  });

  let skipped = 0;
  const selection = new Set();
  expanded.forEach((id) => {
    if (state.installed.has(id)) {
      skipped += 1;
      return;
    }
    selection.add(id);
  });

  state.selected = selection;
  state.activePreset = '';
  state.done.clear();
  state.failed.clear();
  state.simulated.clear();
  state.installProgress.clear();
  persistSelection();
  updatePresetActive();
  renderAll();
  return { count: selection.size, skipped, unknown };
}

function importProfileFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const profile = JSON.parse(String(reader.result || ''));
      const { count, skipped, unknown } = applyImportedProfile(profile);
      addLog(`[hồ sơ] Đã nhập ${count} ứng dụng${skipped ? `, bỏ qua ${skipped} đã cài` : ''}${unknown.length ? `, ${unknown.length} ID không khớp danh mục` : ''}.`);
      showToast(
        'Đã nhập hồ sơ',
        `Chọn ${count} ứng dụng${skipped ? `, bỏ qua ${skipped} đã cài` : ''}${unknown.length ? `, bỏ ${unknown.length} ID lạ` : ''}.`,
        'ph-check-circle'
      );
      switchView('queue');
    } catch (error) {
      showToast('Không nhập được hồ sơ', error.message || 'Tệp JSON không hợp lệ.', 'ph-warning-circle');
      addLog(`[lỗi hồ sơ] ${error.message || 'JSON không hợp lệ.'}`);
    }
  };
  reader.onerror = () => showToast('Không đọc được tệp', 'Trình duyệt không đọc được tệp đã chọn.', 'ph-warning-circle');
  reader.readAsText(file);
}

// Chọn nhanh toàn bộ ứng dụng đang lọc mà chưa cài (kèm phụ thuộc nên có trước).
function selectAllFiltered() {
  if (state.running || state.scanning || state.busyId) return;
  const list = filteredApps().filter((app) => !state.installed.has(app.id));
  if (!list.length) {
    showToast('Không có gì để chọn', 'Danh sách đang lọc không còn ứng dụng nào chưa cài.', 'ph-info');
    return;
  }
  let added = 0;
  list.forEach((app) => {
    if (!state.selected.has(app.id)) {
      state.selected.add(app.id);
      added += 1;
    }
    dependencyIdsFor(app).forEach((dependencyId) => {
      if (!state.installed.has(dependencyId)) state.selected.add(dependencyId);
    });
  });
  state.activePreset = '';
  persistSelection();
  updatePresetActive();
  renderAll();
  addLog(`[lựa chọn] Chọn nhanh ${added} ứng dụng theo bộ lọc hiện tại.`);
  showToast('Đã chọn hàng loạt', `Thêm ${added} ứng dụng vào gói cài đặt.`, 'ph-check-circle');
}

function clearSelection() {
  if (state.running || state.scanning || state.busyId || !state.selected.size) return;
  const count = state.selected.size;
  state.selected.clear();
  state.done.clear();
  state.failed.clear();
  state.simulated.clear();
  state.installProgress.clear();
  state.activePreset = '';
  persistSelection();
  updatePresetActive();
  renderAll();
  addLog(`[lựa chọn] Đã bỏ chọn toàn bộ ${count} ứng dụng.`);
  showToast('Đã bỏ chọn', 'Gói cài đặt đã được làm trống.', 'ph-broom');
}

function retryFailed() {
  if (state.running || state.scanning || state.busyId || !state.failed.size) return;
  const failedIds = [...state.failed];
  failedIds.forEach((id) => {
    state.selected.add(id);
    state.failed.delete(id);
    state.done.delete(id);
    state.installProgress.delete(id);
  });
  persistSelection();
  addLog(`[cài lại] Thử lại ${failedIds.length} ứng dụng lỗi.`);
  renderAll();
  runInstallPlan();
}

function requestStop() {
  if (!state.running || state.stopRequested) return;
  state.stopRequested = true;
  if (els.stopBtn) els.stopBtn.disabled = true;
  appendTerminal('[SetupKit] Đã nhận yêu cầu dừng. Sẽ dừng sau khi ứng dụng hiện tại xong.\n', 'system');
  addLog('[dừng] Người dùng yêu cầu dừng hàng đợi.');
  showToast('Sẽ dừng', 'Hàng đợi sẽ dừng sau khi ứng dụng đang chạy hoàn tất.', 'ph-hand-palm');
}

// Cập nhật hoặc gỡ một ứng dụng đã cài (ngoài hàng đợi), stream qua terminal.
async function runSingleOp(id, kind, { view = kind === 'upgrade' ? 'updates' : 'queue' } = {}) {
  const app = appById(id);
  if (!app || !window.setupkitNative || state.running || state.scanning || state.busyId) return;
  const method = kind === 'upgrade'
    ? (window.setupkitNative.upgradeAppConfirmed ? 'upgradeAppConfirmed' : 'upgradeApp')
    : (window.setupkitNative.uninstallAppConfirmed ? 'uninstallAppConfirmed' : 'uninstallApp');
  if (typeof window.setupkitNative[method] !== 'function') {
    showToast('Không khả dụng', 'Cầu nối native chưa hỗ trợ thao tác này.', 'ph-warning-circle');
    return;
  }
  const verbLabel = kind === 'upgrade' ? 'Cập nhật' : 'Gỡ cài đặt';

  if (els.detailDialog.open) {
    closeDetail();
    await wait(160);
  }
  const confirmed = await confirmSingleOperation(app, kind);
  if (!confirmed) {
    showToast(app.name, 'Đã hủy thao tác.', 'ph-hand-palm');
    addLog(`[${kind === 'upgrade' ? 'cập nhật' : 'gỡ'}] ${app.name}: người dùng hủy trước khi chạy.`);
    return;
  }

  state.busyId = id;
  switchView(view);
  state.terminalOpen = true;
  state.terminalCommand = '';
  renderTerminalChrome();
  appendTerminal(`[SetupKit] ${verbLabel}: ${app.name}...\n`, 'system');
  addLog(`[${kind === 'upgrade' ? 'cập nhật' : 'gỡ'}] ${app.name}: bắt đầu.`);
  renderCatalog();
  renderStatusBar();

  try {
    const result = await window.setupkitNative[method](app.pkg);
    if (result.cancelled) {
      appendTerminal('[SetupKit] Đã hủy thao tác.\n', 'system');
      showToast(app.name, 'Đã hủy thao tác.', 'ph-hand-palm');
    } else if (result.ok) {
      if (kind === 'upgrade') {
        if (result.details) state.installed.set(id, result.details);
        showToast(app.name, 'Đã cập nhật lên bản mới nhất.', 'ph-check-circle');
        addLog(`[cập nhật] ${app.name}: xong (winget exitCode=${result.code}).`);
      } else {
        state.installed.delete(id);
        state.selected.delete(id);
        state.done.delete(id);
        state.failed.delete(id);
        state.simulated.delete(id);
        state.installProgress.delete(id);
        state.installLocations.delete(id);
        persistSelection();
        showToast(app.name, 'Đã gỡ khỏi máy.', 'ph-check-circle');
        addLog(`[gỡ] ${app.name}: xong (winget exitCode=${result.code}).`);
      }
    } else {
      appendTerminal(`[SetupKit] ${verbLabel} thất bại: ${result.error || 'winget exitCode=' + result.code}\n`, 'stderr');
      showToast(`${verbLabel} thất bại`, result.error || `winget exitCode=${result.code}`, 'ph-warning-circle');
      addLog(`[lỗi] ${app.name}: ${result.error || 'winget exitCode=' + result.code}`);
    }
  } catch (error) {
    showToast(`${verbLabel} thất bại`, error.message || 'Lỗi không xác định.', 'ph-warning-circle');
    addLog(`[lỗi] ${app.name}: ${error.message || 'Không gọi được winget.'}`);
  } finally {
    state.busyId = '';
    state.currentId = '';
    renderCatalog();
    renderUpdates();
    renderQueue();
    renderStatusBar();
  }
}

async function runUpdateAll() {
  const pending = updateApps();
  if (!pending.length || state.running || state.scanning || state.updatesScanning || state.busyId) return;
  const upgradeAllRunner = window.setupkitNative?.upgradeAppsConfirmed || window.setupkitNative?.upgradeApps;
  if (!upgradeAllRunner) {
    showToast('Không khả dụng', 'Cầu nối native chưa hỗ trợ cập nhật hàng loạt.', 'ph-warning-circle');
    return;
  }
  const preview = pending.slice(0, 10).map((app) => `${app.name}\n${upgradeCommandFor(app)}`);
  if (pending.length > 10) {
    preview.push(uiText(`... và ${pending.length - 10} ứng dụng khác`, `... and ${pending.length - 10} more apps`));
  }
  const confirmed = await requestActionConfirm({
    title: uiText(`Cập nhật ${pending.length} ứng dụng`, `Update ${pending.length} apps`),
    message: uiText('SetupKit sẽ chạy tuần tự các package đã phát hiện có bản mới.', 'SetupKit will update the detected packages one by one.'),
    command: preview.join('\n\n'),
    note: uiText('Cập nhật hàng loạt chỉ chạy package nằm trong catalog đã duyệt và stream tiến trình từng app.', 'Bulk update only runs packages from the reviewed catalog and streams progress for each app.'),
    confirmLabel: uiText('Cập nhật tất cả', 'Update all'),
    icon: 'ph-arrow-circle-up',
    tone: 'success'
  });
  if (!confirmed) {
    showToast('Đã hủy cập nhật', 'Bạn chưa xác nhận phiên cập nhật hàng loạt.', 'ph-hand-palm');
    addLog('[cập nhật] Người dùng hủy cập nhật hàng loạt trước khi chạy.');
    return;
  }

  state.running = true;
  state.operation = 'upgrade';
  state.stopRequested = false;
  state.currentId = '';
  state.done.clear();
  state.failed.clear();
  state.installProgress.clear();
  state.terminalLines = [];
  state.terminalLineCount = 0;
  state.terminalOpen = true;
  state.terminalCommand = '';
  switchView('updates');
  appendTerminal(`[SetupKit] Chuẩn bị cập nhật ${pending.length} ứng dụng.\n`, 'system');
  addLog(`[cập nhật] Bắt đầu cập nhật hàng loạt ${pending.length} ứng dụng.`);
  renderAll();

  try {
    const result = await upgradeAllRunner(pending.map((app) => app.pkg));
    const results = result.results || {};
    pending.forEach((app) => {
      const item = results[app.pkg];
      if (!item) return;
      if (item.ok) {
        state.done.add(app.id);
        if (item.details) state.installed.set(app.id, item.details);
      } else if (!item.cancelled) {
        state.failed.add(app.id);
      }
    });

    if (result.cancelled) {
      showToast('Đã hủy cập nhật', 'Bạn chưa xác nhận phiên cập nhật hàng loạt.', 'ph-hand-palm');
      addLog('[cập nhật] Người dùng hủy cập nhật hàng loạt.');
    } else if (result.failed) {
      showToast('Cập nhật đã chạy xong', `${result.success || 0} thành công, ${result.failed} cần kiểm tra.`, 'ph-warning-circle');
      addLog(`[cập nhật] Hoàn tất: ${result.success || 0} thành công, ${result.failed} lỗi.`);
    } else {
      showToast('Đã cập nhật tất cả', `${result.success || pending.length} ứng dụng đã lên bản mới nhất.`, 'ph-check-circle');
      addLog(`[cập nhật] Hoàn tất ${result.success || pending.length}/${pending.length} ứng dụng.`);
    }
  } catch (error) {
    showToast('Cập nhật thất bại', error.message || 'Không gọi được winget upgrade.', 'ph-warning-circle');
    addLog(`[lỗi cập nhật] ${error.message || 'Không gọi được winget upgrade.'}`);
  } finally {
    state.running = false;
    state.operation = '';
    state.currentId = '';
    renderAll();
    refreshUpdateAvailability();
  }
}

async function loadPackageVersions(id = state.versionAppId) {
  const app = appById(id);
  if (!app || app.source !== 'winget' || !window.setupkitNative?.listPackageVersions || state.versionLoadingId || state.running || state.busyId) return;

  state.versionAppId = app.id;
  state.selectedVersion = '';
  state.versionLoadingId = app.id;
  renderVersions();
  addLog(`[versions] Đang tải danh sách version của ${app.name}.`);

  try {
    const result = await window.setupkitNative.listPackageVersions(app.pkg);
    state.versionRecords.set(app.id, result);
    if (result.ok && result.versions?.length) {
      const current = state.installed.get(app.id)?.version || result.currentVersion;
      state.selectedVersion = result.versions.find((version) => version !== current) || result.versions[0];
      addLog(`[versions] ${app.name}: tìm thấy ${result.versions.length} version.`);
    } else {
      addLog(`[versions] ${app.name}: ${result.error || 'không có version cũ.'}`);
    }
  } catch (error) {
    state.versionRecords.set(app.id, {
      ok: false,
      packageId: app.pkg,
      source: app.source,
      error: error.message || 'Không gọi được winget show --versions.'
    });
    addLog(`[versions] ${app.name}: ${error.message || 'không tải được version.'}`);
  } finally {
    state.versionLoadingId = '';
    renderVersions();
  }
}

async function runInstallVersion(mode) {
  const app = appById(state.versionAppId);
  const version = state.selectedVersion;
  const record = app ? state.versionRecords.get(app.id) : null;
  if (!app || !version || !record?.ok || !window.setupkitNative?.installVersion || state.running || state.scanning || state.busyId) return;
  const versionInstallCommand = `winget install --id ${app.pkg} --exact --source winget --version ${version} --silent --accept-package-agreements --accept-source-agreements --disable-interactivity`;
  const reinstall = mode === 'reinstall';
  const confirmed = await requestActionConfirm({
    title: reinstall
      ? uiText(`Rollback ${app.name}`, `Rollback ${app.name}`)
      : uiText(`Cài ${app.name} ${version}`, `Install ${app.name} ${version}`),
    message: reinstall
      ? uiText('SetupKit sẽ gỡ bản hiện tại rồi cài version đã chọn.', 'SetupKit will uninstall the current build, then install the selected version.')
      : uiText('SetupKit sẽ cài đúng version từ manifest winget.', 'SetupKit will install the selected version from the winget manifest.'),
    command: reinstall
      ? `${uninstallCommandFor(app)}\n${versionInstallCommand}`
      : versionInstallCommand,
    note: reinstall
      ? uiText('Chế độ gỡ rồi cài có thể ảnh hưởng cấu hình của app. Với VPN, uninstaller riêng có thể xuất hiện.', 'Reinstall mode can affect app settings. VPN uninstallers may open their own window.')
      : uiText('Nếu installer không cho downgrade trực tiếp, bạn có thể dùng chế độ gỡ rồi cài.', 'If the installer blocks direct downgrade, use uninstall-then-install mode.'),
    confirmLabel: reinstall ? uiText('Gỡ rồi cài version', 'Uninstall then install') : uiText('Cài version này', 'Install this version'),
    icon: reinstall ? 'ph-clock-counter-clockwise' : 'ph-download-simple',
    tone: reinstall ? 'danger' : 'success'
  });
  if (!confirmed) {
    showToast(app.name, 'Đã hủy cài version.', 'ph-hand-palm');
    addLog(`[versions] ${app.name}: người dùng hủy trước khi chạy.`);
    return;
  }

  state.busyId = app.id;
  state.operation = mode === 'reinstall' ? 'rollback' : 'version';
  state.currentId = app.id;
  state.installProgress.delete(app.id);
  state.terminalOpen = true;
  state.terminalCommand = '';
  switchView('versions');
  appendTerminal(`[SetupKit] ${mode === 'reinstall' ? 'Rollback' : 'Cài version'}: ${app.name} -> ${version}.\n`, 'system');
  addLog(`[versions] ${app.name}: bắt đầu ${mode === 'reinstall' ? 'gỡ rồi cài' : 'cài'} version ${version}.`);
  renderAll();

  try {
    const installer = window.setupkitNative.installVersionConfirmed || window.setupkitNative.installVersion;
    const result = await installer(app.pkg, version, mode);
    if (result.cancelled) {
      showToast(app.name, 'Đã hủy cài version.', 'ph-hand-palm');
      addLog(`[versions] ${app.name}: người dùng hủy.`);
    } else if (result.ok) {
      if (result.details) state.installed.set(app.id, result.details);
      state.done.add(app.id);
      showToast(app.name, `Đã cài version ${version}.`, 'ph-check-circle');
      addLog(`[versions] ${app.name}: đã cài version ${version}.`);
      state.versionRecords.delete(app.id);
      await scanInstalled({ showFeedback: false, pruneSelection: true });
    } else {
      state.failed.add(app.id);
      showToast('Cài version thất bại', result.error || `winget exitCode=${result.code}`, 'ph-warning-circle');
      addLog(`[versions] ${app.name}: ${result.error || 'cài version thất bại.'}`);
    }
  } catch (error) {
    state.failed.add(app.id);
    showToast('Cài version thất bại', error.message || 'Không gọi được winget.', 'ph-warning-circle');
    addLog(`[versions] ${app.name}: ${error.message || 'không gọi được winget.'}`);
  } finally {
    state.busyId = '';
    state.operation = '';
    state.currentId = '';
    renderAll();
  }
}

// Banner khi máy chưa có winget: mời cài App Installer thay vì báo lỗi cụt.
function renderWingetBanner() {
  if (!els.wingetMissingBanner) return;
  const show = Boolean(window.setupkitNative)
    && state.wingetChecked
    && !state.wingetAvailable
    && !state.scanning;
  els.wingetMissingBanner.hidden = !show;
}

async function recheckWinget() {
  if (!window.setupkitNative?.checkSystem) return;
  els.wingetRecheck.disabled = true;
  els.wingetRecheck.querySelector('.ph')?.classList.add('is-spinning');
  try {
    const system = await window.setupkitNative.checkSystem();
    state.wingetAvailable = Boolean(system.wingetAvailable);
    state.wingetVersion = system.wingetVersion || '';
    state.wingetChecked = true;
    if (state.wingetAvailable) {
      els.realMode.disabled = false;
      addLog('[hệ thống] winget đã sẵn sàng sau khi kiểm tra lại.');
      showToast('Đã tìm thấy winget', `${state.wingetVersion || 'winget'} đã sẵn sàng. Có thể cài thật.`, 'ph-check-circle');
      await scanInstalled({ showFeedback: false, pruneSelection: true });
    } else {
      showToast('Vẫn chưa thấy winget', 'Hãy cài App Installer từ Microsoft Store rồi bấm Kiểm tra lại.', 'ph-warning-circle');
    }
  } catch (error) {
    showToast('Không kiểm tra được', error.message || 'Lỗi không xác định.', 'ph-warning-circle');
  } finally {
    els.wingetRecheck.disabled = false;
    els.wingetRecheck.querySelector('.ph')?.classList.remove('is-spinning');
    renderWingetBanner();
    renderStatusBar();
  }
}

async function installAppInstaller() {
  if (!window.setupkitNative?.openAppInstallerPage) {
    showToast('Không mở được', 'Cầu nối native chưa sẵn sàng.', 'ph-warning-circle');
    return;
  }
  try {
    const result = await window.setupkitNative.openAppInstallerPage();
    if (result && result.ok === false) throw new Error(result.error);
    showToast('Đã mở Microsoft Store', 'Cài "App Installer" rồi quay lại bấm Kiểm tra lại.', 'ph-check-circle');
    addLog('[hệ thống] Mở trang App Installer trên Microsoft Store.');
  } catch (error) {
    showToast('Không mở được Store', error.message || 'Windows không mở được Microsoft Store.', 'ph-warning-circle');
  }
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
  els.workspaces?.addEventListener('click', (event) => {
    const detail = event.target.closest('[data-workspace-detail]');
    const apply = event.target.closest('[data-workspace-apply]');
    const button = event.target.closest('[data-preset]');
    if (detail) {
      event.stopPropagation();
      openWorkspaceDetail(detail.dataset.workspaceDetail);
      return;
    }
    if (apply) {
      event.stopPropagation();
      applyPreset(apply.dataset.workspaceApply);
      return;
    }
    if (button) applyPreset(button.dataset.preset);
    if (!event.target.closest('button')) {
      const card = event.target.closest('[data-workspace]');
      if (card) openWorkspaceDetail(card.dataset.workspace);
    }
  });
  els.workspaces?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.matches?.('[data-workspace]')) {
      event.preventDefault();
      openWorkspaceDetail(event.target.dataset.workspace);
    }
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

  els.updatesList?.addEventListener('click', (event) => {
    const single = event.target.closest('[data-update-single]');
    const detail = event.target.closest('[data-detail]');
    const scan = event.target.closest('#emptyScanUpdatesBtn');
    if (single && !single.disabled) runSingleOp(single.dataset.updateSingle, 'upgrade', { view: 'updates' });
    if (detail) openDetail(detail.dataset.detail);
    if (scan && !scan.disabled) refreshUpdateAvailability();
  });
  els.updatesSearch?.addEventListener('input', (event) => {
    state.updateQuery = event.target.value;
    renderUpdates();
  });

  els.versionSearch?.addEventListener('input', (event) => {
    state.versionQuery = event.target.value;
    renderVersions();
  });
  els.versionScope?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-version-scope]');
    if (!button) return;
    state.versionScope = button.dataset.versionScope;
    state.versionAppId = '';
    state.selectedVersion = '';
    renderVersions();
  });
  els.versionAppList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-version-app]');
    if (!button) return;
    state.versionAppId = button.dataset.versionApp;
    state.selectedVersion = '';
    renderVersions();
  });
  els.versionList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-version]');
    if (!button) return;
    state.selectedVersion = button.dataset.version;
    renderVersions();
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
    updateSearchAffordance();
    scheduleSearchRender();
  });
  els.search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.search.value) {
      event.stopPropagation();
      state.query = '';
      els.search.value = '';
      updateSearchAffordance();
      renderCatalog();
    }
  });
  els.searchClear.addEventListener('click', () => {
    state.query = '';
    els.search.value = '';
    els.search.focus();
    updateSearchAffordance();
    renderCatalog();
  });
  categoryDropdown = createDropdown(els.categoryDropdown, {
    options: [{ value: 'all', label: 'Tất cả danh mục', icon: 'ph-squares-four', tone: 'neutral' }],
    value: state.category,
    onChange: (value) => {
      state.category = value;
      renderCatalog();
    }
  });
  sourceDropdown = createDropdown(els.sourceDropdown, {
    options: [
      { value: 'all', label: 'Tất cả nguồn', icon: 'ph-stack', tone: 'neutral' },
      { value: 'winget', label: 'Chỉ winget', icon: 'ph-terminal-window', tone: 'accent' },
      { value: 'msstore', label: 'Chỉ Microsoft Store', icon: 'ph-storefront', tone: 'store' }
    ],
    value: state.source,
    onChange: (value) => {
      state.source = value;
      renderCatalog();
    }
  });
  statusDropdown = createDropdown(els.statusDropdown, {
    options: [
      { value: 'all', label: 'Mọi tình trạng', icon: 'ph-circles-three', tone: 'neutral' },
      { value: 'installed', label: 'Đã cài trên máy', icon: 'ph-check-circle', tone: 'success' },
      { value: 'available', label: 'Chưa cài', icon: 'ph-download-simple', tone: 'muted' },
      { value: 'selected', label: 'Đang chọn', icon: 'ph-stack', tone: 'accent' }
    ],
    value: state.status,
    statusDot: true,
    onChange: (value) => {
      state.status = value;
      renderCatalog();
    }
  });
  sortDropdown = createDropdown(els.sortDropdown, {
    options: [
      { value: 'smart', label: 'Thông minh', icon: 'ph-sparkle', tone: 'accent' },
      { value: 'installOrder', label: 'Thứ tự cài', icon: 'ph-sort-ascending', tone: 'neutral' },
      { value: 'name', label: 'Tên A-Z', icon: 'ph-text-aa', tone: 'neutral' },
      { value: 'category', label: 'Danh mục', icon: 'ph-folders', tone: 'accent' },
      { value: 'status', label: 'Tình trạng', icon: 'ph-traffic-signal', tone: 'success' },
      { value: 'source', label: 'Nguồn cài', icon: 'ph-git-branch', tone: 'store' },
      { value: 'size', label: 'App lớn trước', icon: 'ph-hard-drives', tone: 'warning' },
      { value: 'pending', label: 'Chưa cài trước', icon: 'ph-download-simple', tone: 'muted' }
    ],
    value: state.sort,
    onChange: (value) => setSortMode(value)
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
  els.viewModes.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (button) setViewMode(button.dataset.mode);
  });
  els.realMode.addEventListener('change', () => {
    addLog(`[chế độ] ${els.realMode.checked ? 'Đã bật cài đặt thật bằng winget.' : 'Đã chuyển về mô phỏng, máy sẽ không thay đổi.'}`);
    renderQueue();
  });
  els.install.addEventListener('click', runInstallPlan);
  els.stopBtn?.addEventListener('click', requestStop);
  els.retryFailed?.addEventListener('click', retryFailed);
  els.selectAll?.addEventListener('click', selectAllFiltered);
  els.clearSelection?.addEventListener('click', clearSelection);
  els.exportQueue.addEventListener('click', exportProfile);
  els.exportProfile.addEventListener('click', exportProfile);
  els.importProfile?.addEventListener('click', () => els.importProfileInput?.click());
  els.importProfileInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) importProfileFromFile(file);
    event.target.value = '';
  });
  els.wingetRecheck?.addEventListener('click', recheckWinget);
  els.wingetInstall?.addEventListener('click', installAppInstaller);
  els.rescan.addEventListener('click', () => scanInstalled({ showFeedback: true, pruneSelection: false }));
  els.scanUpdates?.addEventListener('click', refreshUpdateAvailability);
  els.updateAll?.addEventListener('click', runUpdateAll);
  els.loadVersions?.addEventListener('click', () => loadPackageVersions());
  els.installVersion?.addEventListener('click', () => runInstallVersion('install'));
  els.reinstallVersion?.addEventListener('click', () => runInstallVersion('reinstall'));
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
  els.detailUpgrade.addEventListener('click', () => {
    if (detailAppId) runSingleOp(detailAppId, 'upgrade');
  });
  els.detailUninstall.addEventListener('click', () => {
    if (detailAppId) runSingleOp(detailAppId, 'uninstall');
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
  document.getElementById('workspaceDialogCloseBtn').addEventListener('click', closeWorkspaceDetail);
  document.getElementById('workspaceDialogCancelBtn').addEventListener('click', closeWorkspaceDetail);
  els.actionConfirmCancel?.addEventListener('click', () => closeActionConfirm(false));
  els.actionConfirmRun?.addEventListener('click', () => closeActionConfirm(true));
  els.actionConfirmDialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeActionConfirm(false);
  });
  els.actionConfirmDialog?.addEventListener('click', (event) => {
    if (event.detail === 0 || event.target !== els.actionConfirmDialog) return;
    const rect = els.actionConfirmDialog.getBoundingClientRect();
    const outside = event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom;
    if (outside) closeActionConfirm(false);
  });
  els.workspaceDetailApply.addEventListener('click', () => {
    if (workspaceDialogClosing || !workspaceDetailId) return;
    applyPreset(workspaceDetailId);
    closeWorkspaceDetail();
  });
  els.workspaceDetailQueue.addEventListener('click', () => {
    closeWorkspaceDetail({ immediate: true });
    switchView('queue');
  });
  els.workspaceDetailApps.addEventListener('click', (event) => {
    const appButton = event.target.closest('[data-workspace-app-detail]');
    if (!appButton) return;
    const appId = appButton.dataset.workspaceAppDetail;
    closeWorkspaceDetail({ immediate: true });
    openDetail(appId);
  });
  els.workspaceDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeWorkspaceDetail();
  });
  els.workspaceDialog.addEventListener('click', (event) => {
    if (event.detail === 0) return;
    if (event.target !== els.workspaceDialog) return;
    const rect = els.workspaceDialog.getBoundingClientRect();
    const outside = event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom;
    if (outside) closeWorkspaceDetail();
  });
  els.theme.addEventListener('click', toggleTheme);

  // Nút Terminal ở status bar: mở trang gói cài đặt và bật terminal.
  els.statusTerminalBtn.addEventListener('click', () => {
    const willOpen = !(state.terminalOpen && document.getElementById('page-queue')?.classList.contains('active'));
    switchView('queue');
    setTerminalOpen(willOpen);
  });

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
    if (state.running && Number(payload.percent || 0) < 100) {
      state.currentId = app.id;
    }
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
    state.wingetChecked = true;
    addLog(`[hệ thống] WebView2 native đang hoạt động. ${list.length} package ID đã được cho phép.`);

    if (!state.wingetAvailable) {
      els.realMode.checked = false;
      els.realMode.disabled = true;
      addLog('[hệ thống] Không tìm thấy winget. Vẫn có thể quét app đã cài nhưng không thể cài thật.');
    } else {
      addLog(`[hệ thống] winget${state.wingetVersion ? ` ${state.wingetVersion}` : ''} đã sẵn sàng.`);
    }
    renderWingetBanner();
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
  initViewMode();
  initSortMode();
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
