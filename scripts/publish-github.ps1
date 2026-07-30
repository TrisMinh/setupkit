# publish-github.ps1 - Đưa SetupKit lên GitHub từ đầu đến cuối:
#   1. Tự cài Git / GitHub CLI / Node / Go nếu thiếu (qua winget)
#   2. Đăng nhập GitHub (mở trình duyệt, chỉ lần đầu)
#   3. git init + commit toàn bộ mã nguồn
#   4. Tạo repo trên GitHub (kèm mô tả + topics) và push
#   5. Build SetupKit.exe (validate + test + build)
#   6. Tạo GitHub Release kèm SetupKit.exe và file zip
#
# Cách dùng:  PUBLISH-GITHUB.cmd  (double-click ở thư mục SetUpKit)
# Tùy chọn :  -RepoName ten-khac   -Private   -SkipBuild   -Tag v0.4.2
param(
  [string]$RepoName = 'setupkit',
  [switch]$Private,
  [string]$Tag = 'v0.8.0',
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Test-Cmd([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Ensure-Tool([string]$command, [string]$wingetId, [string]$display) {
  if (Test-Cmd $command) { return }
  Write-Host "[SetupKit] Đang cài $display..."
  winget install --id $wingetId --exact --source winget --silent `
    --accept-package-agreements --accept-source-agreements
  Refresh-Path
  if (-not (Test-Cmd $command)) {
    throw "$display đã được cài nhưng PowerShell chưa nhận PATH. Đóng cửa sổ này, mở lại và chạy lại script."
  }
}

Write-Host '=============================================='
Write-Host '  SetupKit - publish lên GitHub'
Write-Host '=============================================='

# --- 1. Công cụ ------------------------------------------------------------
Ensure-Tool 'git'  'Git.Git'           'Git'
Ensure-Tool 'gh'   'GitHub.cli'        'GitHub CLI'
Ensure-Tool 'node' 'OpenJS.NodeJS.LTS' 'Node.js'
Ensure-Tool 'go'   'GoLang.Go'         'Go'

# --- 2. Đăng nhập GitHub ----------------------------------------------------
cmd /c "gh auth status >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  Write-Host '[SetupKit] Mở trình duyệt để đăng nhập GitHub (chỉ cần làm 1 lần).'
  Write-Host '[SetupKit] LƯU Ý: nhìn mã one-time code hiện ở cửa sổ này rồi nhập vào trình duyệt.'
  gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { throw 'Đăng nhập GitHub thất bại.' }
}
$login = (gh api user --jq .login).Trim()
if (-not $login) { throw 'Không đọc được tài khoản GitHub sau khi đăng nhập.' }
Write-Host "[SetupKit] Tài khoản GitHub: $login"

# --- 3. Git repo + commit ---------------------------------------------------
$userName = cmd /c "git config user.name 2>nul"
if (-not $userName) { git config --global user.name $login }
$userEmail = cmd /c "git config user.email 2>nul"
if (-not $userEmail) { git config --global user.email "$login@users.noreply.github.com" }

if (-not (Test-Path '.git')) {
  git init -b main | Out-Null
  Write-Host '[SetupKit] Đã tạo git repo (nhánh main).'
}
# Dọn bố cục trước khi commit để các file bị di dời/xóa được ghi nhận vào git.
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'tidy-layout.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Không thể dọn bố cục dự án.' }
git add -A
$pending = git status --porcelain
if ($pending) {
  git commit -m "SetupKit $Tag" -m "Chi tiết thay đổi: CHANGELOG.md" | Out-Null
  Write-Host '[SetupKit] Đã commit mã nguồn.'
} else {
  Write-Host '[SetupKit] Không có thay đổi mới để commit.'
}
$branch = (git branch --show-current).Trim()
if (-not $branch) { $branch = 'main' }

# --- 4. Tạo repo trên GitHub + push -----------------------------------------
$description = 'Dựng máy Windows mới với 440 ứng dụng đã xác minh qua winget và Microsoft Store. Một file EXE ~12 MB chạy trên WebView2, có workstation plan theo vai trò, chế độ chạy thử và allowlist an toàn.'
cmd /c "gh repo view $login/$RepoName >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  $visibility = if ($Private) { '--private' } else { '--public' }
  Write-Host "[SetupKit] Đang tạo repo $login/$RepoName ($visibility)..."
  gh repo create $RepoName $visibility --source . --remote origin --push --description $description
  if ($LASTEXITCODE -ne 0) { throw 'Tạo repo thất bại.' }
} else {
  Write-Host "[SetupKit] Repo $login/$RepoName đã tồn tại - push code mới."
  cmd /c "git remote get-url origin >nul 2>&1"
  if ($LASTEXITCODE -ne 0) { git remote add origin "https://github.com/$login/$RepoName.git" }
  git push -u origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Push thất bại.' }
}

# Cập nhật mô tả (có dấu) + topics cho phần About - chạy lại luôn an toàn.
Write-Host '[SetupKit] Đang cập nhật mô tả và topics cho repo...'
gh repo edit "$login/$RepoName" --description $description `
  --add-topic windows --add-topic winget --add-topic wails --add-topic webview2 `
  --add-topic installer --add-topic setup --add-topic devtools
if ($LASTEXITCODE -ne 0) { Write-Host '[SetupKit] (Bỏ qua) Không cập nhật được About - không ảnh hưởng publish.' }

# --- 5. Build ---------------------------------------------------------------
$needBuild = -not $SkipBuild
if ($SkipBuild -and -not (Test-Path 'release\SetupKit.exe')) {
  Write-Host '[SetupKit] Chưa có release\SetupKit.exe nên vẫn phải build.'
  $needBuild = $true
}
if ($needBuild) {
  Write-Host '[SetupKit] Đang build SetupKit.exe (validate + test + build)...'
  powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'build-native.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Build thất bại - chưa tạo release.' }
}

# --- 6. Tag + Release --------------------------------------------------------
cmd /c "git rev-parse --verify $Tag >nul 2>&1"
if ($LASTEXITCODE -ne 0) { git tag $Tag }
git push origin $Tag
if ($LASTEXITCODE -ne 0) { throw "Push tag $Tag thất bại." }

$notesFile = Join-Path $projectRoot ("docs\RELEASE-NOTES-$Tag.md")
$assets = @('release\SetupKit.exe', 'release\SetupKit-win-x64.zip') | Where-Object { Test-Path $_ }
if (-not $assets) { throw 'Không tìm thấy file trong release\ để đính kèm.' }

cmd /c "gh release view $Tag >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  Write-Host "[SetupKit] Đang tạo release $Tag..."
  if (Test-Path $notesFile) {
    gh release create $Tag @assets --title "SetupKit $Tag" --notes-file $notesFile
  } else {
    gh release create $Tag @assets --title "SetupKit $Tag" --generate-notes
  }
  if ($LASTEXITCODE -ne 0) { throw 'Tạo release thất bại.' }
} else {
  Write-Host "[SetupKit] Release $Tag đã tồn tại - cập nhật file đính kèm và ghi chú..."
  gh release upload $Tag @assets --clobber
  if ($LASTEXITCODE -ne 0) { throw 'Upload file release thất bại.' }
  if (Test-Path $notesFile) {
    gh release edit $Tag --title "SetupKit $Tag" --notes-file $notesFile | Out-Null
  }
}

Write-Host ''
Write-Host '=============================================='
Write-Host '  XONG!'
Write-Host "  Repo   : https://github.com/$login/$RepoName"
Write-Host "  Release: https://github.com/$login/$RepoName/releases/tag/$Tag"
Write-Host '=============================================='
