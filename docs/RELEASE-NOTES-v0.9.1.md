## SetupKit v0.9.1

This release focuses on product polish, English documentation, and release readiness while keeping the app in the pre-1.0 track.

### Highlights

- **English product documentation** - README, changelog, release notes, catalog documentation, and workstation planning docs now use English.
- **Fresh screenshots** - the documentation captures the current catalog, detail, compact, install-progress, and theme states.
- **English catalog language** - generated category names, tags, descriptions, risk notes, and source summaries are aligned with the English UI direction.
- **Release script polish** - install and GitHub publish helper scripts now use English prompts and status output.
- **Version alignment** - the desktop footer, package metadata, landing links, release archive, and installer build now point to `v0.9.1`.

### Included Artifacts

- `SetupKit.exe`
- `SetupKit-win-x64.zip`
- `SetupKit-Setup-0.9.1-win-x64.exe`

### Verification

- `npm run validate`
- `go test ./...`
- `scripts/build-installer.ps1`

### Notes

- SetupKit is still a pre-1.0 product. This release intentionally lands as `0.9.1`, not `1.0`.
- The Windows binary is not code-signed yet, so SmartScreen may warn the first time it is launched.
