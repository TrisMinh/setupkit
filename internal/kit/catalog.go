package kit

import (
	"encoding/json"
	"fmt"
	"sort"
)

type packageRecord struct {
	Source     string
	Name       string
	MatchNames []string
}

type catalogAppRecord struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	PackageID  string   `json:"pkg"`
	Source     string   `json:"source"`
	MatchNames []string `json:"matchNames"`
	Verified   bool     `json:"verified"`
}

type catalogDocument struct {
	SchemaVersion int                `json:"schemaVersion"`
	Apps          []catalogAppRecord `json:"apps"`
}

var allowlist map[string]packageRecord

// InitCatalog nạp allowlist từ nội dung catalog.json (main đọc từ frontend
// nhúng trong exe rồi truyền vào - catalog chỉ tồn tại một bản duy nhất).
// Panic nếu catalog sai vì app không được phép chạy với allowlist hỏng.
func InitCatalog(embeddedCatalog []byte) {
	allowlist = loadAllowlist(embeddedCatalog)
}

func loadAllowlist(embeddedCatalog []byte) map[string]packageRecord {
	var catalog catalogDocument
	if err := json.Unmarshal(embeddedCatalog, &catalog); err != nil {
		panic(fmt.Errorf("không thể đọc catalog.json: %w", err))
	}
	if catalog.SchemaVersion != 3 {
		panic(fmt.Errorf("catalog schema không được hỗ trợ: %d", catalog.SchemaVersion))
	}

	result := make(map[string]packageRecord, len(catalog.Apps))
	seenIDs := make(map[string]struct{}, len(catalog.Apps))
	for _, app := range catalog.Apps {
		if app.ID == "" || app.Name == "" || app.PackageID == "" {
			panic("catalog có ứng dụng thiếu id, name hoặc package ID")
		}
		if !app.Verified {
			panic(fmt.Errorf("package chưa được xác minh trong catalog: %s", app.PackageID))
		}
		if app.Source != "winget" && app.Source != "msstore" {
			panic(fmt.Errorf("nguồn package không được hỗ trợ: %s", app.Source))
		}
		if _, exists := result[app.PackageID]; exists {
			panic(fmt.Errorf("package ID bị trùng trong catalog: %s", app.PackageID))
		}
		if _, exists := seenIDs[app.ID]; exists {
			panic(fmt.Errorf("app ID bị trùng trong catalog: %s", app.ID))
		}
		seenIDs[app.ID] = struct{}{}

		matchNames := app.MatchNames
		if len(matchNames) == 0 {
			matchNames = []string{app.Name}
		}
		result[app.PackageID] = packageRecord{
			Source:     app.Source,
			Name:       app.Name,
			MatchNames: matchNames,
		}
	}
	if len(result) == 0 {
		panic("catalog không có ứng dụng")
	}
	return result
}

func allowedPackage(packageID string) (packageRecord, error) {
	record, ok := allowlist[packageID]
	if !ok {
		return packageRecord{}, fmt.Errorf("Package ID chưa được SetupKit cho phép: %s", packageID)
	}
	return record, nil
}

func allowlistIDs() []string {
	ids := make([]string, 0, len(allowlist))
	for packageID := range allowlist {
		ids = append(ids, packageID)
	}
	sort.Strings(ids)
	return ids
}
