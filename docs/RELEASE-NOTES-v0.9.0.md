## SetupKit v0.9.0

A single `SetupKit.exe` file you can run directly, plus a one-command install option:

```powershell
irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
```

### What's New

- **Updates tab** - SetupKit groups installed apps with available upgrades into a dedicated screen with search and per-app update actions.
- **Update all** - confirm once, then SetupKit upgrades only reviewed packages through `winget upgrade`, with live terminal output and per-app progress.
- **Versions tab** - fetch older winget package versions with `winget show --versions`.
- **Rollback flow** - choose a version, then use **Install this version** or **Uninstall then install this version**. Microsoft Store apps are marked unsupported because winget does not expose older Store versions.
- **Quick filters in Versions** - switch between Installed, Not installed, and All so long winget lists are easier to navigate.
- **Catalog sorting** - sort by smart order, install order, name, category, status, source, large apps, or not-installed apps.
- **Larger VPN catalog** - adds ExpressVPN, HMA VPN, Surfshark, Private Internet Access, CyberGhost, IPVanish, TunnelBear, hide.me VPN, VPN Unlimited, AdGuard VPN, and Windscribe.
- **No auto-select on launch** - every session starts with an empty queue until the user explicitly selects apps or a workspace.
- **Polished in-app confirmations** - install, update, uninstall, and rollback use a styled modal with command preview instead of rough system dialogs.
- **More reliable VPN uninstall** - `winget uninstall` no longer forces silent/non-interactive flags, so VPN uninstallers can show confirmation, service, or driver prompts when needed.
- **Clearer UI filters** - dropdown icons, status-only color dots, smoother search, and more refined motion.

### Safety

- Every install, update, uninstall, and rollback action is restricted to package IDs in the embedded reviewed catalog.
- Rollback always asks for confirmation before install or uninstall flows, and warns when configuration may be removed.
- SetupKit never downloads installers from external URLs; older versions go through winget manifests and verification.

### Install

| Method | Action |
|---|---|
| One command | Paste the PowerShell command above |
| Manual | Download `SetupKit.exe` below and run it |

Windows 11 works out of the box. On Windows 10, SetupKit prompts for WebView2 if it is missing.

> `SetupKit.exe` is not code-signed yet, so Windows SmartScreen may warn on first launch. Choose "More info" and then "Run anyway" if you trust the release.
