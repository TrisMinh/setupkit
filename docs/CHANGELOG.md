# Changelog

Toàn bộ thay đổi đáng chú ý của SetupKit được ghi tại đây.

## [0.8.0] - 2026-07-30

### Thêm mới

- **Trang Workspaces riêng** — thêm tab Workspaces để duyệt toàn bộ 24 bộ công cụ theo vai trò/lĩnh vực thay vì chỉ xem vài plan nổi bật ở trang chính.
- **Chi tiết workspace kiểu package detail** — mỗi workspace có dialog riêng với tổng số app, số app cần cài, app đã có, nguồn WinGet/Store, danh sách app compact và preview các lệnh sẽ chạy.
- **Preview logo khi hover** — workspace/preset chỉ bung preview logo 2 dòng khi hover hoặc focus, giữ màn hình gọn khi không tương tác.

### Cải thiện

- **Workspace cards gọn hơn** — rail logo trong card tự dàn đều theo chiều ngang, bỏ caret thừa và chỉ hiện nút chi tiết khi người dùng đang focus vào card.
- **Danh sách app trong workspace detail dày hơn** — app trong dialog xếp 2-3 item mỗi hàng trên desktop, giảm cuộn dọc khi xem bộ lớn.
- **Chế độ biểu tượng cân hàng nút** — các nút chọn/chi tiết trong icon view thẳng hàng dù tên app dài 1 hay 2 dòng.
- **Chế độ danh sách tận dụng khoảng trống** — list view hiển thị thêm mô tả, type/tag và trạng thái thay vì để phần giữa row trống.
- **Validation seed hệ sinh thái** — thêm dữ liệu seed và bước kiểm tra `validate-ecosystem-seeds.js` vào `npm run validate`.

## [0.7.0] - 2026-07-26

### Thêm mới

- **Cập nhật ứng dụng đã cài** — SetupKit tự phát hiện app có bản mới (qua `winget upgrade` khi quét máy), gắn nhãn "Có bản cập nhật mới" trên thẻ và thêm nút **Cập nhật** trong hộp thoại chi tiết. Bấm là chạy `winget upgrade` cho đúng ứng dụng đó, có terminal và tiến trình như khi cài.
- **Gỡ cài đặt** — nút **Gỡ cài đặt** trong hộp thoại chi tiết chạy `winget uninstall`, hỏi xác nhận trước khi xóa và cập nhật lại trạng thái ngay sau khi xong.
- **Nhập hồ sơ JSON** — trang Hồ sơ có thêm nút Nhập: chọn tệp hồ sơ đã xuất để áp lại đúng bộ ứng dụng, tự bỏ qua app đã cài và chỉ nhận package ID có trong danh mục đã duyệt.
- **Chọn nhanh hàng loạt** — nút "Chọn hết" thêm toàn bộ ứng dụng đang lọc mà chưa cài (kèm công cụ nên có trước), nút "Bỏ chọn" làm trống gói trong một bấm.
- **Ghi nhớ danh sách đang chọn** — gói cài đặt được lưu lại và khôi phục nguyên vẹn ở lần mở app sau.
- **Cài lại ứng dụng lỗi** — sau khi chạy gói, nút "Cài lại ứng dụng lỗi" thử lại đúng những app thất bại.
- **Dừng giữa chừng** — nút "Dừng sau ứng dụng hiện tại" dừng hàng đợi một cách an toàn sau khi app đang chạy hoàn tất, không cắt ngang giữa lúc cài.
- **Máy chưa có winget** — nếu không tìm thấy Windows Package Manager, SetupKit hiện banner mời cài **App Installer** từ Microsoft Store chỉ với một bấm, kèm nút Kiểm tra lại, thay vì báo lỗi cụt.
- **Tự động build & phát hành (CI)** — thêm GitHub Actions tự build `SetupKit.exe` và tạo Release khi đẩy tag `v*`.

### Gỡ bỏ

- **Gỡ bỏ hoàn toàn trang Kích hoạt Windows** — bỏ cả giao diện (tab Kích hoạt, console lệnh) lẫn phần backend liên quan. SetupKit tập trung vào cài, cập nhật và gỡ ứng dụng.

### Cải thiện

- Ba thao tác winget (cài, cập nhật, gỡ) dùng chung một luồng thực thi: cùng cách stream terminal, suy luận tiến trình và làm mới trạng thái sau khi xong.

### Lưu ý

- File `SetupKit.exe` chưa được ký số (code signing) vì cần chứng chỉ trả phí, nên Windows SmartScreen có thể cảnh báo lần đầu (chọn "More info" rồi "Run anyway"). Bản build CI cũng chưa ký; có thể thêm bước ký khi có chứng chỉ.

## [0.6.0] - 2026-07-26

### Thêm mới

- **Ba kiểu hiển thị danh mục** — Lưới (mặc định), Danh sách (gọn, một app mỗi hàng) và Biểu tượng (ô nhỏ tập trung vào logo). Có nút chuyển ngay trên thanh danh mục và lựa chọn được ghi nhớ cho lần mở sau.
- **Hộp thoại chi tiết hiển thị logo ứng dụng** ngay cạnh tên.

### Sửa lỗi

- Icon ở khối "ứng dụng đã chọn" và thanh trạng thái đổi từ `ph-package` (có nét chĩa lên trông như lỗi) sang `ph-stack` cho sạch
- Khối "ứng dụng đã chọn" bỏ nền kính mờ (`backdrop-filter`) gây vạch góc và lộ nội dung phía sau trên WebView2; nay dùng nền đục

## [0.5.0] - 2026-07-26

### Sửa lỗi

- **Không quét được ứng dụng trên máy** — sau đợt tái cấu trúc, Wails phơi cầu nối native dưới package `kit` (`window.go.kit.App`) nhưng frontend vẫn tìm `window.go.main.App`, khiến mọi lời gọi native (quét máy, cài thật, mở app) đều thất bại. Cầu nối giờ tự dò `App` ở mọi package nên không vỡ khi đổi cấu trúc Go.

### Thêm mới

- **Thanh trạng thái cố định dưới cùng** kiểu IDE, hiện ở mọi tab: trạng thái winget, số ứng dụng đã cài, số đang chọn, và nút mở terminal nhanh kèm số dòng đầu ra
- Đưa gói **Office & Remote Work** (Microsoft 365 / Word, Excel, PowerPoint, Outlook, Teams...) lên vị trí thứ hai để dễ thấy

### Cải thiện

- **Lưới ứng dụng dày hơn** — tự xếp 3-4 ứng dụng trên một hàng ở màn hình rộng thay vì cố định 2, co giãn mượt theo kích thước cửa sổ, tận dụng tối đa không gian

## [0.4.1] - 2026-07-26

### Thay đổi

- Tái cấu trúc dự án theo bố cục chuẩn Wails + Go: giao diện web vào `frontend/`, toàn bộ logic Go vào `internal/kit/` — gốc dự án chỉ còn `main.go` bootstrap và file cấu hình
- Catalog chỉ còn nhúng một bản duy nhất trong exe (trước đây nhúng trùng hai lần) — file build nhẹ hơn ~300 KB
- Xóa `package-lock.json` rỗng; `CHANGELOG.md` chuyển vào `docs/`, `install.ps1` chuyển vào `scripts/`
- Ba dropdown lọc (danh mục, nguồn, tình trạng) chuyển từ `<select>` hệ điều hành sang component tùy chỉnh: đồng bộ theme sáng/tối, đánh dấu mục đang chọn, điều khiển đầy đủ bằng bàn phím (mũi tên, Enter, Esc, Home/End)
- Thêm `install.ps1` - cài SetupKit bằng một dòng lệnh PowerShell, tự tải bản mới nhất từ GitHub Releases và tạo shortcut
- README viết lại với banner, tập trung vào tính năng; mô tả About của repo dùng tiếng Việt có dấu kèm topics

### Sửa lỗi

- Ô tìm kiếm hiển thị hai nút xóa (nút xóa mặc định của WebView2 trùng với nút của app)

## [0.4.0] - 2026-07-26

Bản tối ưu lớn: sửa 10 lỗi giao diện/hành vi, render thông minh hơn, thêm animation nhẹ toàn CSS và cải thiện trải nghiệm — exe vẫn ~12 MB, không thêm thư viện nào.

### Sửa lỗi

- Icon nhóm và tag "CLI" hiển thị trống (catalog dùng `ph-prompt` không tồn tại trong Phosphor → `ph-terminal`)
- Dialog chi tiết bị che mất hàng nút khi nội dung dài — phần thân giờ tự cuộn, footer luôn hiện
- Thanh tiến trình giật/nhấp nháy khi winget đổ log (trước đây rebuild toàn bộ DOM mỗi tick)
- Chớp trắng khi mở app lúc đang dùng theme tối — theme áp trước khi render (`theme-init.js`), màu nền cửa sổ đọc theo dark mode Windows ngay từ khởi tạo
- Nút "Mở ứng dụng" có thể chạy nhầm file `.ico` khi Registry `DisplayIcon` không trỏ tới file thực thi
- Ứng dụng đã cài nhưng còn nằm trong gói không thể bỏ ra khỏi gói
- Nhấn Enter/Space vào nút bên trong dialog làm dialog tự đóng ngoài ý muốn
- Double-click nhanh "Thêm vào gói" tự hủy ngược lựa chọn vừa thêm
- Gõ tìm kiếm trước khi catalog tải xong làm app rơi vào màn hình lỗi
- Icon xoay (spinner) bị reset giật mỗi tick tiến trình

### Hiệu năng

- Chọn/bỏ ứng dụng chỉ cập nhật đúng card đó thay vì vẽ lại cả lưới 440 card
- Tra cứu app/package chuyển sang Map O(1); số đếm tag tính một lần khi tải catalog
- Tìm kiếm có debounce 90ms; chỉ mục tìm kiếm dựng khi máy rảnh (requestIdleCallback)
- CSS icon Phosphor cắt từ 78 KB (1530 icon) còn ~4.6 KB (72 icon thật sự dùng)
- Giới hạn bộ nhớ nhật ký (400 dòng) và terminal (120 KB)
- Terminal chỉ tự cuộn khi đang ở cuối; render log/terminal gom theo frame (rAF)

### Trải nghiệm & giao diện

- Tìm kiếm không cần gõ dấu tiếng Việt ("trinh duyet" khớp "trình duyệt")
- Phím tắt `/` hoặc `Ctrl+K` để tìm nhanh; Esc xóa từ khóa
- Nhấn vào thân card để mở chi tiết
- Animation vào/ra cho card, hàng đợi, preset, dialog, dock chọn ứng dụng và toast (CSS thuần, tự tắt khi Windows bật giảm chuyển động)
- Toast bấm để đóng, tối đa 4, có màu theo loại thông báo
- Ánh sáng chạy trên thanh tiến trình của app đang cài; vạch xanh đánh dấu mục nav đang chọn; nút theme xoay khi đổi giao diện
- Cuộn dải Workstation plans bằng con lăn chuột hoặc hai nút mũi tên
- Skeleton hiển thị trong lúc khởi động; ảnh logo không bị kéo-thả như ảnh web; chỉ vùng lệnh/đường dẫn/log cho phép bôi đen copy

### Build & công cụ

- `scripts/build-phosphor-subset.js`: tự cắt bộ icon theo đúng phần đang dùng, fail ngay lúc build nếu catalog tham chiếu icon không tồn tại (đã nối vào `build-native.ps1` và `npm run validate`)
- `BUILD-SETUPKIT.cmd`: build một cú double-click
- `scripts/publish-github.ps1` + `PUBLISH-GITHUB.cmd`: tự cài công cụ, tạo repo, push và tạo GitHub Release kèm exe

## [0.3.0]

- Bản WebView2 native đầu tiên (Wails v2) thay thế bản Electron — exe độc lập ~12 MB
- Catalog 440 ứng dụng, 24 workstation plan, 15 nhóm, 34 tag, 309 logo
- Quét app đã cài qua winget, Registry, Start Menu, shortcut
- Chế độ chạy thử mặc định, xác nhận từng lệnh khi cài thật, allowlist nhúng trong binary
