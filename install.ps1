# SetupKit - trình cài một dòng lệnh
#
# Cài đặt / cập nhật:
#   irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/install.ps1 | iex
#
# Gỡ cài đặt:
#   & ([scriptblock]::Create((irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/install.ps1))) -Uninstall
param(
  [switch]$Uninstall,
  [switch]$NoLaunch
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

$repo = 'TrisMinh/setupkit'
$appName = 'SetupKit'
$installDir = Join-Path $env:LOCALAPPDATA $appName
$exePath = Join-Path $installDir "$appName.exe"
$startMenuShortcut = Join-Path ([Environment]::GetFolderPath('Programs')) "$appName.lnk"
$desktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) "$appName.lnk"

function Write-Step([string]$message) {
  Write-Host "[$appName] $message"
}

if ($Uninstall) {
  Write-Step 'Đang gỡ cài đặt...'
  Get-Process -Name $appName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 400
  Remove-Item -LiteralPath $installDir -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $startMenuShortcut, $desktopShortcut -Force -ErrorAction SilentlyContinue
  Write-Step "Đã gỡ $appName khỏi máy. Tạm biệt!"
  return
}

Write-Step 'Đang tìm bản phát hành mới nhất trên GitHub...'
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" `
  -Headers @{ 'User-Agent' = "$appName-installer" }
$asset = $release.assets | Where-Object { $_.name -eq "$appName.exe" } | Select-Object -First 1
if (-not $asset) {
  throw "Không tìm thấy $appName.exe trong bản phát hành $($release.tag_name)."
}
Write-Step "Bản mới nhất: $($release.tag_name) ($([math]::Round($asset.size / 1MB, 1)) MB)"

New-Item -ItemType Directory -Path $installDir -Force | Out-Null

# Nếu app đang mở thì đóng lại để thay file.
Get-Process -Name $appName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 400

Write-Step 'Đang tải về...'
$downloadPath = "$exePath.download"
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $downloadPath `
  -Headers @{ 'User-Agent' = "$appName-installer" }
Move-Item -LiteralPath $downloadPath -Destination $exePath -Force

Write-Step 'Đang tạo shortcut Start Menu và Desktop...'
$shell = New-Object -ComObject WScript.Shell
foreach ($shortcutPath in @($startMenuShortcut, $desktopShortcut)) {
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $exePath
  $shortcut.WorkingDirectory = $installDir
  $shortcut.Description = 'Dựng máy Windows mới với catalog ứng dụng đã xác minh'
  $shortcut.Save()
}

Write-Step "Đã cài vào: $exePath"
if (-not $NoLaunch) {
  Write-Step 'Đang mở SetupKit...'
  Start-Process -FilePath $exePath -WorkingDirectory $installDir
}
Write-Step 'Hoàn tất! Lần sau chỉ cần mở từ Start Menu.'
