package kit

import (
	"encoding/json"
	"os/exec"
	"strings"
	"syscall"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/sys/windows"
)

// Console chạy lệnh PowerShell do người dùng nhập.

type activationStatus struct {
	Licensed   bool   `json:"licensed"`
	StatusText string `json:"statusText"`
	Edition    string `json:"edition"`
	PartialKey string `json:"partialKey"`
	IsAdmin    bool   `json:"isAdmin"`
	Error      string `json:"error,omitempty"`
}

type activationResult struct {
	OK        bool              `json:"ok"`
	Cancelled bool              `json:"cancelled,omitempty"`
	Code      int               `json:"code"`
	Error     string            `json:"error,omitempty"`
	Status    *activationStatus `json:"status,omitempty"`
}

const activationStatusScript = `
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$product = Get-CimInstance SoftwareLicensingProduct -Filter "ApplicationID='55c92734-d682-4d71-983e-d6ec3f16059f' AND PartialProductKey IS NOT NULL" |
  Select-Object -First 1
if ($null -eq $product) {
  [pscustomobject]@{ licensed = $false; statusText = 'Chưa có key Windows nào được cài'; edition = ''; partialKey = '' } |
    ConvertTo-Json -Compress
  return
}
$statusMap = @{
  0 = 'Chưa được cấp phép'; 1 = 'Đã kích hoạt'; 2 = 'Hết hạn gia hạn ban đầu';
  3 = 'Hết hạn thời gian thông báo'; 4 = 'Hết hạn (không xác thực được)';
  5 = 'Chưa được xác thực'; 6 = 'Đã cấp phép ngoài dung sai'
}
$text = $statusMap[[int]$product.LicenseStatus]
if (-not $text) { $text = 'Không xác định' }
[pscustomobject]@{
  licensed   = ([int]$product.LicenseStatus -eq 1)
  statusText = $text
  edition    = [string]$product.Name
  partialKey = [string]$product.PartialProductKey
} | ConvertTo-Json -Compress
`

func isElevated() bool {
	return windows.GetCurrentProcessToken().IsElevated()
}

// WindowsActivationStatus đọc trạng thái kích hoạt Windows (chỉ đọc, không cần admin).
func (a *App) WindowsActivationStatus() activationStatus {
	result := runProcess(
		"powershell.exe",
		[]string{"-NoProfile", "-NonInteractive", "-EncodedCommand", encodePowerShell(activationStatusScript)},
		25*time.Second,
	)
	admin := isElevated()
	clean := strings.TrimSpace(strings.TrimPrefix(result.Stdout, "\ufeff"))
	if clean == "" {
		return activationStatus{
			StatusText: "Không đọc được trạng thái kích hoạt",
			IsAdmin:    admin,
			Error:      result.Error,
		}
	}
	var parsed activationStatus
	if err := json.Unmarshal([]byte(clean), &parsed); err != nil {
		return activationStatus{
			StatusText: "Không đọc được trạng thái kích hoạt",
			IsAdmin:    admin,
			Error:      err.Error(),
		}
	}
	parsed.IsAdmin = admin
	return parsed
}

func (a *App) emitActivation(stream, text string) {
	if !strings.HasSuffix(text, "\n") {
		text += "\n"
	}
	wailsRuntime.EventsEmit(a.ctx, "setupkit:activation-output", terminalPayload{
		PackageID: "windows-activation",
		Timestamp: time.Now().Format(time.RFC3339),
		Stream:    stream,
		Text:      text,
	})
}

func activationAccessDenied(res processResult) bool {
	blob := strings.ToLower(res.Stdout + " " + res.Stderr + " " + res.Error)
	return strings.Contains(blob, "0x80070005") ||
		strings.Contains(blob, "access is denied") ||
		strings.Contains(blob, "truy cập bị từ chối")
}

func powerShellCommandArgs(command string, interactive bool) []string {
	args := []string{"-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass"}
	if interactive {
		args = append(args, "-NoExit")
	} else {
		args = append(args, "-NonInteractive")
	}
	return append(args, "-EncodedCommand", encodePowerShell(command))
}

func (a *App) confirmPowerShellCommand(command string, interactive bool) (bool, error) {
	mode := "trong ứng dụng"
	if interactive {
		mode = "trong cửa sổ PowerShell tương tác mới"
	}
	choice, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:          wailsRuntime.QuestionDialog,
		Title:         "Xác nhận chạy PowerShell",
		Message:       "SetupKit sẽ chạy lệnh " + mode + ":\n\n" + command + "\n\nChỉ chạy khi bạn hiểu lệnh này.",
		Buttons:       []string{"Hủy", "Chạy"},
		DefaultButton: "No",
		CancelButton:  "Hủy",
	})
	return confirmedDialogChoice(choice, "Chạy"), err
}

// RunActivationCommand chạy nguyên nội dung người dùng nhập bằng PowerShell
// và đẩy đầu ra về console. Chỉ chạy khi app có quyền admin.
func (a *App) RunActivationCommand(command string) activationResult {
	command = strings.TrimSpace(command)
	if command == "" {
		return activationResult{Error: "Chưa có lệnh nào để chạy."}
	}
	if !isElevated() {
		return activationResult{
			Error: "Chạy lệnh tại đây cần quyền Administrator. Hãy đóng SetupKit, chuột phải chọn Run as administrator rồi thử lại.",
		}
	}

	confirmed, err := a.confirmPowerShellCommand(command, false)
	if err != nil {
		return activationResult{Error: err.Error()}
	}
	if !confirmed {
		a.emitActivation("system", "[SetupKit] Người dùng đã hủy.")
		return activationResult{Cancelled: true}
	}

	a.emitActivation("system", "[SetupKit] Bắt đầu chạy PowerShell...")
	a.emitActivation("command", "PS> "+strings.ReplaceAll(command, "\n", "\nPS> "))
	res := runProcess("powershell.exe", powerShellCommandArgs(command, false), 150*time.Second)
	if out := strings.TrimSpace(stripTerminalNoise(res.Stdout)); out != "" {
		a.emitActivation("stdout", out)
	}
	if errOut := strings.TrimSpace(stripTerminalNoise(res.Stderr)); errOut != "" {
		a.emitActivation("stderr", errOut)
	}
	if activationAccessDenied(res) {
		status := a.WindowsActivationStatus()
		return activationResult{
			Code:   res.Code,
			Error:  "Bị từ chối quyền. Hãy chạy SetupKit bằng quyền Administrator.",
			Status: &status,
		}
	}
	status := a.WindowsActivationStatus()
	if res.Code == 0 {
		a.emitActivation("success", "[SetupKit] Đã chạy xong lệnh.")
	} else {
		a.emitActivation("system", "[SetupKit] Lệnh trả về mã khác 0. Kiểm tra đầu ra ở trên.")
	}
	return activationResult{OK: res.Code == 0, Code: res.Code, Status: &status}
}

// RunInteractivePowerShell mở console PowerShell thật để lệnh có thể đọc stdin,
// Read-Host, phím bấm và các menu tương tác.
func (a *App) RunInteractivePowerShell(command string) activationResult {
	command = strings.TrimSpace(command)
	if command == "" {
		return activationResult{Error: "Chưa có lệnh nào để chạy."}
	}
	if !isElevated() {
		return activationResult{
			Error: "Chạy lệnh tại đây cần quyền Administrator. Hãy đóng SetupKit, chuột phải chọn Run as administrator rồi thử lại.",
		}
	}

	confirmed, err := a.confirmPowerShellCommand(command, true)
	if err != nil {
		return activationResult{Error: err.Error()}
	}
	if !confirmed {
		a.emitActivation("system", "[SetupKit] Người dùng đã hủy.")
		return activationResult{Cancelled: true}
	}

	cmd := exec.Command("powershell.exe", powerShellCommandArgs(command, true)...)
	cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: windows.CREATE_NEW_CONSOLE}
	if err := cmd.Start(); err != nil {
		return activationResult{Error: err.Error()}
	}
	_ = cmd.Process.Release()

	a.emitActivation("success", "[SetupKit] Đã mở cửa sổ PowerShell tương tác. Tiếp tục thao tác trong cửa sổ mới.")
	return activationResult{OK: true}
}
