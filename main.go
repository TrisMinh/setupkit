package main

import (
	"embed"
	"io/fs"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"golang.org/x/sys/windows/registry"
)

// The web UI is embedded directly in the native executable. WebView2 is shared
// with Windows instead of bundling Chromium as Electron does.
//
//go:embed all:frontend
var embeddedFrontend embed.FS

// frontendAssets trả về cây file web với frontend/ làm thư mục gốc.
func frontendAssets() fs.FS {
	assets, err := fs.Sub(embeddedFrontend, "frontend")
	if err != nil {
		log.Fatal(err)
	}
	return assets
}

// systemPrefersDark đọc theme hệ thống để cửa sổ không chớp màu sáng
// trong lúc WebView2 khởi động khi người dùng đang ở dark mode.
func systemPrefersDark() bool {
	key, err := registry.OpenKey(
		registry.CURRENT_USER,
		`Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`,
		registry.QUERY_VALUE,
	)
	if err != nil {
		return false
	}
	defer key.Close()
	value, _, err := key.GetIntegerValue("AppsUseLightTheme")
	if err != nil {
		return false
	}
	return value == 0
}

func main() {
	app := NewApp()

	// Trùng với --bg trong styles.css cho từng theme.
	background := &options.RGBA{R: 243, G: 245, B: 247, A: 1}
	if systemPrefersDark() {
		background = &options.RGBA{R: 16, G: 21, B: 18, A: 1}
	}

	err := wails.Run(&options.App{
		Title:            "SetupKit",
		Width:            1360,
		Height:           900,
		MinWidth:         860,
		MinHeight:        680,
		BackgroundColour: background,
		AssetServer: &assetserver.Options{
			Assets: frontendAssets(),
		},
		OnStartup: app.startup,
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
