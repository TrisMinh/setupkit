package kit

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"testing"
)

func catalogBytes(t testing.TB) []byte {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("..", "..", "frontend", "catalog.json"))
	if err != nil {
		t.Fatalf("không đọc được frontend/catalog.json: %v", err)
	}
	return raw
}

func TestMain(m *testing.M) {
	raw, err := os.ReadFile(filepath.Join("..", "..", "frontend", "catalog.json"))
	if err != nil {
		panic(err)
	}
	InitCatalog(raw)
	os.Exit(m.Run())
}

func TestCatalogAndAllowlistStayInSync(t *testing.T) {
	var catalog catalogDocument
	if err := json.Unmarshal(catalogBytes(t), &catalog); err != nil {
		t.Fatal(err)
	}
	if catalog.SchemaVersion != 3 {
		t.Fatalf("unexpected catalog schema: %d", catalog.SchemaVersion)
	}
	if len(catalog.Apps) < 400 {
		t.Fatalf("expected at least 400 catalog apps, got %d", len(catalog.Apps))
	}
	if len(allowlist) != len(catalog.Apps) {
		t.Fatalf("allowlist has %d packages, catalog has %d", len(allowlist), len(catalog.Apps))
	}
	for _, app := range catalog.Apps {
		record, err := allowedPackage(app.PackageID)
		if err != nil {
			t.Fatalf("%s is missing from allowlist: %v", app.PackageID, err)
		}
		if record.Source != app.Source || record.Name != app.Name {
			t.Fatalf("allowlist metadata differs for %s: %#v", app.PackageID, record)
		}
	}
}

func TestBuildWingetArgsUsesApprovedLocation(t *testing.T) {
	spec, err := buildWingetArgs("Figma.Figma", false, `D:\Apps\Figma`)
	if err != nil {
		t.Fatal(err)
	}
	if spec.Command != "winget" || spec.DryRun {
		t.Fatalf("unexpected command spec: %#v", spec)
	}

	locationIndex := slices.Index(spec.Args, "--location")
	if locationIndex < 0 || locationIndex+1 >= len(spec.Args) {
		t.Fatalf("--location is missing: %#v", spec.Args)
	}
	if spec.Args[locationIndex+1] != `D:\Apps\Figma` {
		t.Fatalf("wrong install location: %q", spec.Args[locationIndex+1])
	}
}

func TestBuildWingetArgsDoesNotOverrideStoreLocation(t *testing.T) {
	spec, err := buildWingetArgs("9NKSQGP7F2NH", false, `D:\Apps\WhatsApp`)
	if err != nil {
		t.Fatal(err)
	}
	if slices.Contains(spec.Args, "--location") {
		t.Fatalf("Microsoft Store command must not contain --location: %#v", spec.Args)
	}
}

func TestBuildWingetArgsRejectsUnknownPackage(t *testing.T) {
	if _, err := buildWingetArgs("Unknown.Untrusted", false, ""); err == nil {
		t.Fatal("expected an allowlist error")
	}
}

func TestBuildVersionInstallArgsPinsVersion(t *testing.T) {
	spec, err := buildVersionInstallArgs("Microsoft.VisualStudioCode", "1.90.2")
	if err != nil {
		t.Fatal(err)
	}
	if spec.Command != "winget" || spec.DryRun {
		t.Fatalf("unexpected command spec: %#v", spec)
	}
	if !slices.Contains(spec.Args, "install") ||
		!slices.Contains(spec.Args, "--version") ||
		!slices.Contains(spec.Args, "1.90.2") {
		t.Fatalf("version install args are missing required tokens: %#v", spec.Args)
	}
}

func TestBuildVersionInstallArgsRejectsStorePackages(t *testing.T) {
	if _, err := buildVersionInstallArgs("9NKSQGP7F2NH", "1.0.0"); err == nil {
		t.Fatal("expected Store package to reject pinned winget versions")
	}
}

func TestParseWingetVersions(t *testing.T) {
	output := `
Found Visual Studio Code [Microsoft.VisualStudioCode]
Version
-------
1.104.2
1.104.1
1.103.2
`
	got := parseWingetVersions(output)
	want := []string{"1.104.2", "1.104.1", "1.103.2"}
	if !slices.Equal(got, want) {
		t.Fatalf("unexpected versions: got %#v want %#v", got, want)
	}
}

func TestInferWingetProgress(t *testing.T) {
	download := inferWingetProgress("Downloading 50 MB / 100 MB", 8)
	if download.Percent < 44 || download.Percent > 46 {
		t.Fatalf("unexpected download progress: %#v", download)
	}
	if !strings.Contains(download.Phase, "50%") {
		t.Fatalf("download phase does not include ratio: %q", download.Phase)
	}

	install := inferWingetProgress("Starting package install...", download.Percent)
	if install.Percent < 82 || install.Phase != "Đang cài đặt" {
		t.Fatalf("unexpected install progress: %#v", install)
	}

	success := inferWingetProgress("Successfully installed", install.Percent)
	if success.Percent != 100 || success.Phase != "Cài đặt thành công" {
		t.Fatalf("unexpected completion progress: %#v", success)
	}
}

func TestInferWingetProgressNeverRegresses(t *testing.T) {
	progress := inferWingetProgress("Preparing package", 72)
	if progress.Percent != 72 {
		t.Fatalf("progress regressed to %d", progress.Percent)
	}
}

func TestWingetPackageDetectionUsesExactTokens(t *testing.T) {
	output := "Visual Studio Code Insiders  Microsoft.VisualStudioCode.Insiders  1.2.3  winget"
	if wingetPackageListed(output, "Microsoft.VisualStudioCode") {
		t.Fatal("base package must not match the Insiders package ID")
	}
	if !wingetPackageListed(output, "Microsoft.VisualStudioCode.Insiders") {
		t.Fatal("exact package ID was not detected")
	}
}

func TestInventoryNameMatchingDoesNotConfuseVariants(t *testing.T) {
	if namesMatch("Visual Studio Code Insiders", []string{"Visual Studio Code"}) {
		t.Fatal("Visual Studio Code must not match Visual Studio Code Insiders")
	}
	if namesMatch("Visual Studio Code", []string{"Visual Studio Code Insiders"}) {
		t.Fatal("Visual Studio Code Insiders must not match Visual Studio Code")
	}
	if !namesMatch("Python 3.13.5 (64-bit)", []string{"Python 3.13"}) {
		t.Fatal("safe version and architecture suffix should match")
	}
}

func BenchmarkScanInstalledApps(b *testing.B) {
	if runtime.GOOS != "windows" {
		b.Skip("Windows inventory scan benchmark")
	}
	for index := 0; index < b.N; index++ {
		result, details := scanInstalledApps()
		if len(result.Apps) != len(allowlist) {
			b.Fatalf("expected %d apps, got %d", len(allowlist), len(result.Apps))
		}
		if len(details) != len(allowlist) {
			b.Fatalf("expected %d detail records, got %d", len(allowlist), len(details))
		}
		installed := 0
		for _, detail := range details {
			if detail.Installed {
				installed++
			}
		}
		b.ReportMetric(float64(result.Diagnostics.InventoryRecords), "inventory_records")
		b.ReportMetric(float64(installed), "installed_apps")
	}
}

func BenchmarkRefreshUpdateAvailability(b *testing.B) {
	if runtime.GOOS != "windows" {
		b.Skip("Windows winget upgrade benchmark")
	}
	_, details := scanInstalledApps()
	b.ResetTimer()
	for index := 0; index < b.N; index++ {
		result, refreshed := refreshUpdateAvailability(details)
		if len(result.Apps) != len(allowlist) {
			b.Fatalf("expected %d apps, got %d", len(allowlist), len(result.Apps))
		}
		if len(refreshed) != len(allowlist) {
			b.Fatalf("expected %d detail records, got %d", len(allowlist), len(refreshed))
		}
		updates := 0
		for _, detail := range refreshed {
			if detail.UpdateAvailable {
				updates++
			}
		}
		b.ReportMetric(float64(updates), "updates_available")
	}
}
