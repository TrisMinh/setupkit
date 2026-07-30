## SetupKit v0.7.0

This release added installed-app management and automated release infrastructure.

### Highlights

- Detect available updates through `winget upgrade`.
- Update or uninstall apps from the detail dialog.
- Import JSON profiles exported from SetupKit.
- Bulk select filtered apps, clear the queue, retry failed apps, and stop safely after the current install.
- Offer App Installer recovery when winget is missing.
- Add GitHub Actions release builds for `v*` tags.
- Remove the Windows activation page so SetupKit stays focused on app workflows.

### Note

`SetupKit.exe` is not code-signed yet, so SmartScreen may warn on first launch.
