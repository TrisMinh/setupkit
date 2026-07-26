# Changelog

Toàn bộ thay đổi đáng chú ý của SetupKit được ghi tại đây.

## [0.4.1] - 2026-07-26

### Thay đổi

- Tái cấu trúc dự án theo bố cục chuẩn Wails: toàn bộ giao diện web (index.html, renderer.js, styles.css, catalog.json, assets) chuyển vào `frontend/`, gốc dự án gọn và dễ đọc hơn
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
