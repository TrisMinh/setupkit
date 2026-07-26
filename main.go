// SetupKit - dựng máy Windows mới với catalog ứng dụng đã xác minh.
//
// File này chỉ làm nhiệm vụ bootstrap: nhúng frontend, nạp catalog và
// khởi động cửa sổ Wails. Toàn bộ logic nằm trong internal/kit.
package main

import (
	"embed"
	"io/fs"
	"log"

	"setupkit/internal/kit"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

// Giao diện web được nhúng thẳng vào exe. WebView2 dùng chung với Windows
// thay vì đóng gói cả Chromium như Electron.
//
//go:embed all:frontend
var embeddedFrontend embed.FS

func main() {
	// Catalog chỉ có một bản duy nhất nằm trong frontend nhúng.
	catalogRaw, err := embeddedFrontend.ReadFile("frontend/catalog.json")
	if err != nil {
		log.Fatal(err)
	}
	kit.InitCatalog(catalogRaw)

	assets, err := fs.Sub(embeddedFrontend, "frontend")
	if err != nil {
		log.Fatal(err)
	}

	app := kit.NewApp()

	// Trùng với --bg trong styles.css cho từng theme để không chớp màu khi mở.
	background := &options.RGBA{R: 243, G: 245, B: 247, A: 1}
	if kit.SystemPrefersDark() {
		background = &options.RGBA{R: 16, G: 21, B: 18, A: 1}
	}

	err = wails.Run(&options.App{
		Title:            "SetupKit",
		Width:            1360,
		Height:           900,
		MinWidth:         860,
		MinHeight:        680,
		BackgroundColour: background,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.Startup,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			Theme:                windows.SystemDefault,
			IsZoomControlEnabled: false,
			DisablePinchZoom:     false,
			Messages: &windows.Messages{
				InstallationRequired: "SetupKit cần Microsoft WebView2. Chọn OK để tải và cài tự động; vui lòng chờ trong lúc bộ cài chạy nền.",
				UpdateRequired:       "Microsoft WebView2 cần được cập nhật. Chọn OK để SetupKit tải và cài bản mới.",
				MissingRequirements:  "Thiếu thành phần hệ thống",
				Webview2NotInstalled: "Chưa cài Microsoft WebView2 Runtime",
				Error:                "Lỗi",
				FailedToInstall:      "Không thể cài WebView2 Runtime. Vui lòng thử lại.",
				DownloadPage:         "SetupKit cần WebView2 Runtime. Chọn OK để mở trang tải. Phiên bản tối thiểu: ",
				PressOKToInstall:     "Chọn OK để cài đặt.",
				ContactAdmin:         "SetupKit cần WebView2 Runtime. Hãy liên hệ quản trị viên hệ thống.",
				InvalidFixedWebview2: "Đường dẫn WebView2 được chỉ định không hợp lệ.",
				WebView2ProcessCrash: "WebView2 đã dừng đột ngột. Vui lòng mở lại SetupKit.",
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}
}
