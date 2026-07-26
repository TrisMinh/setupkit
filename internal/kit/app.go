package kit

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/sys/windows/registry"
)

type App struct {
	ctx               context.Context
	mu                sync.RWMutex
	inventoryCache    map[string]packageDetails
	approvedLocations map[string]string
}

// Windows MessageBox trả về "Yes"/"No" dù Wails được truyền nhãn nút tùy chỉnh.
func confirmedDialogChoice(choice, customConfirmLabel string) bool {
	choice = strings.TrimSpace(choice)
	return strings.EqualFold(choice, "yes") || choice == customConfirmLabel
}

type systemCheck struct {
	Platform        string `json:"platform"`
	WingetAvailable bool   `json:"wingetAvailable"`
	WingetVersion   string `json:"wingetVersion"`
	Reason          string `json:"reason"`
	Runtime         string `json:"runtime"`
}

type commandSpec struct {
	Command string   `json:"command"`
	Args    []string `json:"args"`
	DryRun  bool     `json:"dryRun"`
}

type selectionResult struct {
	OK        bool   `json:"ok"`
	Cancelled bool   `json:"cancelled,omitempty"`
	Location  string `json:"location,omitempty"`
	Error     string `json:"error,omitempty"`
}

type actionResult struct {
	OK     bool   `json:"ok"`
	Method string `json:"method,omitempty"`
	Error  string `json:"error,omitempty"`
}

type installResult struct {
	OK                bool                  `json:"ok"`
	Cancelled         bool                  `json:"cancelled,omitempty"`
	Code              int                   `json:"code"`
	Stdout            string                `json:"stdout,omitempty"`
	Stderr            string                `json:"stderr,omitempty"`
	Error             string                `json:"error,omitempty"`
	RequestedLocation string                `json:"requestedLocation,omitempty"`
	LocationHonored   *bool                 `json:"locationHonored"`
	Details           *publicPackageDetails `json:"details,omitempty"`
}

type installProgressPayload struct {
	PackageID string `json:"packageId"`
	Phase     string `json:"phase"`
	Percent   int    `json:"percent"`
	Message   string `json:"message"`
	Error     bool   `json:"error,omitempty"`
}

type terminalPayload struct {
	PackageID string `json:"packageId"`
	Timestamp string `json:"timestamp"`
	Stream    string `json:"stream"`
	Text      string `json:"text"`
}

func NewApp() *App {
	return &App{
		inventoryCache:    make(map[string]packageDetails),
		approvedLocations: make(map[string]string),
	}
}

// Startup được Wails gọi khi cửa sổ sẵn sàng.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// SystemPrefersDark đọc theme hệ thống để cửa sổ không chớp màu sáng
// trong lúc WebView2 khởi động khi người dùng đang ở dark mode.
func SystemPrefersDark() bool {
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

func (a *App) ListAllowlist() []string {
	return allowlistIDs()
}

func (a *App) CheckSystem() systemCheck {
	result := runProcess("winget", []string{"--version"}, 5*time.Second)
	reason := result.Error
	if reason == "" {
		reason = strings.TrimSpace(result.Stderr)
	}
	return systemCheck{
		Platform:        runtime.GOOS,
		WingetAvailable: result.OK,
		WingetVersion:   strings.TrimSpace(result.Stdout),
		Reason:          reason,
		Runtime:         "WebView2 native",
	}
}

func (a *App) ScanInstalled() inventoryResult {
	result, details := scanInstalledApps()
	a.mu.Lock()
	a.inventoryCache = details
	a.mu.Unlock()
	return result
}

func (a *App) approvedLocation(packageID string) string {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.approvedLocations[packageID]
}

func buildWingetArgs(packageID string, dryRun bool, installLocation string) (commandSpec, error) {
	record, err := allowedPackage(packageID)
	if err != nil {
		return commandSpec{}, err
	}

	args := []string{"install", "--id", packageID, "--exact", "--source", record.Source}
	if record.Source == "winget" {
		args = append(args, "--silent")
	}
	if installLocation != "" && record.Source != "msstore" {
		args = append(args, "--location", installLocation)
	}
	args = append(
		args,
		"--accept-package-agreements",
		"--accept-source-agreements",
		"--disable-interactivity",
	)
	return commandSpec{Command: "winget", Args: args, DryRun: dryRun}, nil
}

func (a *App) BuildCommand(packageID string) (commandSpec, error) {
	return buildWingetArgs(packageID, true, a.approvedLocation(packageID))
}

func (a *App) ChooseInstallLocation(packageID string) selectionResult {
	record, err := allowedPackage(packageID)
	if err != nil {
		return selectionResult{OK: false, Error: err.Error()}
	}
	if record.Source == "msstore" {
		return selectionResult{
			OK:    false,
			Error: "Microsoft Store quản lý vị trí cài đặt của ứng dụng này.",
		}
	}

	location, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title:                "Chọn thư mục cài " + record.Name,
		DefaultDirectory:     a.approvedLocation(packageID),
		CanCreateDirectories: true,
	})
	if err != nil {
		return selectionResult{OK: false, Error: err.Error()}
	}
	if location == "" {
		return selectionResult{
			OK:        false,
			Cancelled: true,
			Location:  a.approvedLocation(packageID),
		}
	}

	absolute, err := filepath.Abs(location)
	if err != nil {
		return selectionResult{OK: false, Error: err.Error()}
	}
	location = filepath.Clean(absolute)
	a.mu.Lock()
	a.approvedLocations[packageID] = location
	a.mu.Unlock()
	return selectionResult{OK: true, Location: location}
}

func (a *App) ResetInstallLocation(packageID string) (actionResult, error) {
	if _, err := allowedPackage(packageID); err != nil {
		return actionResult{}, err
	}
	a.mu.Lock()
	delete(a.approvedLocations, packageID)
	a.mu.Unlock()
	return actionResult{OK: true}, nil
}

func (a *App) detailsFor(packageID string) (packageDetails, error) {
	if _, err := allowedPackage(packageID); err != nil {
		return packageDetails{}, err
	}
	a.mu.RLock()
	details, exists := a.inventoryCache[packageID]
	a.mu.RUnlock()
	if exists {
		return details, nil
	}
	a.ScanInstalled()
	a.mu.RLock()
	details = a.inventoryCache[packageID]
	a.mu.RUnlock()
	return details, nil
}

func (a *App) OpenApp(packageID string) actionResult {
	details, err := a.detailsFor(packageID)
	if err != nil {
		return actionResult{OK: false, Error: err.Error()}
	}
	if !details.Installed {
		return actionResult{OK: false, Error: "Ứng dụng chưa được phát hiện trên máy."}
	}

	if details.Target != "" {
		if err := hiddenCommand(details.Target).Start(); err != nil {
			return actionResult{OK: false, Error: err.Error()}
		}
		return actionResult{OK: true, Method: "executable"}
	}
	if details.AppID != "" {
		if err := exec.Command("explorer.exe", `shell:AppsFolder\`+details.AppID).Start(); err != nil {
			return actionResult{OK: false, Error: err.Error()}
		}
		return actionResult{OK: true, Method: "start-menu"}
	}
	return actionResult{OK: false, Error: "Windows không cung cấp lối tắt để mở ứng dụng này."}
}

func (a *App) OpenAppFolder(packageID string) actionResult {
	details, err := a.detailsFor(packageID)
	if err != nil {
		return actionResult{OK: false, Error: err.Error()}
	}
	if !details.Installed {
		return actionResult{OK: false, Error: "Ứng dụng chưa được phát hiện trên máy."}
	}
	if details.InstallDirectory == "" {
		return actionResult{OK: false, Error: "Windows không công khai thư mục cài đặt của ứng dụng này."}
	}
	if err := exec.Command("explorer.exe", details.InstallDirectory).Start(); err != nil {
		return actionResult{OK: false, Error: err.Error()}
	}
	return actionResult{OK: true}
}

func quoteCommandArgument(argument string) string {
	if !strings.ContainsAny(argument, " \t\"") {
		return argument
	}
	return `"` + strings.ReplaceAll(argument, `"`, `\"`) + `"`
}

func commandLine(spec commandSpec) string {
	parts := []string{spec.Command}
	for _, argument := range spec.Args {
		parts = append(parts, quoteCommandArgument(argument))
	}
	return strings.Join(parts, " ")
}

func (a *App) emitProgress(packageID string, inference progressInference, isError bool) {
	wailsRuntime.EventsEmit(a.ctx, "setupkit:install-progress", installProgressPayload{
		PackageID: packageID,
		Phase:     inference.Phase,
		Percent:   inference.Percent,
		Message:   inference.Message,
		Error:     isError,
	})
}

func (a *App) emitTerminal(packageID, stream, text string) {
	wailsRuntime.EventsEmit(a.ctx, "setupkit:terminal-output", terminalPayload{
		PackageID: packageID,
		Timestamp: time.Now().Format(time.RFC3339),
		Stream:    stream,
		Text:      text,
	})
}

func (a *App) confirmInstall(spec commandSpec, installLocation string) (bool, error) {
	line := commandLine(spec)
	detail := "Vị trí cài đặt sẽ do nhà phát hành quyết định. URL tùy ý và script tải ngoài luôn bị chặn."
	if installLocation != "" {
		detail = "Yêu cầu cài vào: " + installLocation +
			"\n\nTrình cài đặt có thể bỏ qua vị trí tùy chỉnh nếu package không hỗ trợ."
	}
	choice, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:          wailsRuntime.QuestionDialog,
		Title:         "Xác nhận cài đặt",
		Message:       "SetupKit chuẩn bị chạy:\n\n" + line + "\n\n" + detail,
		Buttons:       []string{"Hủy", "Chạy lệnh winget"},
		DefaultButton: "No",
		CancelButton:  "Hủy",
	})
	return confirmedDialogChoice(choice, "Chạy lệnh winget"), err
}

func readProcessStream(reader io.Reader, onChunk func(string)) {
	buffer := make([]byte, 4096)
	for {
		count, err := reader.Read(buffer)
		if count > 0 {
			onChunk(string(buffer[:count]))
		}
		if err != nil {
			return
		}
	}
}

func (a *App) RunWinget(packageID string) installResult {
	installLocation := a.approvedLocation(packageID)
	spec, err := buildWingetArgs(packageID, false, installLocation)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}

	a.emitTerminal(packageID, "command", "> "+commandLine(spec)+"\n")
	a.emitProgress(packageID, progressInference{
		Phase:   "Chờ xác nhận",
		Percent: 3,
		Message: "Đang chờ người dùng xác nhận lệnh winget.",
	}, false)

	confirmed, err := a.confirmInstall(spec, installLocation)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	if !confirmed {
		a.emitTerminal(packageID, "system", "[SetupKit] Người dùng đã hủy lệnh.\n")
		a.emitProgress(packageID, progressInference{
			Phase:   "Đã hủy",
			Percent: 0,
			Message: "Người dùng đã hủy cài đặt.",
		}, false)
		return installResult{Cancelled: true}
	}

	cmd := hiddenCommand(spec.Command, spec.Args...)
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}

	a.emitProgress(packageID, progressInference{
		Phase:   "Đang khởi chạy winget",
		Percent: 8,
		Message: "Đã xác nhận. Đang khởi chạy winget.",
	}, false)
	if err := cmd.Start(); err != nil {
		a.emitTerminal(packageID, "stderr", "[SetupKit] Không thể khởi chạy winget: "+err.Error()+"\n")
		a.emitProgress(packageID, progressInference{
			Phase:   "Không thể khởi chạy",
			Percent: 100,
			Message: err.Error(),
		}, true)
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}

	var outputMu sync.Mutex
	var stdout strings.Builder
	var stderr strings.Builder
	combinedOutput := ""
	currentProgress := 8
	lastPhase := ""
	processChunk := func(raw, stream string) {
		clean := stripTerminalNoise(raw)
		if strings.TrimSpace(clean) != "" {
			if !strings.HasSuffix(clean, "\n") {
				clean += "\n"
			}
			a.emitTerminal(packageID, stream, clean)
		}

		outputMu.Lock()
		if stream == "stdout" {
			stdout.WriteString(raw)
		} else {
			stderr.WriteString(raw)
		}
		combinedOutput += raw
		if len(combinedOutput) > 120000 {
			combinedOutput = combinedOutput[len(combinedOutput)-120000:]
		}
		inference := inferWingetProgress(combinedOutput, currentProgress)
		shouldEmit := inference.Percent != currentProgress || inference.Phase != lastPhase
		currentProgress = inference.Percent
		lastPhase = inference.Phase
		outputMu.Unlock()

		if shouldEmit {
			a.emitProgress(packageID, inference, false)
		}
	}

	var readers sync.WaitGroup
	readers.Add(2)
	go func() {
		defer readers.Done()
		readProcessStream(stdoutPipe, func(chunk string) { processChunk(chunk, "stdout") })
	}()
	go func() {
		defer readers.Done()
		readProcessStream(stderrPipe, func(chunk string) { processChunk(chunk, "stderr") })
	}()

	waitError := cmd.Wait()
	readers.Wait()
	outputMu.Lock()
	stdoutText := stdout.String()
	stderrText := stderr.String()
	outputMu.Unlock()

	exitCode := 0
	if waitError != nil {
		exitCode = -1
		var exitError *exec.ExitError
		if errors.As(waitError, &exitError) {
			exitCode = exitError.ExitCode()
		}
	}
	stream := "system"
	if exitCode != 0 {
		stream = "stderr"
	}
	a.emitTerminal(packageID, stream, fmt.Sprintf("[SetupKit] winget kết thúc với mã %d.\n", exitCode))

	if exitCode != 0 {
		cleanError := strings.TrimSpace(stripTerminalNoise(stderrText))
		if cleanError == "" {
			cleanError = strings.TrimSpace(stripTerminalNoise(stdoutText))
		}
		if cleanError == "" {
			cleanError = fmt.Sprintf("winget kết thúc với mã %d.", exitCode)
		}
		a.emitProgress(packageID, progressInference{
			Phase:   "Cài đặt thất bại",
			Percent: 100,
			Message: cleanError,
		}, true)
		return installResult{
			OK:     false,
			Code:   exitCode,
			Stdout: stdoutText,
			Stderr: stderrText,
			Error:  cleanError,
		}
	}

	outputMu.Lock()
	currentProgress = max(currentProgress, 96)
	refreshPercent := currentProgress
	outputMu.Unlock()
	a.emitProgress(packageID, progressInference{
		Phase:   "Đang cập nhật trạng thái",
		Percent: refreshPercent,
		Message: "Cài đặt đã xong. Đang quét lại ứng dụng trên máy.",
	}, false)

	a.ScanInstalled()
	a.mu.Lock()
	installedDetails := a.inventoryCache[packageID]
	if !installedDetails.Installed {
		installedDetails = packageDetails{
			PackageID:  packageID,
			Installed:  true,
			DetectedBy: []string{"winget-install-result"},
		}
		a.inventoryCache[packageID] = installedDetails
	}
	a.mu.Unlock()

	a.emitProgress(packageID, progressInference{
		Phase:   "Đã cài đặt",
		Percent: 100,
		Message: "Ứng dụng đã được cài đặt thành công.",
	}, false)
	a.emitTerminal(packageID, "success", "[SetupKit] Đã cài đặt và cập nhật trạng thái ứng dụng.\n")

	var locationHonored *bool
	if installLocation != "" && installedDetails.InstallDirectory != "" {
		requested := strings.TrimSuffix(strings.ToLower(filepath.Clean(installLocation)), string(filepath.Separator))
		actual := strings.ToLower(filepath.Clean(installedDetails.InstallDirectory))
		honored := actual == requested || strings.HasPrefix(actual, requested+string(filepath.Separator))
		locationHonored = &honored
	}
	public := publicDetails(installedDetails)
	return installResult{
		OK:                true,
		Code:              exitCode,
		Stdout:            stdoutText,
		Stderr:            stderrText,
		RequestedLocation: installLocation,
		LocationHonored:   locationHonored,
		Details:           &public,
	}
}
