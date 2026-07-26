# tidy-layout.ps1 - Dọn bố cục dự án sau các đợt tái cấu trúc.
# Được gọi ở đầu build-native.ps1 VÀ trước bước commit trong publish-github.ps1
# để mọi thay đổi vị trí file đều được ghi nhận vào git.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

# 1. File web từng nằm ở gốc, nay thuộc frontend/.
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

# 2. File từng ở gốc, nay đã có bản mới ở vị trí chuẩn (chỉ xóa khi bản mới tồn tại).
$legacyPairs = @(
  @{ Old = 'app.go';       New = 'internal\kit\app.go' },
  @{ Old = 'app_test.go';  New = 'internal\kit\app_test.go' },
  @{ Old = 'catalog.go';   New = 'internal\kit\catalog.go' },
  @{ Old = 'inventory.go'; New = 'internal\kit\inventory.go' },
  @{ Old = 'CHANGELOG.md'; New = 'docs\CHANGELOG.md' },
  @{ Old = 'install.ps1';  New = 'scripts\install.ps1' }
)
foreach ($pair in $legacyPairs) {
  $oldPath = Join-Path $projectRoot $pair.Old
  if ((Test-Path $oldPath) -and (Test-Path (Join-Path $projectRoot $pair.New))) {
    Remove-Item -LiteralPath $oldPath -Force -ErrorAction SilentlyContinue
    Write-Output "Đã dọn bản cũ ở gốc: $($pair.Old)"
  }
}

# 3. package-lock.json rỗng - dự án không có npm dependency.
Remove-Item -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Force -ErrorAction SilentlyContinue

exit 0
