# Changelog

Notable SetupKit changes are documented here.

## [0.9.1] - 2026-07-30

### Changed

- Reworked the README, changelog, release notes, catalog documentation, and workstation documentation in English.
- Refreshed product screenshots so the documentation presents the current English UI and updated visual states.
- Updated catalog category, tag, description, risk, and source text to English across generated docs and the bundled catalog.
- Updated install and publish scripts with English prompts and status messages.
- Versioned the desktop app, landing page download links, and packaged release notes as `v0.9.1`.

### Removed

- Removed stale activation and Vietnamese-search screenshots from the documentation set.

## [0.9.0] - 2026-07-30

### Added

- **Dedicated Updates tab** with search, status, `winget upgrade` command preview, and per-app update actions.
- **Update all with one confirmation** through a reviewed package list, sequential execution, terminal streaming, and per-app progress.
- **Versions and rollback** for winget packages using `winget show --versions`, with exact-version install support.
- **Two rollback modes**: install a selected version directly or uninstall the current app before installing the selected version.
- **Version filters** for Installed, Not installed, and All apps.
- **Expanded VPN catalog** with ExpressVPN, HMA VPN, Surfshark, Private Internet Access, CyberGhost, IPVanish, TunnelBear, hide.me VPN, VPN Unlimited, AdGuard VPN, and Windscribe.

### Improved

- New sessions start with an empty queue instead of restoring an old selection automatically.
- Install, update, uninstall, and rollback confirmations now use a styled in-app modal with command preview.
- VPN uninstall commands no longer force `--silent` or `--disable-interactivity`, allowing vendor uninstallers to request service or driver cleanup.
- Catalog sorting adds smart order, install order, name, category, status, source, large apps, and not-installed apps.
- Search aliases cover common terms such as `vscode`, `ai`, `docker`, `vpn`, `db`, `browser`, and `office`.
- Filter UI uses clearer icons, with colored dots reserved for status only.
- Hover, dropdown, dialog, and card motion was smoothed while respecting reduced-motion settings.
- Versions UI gained search, segmented filters, and better narrow-panel behavior.

### Tested

- Added unit tests for `winget show --versions`, exact-version install commands, and VPN uninstall command flags.
- `npm run validate`, `npm test`, and the Windows package build run catalog, icon subset, DOM reference, and Go tests.

## [0.8.0] - 2026-07-30

### Added

- Separate Workspaces tab for browsing all 24 role-based toolsets.
- Workspace detail dialog with app counts, installed state, source summary, compact app list, and command preview.
- Two-row logo preview on workspace hover or focus.

### Improved

- Workspace cards became denser and the detail button appears only on active hover/focus states.
- Workspace detail app lists use two to three columns on desktop.
- Icon view aligns select/detail buttons even when names wrap.
- List view now uses available row space for descriptions, type/source, and status.
- Ecosystem seed validation was added to `npm run validate`.

## [0.7.0] - 2026-07-26

### Added

- Installed-app update detection through `winget upgrade`, with update badges and app-detail update actions.
- Uninstall action in app details, with confirmation and status refresh.
- JSON profile import to reapply exported app sets while ignoring unknown package IDs.
- Bulk select and clear actions for filtered apps.
- Failed-app retry and safe stop-after-current controls for install queues.
- App Installer recovery flow when winget is missing.
- GitHub Actions release workflow for tags matching `v*`.

### Removed

- Removed the Windows activation page and backend logic so SetupKit stays focused on app install, update, and uninstall workflows.

### Improved

- Install, update, and uninstall share one execution pipeline with terminal streaming, progress inference, and post-run status refresh.

### Notes

- `SetupKit.exe` is not code-signed yet, so SmartScreen may warn on first launch.

## [0.6.0] - 2026-07-26

### Added

- Three catalog view modes: grid, list, and icon.
- App detail dialogs now show app logos beside names.

### Fixed

- Replaced confusing package icons with stack icons in selected-app and status areas.
- Removed translucent selected-app backgrounds that caused visual artifacts in WebView2.

## [0.5.0] - 2026-07-26

### Fixed

- Native scanning worked again after the Wails bridge moved from `window.go.main.App` to package-specific namespaces.

### Added

- Persistent IDE-style status bar with winget state, installed count, selected count, and terminal shortcut.
- Office & Remote Work was promoted near the top of workspace presets.

### Improved

- App grid density increased to three or four columns on wide screens.

## [0.4.1] - 2026-07-26

### Changed

- Reorganized the project into a cleaner Wails + Go layout.
- Embedded a single catalog copy in the executable.
- Moved changelog and install scripts into `docs/` and `scripts/`.
- Replaced native select dropdowns with custom theme-aware, keyboard-friendly controls.
- Added `install.ps1` for one-command GitHub release installation.
- Rewrote README around the product experience.

### Fixed

- Search no longer shows duplicate clear buttons in WebView2.

## [0.4.0] - 2026-07-26

### Added

- Safety-focused first release with a verified app catalog, role-based presets, dry-run mode, command preview, and live terminal output.

### Fixed

- Improved dialog layout, selection behavior, search stability, spinner behavior, and card rendering performance.
