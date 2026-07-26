# SetupKit Developer Workstation Build Plan

Ngày xác minh: 2026-07-26  
Nguồn kiểm tra: Windows Package Manager `winget`  
Kết quả: 438 package winget hợp lệ, 2 package Microsoft Store, tổng cộng 440 ứng dụng.

## 1. Mục tiêu

SetupKit sẽ chuyển từ catalog ứng dụng phổ thông sang trình dựng workstation cho:

- Lập trình viên web frontend và backend.
- Lập trình viên .NET, Java, Python, Go, Rust và mobile.
- Data, AI, database, DevOps, cloud và hạ tầng.
- Product, design, office, họp và làm việc từ xa.
- Tiện ích, bảo mật, mạng, media, game và game development.

Mỗi ứng dụng phải có package ID, nguồn, command preview, mô tả, tag, lưu ý,
trạng thái đã cài, phiên bản, vị trí cài và hành động mở ứng dụng/thư mục khi
Windows cung cấp dữ liệu.

## 2. Taxonomy

| Nhóm chính | Số package winget | Tag tiêu biểu |
|---|---:|---|
| IDE & Code | 37 | `ide`, `code`, `editor`, `ai-editor`, `mobile` |
| Ngôn ngữ & Runtime | 41 | `runtime`, `language`, `javascript`, `python`, `dotnet`, `java`, `go`, `rust` |
| Build & Package | 16 | `build`, `package-manager`, `node`, `python`, `cpp` |
| Terminal & Git | 24 | `terminal`, `shell`, `git`, `version-control`, `diff` |
| CLI | 26 | `cli`, `search`, `json`, `download`, `automation` |
| DevOps & Cloud | 41 | `devops`, `cloud`, `container`, `kubernetes`, `iac`, `virtualization` |
| Database & API | 28 | `database`, `sql`, `nosql`, `api`, `testing` |
| AI lập trình | 19 | `ai`, `local-ai`, `llm`, `assistant` |
| Mạng & Bảo mật | 31 | `network`, `vpn`, `ssh`, `remote`, `password`, `security` |
| Office & Công việc | 35 | `office`, `docs`, `notes`, `meeting`, `sync`, `productivity` |
| Liên lạc & Xã hội | 16 | `chat`, `meeting`, `social`, `work` |
| Trình duyệt | 19 | `browser`, `web`, `privacy`, `testing` |
| Tiện ích | 51 | `utility`, `windows`, `archive`, `search`, `screenshot`, `disk` |
| Thiết kế & Media | 35 | `design`, `ui`, `3d`, `image`, `audio`, `video`, `streaming` |
| Game & Game Dev | 21 | `game`, `game-dev`, `engine`, `launcher` |

Danh sách nền và danh sách mở rộng nằm trong `docs/package-candidates.json` và
`docs/package-expansion-candidates.json`. Tổng cộng 438 ID được đưa vào catalog
đã vượt qua:

```powershell
winget show --id <PACKAGE_ID> --exact --source winget --accept-source-agreements --disable-interactivity
```

## 3. Workstation plans

### Developer Core

Git, GitHub CLI, VS Code, Windows Terminal, PowerShell, Chrome, 7-Zip,
PowerToys, Everything, Bitwarden và ShareX.

### Web Frontend

Node.js LTS, pnpm, Git, GitHub CLI, VS Code, Chrome, Firefox, Postman,
Docker Desktop, DBeaver và Figma.

### Node.js Backend

Node.js LTS, pnpm, Git, VS Code, Docker Desktop, Postman, Bruno,
DBeaver, PostgreSQL 17, Redis Insight và MongoDB Compass.

### Python, Data & AI

Python 3.14, uv, Miniconda, VS Code, Git, Docker Desktop, DBeaver,
Postman, Power BI Desktop, Ollama và LM Studio.

### .NET Developer

Visual Studio 2022 Community, .NET SDK 10, Git, PowerShell,
SQL Server 2022 Developer, SQL Server Management Studio, Docker Desktop
và Postman.

### Java Developer

IntelliJ IDEA Community, Temurin JDK 21, Git, Windows Terminal,
Docker Desktop, Postman, DBeaver và Redis Insight.

### Mobile Developer

Android Studio, Temurin JDK 21, Dart SDK, VS Code, Git, Postman,
Docker Desktop, Figma và draw.io.

Flutter SDK không có package cài đặt trong source WinGet ở thời điểm kiểm tra,
vì vậy không thể đưa vào lệnh tự động.

### Go & Rust Systems

Go, Rustup, VS Code, Git, CMake, LLVM, Ninja, PowerShell, Docker Desktop,
ripgrep, fd, bat, fzf, jq và Just.

### DevOps & Cloud

WSL, Docker Desktop, Windows Terminal, PowerShell, Git, GitHub CLI,
Azure CLI, AWS CLI, Google Cloud CLI, kubectl, Helm, Terraform,
OpenTofu, Pulumi, k9s, cloudflared, Vault và WinSCP.

### Database & API

Postman, Insomnia, Bruno, DBeaver, DataGrip, MongoDB Compass, pgAdmin,
MySQL Workbench, Redis Insight, SQL Server Management Studio,
DB Browser for SQLite, TablePlus và Beekeeper Studio.

### Office & Remote Work

Microsoft 365 Apps, Teams, Slack, Zoom, Notion, Obsidian, Todoist,
Google Drive, OneDrive, Adobe Acrobat Reader, draw.io, Miro,
Bitwarden và Tailscale.

### Product & Design

Figma, Blender, GIMP, Inkscape, Krita, OBS Studio, Audacity, HandBrake,
VLC, Notion, Miro và ShareX.

### Game Development

Unity Hub, Godot, Blender, Visual Studio Code, Git, CMake, Discord,
Steam và Epic Games Launcher.

### Các plan mở rộng

- C/C++ Desktop
- PHP Web
- QA & Automation
- Security & Network
- Sysadmin & IT Support
- Creator & Streaming
- Open-source Desktop
- Gaming PC
- Terminal Power User
- Data Analyst
- AI Coding & Local LLM

## 4. Nguồn và command

Nguồn chính thức:

- Tài liệu WinGet: <https://learn.microsoft.com/windows/package-manager/winget/>
- Danh sách source mặc định: <https://learn.microsoft.com/windows/package-manager/winget/source>
- Manifest cộng đồng: <https://github.com/microsoft/winget-pkgs>

Microsoft xác định `winget` là WinGet Community Repository và `msstore` là
Microsoft Store catalog. SetupKit chỉ dùng đúng hai source mặc định này.

Command nguồn winget:

```powershell
winget install --id <PACKAGE_ID> --exact --source winget --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
```

Nguồn Microsoft Store:

```powershell
winget install --id <STORE_PRODUCT_ID> --exact --source msstore --accept-package-agreements --accept-source-agreements --disable-interactivity
```

Nếu người dùng chọn thư mục và package hỗ trợ:

```powershell
winget install --id <PACKAGE_ID> --exact --source winget --silent --location "<INSTALL_DIRECTORY>" --accept-package-agreements --accept-source-agreements --disable-interactivity
```

SetupKit chỉ dựng command từ package ID nằm trong allowlist. URL và script cài
đặt tùy ý tiếp tục bị chặn.

## 5. Kiến trúc dữ liệu

Một file `catalog.json` sẽ là nguồn dữ liệu duy nhất cho:

- Catalog hiển thị trong renderer.
- Allowlist của Go backend.
- Match name dùng khi quét Registry, Start Menu và shortcut.
- Workstation plans.
- Category, tag, publisher, mô tả và lưu ý.
- Tài liệu package/source/command được sinh tự động.

Việc này loại bỏ tình trạng catalog JavaScript và allowlist Go không đồng bộ.

## 6. Thay đổi giao diện

- Thay 5 preset chung bằng workstation plan theo vai trò.
- Thêm thanh tag bấm được, cho phép kết hợp category, tag, source và status.
- Hiển thị tag quan trọng ngay trên card nhưng giới hạn số lượng để tránh rối.
- Thêm phần publisher, loại công cụ, nguồn, package ID, command và dependency
  trong màn chi tiết.
- Thêm bộ đếm kết quả, bộ lọc đang dùng và nút xóa từng tag.
- Thêm fallback icon theo category nếu logo chưa có, không hiển thị ảnh lỗi.
- Giữ layout hai cột, dark mode, keyboard focus và progress/terminal hiện tại.

## 7. Thứ tự cài

Plan sẽ được sắp xếp theo lớp:

1. Hệ thống, terminal và công cụ nền.
2. Git và CLI.
3. Ngôn ngữ/runtime.
4. Build/package manager.
5. IDE/editor.
6. Container, cloud và database.
7. Công cụ công việc, design và ứng dụng tùy chọn.

Ứng dụng đã cài bị bỏ qua. SetupKit vẫn yêu cầu xác nhận trước từng command.

## 8. Package chưa có trong WinGet

Các công cụ sau không có package cài đặt trong WinGet ở lần kiểm tra này:
Flutter SDK, Kotlin Compiler độc lập, Poetry,
Maven, Gradle, Composer, RustDesk, FileZilla, Dev Home và AnythingLLM Desktop.

SetupKit không giả một package ID hoặc âm thầm thay bằng URL khác. Người dùng
vẫn có thể cài thủ công từ website hợp pháp của sản phẩm.

## 9. Tiêu chí hoàn thành

- Catalog và backend đọc cùng một nguồn dữ liệu.
- 440 ứng dụng có package/source/command rõ ràng.
- Không có package winget chưa xác minh trong allowlist.
- Search hỗ trợ tên, package ID, category, tag và publisher.
- Tag, category, source và status kết hợp được.
- 24 workstation plan áp dụng đúng và không thêm lại ứng dụng đã cài.
- Logo có fallback, không có ảnh vỡ.
- Progress không lùi, terminal stream đúng, vị trí cài được hiển thị.
- Giao diện không overflow ở 860x680 và hoạt động ở light/dark mode.
- EXE native vẫn ở mức vài chục MB trở xuống.
