(() => {
  // Production uses the lightweight Wails/WebView2 bridge exposed as
  // window.go.main.App. Keeping this compatibility shape avoids coupling the UI
  // to a desktop framework.
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

  const nativeApp = () => waitFor(
    () => window.go?.main?.App,
    'cầu nối WebView2'
  );

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
    openApp: (packageId) => invoke('OpenApp', packageId),
    openAppFolder: (packageId) => invoke('OpenAppFolder', packageId),
    onInstallProgress: (callback) => subscribe('setupkit:install-progress', callback),
    onTerminalOutput: (callback) => subscribe('setupkit:terminal-output', callback)
  });
})();
