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

// wingetVerb phân biệt ba thao tác winget dùng chung một luồng thực thi.
type wingetVerb string

const (
	verbInstall   wingetVerb = "install"
	verbUpgrade   wingetVerb = "upgrade"
	verbUninstall wingetVerb = "uninstall"
)

// confirmConfig mô tả hộp thoại xác nhận trước khi chạy winget.
type confirmConfig struct {
	Title   string
	Message string
	Confirm string
}

// wingetOperation gói toàn bộ khác biệt giữa install/upgrade/uninstall để
// executeWinget tái dùng chung luồng chạy lệnh, stream terminal và cập nhật trạng thái.
type wingetOperation struct {
	Verb            wingetVerb
	Spec            commandSpec
	InstallLocation string
	Confirm         confirmConfig
	LaunchPhase     string
	LaunchMessage   string
	SuccessPhase    string
	SuccessMessage  string
	SuccessLog      string
	FailPhase       string
	MarkInstalled   bool
}

// buildUpgradeArgs dựng lệnh "winget upgrade" cho đúng một package đã duyệt.
func buildUpgradeArgs(packageID string) (commandSpec, error) {
	record, err := allowedPackage(packageID)
	if err != nil {
		return commandSpec{}, err
	}
	args := []string{"upgrade", "--id", packageID, "--exact", "--source", record.Source}
	if record.Source == "winget" {
		args = append(args, "--silent")
	}
	args = append(
		args,
		"--accept-package-agreements",
		"--accept-source-agreements",
		"--disable-interactivity",
	)
	return commandSpec{Command: "winget", Args: args, DryRun: false}, nil
}

// buildUninstallArgs dựng lệnh "winget uninstall" cho đúng một package đã duyệt.
func buildUninstallArgs(packageID string) (commandSpec, error) {
	record, err := allowedPackage(packageID)
	if err != nil {
		return commandSpec{}, err
	}
	args := []string{"uninstall", "--id", packageID, "--exact"}
	if record.Source == "winget" {
		args = append(args, "--source", record.Source, "--silent")
	}
	args = append(
		args,
		"--accept-source-agreements",
		"--disable-interactivity",
	)
	return commandSpec{Command: "winget", Args: args, DryRun: false}, nil
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

// OpenAppInstallerPage mở trang Microsoft Store của App Installer (gói cung cấp
// winget) để người dùng cài khi máy chưa có Windows Package Manager.
func (a *App) OpenAppInstallerPage() actionResult {
	if err := exec.Command("explorer.exe", "ms-windows-store://pdp/?productid=9NBLGGH4NNS1").Start(); err != nil {
		return actionResult{OK: false, Error: err.Error()}
	}
	return actionResult{OK: true, Method: "store"}
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

func (a *App) confirmDialog(cfg confirmConfig) (bool, error) {
	choice, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:          wailsRuntime.WarningDialog,
		Title:         cfg.Title,
		Message:       cfg.Message,
		Buttons:       []string{"Hủy", cfg.Confirm},
		DefaultButton: "Hủy",
		CancelButton:  "Hủy",
	})
	return choice == cfg.Confirm, err
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

// inferProgress chọn cách suy luận tiến trình theo loại thao tác winget.
func inferProgress(output string, previous int, verb wingetVerb) progressInference {
	if verb == verbUninstall {
		return inferUninstallProgress(output, previous)
	}
	return inferWingetProgress(output, previous)
}

// executeWinget chạy chung cho install/upgrade/uninstall: xác nhận, stream
// terminal, suy luận tiến trình, xử lý mã thoát và làm mới trạng thái ứng dụng.
func (a *App) executeWinget(packageID string, op wingetOperation) installResult {
	a.emitTerminal(packageID, "command", "> "+commandLine(op.Spec)+"\n")
	a.emitProgress(packageID, progressInference{
		Phase:   "Chờ xác nhận",
		Percent: 3,
		Message: "Đang chờ người dùng xác nhận lệnh winget.",
	}, false)

	confirmed, err := a.confirmDialog(op.Confirm)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	if !confirmed {
		a.emitTerminal(packageID, "system", "[SetupKit] Người dùng đã hủy lệnh.\n")
		a.emitProgress(packageID, progressInference{
			Phase:   "Đã hủy",
			Percent: 0,
			Message: "Người dùng đã hủy thao tác.",
		}, false)
		return installResult{Cancelled: true}
	}

	cmd := hiddenCommand(op.Spec.Command, op.Spec.Args...)
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}

	a.emitProgress(packageID, progressInference{
		Phase:   op.LaunchPhase,
		Percent: 8,
		Message: op.LaunchMessage,
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
		inference := inferProgress(combinedOutput, currentProgress, op.Verb)
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
			Phase:   op.FailPhase,
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
		Message: "Thao tác đã xong. Đang quét lại ứng dụng trên máy.",
	}, false)

	a.ScanInstalled()
	a.mu.Lock()
	details := a.inventoryCache[packageID]
	if op.MarkInstalled && !details.Installed {
		details = packageDetails{
			PackageID:  packageID,
			Installed:  true,
			DetectedBy: []string{"winget-install-result"},
		}
		a.inventoryCache[packageID] = details
	}
	if !op.MarkInstalled {
		// Gỡ thành công: đánh dấu chưa cài dù registry còn sót dấu vết.
		details = packageDetails{
			PackageID:  packageID,
			Installed:  false,
			DetectedBy: []string{"winget-uninstall-result"},
		}
		a.inventoryCache[packageID] = details
	}
	a.mu.Unlock()

	a.emitProgress(packageID, progressInference{
		Phase:   op.SuccessPhase,
		Percent: 100,
		Message: op.SuccessMessage,
	}, false)
	a.emitTerminal(packageID, "success", op.SuccessLog)

	var locationHonored *bool
	if op.InstallLocation != "" && details.InstallDirectory != "" {
		requested := strings.TrimSuffix(strings.ToLower(filepath.Clean(op.InstallLocation)), string(filepath.Separator))
		actual := strings.ToLower(filepath.Clean(details.InstallDirectory))
		honored := actual == requested || strings.HasPrefix(actual, requested+string(filepath.Separator))
		locationHonored = &honored
	}
	public := publicDetails(details)
	return installResult{
		OK:                true,
		Code:              exitCode,
		Stdout:            stdoutText,
		Stderr:            stderrText,
		RequestedLocation: op.InstallLocation,
		LocationHonored:   locationHonored,
		Details:           &public,
	}
}

// RunWinget cài đặt một package đã duyệt qua winget.
func (a *App) RunWinget(packageID string) installResult {
	installLocation := a.approvedLocation(packageID)
	spec, err := buildWingetArgs(packageID, false, installLocation)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	detail := "Vị trí cài đặt sẽ do nhà phát hành quyết định. URL tùy ý và script tải ngoài luôn bị chặn."
	if installLocation != "" {
		detail = "Yêu cầu cài vào: " + installLocation +
			"\n\nTrình cài đặt có thể bỏ qua vị trí tùy chỉnh nếu package không hỗ trợ."
	}
	op := wingetOperation{
		Verb:            verbInstall,
		Spec:            spec,
		InstallLocation: installLocation,
		Confirm: confirmConfig{
			Title:   "Xác nhận cài đặt",
			Message: "SetupKit chuẩn bị chạy:\n\n" + commandLine(spec) + "\n\n" + detail,
			Confirm: "Chạy lệnh winget",
		},
		LaunchPhase:    "Đang khởi chạy winget",
		LaunchMessage:  "Đã xác nhận. Đang khởi chạy winget.",
		SuccessPhase:   "Đã cài đặt",
		SuccessMessage: "Ứng dụng đã được cài đặt thành công.",
		SuccessLog:     "[SetupKit] Đã cài đặt và cập nhật trạng thái ứng dụng.\n",
		FailPhase:      "Cài đặt thất bại",
		MarkInstalled:  true,
	}
	return a.executeWinget(packageID, op)
}

// UpgradeApp cập nhật một package đã cài lên bản mới nhất qua winget.
func (a *App) UpgradeApp(packageID string) installResult {
	spec, err := buildUpgradeArgs(packageID)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	record, err := allowedPackage(packageID)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	op := wingetOperation{
		Verb: verbUpgrade,
		Spec: spec,
		Confirm: confirmConfig{
			Title:   "Xác nhận cập nhật",
			Message: "SetupKit chuẩn bị cập nhật " + record.Name + ":\n\n" + commandLine(spec) + "\n\nChỉ cập nhật đúng ứng dụng này qua winget.",
			Confirm: "Cập nhật",
		},
		LaunchPhase:    "Đang khởi chạy winget",
		LaunchMessage:  "Đã xác nhận. Đang khởi chạy winget để cập nhật.",
		SuccessPhase:   "Đã cập nhật",
		SuccessMessage: "Ứng dụng đã được cập nhật lên bản mới nhất.",
		SuccessLog:     "[SetupKit] Đã cập nhật và làm mới trạng thái ứng dụng.\n",
		FailPhase:      "Cập nhật thất bại",
		MarkInstalled:  true,
	}
	return a.executeWinget(packageID, op)
}

// UninstallApp gỡ một package đã cài khỏi máy qua winget.
func (a *App) UninstallApp(packageID string) installResult {
	spec, err := buildUninstallArgs(packageID)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	record, err := allowedPackage(packageID)
	if err != nil {
		return installResult{OK: false, Code: -1, Error: err.Error()}
	}
	op := wingetOperation{
		Verb: verbUninstall,
		Spec: spec,
		Confirm: confirmConfig{
			Title:   "Xác nhận gỡ cài đặt",
			Message: "SetupKit chuẩn bị gỡ " + record.Name + ":\n\n" + commandLine(spec) + "\n\nThao tác này sẽ xóa ứng dụng khỏi máy.",
			Confirm: "Gỡ cài đặt",
		},
		LaunchPhase:    "Đang khởi chạy winget",
		LaunchMessage:  "Đã xác nhận. Đang khởi chạy winget để gỡ.",
		SuccessPhase:   "Đã gỡ cài đặt",
		SuccessMessage: "Ứng dụng đã được gỡ khỏi máy.",
		SuccessLog:     "[SetupKit] Đã gỡ cài đặt và làm mới trạng thái.\n",
		FailPhase:      "Gỡ cài đặt thất bại",
		MarkInstalled:  false,
	}
	return a.executeWinget(packageID, op)
}
