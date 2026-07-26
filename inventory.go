package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unicode"
	"unicode/utf16"
)

var (
	ansiPattern        = regexp.MustCompile(`\x1b\[[0-?]*[ -/]*[@-~]`)
	bracketPattern     = regexp.MustCompile(`\([^)]*\)`)
	terminalBarPattern = regexp.MustCompile(`[█▒▉▊▋▌▍▎▏]+`)
	multiLinePattern   = regexp.MustCompile(`\n{3,}`)
	downloadPattern    = regexp.MustCompile(`(?i)([\d.]+)\s*(B|KB|MB|GB)\s*/\s*([\d.]+)\s*(B|KB|MB|GB)`)
)

type processResult struct {
	OK     bool
	Code   int
	Stdout string
	Stderr string
	Error  string
}

type inventoryRecord struct {
	Kind            string `json:"Kind"`
	Name            string `json:"Name"`
	Version         string `json:"Version"`
	InstallLocation string `json:"InstallLocation"`
	Target          string `json:"Target"`
	AppID           string `json:"AppId"`
	ShortcutPath    string `json:"ShortcutPath"`
}

type packageDetails struct {
	PackageID        string   `json:"packageId"`
	Installed        bool     `json:"installed"`
	Version          string   `json:"version"`
	InstallDirectory string   `json:"installDirectory"`
	Target           string   `json:"-"`
	AppID            string   `json:"-"`
	CanLaunch        bool     `json:"canLaunch"`
	CanOpenFolder    bool     `json:"canOpenFolder"`
	DetectedBy       []string `json:"detectedBy"`
}

type publicPackageDetails struct {
	PackageID        string   `json:"packageId"`
	Installed        bool     `json:"installed"`
	Version          string   `json:"version"`
	InstallDirectory string   `json:"installDirectory"`
	CanLaunch        bool     `json:"canLaunch"`
	CanOpenFolder    bool     `json:"canOpenFolder"`
	DetectedBy       []string `json:"detectedBy"`
}

type inventoryDiagnostics struct {
	WingetOK         bool `json:"wingetOk"`
	InventoryOK      bool `json:"inventoryOk"`
	InventoryRecords int  `json:"inventoryRecords"`
}

type inventoryResult struct {
	Apps        []publicPackageDetails `json:"apps"`
	Diagnostics inventoryDiagnostics   `json:"diagnostics"`
}

type progressInference struct {
	Percent int    `json:"percent"`
	Phase   string `json:"phase"`
	Message string `json:"message"`
}

const inventoryPowerShell = `
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$items = [System.Collections.Generic.List[object]]::new()

$registryPaths = @(
  'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

Get-ItemProperty $registryPaths | Where-Object { $_.DisplayName } | ForEach-Object {
  $target = [string]$_.DisplayIcon
  if ($target) {
    $target = $target.Trim('"')
    $target = $target -replace ',\s*-?\d+$', ''
    $target = $target.Trim('"')
  }
  $items.Add([pscustomobject]@{
    Kind = 'registry'
    Name = [string]$_.DisplayName
    Version = [string]$_.DisplayVersion
    InstallLocation = [string]$_.InstallLocation
    Target = $target
    AppId = ''
    ShortcutPath = ''
  })
}

Get-StartApps | ForEach-Object {
  $items.Add([pscustomobject]@{
    Kind = 'start'
    Name = [string]$_.Name
    Version = ''
    InstallLocation = ''
    Target = ''
    AppId = [string]$_.AppID
    ShortcutPath = ''
  })
}

$shortcutRoots = @(
  [Environment]::GetFolderPath('CommonStartMenu'),
  [Environment]::GetFolderPath('StartMenu'),
  [Environment]::GetFolderPath('CommonDesktopDirectory'),
  [Environment]::GetFolderPath('DesktopDirectory')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

$shell = New-Object -ComObject WScript.Shell
Get-ChildItem -LiteralPath $shortcutRoots -Filter '*.lnk' -Recurse | ForEach-Object {
  $shortcut = $shell.CreateShortcut($_.FullName)
  $items.Add([pscustomobject]@{
    Kind = 'shortcut'
    Name = [string]$_.BaseName
    Version = ''
    InstallLocation = ''
    Target = [string]$shortcut.TargetPath
    AppId = ''
    ShortcutPath = [string]$_.FullName
  })
}

@($items) | ConvertTo-Json -Compress -Depth 3
`

func hiddenCommandContext(ctx context.Context, name string, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd
}

func hiddenCommand(name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd
}

func runProcess(command string, args []string, timeout time.Duration) processResult {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := hiddenCommandContext(ctx, command, args...)
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()

	result := processResult{
		OK:     err == nil,
		Code:   0,
		Stdout: stdout.String(),
		Stderr: stderr.String(),
	}
	if ctx.Err() == context.DeadlineExceeded {
		result.OK = false
		result.Code = -1
		result.Error = "timeout"
		return result
	}
	if err != nil {
		result.Error = err.Error()
		var exitError *exec.ExitError
		if errors.As(err, &exitError) {
			result.Code = exitError.ExitCode()
		} else {
			result.Code = -1
		}
	}
	return result
}

func encodePowerShell(script string) string {
	codepoints := utf16.Encode([]rune(script))
	payload := make([]byte, len(codepoints)*2)
	for index, value := range codepoints {
		binary.LittleEndian.PutUint16(payload[index*2:], value)
	}
	return base64.StdEncoding.EncodeToString(payload)
}

func normalizeName(value string) string {
	value = bracketPattern.ReplaceAllString(value, " ")
	var normalized strings.Builder
	spacePending := false
	for _, char := range strings.ToLower(value) {
		if unicode.IsLetter(char) || unicode.IsDigit(char) {
			if spacePending && normalized.Len() > 0 {
				normalized.WriteByte(' ')
			}
			normalized.WriteRune(char)
			spacePending = false
			continue
		}
		spacePending = true
	}
	return strings.TrimSpace(normalized.String())
}

func namesMatch(recordName string, hints []string) bool {
	record := normalizeName(recordName)
	if record == "" {
		return false
	}
	for _, hint := range hints {
		normalizedHint := normalizeName(hint)
		if normalizedHint == "" {
			continue
		}
		if record == normalizedHint {
			return true
		}
		if strings.HasPrefix(record, normalizedHint+" ") &&
			safeNameSuffix(strings.TrimPrefix(record, normalizedHint+" ")) {
			return true
		}
	}
	return false
}

func safeNameSuffix(value string) bool {
	allowedWords := map[string]bool{
		"bit": true, "edition": true, "lts": true, "machine": true,
		"stable": true, "user": true, "version": true, "x64": true, "x86": true,
	}
	for _, token := range strings.Fields(value) {
		if allowedWords[token] {
			continue
		}
		if _, err := strconv.ParseFloat(token, 64); err == nil {
			continue
		}
		return false
	}
	return value != ""
}

func wingetPackageListed(output string, packageID string) bool {
	for _, line := range strings.Split(output, "\n") {
		for _, field := range strings.Fields(line) {
			if strings.EqualFold(field, packageID) {
				return true
			}
		}
	}
	return false
}

func parseInventoryJSON(raw string) []inventoryRecord {
	clean := strings.TrimSpace(strings.TrimPrefix(raw, "\ufeff"))
	if clean == "" {
		return nil
	}
	var records []inventoryRecord
	if strings.HasPrefix(clean, "[") {
		if json.Unmarshal([]byte(clean), &records) == nil {
			return records
		}
		return nil
	}
	var record inventoryRecord
	if json.Unmarshal([]byte(clean), &record) == nil {
		return []inventoryRecord{record}
	}
	return nil
}

func existingFile(candidate string) string {
	clean := strings.Trim(strings.TrimSpace(candidate), `"`)
	if clean == "" {
		return ""
	}
	info, err := os.Stat(clean)
	if err != nil || info.IsDir() {
		return ""
	}
	absolute, err := filepath.Abs(clean)
	if err != nil {
		return ""
	}
	return filepath.Clean(absolute)
}

func existingDirectory(candidate string) string {
	clean := strings.Trim(strings.TrimSpace(candidate), `"`)
	if clean == "" {
		return ""
	}
	info, err := os.Stat(clean)
	if err != nil || !info.IsDir() {
		return ""
	}
	absolute, err := filepath.Abs(clean)
	if err != nil {
		return ""
	}
	return filepath.Clean(absolute)
}

func firstNonEmpty(values []string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func resolvePackageDetails(
	packageID string,
	record packageRecord,
	wingetOutput string,
	inventory []inventoryRecord,
) packageDetails {
	hints := record.MatchNames
	if len(hints) == 0 {
		hints = []string{record.Name}
	}

	matches := make([]inventoryRecord, 0)
	for _, item := range inventory {
		if namesMatch(item.Name, hints) {
			matches = append(matches, item)
		}
	}

	registryMatches := make([]inventoryRecord, 0)
	shortcutMatches := make([]inventoryRecord, 0)
	startMatches := make([]inventoryRecord, 0)
	for _, item := range matches {
		switch item.Kind {
		case "registry":
			registryMatches = append(registryMatches, item)
		case "shortcut":
			shortcutMatches = append(shortcutMatches, item)
		case "start":
			startMatches = append(startMatches, item)
		}
	}

	shortcutTargets := make([]string, 0, len(shortcutMatches))
	for _, item := range shortcutMatches {
		shortcutTargets = append(shortcutTargets, existingFile(item.Target))
	}
	registryTargets := make([]string, 0, len(registryMatches))
	for _, item := range registryMatches {
		registryTargets = append(registryTargets, existingFile(item.Target))
	}
	target := firstNonEmpty(append(shortcutTargets, registryTargets...))

	// DisplayIcon trong Registry đôi khi trỏ tới file .ico thay vì file chạy.
	// Chỉ dùng target làm lối tắt khởi chạy khi đó thật sự là file thực thi;
	// vẫn giữ target gốc để suy ra thư mục cài đặt.
	launchTarget := ""
	if strings.EqualFold(filepath.Ext(target), ".exe") {
		launchTarget = target
	}

	registryDirectories := make([]string, 0, len(registryMatches))
	for _, item := range registryMatches {
		registryDirectories = append(registryDirectories, existingDirectory(item.InstallLocation))
	}
	targetDirectory := ""
	if target != "" {
		targetDirectory = existingDirectory(filepath.Dir(target))
	}
	installDirectory := firstNonEmpty(append(registryDirectories, targetDirectory))

	appIDs := make([]string, 0, len(startMatches))
	for _, item := range startMatches {
		appIDs = append(appIDs, item.AppID)
	}
	appID := firstNonEmpty(appIDs)

	versions := make([]string, 0, len(registryMatches))
	for _, item := range registryMatches {
		versions = append(versions, item.Version)
	}
	version := firstNonEmpty(versions)
	wingetDetected := wingetPackageListed(wingetOutput, packageID)

	detectedBy := make([]string, 0, 4)
	if wingetDetected {
		detectedBy = append(detectedBy, "winget")
	}
	if len(registryMatches) > 0 {
		detectedBy = append(detectedBy, "registry")
	}
	if len(shortcutMatches) > 0 {
		detectedBy = append(detectedBy, "shortcut")
	}
	if len(startMatches) > 0 {
		detectedBy = append(detectedBy, "start-menu")
	}

	return packageDetails{
		PackageID:        packageID,
		Installed:        wingetDetected || len(matches) > 0,
		Version:          version,
		InstallDirectory: installDirectory,
		Target:           launchTarget,
		AppID:            appID,
		CanLaunch:        launchTarget != "" || appID != "",
		CanOpenFolder:    installDirectory != "",
		DetectedBy:       detectedBy,
	}
}

func publicDetails(details packageDetails) publicPackageDetails {
	return publicPackageDetails{
		PackageID:        details.PackageID,
		Installed:        details.Installed,
		Version:          details.Version,
		InstallDirectory: details.InstallDirectory,
		CanLaunch:        details.CanLaunch,
		CanOpenFolder:    details.CanOpenFolder,
		DetectedBy:       details.DetectedBy,
	}
}

func scanInstalledApps() (inventoryResult, map[string]packageDetails) {
	wingetChannel := make(chan processResult, 1)
	inventoryChannel := make(chan processResult, 1)

	go func() {
		wingetChannel <- runProcess(
			"winget",
			[]string{"list", "--accept-source-agreements", "--disable-interactivity"},
			30*time.Second,
		)
	}()
	go func() {
		inventoryChannel <- runProcess(
			"powershell.exe",
			[]string{"-NoProfile", "-NonInteractive", "-EncodedCommand", encodePowerShell(inventoryPowerShell)},
			30*time.Second,
		)
	}()

	wingetResult := <-wingetChannel
	systemResult := <-inventoryChannel
	wingetOutput := wingetResult.Stdout + "\n" + wingetResult.Stderr
	records := parseInventoryJSON(systemResult.Stdout)

	detailsMap := make(map[string]packageDetails, len(allowlist))
	apps := make([]publicPackageDetails, 0, len(allowlist))
	for _, packageID := range allowlistIDs() {
		details := resolvePackageDetails(packageID, allowlist[packageID], wingetOutput, records)
		detailsMap[packageID] = details
		apps = append(apps, publicDetails(details))
	}

	return inventoryResult{
		Apps: apps,
		Diagnostics: inventoryDiagnostics{
			WingetOK:         wingetResult.OK,
			InventoryOK:      systemResult.OK,
			InventoryRecords: len(records),
		},
	}, detailsMap
}

func stripTerminalNoise(value string) string {
	clean := ansiPattern.ReplaceAllString(value, "")
	clean = strings.ReplaceAll(clean, "\b", "")
	clean = strings.ReplaceAll(clean, "\r", "\n")
	clean = terminalBarPattern.ReplaceAllString(clean, "")
	return multiLinePattern.ReplaceAllString(clean, "\n\n")
}

func bytesFor(value, unit string) float64 {
	parsed, _ := strconv.ParseFloat(value, 64)
	switch strings.ToUpper(unit) {
	case "KB":
		return parsed * 1024
	case "MB":
		return parsed * 1024 * 1024
	case "GB":
		return parsed * 1024 * 1024 * 1024
	default:
		return parsed
	}
}

func inferWingetProgress(output string, previous int) progressInference {
	clean := stripTerminalNoise(output)
	lower := strings.ToLower(clean)
	percent := previous
	phase := "Đang chuẩn bị"

	if strings.Contains(lower, "found ") || strings.Contains(lower, "tìm thấy") {
		percent = max(percent, 18)
		phase = "Đã tìm thấy package"
	}

	matches := downloadPattern.FindAllStringSubmatch(clean, -1)
	if len(matches) > 0 {
		latest := matches[len(matches)-1]
		current := bytesFor(latest[1], latest[2])
		total := bytesFor(latest[3], latest[4])
		ratio := 0.0
		if total > 0 {
			ratio = min(1, current/total)
		}
		percent = max(percent, 25+int(ratio*40+0.5))
		phase = "Đang tải xuống " + strconv.Itoa(int(ratio*100+0.5)) + "%"
	} else if strings.Contains(lower, "download") || strings.Contains(lower, "đang tải") {
		percent = max(percent, 28)
		phase = "Đang tải xuống"
	}

	if (strings.Contains(lower, "hash") && strings.Contains(lower, "verif")) ||
		strings.Contains(lower, "verified installer") ||
		strings.Contains(lower, "xác minh") {
		percent = max(percent, 70)
		phase = "Đã xác minh bộ cài"
	}
	if strings.Contains(lower, "starting package install") ||
		strings.Contains(lower, "starting install") ||
		strings.Contains(lower, "đang bắt đầu cài") {
		percent = max(percent, 82)
		phase = "Đang cài đặt"
	}
	if strings.Contains(lower, "successfully installed") ||
		strings.Contains(lower, "installed successfully") ||
		strings.Contains(lower, "cài đặt thành công") {
		percent = 100
		phase = "Cài đặt thành công"
	}

	message := phase
	lines := strings.Split(clean, "\n")
	for index := len(lines) - 1; index >= 0; index-- {
		line := strings.TrimSpace(lines[index])
		if line == "" || strings.Trim(line, `-\|/`) == "" {
			continue
		}
		message = line
		break
	}

	return progressInference{
		Percent: min(100, percent),
		Phase:   phase,
		Message: message,
	}
}
