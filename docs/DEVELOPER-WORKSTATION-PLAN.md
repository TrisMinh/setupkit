# SetupKit Developer Workstation Build Plan

Verification date: 2026-07-26
Source checked: Windows Package Manager `winget`
Result: 448 valid winget packages, 2 Microsoft Store packages, 450 apps total.

## 1. Goal

SetupKit turns a broad Windows app catalog into a role-based workstation builder for:

- Frontend and backend web developers.
- .NET, Java, Python, Go, Rust, and mobile developers.
- Data, AI, database, DevOps, cloud, and infrastructure work.
- Product, design, office, meetings, and remote collaboration.
- Utilities, security, networking, media, gaming, and game development.

Each app needs a package ID, source, command preview, description, tags, risk notes, installed state, version, install path, and app/folder open actions when Windows exposes that data.

## 2. Taxonomy

| Group | Winget packages | Example tags |
|---|---:|---|
| IDE & Code | 37 | `ide`, `code`, `editor`, `ai-editor`, `mobile` |
| Languages & Runtime | 41 | `runtime`, `language`, `javascript`, `python`, `dotnet`, `java`, `go`, `rust` |
| Build & Package | 16 | `build`, `package-manager`, `node`, `python`, `cpp` |
| Terminal & Git | 24 | `terminal`, `shell`, `git`, `version-control`, `diff` |
| CLI | 26 | `cli`, `search`, `json`, `download`, `automation` |
| DevOps & Cloud | 41 | `devops`, `cloud`, `container`, `kubernetes`, `iac`, `virtualization` |
| Database & API | 28 | `database`, `sql`, `nosql`, `api`, `testing` |
| AI Coding | 19 | `ai`, `local-ai`, `llm`, `assistant` |
| Network & Security | 41 | `network`, `vpn`, `ssh`, `remote`, `password`, `security` |
| Office & Work | 35 | `office`, `docs`, `notes`, `meeting`, `sync`, `productivity` |
| Communication & Social | 16 | `chat`, `meeting`, `social`, `work` |
| Browsers | 19 | `browser`, `web`, `privacy`, `testing` |
| Utilities | 51 | `utility`, `windows`, `archive`, `search`, `screenshot`, `disk` |
| Design & Media | 35 | `design`, `ui`, `3d`, `image`, `audio`, `video`, `streaming` |
| Game & Game Dev | 21 | `game`, `game-dev`, `engine`, `launcher` |

Base and expansion candidates live in `docs/package-candidates.json` and `docs/package-expansion-candidates.json`. All 450 catalog apps passed:

```powershell
winget show --id <PACKAGE_ID> --exact --source winget --accept-source-agreements --disable-interactivity
```

## 3. Workstation Plans

### Developer Core

Git, GitHub CLI, VS Code, Windows Terminal, PowerShell, Chrome, 7-Zip, PowerToys, Everything, Bitwarden, and ShareX.

### Web Frontend

Node.js LTS, pnpm, Git, GitHub CLI, VS Code, Chrome, Firefox, Postman, Docker Desktop, DBeaver, and Figma.

### Node.js Backend

Node.js LTS, pnpm, Git, VS Code, Docker Desktop, Postman, Bruno, DBeaver, PostgreSQL 17, Redis Insight, and MongoDB Compass.

### Python, Data & AI

Python 3.14, uv, Miniconda, VS Code, Git, Docker Desktop, DBeaver, Postman, Power BI Desktop, Ollama, and LM Studio.

### .NET Developer

Visual Studio 2022 Community, .NET SDK 10, Git, PowerShell, SQL Server 2022 Developer, SQL Server Management Studio, Docker Desktop, and Postman.

### Java Developer

IntelliJ IDEA Community, Temurin JDK 21, Git, Windows Terminal, Docker Desktop, Postman, DBeaver, and Redis Insight.

### Mobile Developer

Android Studio, Temurin JDK 21, Dart SDK, VS Code, Git, Postman, Docker Desktop, Figma, and draw.io.

Flutter SDK did not have a valid winget package source during verification, so it is not included in automatic commands.

### Go & Rust Systems

Go, Rustup, VS Code, Git, CMake, LLVM, Ninja, PowerShell, Docker Desktop, ripgrep, fd, bat, fzf, jq, and Just.

### DevOps & Cloud

WSL, Docker Desktop, Windows Terminal, PowerShell, Git, GitHub CLI, Azure CLI, AWS CLI, Google Cloud CLI, kubectl, Helm, Terraform, OpenTofu, Pulumi, k9s, cloudflared, Vault, and WinSCP.

### Database & API

Postman, Insomnia, Bruno, DBeaver, DataGrip, MongoDB Compass, pgAdmin, MySQL Workbench, Redis Insight, SQL Server Management Studio, DB Browser for SQLite, TablePlus, and Beekeeper Studio.

### Office & Remote Work

Microsoft 365 Apps, Teams, Slack, Zoom, Notion, Obsidian, Todoist, Google Drive, OneDrive, Adobe Acrobat Reader, draw.io, Miro, Bitwarden, and Tailscale.

### Product & Design

Figma, Blender, GIMP, Inkscape, Krita, OBS Studio, Audacity, HandBrake, VLC, Notion, Miro, and ShareX.

### Game Development

Unity Hub, Godot, Blender, VS Code, Git, CMake, Discord, Steam, and Epic Games Launcher.

### C/C++ Desktop

Visual Studio 2022 Community, CLion, VS Code, Code::Blocks, LLVM, CMake, Ninja, and Git.

### PHP Web

PHP 8.4, Laragon, PhpStorm, VS Code, Git, Node.js LTS, MariaDB, DBeaver, and Postman.

### QA & Automation

Postman, Bruno, Insomnia, Chrome, Firefox, Edge, Python 3.14, Node.js LTS, Android Studio, Docker Desktop, and Git.

### Security & Network

Nmap, Wireshark, Burp Suite Community, OWASP ZAP, mitmproxy, WireGuard, Tailscale, VeraCrypt, KeePassXC, and Bitwarden.

### Sysadmin & IT Support

PowerShell, Windows Terminal, WSL, Sysinternals Suite, PuTTY, WinSCP, Nmap, AnyDesk, TeamViewer, Wireshark, Rufus, Ventoy, HWiNFO, and Display Driver Uninstaller.

### Creator & Streaming

OBS Studio, Kdenlive, Shotcut, Audacity, FFmpeg, HandBrake, VLC, GIMP, Krita, Canva, and ScreenToGif.

### Open-source Desktop

VSCodium, LibreWolf, Thunderbird, LibreOffice, Joplin, KeePassXC, GIMP, Inkscape, VLC, PeaZip, CopyQ, LocalSend, and Syncthing.

### Gaming PC

Steam, Epic Games Launcher, GOG Galaxy, EA App, Ubisoft Connect, Heroic Games Launcher, Playnite, Prism Launcher, CurseForge, Discord, and Spotify.

### Terminal Power User

Windows Terminal, PowerShell, Nushell, Alacritty, WezTerm, Oh My Posh, Starship, Git, GitHub CLI, ripgrep, fd, bat, fzf, eza, dust, bottom, jq, yq, zoxide, and lazygit.

### Data Analyst

Python 3.14, Miniconda, R, RStudio, Julia, Power BI, DBeaver, PostgreSQL 17, Microsoft 365 Apps, VS Code, and Git.

### AI Coding & Local LLM

Codex, GitHub Copilot CLI, Claude Code, AI Shell, Ollama, LM Studio, Jan, GPT4All, Chatbox, Msty, Python 3.14, VS Code, and Docker Desktop.

## 4. Execution Order

SetupKit sorts queue execution by:

1. Foundational tooling: Git, terminal, PowerShell, WSL.
2. Runtimes and SDKs: Node, Python, Go, Rust, .NET, Java.
3. Build tools and package managers.
4. Containers, virtualization, and database engines.
5. IDEs and editors.
6. API clients, database GUIs, browsers, and test tools.
7. Office, design, media, and optional apps.

Already installed apps are skipped. SetupKit still asks for confirmation before every real command.

## 5. Safety Rules

- Only package IDs present in `catalog.json` can be executed.
- Commands are generated by the backend, not by user input.
- `--exact` and fixed source flags prevent ambiguous package resolution.
- Dry run mode is the default.
- Real install/update/uninstall/rollback operations require explicit confirmation.
- Store apps use `msstore`; winget apps use `winget`.
- Large, privileged, commercial, or login-required apps are tagged with risk notes.
- External URLs and arbitrary scripts are intentionally unsupported.

## 6. Validation Gates

- 450 apps have explicit package/source/command metadata.
- Every app has a category, tags, type, publisher, description, and risk note.
- Every role-based plan references existing catalog app IDs.
- No duplicate app IDs, package IDs, category IDs, tag IDs, or plan IDs.
- Generated commands use reviewed package IDs and fixed sources.
- Installed apps are not re-added to work queues.
