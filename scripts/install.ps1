# SetupKit - one-command installer
#
# Install / update:
#   irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1 | iex
#
# Uninstall:
#   & ([scriptblock]::Create((irm https://raw.githubusercontent.com/TrisMinh/setupkit/main/scripts/install.ps1))) -Uninstall
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
  Write-Step 'Uninstalling...'
  Get-Process -Name $appName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 400
  Remove-Item -LiteralPath $installDir -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $startMenuShortcut, $desktopShortcut -Force -ErrorAction SilentlyContinue
  Write-Step "Removed $appName from this machine. Goodbye!"
  return
}

Write-Step 'Finding the latest GitHub release...'
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" `
  -Headers @{ 'User-Agent' = "$appName-installer" }
$asset = $release.assets | Where-Object { $_.name -eq "$appName.exe" } | Select-Object -First 1
if (-not $asset) {
  throw "Could not find $appName.exe in release $($release.tag_name)."
}
Write-Step "Latest version: $($release.tag_name) ($([math]::Round($asset.size / 1MB, 1)) MB)"

New-Item -ItemType Directory -Path $installDir -Force | Out-Null

# Close the app if it is running so the executable can be replaced.
Get-Process -Name $appName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 400

Write-Step 'Downloading...'
$downloadPath = "$exePath.download"
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $downloadPath `
  -Headers @{ 'User-Agent' = "$appName-installer" }
Move-Item -LiteralPath $downloadPath -Destination $exePath -Force

Write-Step 'Creating Start Menu and Desktop shortcuts...'
$shell = New-Object -ComObject WScript.Shell
foreach ($shortcutPath in @($startMenuShortcut, $desktopShortcut)) {
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $exePath
  $shortcut.WorkingDirectory = $installDir
  $shortcut.Description = 'Build a fresh Windows workspace with a verified app catalog'
  $shortcut.Save()
}

Write-Step "Installed to: $exePath"
if (-not $NoLaunch) {
  Write-Step 'Launching SetupKit...'
  Start-Process -FilePath $exePath -WorkingDirectory $installDir
}
Write-Step 'Done. Next time, open SetupKit from the Start Menu.'
