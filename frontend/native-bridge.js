(() => {
  // Wails phơi struct App dưới dạng window.go.<package>.App. Tùy Go package
  // (main hoặc kit...) mà namespace khác nhau, nên ta DÒ App ở mọi package
  // thay vì hardcode window.go.main.App - tránh vỡ khi đổi cấu trúc Go.
  if (window.setupkitNative) return;

  const waitFor = (resolveValue, label) => new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      const value = resolveValue();
      if (value) {
        resolve(value);
        return;
      }
      if (Date.now() - startedAt > 15000) {
        reject(new Error(`Không thể khởi tạo ${label}.`));
        return;
      }
      window.setTimeout(poll, 25);
    };
    poll();
  });

  const findApp = () => {
    const go = window.go;
    if (!go || typeof go !== 'object') return null;
    // Ưu tiên các namespace đã biết, sau đó dò mọi package có struct App.
    const known = go.main?.App || go.kit?.App;
    if (known) return known;
    for (const pkg of Object.keys(go)) {
      const candidate = go[pkg]?.App;
      if (candidate && typeof candidate === 'object') return candidate;
    }
    return null;
  };

  const nativeApp = () => waitFor(findApp, 'cầu nối WebView2');

  const invoke = async (method, ...args) => {
    const app = await nativeApp();
    if (typeof app[method] !== 'function') {
      throw new Error(`Cầu nối native thiếu phương thức ${method}.`);
    }
    return app[method](...args);
  };

  const subscribe = (eventName, callback) => {
    let cancelled = false;
    let unsubscribe = () => {};
    waitFor(() => window.runtime?.EventsOn, 'hệ thống sự kiện')
      .then((eventsOn) => {
        if (cancelled) return;
        unsubscribe = eventsOn(eventName, callback);
      })
      .catch((error) => {
        console.error(error);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  };

  window.setupkitNative = Object.freeze({
    listAllowlist: () => invoke('ListAllowlist'),
    checkSystem: () => invoke('CheckSystem'),
    scanInstalled: () => invoke('ScanInstalled'),
    buildCommand: (packageId) => invoke('BuildCommand', packageId),
    chooseInstallLocation: (packageId) => invoke('ChooseInstallLocation', packageId),
    resetInstallLocation: (packageId) => invoke('ResetInstallLocation', packageId),
    runWinget: (packageId) => invoke('RunWinget', packageId),
    upgradeApp: (packageId) => invoke('UpgradeApp', packageId),
    uninstallApp: (packageId) => invoke('UninstallApp', packageId),
    openApp: (packageId) => invoke('OpenApp', packageId),
    openAppFolder: (packageId) => invoke('OpenAppFolder', packageId),
    openAppInstallerPage: () => invoke('OpenAppInstallerPage'),
    onInstallProgress: (callback) => subscribe('setupkit:install-progress', callback),
    onTerminalOutput: (callback) => subscribe('setupkit:terminal-output', callback)
  });
})();
