<div align="center">

# 📦 SetupKit

**Dựng máy Windows mới trong một buổi cà phê — 440 ứng dụng đã xác minh, cài bằng winget, an toàn tuyệt đối.**

![Windows 10/11](https://img.shields.io/badge/Windows%2010%2F11-x64-0078D4?logo=windows&logoColor=white)
![WebView2 native](https://img.shields.io/badge/WebView2-native%20%7C%20~12%20MB-2ea44f)
![Wails v2](https://img.shields.io/badge/Wails-v2-DF0000)
![License](https://img.shields.io/badge/license-MIT-blue)

<img src="docs/screenshots/catalog-light.png" alt="SetupKit - danh mục ứng dụng" width="900">

</div>

---

## SetupKit là gì?

Máy Windows mới tinh (hoặc vừa cài lại) luôn kèm theo một buổi chiều mở 20 tab trình duyệt để tải từng bộ cài. SetupKit thay việc đó bằng **một file EXE duy nhất ~12 MB**: chọn một Workstation plan theo vai trò (Developer, Designer, Gaming...), xem trước từng lệnh, bấm cài, và theo dõi tiến trình từng ứng dụng ngay trong app.

Không Electron, không thư mục runtime 300 MB — SetupKit dùng **WebView2 có sẵn của Windows** (qua [Wails v2](https://wails.io)), nên mở lên là chạy ngay cả trên máy vừa active.

## Tính năng

- **440 ứng dụng hợp pháp** từ WinGet và Microsoft Store, chia 15 nhóm, 34 tag, kèm 309 logo đóng gói cục bộ
- **24 Workstation plan** theo vai trò: chọn một plan là có ngay bộ công cụ được sắp đúng thứ tự nền tảng → runtime → build tool → IDE
- **Tự quét máy** qua winget, Registry, Start Menu và shortcut để biết app nào đã cài (kèm phiên bản, thư mục cài đặt)
- **Tìm kiếm không cần gõ dấu** — "trinh duyet", "may ao" vẫn ra đúng kết quả; phím tắt `/` hoặc `Ctrl+K`
- **Chế độ chạy thử mặc định**: mô phỏng toàn bộ quá trình cài mà không đụng gì tới máy
- **Terminal tích hợp**: xem command, stdout, stderr và mã thoát của winget theo thời gian thực
- **Chọn thư mục cài riêng** cho từng package hỗ trợ `--location`
- Sau khi cài: mở app, xem phiên bản, mở thư mục cài đặt ngay trong SetupKit
- **Xuất hồ sơ JSON** để dùng lại cấu hình cho máy tiếp theo
- Giao diện sáng/tối theo hệ thống, animation nhẹ toàn CSS, tôn trọng cài đặt giảm chuyển động của Windows

## Ảnh màn hình

| | |
|:---:|:---:|
| ![Dark mode](docs/screenshots/catalog-dark.png) | ![Tìm kiếm không dấu](docs/screenshots/search-khong-dau.png) |
| *Giao diện tối* | *Tìm "trinh duyet" không cần dấu* |
| ![Chi tiết ứng dụng](docs/screenshots/app-detail.png) | ![Tiến trình cài đặt](docs/screenshots/install-progress.png) |
| *Xem lệnh winget trước khi chạy* | *Theo dõi cài đặt + terminal trực tiếp* |

<div align="center">
<img src="docs/screenshots/compact-layout.png" alt="Bố cục thu gọn" width="560">

*Bố cục tự thích ứng khi thu nhỏ cửa sổ*
</div>

## Cài đặt

Tải **`SetupKit.exe`** từ [Releases](../../releases/latest) và mở — không cần cài đặt.

> Windows 11 có sẵn WebView2. Trên Windows 10 thiếu WebView2, SetupKit sẽ tự đề nghị tải Evergreen Runtime chính thức của Microsoft.

## Cơ chế an toàn

SetupKit được thiết kế để **không thể** trở thành công cụ tải phần mềm lạ:

- Package ID bị giới hạn bằng **allowlist nhúng trong binary** (`catalog.go`) — không nhận ID tùy ý, không URL ngoài, không script tải về
- Chỉ hai nguồn được hỗ trợ: `winget` và `msstore`
- Mặc định luôn ở **chế độ chạy thử**; cài thật yêu cầu bật công tắc riêng **và** xác nhận từng lệnh qua hộp thoại hệ thống
- Mọi lệnh hiển thị đầy đủ trước khi chạy; thư mục tùy chỉnh chỉ lấy từ hộp thoại chọn thư mục của Windows
- Sau khi cài, SetupKit quét lại để xác nhận trạng thái thật trên máy

## Build từ mã nguồn

Yêu cầu: [Go 1.25+](https://go.dev/dl/), [Node.js LTS](https://nodejs.org) (chỉ dùng cho script build catalog, app không cần Node khi chạy).

```powershell
npm run package:win
```

Script sẽ validate catalog, cắt bộ icon Phosphor còn đúng phần đang dùng, tạo icon/manifest Windows, chạy `go test` rồi xuất hai artifact vào `release/`: `SetupKit.exe` và `SetupKit-win-x64.zip`.

Các lệnh hữu ích khác:

```powershell
npm run validate        # kiểm tra catalog + JS + icon + DOM mà không build
npm run catalog:build   # sinh lại catalog.json từ scripts/build-catalog.js
```

## Kiến trúc

```
setupkit-app/
├── main.go              # Wails bootstrap, theme nền cửa sổ theo dark mode
├── app.go               # API native: chạy winget, chọn thư mục, mở app
├── inventory.go         # Quét winget + Registry + Start Menu + shortcut
├── catalog.go           # Allowlist nhúng, fail-fast nếu catalog sai
├── index.html           # UI (embed vào exe cùng renderer.js, styles.css)
├── renderer.js          # Toàn bộ logic UI - vanilla JS, không framework
├── theme-init.js        # Áp theme trước khi CSS render (chống chớp trắng)
├── catalog.json         # 440 app - SINH TỰ ĐỘNG, sửa build-catalog.js thay vì file này
├── assets/              # 309 logo SVG + bộ icon Phosphor đã cắt gọn
└── scripts/             # build-native.ps1, build-catalog.js, publish-github.ps1...
```

Frontend gọi Go qua binding của Wails (`window.go.main.App`), bọc trong `native-bridge.js` để UI không phụ thuộc framework desktop. Sự kiện tiến trình cài đẩy về UI qua `EventsEmit`.

## Giấy phép

[MIT](LICENSE) — logo các ứng dụng thuộc về chủ sở hữu tương ứng (nguồn [Simple Icons](https://simpleicons.org)), icon giao diện từ [Phosphor Icons](https://phosphoricons.com).
