(() => {
  const STORAGE_KEY = 'setupkit-language';
  const DEFAULT_LANGUAGE = 'en';

  const viToEn = new Map([
    ['Thiết lập máy an toàn', 'Safe machine setup'],
    ['Điều hướng chính', 'Primary navigation'],
    ['Ứng dụng', 'Apps'],
    ['ứng dụng', 'apps'],
    ['Bảng điều khiển', 'Dashboard'],
    ['Cập nhật', 'Updates'],
    ['Gói cài đặt', 'Install queue'],
    ['Nhật ký', 'Logs'],
    ['Hồ sơ', 'Profile'],
    ['Chính sách an toàn', 'Safety policy'],
    ['Nguồn đã xác minh', 'Verified sources'],
    ['Chỉ tạo lệnh từ danh sách đã duyệt. Không tải script hay bộ cài từ URL lạ.', 'Commands only come from the reviewed catalog. No scripts or installers from unknown URLs.'],
    ['450 ứng dụng', '450 apps'],
    ['Hệ thống sẵn sàng', 'System ready'],
    ['Quét lại ứng dụng đã cài', 'Rescan installed apps'],
    ['Quét lại ứng dụng', 'Rescan apps'],
    ['Đổi giao diện', 'Toggle theme'],
    ['Dựng workstation theo công việc', 'Build a workstation by role'],
    ['Chọn plan theo vai trò hoặc lọc đúng công cụ, runtime và ứng dụng bạn cần.', 'Choose a role-based plan or filter the exact tools, runtimes, and apps you need.'],
    ['Không tìm thấy winget trên máy', 'winget was not found'],
    ['SetupKit cần Windows Package Manager (App Installer) để cài thật. Bạn vẫn xem và mô phỏng được toàn bộ danh mục.', 'SetupKit needs Windows Package Manager (App Installer) for real installs. You can still browse and simulate the full catalog.'],
    ['Kiểm tra lại', 'Check again'],
    ['Cài App Installer', 'Install App Installer'],
    ['Workspace preview', 'Workspace preview'],
    ['Xem tất cả', 'View all'],
    ['Đang tải workspace', 'Loading workspaces'],
    ['Cuộn danh sách plan sang trái', 'Scroll plans left'],
    ['Cuộn danh sách plan sang phải', 'Scroll plans right'],
    ['Kho ứng dụng', 'App catalog'],
    ['Tìm ứng dụng', 'Search apps'],
    ['Tìm app, runtime, publisher, package ID... (phím /)', 'Search app, runtime, publisher, package ID... (/)'],
    ['Xóa từ khóa', 'Clear search'],
    ['Lọc theo danh mục', 'Filter by category'],
    ['Lọc theo nguồn cài đặt', 'Filter by source'],
    ['Lọc theo tình trạng cài đặt', 'Filter by install status'],
    ['Sắp xếp danh sách', 'Sort list'],
    ['Lọc nhanh theo tag', 'Quick tag filters'],
    ['Xóa tag', 'Clear tags'],
    ['Tag ứng dụng', 'App tags'],
    ['Đang tải danh sách', 'Loading catalog'],
    ['Chọn tất cả ứng dụng đang lọc mà chưa cài', 'Select all filtered apps that are not installed'],
    ['Chọn hết', 'Select all'],
    ['Bỏ chọn tất cả ứng dụng trong gói', 'Clear all apps in the queue'],
    ['Bỏ chọn', 'Clear'],
    ['Đang kiểm tra ứng dụng trên máy', 'Checking installed apps'],
    ['Kiểu hiển thị', 'View mode'],
    ['Dạng lưới', 'Grid view'],
    ['Xem dạng lưới', 'Show grid view'],
    ['Dạng danh sách', 'List view'],
    ['Xem dạng danh sách', 'Show list view'],
    ['Dạng biểu tượng', 'Icon view'],
    ['Xem dạng biểu tượng', 'Show icon view'],
    ['Tóm tắt lựa chọn', 'Selection summary'],
    ['0 ứng dụng đã chọn', '0 apps selected'],
    ['Sẵn sàng để xem lại và chạy', 'Ready to review and run'],
    ['Xem gói cài đặt', 'Review install queue'],
    ['Chọn bộ công cụ theo vai trò, ngữ cảnh làm việc hoặc stack bạn muốn dựng trên máy.', 'Choose tools by role, work context, or stack.'],
    ['Tất cả workspace', 'All workspaces'],
    ['Cập nhật ứng dụng', 'App updates'],
    ['SetupKit phát hiện app có bản mới qua winget và cập nhật đúng package đã duyệt.', 'SetupKit detects available winget upgrades and updates only reviewed packages.'],
    ['Ứng dụng có bản mới', 'Apps with updates'],
    ['Quét update', 'Scan updates'],
    ['Chưa quét', 'Not scanned'],
    ['Tìm app cần cập nhật', 'Search apps to update'],
    ['Tìm app cần cập nhật...', 'Search apps to update...'],
    ['Tóm tắt cập nhật', 'Update summary'],
    ['Đã phát hiện', 'Detected'],
    ['0 ứng dụng', '0 apps'],
    ['Nguồn', 'Source'],
    ['Phạm vi', 'Scope'],
    ['Catalog đã duyệt', 'Reviewed catalog'],
    ['Chế độ', 'Mode'],
    ['Sẵn sàng', 'Ready'],
    ['Cập nhật hàng loạt sẽ hỏi xác nhận một lần rồi chạy tuần tự từng package.', 'Bulk updates ask for confirmation once, then run each package in sequence.'],
    ['Cập nhật tất cả', 'Update all'],
    ['Xem nhật ký', 'View logs'],
    ['Tải version cũ', 'Download older versions'],
    ['Chọn app nguồn winget, xem version còn trong manifest và cài lại version cần dùng.', 'Choose a winget app, view manifest versions, and install the version you need.'],
    ['Ứng dụng winget', 'winget apps'],
    ['Đang tải', 'Loading'],
    ['Tìm app để tải version cũ', 'Search apps for older versions'],
    ['Tìm app winget...', 'Search winget apps...'],
    ['Lọc ứng dụng theo trạng thái cài đặt', 'Filter apps by install status'],
    ['Đã cài', 'Installed'],
    ['Chưa cài', 'Not installed'],
    ['Tất cả', 'All'],
    ['Version có thể cài', 'Installable versions'],
    ['Tải version', 'Load versions'],
    ['Chọn app', 'Choose app'],
    ['Rollback có thể thất bại nếu installer không cho downgrade. Chế độ gỡ rồi cài có thể ảnh hưởng cấu hình của app.', 'Rollback can fail if the installer blocks downgrades. Reinstall mode can affect app settings.'],
    ['Cài version này', 'Install this version'],
    ['Gỡ rồi cài version này', 'Uninstall then install this version'],
    ['Cài đặt và theo dõi', 'Install and monitor'],
    ['Xem tiến trình từng ứng dụng và mở ngay sau khi cài xong.', 'Track each app and open it after install.'],
    ['Terminal', 'Terminal'],
    ['Chưa bắt đầu', 'Not started'],
    ['Tiến trình cài đặt', 'Install progress'],
    ['Đầu ra cài đặt', 'Install output'],
    ['Chưa có lệnh nào được chạy', 'No command has run yet'],
    ['Sao chép terminal', 'Copy terminal'],
    ['Xóa terminal', 'Clear terminal'],
    ['Đóng terminal', 'Close terminal'],
    ['Terminal sẽ hiển thị command, stdout và stderr khi bắt đầu cài.', 'Terminal output will show command, stdout, and stderr when install starts.'],
    ['Tóm tắt gói cài đặt', 'Install queue summary'],
    ['Tóm tắt', 'Summary'],
    ['Đã có trên máy', 'Already installed'],
    ['Ứng dụng dung lượng lớn', 'Large apps'],
    ['Đã xác minh', 'Verified'],
    ['URL tải ngoài', 'External URLs'],
    ['Đã chặn', 'Blocked'],
    ['Chạy thử an toàn', 'Safe simulation'],
    ['Cài đặt thật', 'Real install'],
    ['Cho phép chạy winget', 'Allow winget commands'],
    ['Mỗi ứng dụng vẫn cần xác nhận', 'Each app still requires confirmation'],
    ['Chế độ này sẽ thay đổi máy. SetupKit sẽ hỏi lại trước từng lệnh.', 'This mode changes your machine. SetupKit asks again before each command.'],
    ['Chạy thử gói cài', 'Simulate queue'],
    ['Dừng sau ứng dụng hiện tại', 'Stop after current app'],
    ['Cài lại ứng dụng lỗi', 'Retry failed apps'],
    ['Xuất hồ sơ', 'Export profile'],
    ['Nhật ký hoạt động', 'Activity logs'],
    ['Theo dõi từng thay đổi và kết quả xử lý ngay trên máy.', 'Track changes and results on this machine.'],
    ['Phiên hiện tại', 'Current session'],
    ['Xóa nhật ký', 'Clear logs'],
    ['Lưu lại cấu hình máy', 'Save machine profile'],
    ['Xuất danh sách ứng dụng thành một hồ sơ JSON để dùng lại sau.', 'Export selected apps as a reusable JSON profile.'],
    ['Chính sách an toàn đi kèm', 'Built-in safety policy'],
    ['Hồ sơ chỉ chứa package ID đã duyệt và lệnh được tạo cục bộ.', 'Profiles only contain reviewed package IDs and locally generated commands.'],
    ['Allowlist cục bộ', 'Local allowlist'],
    ['Không chấp nhận package ID tùy ý', 'Rejects arbitrary package IDs'],
    ['Không có URL ngoài', 'No external URLs'],
    ['Không tải script hoặc installer lạ', 'No unknown scripts or installers'],
    ['Lệnh minh bạch', 'Transparent commands'],
    ['Có thể xem trước từng lệnh winget', 'Preview every winget command'],
    ['Xác nhận thủ công', 'Manual confirmation'],
    ['Cài đặt thật luôn cần đồng ý', 'Real installs always require approval'],
    ['Hồ sơ SetupKit', 'SetupKit profile'],
    ['Xuất các ứng dụng đang chọn cùng nguồn và command tương ứng, hoặc nhập lại hồ sơ đã lưu để dựng máy y hệt.', 'Export selected apps with source and command, or import a saved profile to rebuild the same machine.'],
    ['Xuất hồ sơ JSON', 'Export JSON profile'],
    ['Nhập hồ sơ JSON', 'Import JSON profile'],
    ['Nhập hồ sơ sẽ thay danh sách đang chọn bằng ứng dụng trong tệp. Chỉ nhận package ID đã có trong danh mục đã duyệt.', 'Import replaces the current selection with apps from the file. Only package IDs from the reviewed catalog are accepted.'],
    ['Thanh trạng thái', 'Status bar'],
    ['Đang kiểm tra hệ thống', 'Checking system'],
    ['Ứng dụng trong danh mục đã có trên máy', 'Catalog apps installed on this machine'],
    ['0 đã cài', '0 installed'],
    ['Ứng dụng đang chọn trong gói cài đặt', 'Apps selected in the install queue'],
    ['0 đang chọn', '0 selected'],
    ['Mở terminal đầu ra cài đặt', 'Open install output terminal'],
    ['Chi tiết ứng dụng', 'App details'],
    ['Đóng', 'Close'],
    ['Tình trạng', 'Status'],
    ['Phiên bản', 'Version'],
    ['Nguồn cài đặt', 'Install source'],
    ['Nhà phát hành', 'Publisher'],
    ['Loại công cụ', 'Tool type'],
    ['Mức dung lượng', 'Size class'],
    ['Nên cài cùng', 'Recommended with'],
    ['Lưu ý', 'Note'],
    ['Thư mục hiện tại', 'Current folder'],
    ['Vị trí cài mới', 'Install target'],
    ['Lệnh sẽ được chạy', 'Command to run'],
    ['Lệnh này được tạo từ allowlist nội bộ, không nhận URL hoặc script bên ngoài.', 'This command is generated from the internal allowlist. No external URLs or scripts are accepted.'],
    ['Mở thư mục', 'Open folder'],
    ['Gỡ cài đặt', 'Uninstall'],
    ['Dùng mặc định', 'Use default'],
    ['Chọn thư mục', 'Choose folder'],
    ['Mở ứng dụng', 'Open app'],
    ['Thêm vào gói', 'Add to queue'],
    ['Chi tiết workspace', 'Workspace details'],
    ['Quy mô', 'Size'],
    ['Cần cài', 'To install'],
    ['Ứng dụng trong workspace', 'Apps in workspace'],
    ['Chỉ liệt kê app chưa cài', 'Only lists apps not installed'],
    ['Các lệnh được tạo từ catalog đã duyệt, tự bỏ qua ứng dụng Windows đã phát hiện.', 'Commands are generated from the reviewed catalog and skip detected Windows apps.'],
    ['Dùng workspace này', 'Use this workspace']
  ]);

  for (const [vi, en] of [
    ['Tất cả danh mục', 'All categories'],
    ['Tất cả nguồn', 'All sources'],
    ['Chỉ winget', 'winget only'],
    ['Chỉ Microsoft Store', 'Microsoft Store only'],
    ['Mọi tình trạng', 'Any status'],
    ['Đã cài trên máy', 'Installed on this machine'],
    ['Đang trong gói', 'In queue'],
    ['Đang chọn', 'Selected'],
    ['Thông minh', 'Smart'],
    ['Thứ tự cài', 'Install order'],
    ['Tên A-Z', 'Name A-Z'],
    ['Danh mục', 'Category'],
    ['Nguồn cài', 'Source'],
    ['App lớn trước', 'Large apps first'],
    ['Chưa cài trước', 'Not installed first'],
    ['Đang cài', 'Installing'],
    ['Mô phỏng xong', 'Simulated'],
    ['Cần xử lý', 'Needs review'],
    ['Đã chọn', 'Selected'],
    ['Chưa cài', 'Not installed'],
    ['App lớn', 'Large app'],
    ['Có bản cập nhật mới', 'Update available'],
    ['Đã phát hiện trên Windows', 'Detected on Windows'],
    ['Xem chi tiết', 'View details'],
    ['Bỏ khỏi gói', 'Remove from queue'],
    ['Bỏ', 'Remove'],
    ['Thêm', 'Add'],
    ['Không tìm thấy ứng dụng', 'No apps found'],
    ['Thử từ khóa ngắn hơn hoặc đặt lại bộ lọc.', 'Try a shorter keyword or reset filters.'],
    ['Đặt lại bộ lọc', 'Reset filters'],
    ['Đang chuẩn bị', 'Preparing'],
    ['Thư mục hiện tại', 'Current folder'],
    ['Windows không công khai vị trí cài đặt', 'Windows does not expose the install location'],
    ['Vị trí cài đặt', 'Install location'],
    ['Mặc định', 'Default'],
    ['Đổi', 'Change'],
    ['Đã cập nhật', 'Updated'],
    ['Đang cập nhật', 'Updating'],
    ['Cần kiểm tra', 'Needs review'],
    ['Có update', 'Has update'],
    ['Mới nhất', 'Latest'],
    ['Đang bận', 'Busy'],
    ['Không khả dụng', 'Unavailable'],
    ['Không tìm thấy app update', 'No matching updates'],
    ['Chưa có ứng dụng cần cập nhật', 'No apps need updates yet'],
    ['Thử từ khóa ngắn hơn hoặc xóa ô tìm kiếm để xem toàn bộ app có update.', 'Try a shorter keyword or clear search to see every app with updates.'],
    ['Bấm quét update để hỏi lại winget khi cần kiểm tra phiên bản mới.', 'Click scan updates to ask winget for new versions.'],
    ['Không tìm thấy app winget', 'No winget apps found'],
    ['Chọn một ứng dụng', 'Choose an app'],
    ['Danh sách bên trái chỉ gồm app nguồn winget.', 'The left list only includes winget apps.'],
    ['Chưa tải', 'Not loaded'],
    ['Đang tải version', 'Loading versions'],
    ['Chưa tải danh sách version', 'Versions not loaded'],
    ['Bấm Tải version để xem các bản mà winget còn giữ trong manifest.', 'Click Load versions to see versions still kept in the winget manifest.'],
    ['Không lấy được version', 'Could not load versions'],
    ['Đang cài trên máy', 'Currently installed'],
    ['Mới nhất trong manifest', 'Latest in manifest'],
    ['Version cũ', 'Older version'],
    ['Gói cài đặt đang trống', 'Install queue is empty'],
    ['Ứng dụng đã có trên máy sẽ không bị thêm lại vào gói.', 'Apps already installed will not be added again.'],
    ['Chọn ứng dụng', 'Choose apps'],
    ['Chọn ứng dụng hoặc workstation plan', 'Choose apps or a workstation plan'],
    ['Chỉ mô phỏng, không thay đổi máy', 'Simulation only, no machine changes'],
    ['Cài đặt thật bằng winget', 'Real install with winget'],
    ['Đang chạy', 'Running'],
    ['Đã cài', 'Installed'],
    ['Chế độ mô phỏng - không có cầu nối native', 'Simulation mode - native bridge unavailable'],
    ['Không tìm thấy winget - chỉ mô phỏng', 'winget not found - simulation only'],
    ['Đang quét ứng dụng trên máy...', 'Scanning installed apps...'],
    ['Chuyển sang giao diện sáng', 'Switch to light theme'],
    ['Chuyển sang giao diện tối', 'Switch to dark theme'],
    ['Giao diện sáng', 'Light theme'],
    ['Giao diện tối', 'Dark theme'],
    ['Chỉ có thể mô phỏng', 'Simulation only'],
    ['Catalog không khả dụng', 'Catalog unavailable'],
    ['Không thể tải danh mục ứng dụng', 'Could not load app catalog'],
    ['Catalog không hợp lệ.', 'Invalid catalog.'],
    ['Không tải được catalog', 'Could not load catalog'],
    ['Không đọc được trạng thái máy', 'Could not read machine state'],
    ['Catalog và allowlist chưa đồng bộ', 'Catalog and allowlist are out of sync'],
    ['Cần winget', 'Needs winget'],
    ['Chưa cài trên máy', 'Not installed on this machine'],
    ['Mặc định của nhà phát hành, xác nhận sau khi cài', 'Publisher default, confirm after install']
  ]) {
    viToEn.set(vi, en);
  }

  const enToVi = new Map([...viToEn.entries()].map(([vi, en]) => [en, vi]));
  let language = readLanguage();
  let localizing = false;
  let initialized = false;

  function readLanguage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'vi' ? 'vi' : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  }

  function translateText(value) {
    if (!value || !value.trim()) return value;
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const trimmed = value.trim();
    const translated = language === 'en'
      ? viToEn.get(trimmed) || translatePattern(trimmed, 'en')
      : enToVi.get(trimmed) || translatePattern(trimmed, 'vi');
    return translated ? `${leading}${translated}${trailing}` : value;
  }

  function translatePattern(text, targetLanguage) {
    const patterns = targetLanguage === 'en'
      ? [
          [/^(\d+) ứng dụng$/, '$1 apps'],
          [/^(\d+) ứng dụng đã chọn$/, '$1 apps selected'],
          [/^(\d+) đã cài$/, '$1 installed'],
          [/^(\d+) đang chọn$/, '$1 selected'],
          [/^(\d+) cần cài$/, '$1 to install'],
          [/^(\d+) cần cài, (\d+) đã có$/, '$1 to install, $2 installed'],
          [/^(\d+) cần cài, (\d+) app lớn$/, '$1 to install, $2 large apps'],
          [/^(\d+) cần cài · (\d+) đã có$/, '$1 to install · $2 installed'],
          [/^(\d+) cần cài · (\d+) app lớn$/, '$1 to install · $2 large apps'],
          [/^(\d+) ứng dụng còn cần cài$/, '$1 apps left to install'],
          [/^(\d+) ứng dụng còn cần cài, gồm (\d+) app lớn$/, '$1 apps left to install, including $2 large apps'],
          [/^(\d+) đã phát hiện$/, '$1 detected'],
          [/^(\d+) workspace nổi bật$/, '$1 featured workspaces'],
          [/^(\d+) workspace theo vai trò và lĩnh vực$/, '$1 workspaces by role and domain'],
          [/^(\d+) \/ (\d+) ứng dụng phù hợp$/, '$1 / $2 matching apps'],
          [/^\/ (\d+) ứng dụng phù hợp$/, '/ $1 matching apps'],
          [/^(\d+) ứng dụng đã cài trên máy$/, '$1 apps installed on this machine'],
          [/^Mô phỏng (\d+) ứng dụng$/, 'Simulate $1 apps'],
          [/^(\d+)\/(\d+) ứng dụng$/, '$1/$2 apps']
        ]
      : [
          [/^(\d+) apps$/, '$1 ứng dụng'],
          [/^(\d+) apps selected$/, '$1 ứng dụng đã chọn'],
          [/^(\d+) installed$/, '$1 đã cài'],
          [/^(\d+) selected$/, '$1 đang chọn'],
          [/^(\d+) to install$/, '$1 cần cài'],
          [/^(\d+) to install, (\d+) installed$/, '$1 cần cài, $2 đã có'],
          [/^(\d+) to install, (\d+) large apps$/, '$1 cần cài, $2 app lớn'],
          [/^(\d+) to install · (\d+) installed$/, '$1 cần cài · $2 đã có'],
          [/^(\d+) to install · (\d+) large apps$/, '$1 cần cài · $2 app lớn'],
          [/^(\d+) apps left to install$/, '$1 ứng dụng còn cần cài'],
          [/^(\d+) apps left to install, including (\d+) large apps$/, '$1 ứng dụng còn cần cài, gồm $2 app lớn'],
          [/^(\d+) detected$/, '$1 đã phát hiện'],
          [/^(\d+) featured workspaces$/, '$1 workspace nổi bật'],
          [/^(\d+) workspaces by role and domain$/, '$1 workspace theo vai trò và lĩnh vực'],
          [/^(\d+) \/ (\d+) matching apps$/, '$1 / $2 ứng dụng phù hợp'],
          [/^\/ (\d+) matching apps$/, '/ $1 ứng dụng phù hợp'],
          [/^(\d+) apps installed on this machine$/, '$1 ứng dụng đã cài trên máy'],
          [/^Simulate (\d+) apps$/, 'Mô phỏng $1 ứng dụng'],
          [/^(\d+)\/(\d+) apps$/, '$1/$2 ứng dụng']
        ];
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(text)) return text.replace(pattern, replacement);
    }
    return '';
  }

  function translateAttribute(element, attr) {
    if (!element.hasAttribute(attr)) return;
    const next = translateText(element.getAttribute(attr));
    if (next !== element.getAttribute(attr)) element.setAttribute(attr, next);
  }

  function localize(root = document.body) {
    if (!root || localizing) return;
    localizing = true;
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (['SCRIPT', 'STYLE'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        const next = translateText(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
      const elementRoot = root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement;
      for (const element of [elementRoot, ...elementRoot.querySelectorAll('*')]) {
        for (const attr of ['aria-label', 'title', 'placeholder', 'data-dropdown-label']) {
          translateAttribute(element, attr);
        }
      }
      document.documentElement.lang = language;
      document.documentElement.dataset.language = language;
      updateControls();
    } finally {
      localizing = false;
    }
  }

  function updateControls() {
    for (const button of document.querySelectorAll('[data-language-choice]')) {
      button.setAttribute('aria-pressed', String(button.dataset.languageChoice === language));
    }
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === 'vi' ? 'vi' : 'en';
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Language still changes for this session.
    }
    localize(document.body);
    window.dispatchEvent(new CustomEvent('setupkit:languagechange', { detail: { language } }));
  }

  function init() {
    if (initialized || !document.body) return;
    initialized = true;
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    localize(document.body);
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-language-choice]');
      if (button) setLanguage(button.dataset.languageChoice);
    });
    const observer = new MutationObserver((mutations) => {
      if (localizing) return;
      const roots = new Set();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) roots.add(node);
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) roots.add(node.parentElement);
        }
      }
      if (roots.size) queueMicrotask(() => roots.forEach((node) => localize(node)));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.SetupKitI18n = {
    t: (value) => translateText(value),
    localize,
    setLanguage,
    getLanguage: () => language
  };

  if (document.body) {
    init();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
