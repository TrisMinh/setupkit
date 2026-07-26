param(
  [switch]$TestOnly
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$resourceObject = Join-Path $projectRoot 'rsrc_windows_amd64.syso'
$generatedIcon = Join-Path $projectRoot 'build\windows\icon.ico'
$generatedAppIcon = Join-Path $projectRoot 'build\appicon.png'
$go = Get-Command go -ErrorAction SilentlyContinue
if (-not $go) {
  throw 'Cần Go 1.23+ để build SetupKit: https://go.dev/dl/'
}

Push-Location $projectRoot
try {
  # Di trú bố cục cũ: file web từng nằm ở gốc dự án, nay thuộc frontend/.
  # - Nếu frontend/ chưa có bản tương ứng -> di chuyển từ gốc vào.
  # - Nếu frontend/ đã có -> xóa bản thừa ở gốc.
  $frontendDir = Join-Path $projectRoot 'frontend'
  New-Item -ItemType Directory -Path $frontendDir -Force | Out-Null
  $webEntries = @(
    'index.html', 'renderer.js', 'native-bridge.js',
    'theme-init.js', 'styles.css', 'catalog.json', 'assets'
  )
  foreach ($entry in $webEntries) {
    $legacyPath = Join-Path $projectRoot $entry
    if (-not (Test-Path $legacyPath)) { continue }
    $newPath = Join-Path $frontendDir $entry
    if (Test-Path $newPath) {
      Remove-Item -LiteralPath $legacyPath -Recurse -Force -ErrorAction SilentlyContinue
      Write-Output "Đã dọn bản cũ ở gốc: $entry"
    } else {
      Move-Item -LiteralPath $legacyPath -Destination $newPath
      Write-Output "Đã chuyển vào frontend/: $entry"
    }
  }

  # Dọn file cũ sau đợt tái cấu trúc v0.4.1 (chỉ xóa khi bản mới đã tồn tại).
  $legacyPairs = @(
    @{ Old = 'app.go';            New = 'internal\kit\app.go' },
    @{ Old = 'app_test.go';       New = 'internal\kit\app_test.go' },
    @{ Old = 'catalog.go';        New = 'internal\kit\catalog.go' },
    @{ Old = 'inventory.go';      New = 'internal\kit\inventory.go' },
    @{ Old = 'CHANGELOG.md';      New = 'docs\CHANGELOG.md' },
    @{ Old = 'install.ps1';       New = 'scripts\install.ps1' }
  )
  foreach ($pair in $legacyPairs) {
    $oldPath = Join-Path $projectRoot $pair.Old
    if ((Test-Path $oldPath) -and (Test-Path (Join-Path $projectRoot $pair.New))) {
      Remove-Item -LiteralPath $oldPath -Force -ErrorAction SilentlyContinue
      Write-Output "Đã dọn bản cũ ở gốc: $($pair.Old)"
    }
  }
  # package-lock.json rỗng, dự án không có npm dependency.
  Remove-Item -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Force -ErrorAction SilentlyContinue

  & node (Join-Path $PSScriptRoot 'build-catalog.js')
  if ($LASTEXITCODE -ne 0) {
    throw 'Catalog validation failed.'
  }

  & node (Join-Path $PSScriptRoot 'build-phosphor-subset.js')
  if ($LASTEXITCODE -ne 0) {
    throw 'Phosphor icon subset failed.'
  }

  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'generate-app-icon.ps1')
  if ($LASTEXITCODE -ne 0) {
    throw 'Không thể tạo icon Windows.'
  }

  & go run github.com/akavel/rsrc@v0.10.2 `
    -arch amd64 `
    -manifest (Join-Path $projectRoot 'build\windows\app.manifest') `
    -ico $generatedIcon `
    -o $resourceObject
  if ($LASTEXITCODE -ne 0) {
    throw 'Không thể đóng gói resource Windows.'
  }

  & go test ./...
  if ($LASTEXITCODE -ne 0) {
    throw 'Go tests failed.'
  }
  if ($TestOnly) {
    exit 0
  }

  $outputDirectory = Join-Path $projectRoot 'release'
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  $executable = Join-Path $outputDirectory 'SetupKit.exe'
  & go build `
    -tags 'desktop,production' `
    -trimpath `
    -ldflags '-w -s -H windowsgui' `
    -o $executable `
    .
  if ($LASTEXITCODE -ne 0) {
    throw 'Native build failed.'
  }

  $archive = Join-Path $outputDirectory 'SetupKit-win-x64.zip'
  $previousProgressPreference = $ProgressPreference
  $ProgressPreference = 'SilentlyContinue'
  try {
    Compress-Archive -LiteralPath @(
      $executable,
      (Join-Path $projectRoot 'README.md'),
      (Join-Path $projectRoot 'docs\CATALOG.md'),
      (Join-Path $projectRoot 'docs\DEVELOPER-WORKSTATION-PLAN.md')
    ) -DestinationPath $archive -CompressionLevel Optimal -Force
  }
  finally {
    $ProgressPreference = $previousProgressPreference
  }

  $artifact = Get-Item -LiteralPath $executable
  $package = Get-Item -LiteralPath $archive
  Write-Output ('Built {0:N2} MB: {1}' -f ($artifact.Length / 1MB), $artifact.FullName)
  Write-Output ('Packed {0:N2} MB: {1}' -f ($package.Length / 1MB), $package.FullName)
}
finally {
  Remove-Item -LiteralPath $resourceObject, $generatedIcon, $generatedAppIcon -Force -ErrorAction SilentlyContinue
  Pop-Location
}
