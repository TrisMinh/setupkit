# publish-github.ps1 - Dua SetupKit len GitHub tu dau den cuoi:
#   1. Tu cai Git / GitHub CLI / Node / Go neu thieu (qua winget)
#   2. Dang nhap GitHub (mo trinh duyet, chi lan dau)
#   3. git init + commit toan bo ma nguon
#   4. Tao repo tren GitHub va push
#   5. Build SetupKit.exe (validate + test + build)
#   6. Tao GitHub Release kem SetupKit.exe va file zip
#
# Cach dung:  PUBLISH-GITHUB.cmd  (double-click o thu muc SetUpKit)
# Tuy chon :  -RepoName ten-khac   -Private   -SkipBuild   -Tag v0.4.1
param(
  [string]$RepoName = 'setupkit',
  [switch]$Private,
  [string]$Tag = 'v0.4.0',
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
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
  Write-Host "[SetupKit] Dang cai $display..."
  winget install --id $wingetId --exact --source winget --silent `
    --accept-package-agreements --accept-source-agreements
  Refresh-Path
  if (-not (Test-Cmd $command)) {
    throw "$display da duoc cai nhung PowerShell chua nhan PATH. Dong cua so nay, mo lai va chay lai script."
  }
}

Write-Host '=============================================='
Write-Host '  SetupKit - publish len GitHub'
Write-Host '=============================================='

# --- 1. Cong cu ------------------------------------------------------------
Ensure-Tool 'git'  'Git.Git'          'Git'
Ensure-Tool 'gh'   'GitHub.cli'       'GitHub CLI'
Ensure-Tool 'node' 'OpenJS.NodeJS.LTS' 'Node.js'
Ensure-Tool 'go'   'GoLang.Go'        'Go'

# --- 2. Dang nhap GitHub ----------------------------------------------------
cmd /c "gh auth status >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  Write-Host '[SetupKit] Mo trinh duyet de dang nhap GitHub (chi can lam 1 lan)...'
  gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { throw 'Dang nhap GitHub that bai.' }
}
$login = (gh api user --jq .login).Trim()
if (-not $login) { throw 'Khong doc duoc tai khoan GitHub sau khi dang nhap.' }
Write-Host "[SetupKit] Tai khoan GitHub: $login"

# --- 3. Git repo + commit ---------------------------------------------------
$userName = cmd /c "git config user.name 2>nul"
if (-not $userName) { git config --global user.name $login }
$userEmail = cmd /c "git config user.email 2>nul"
if (-not $userEmail) { git config --global user.email "$login@users.noreply.github.com" }

if (-not (Test-Path '.git')) {
  git init -b main | Out-Null
  Write-Host '[SetupKit] Da tao git repo (nhanh main).'
}
git add -A
$pending = git status --porcelain
if ($pending) {
  git commit -m "SetupKit $Tag" -m "Toi uu hieu nang, sua loi giao dien, them animation. Chi tiet: CHANGELOG.md" | Out-Null
  Write-Host '[SetupKit] Da commit ma nguon.'
} else {
  Write-Host '[SetupKit] Khong co thay doi moi de commit.'
}
$branch = (git branch --show-current).Trim()
if (-not $branch) { $branch = 'main' }

# --- 4. Tao repo tren GitHub + push ----------------------------------------
$description = 'Dung may Windows moi voi 440 ung dung da xac minh qua winget - WebView2 native ~12MB, an toan voi allowlist va che do chay thu'
cmd /c "gh repo view $login/$RepoName >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  $visibility = if ($Private) { '--private' } else { '--public' }
  Write-Host "[SetupKit] Dang tao repo $login/$RepoName ($visibility)..."
  gh repo create $RepoName $visibility --source . --remote origin --push --description $description
  if ($LASTEXITCODE -ne 0) { throw 'Tao repo that bai.' }
} else {
  Write-Host "[SetupKit] Repo $login/$RepoName da ton tai - chi push code moi."
  cmd /c "git remote get-url origin >nul 2>&1"
  if ($LASTEXITCODE -ne 0) { git remote add origin "https://github.com/$login/$RepoName.git" }
  git push -u origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Push that bai.' }
}

# --- 5. Build ---------------------------------------------------------------
$needBuild = -not $SkipBuild
if ($SkipBuild -and -not (Test-Path 'release\SetupKit.exe')) {
  Write-Host '[SetupKit] Chua co release\SetupKit.exe nen van phai build.'
  $needBuild = $true
}
if ($needBuild) {
  Write-Host '[SetupKit] Dang build SetupKit.exe (validate + test + build)...'
  powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'build-native.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Build that bai - chua tao release.' }
}

# --- 6. Tag + Release -------------------------------------------------------
cmd /c "git rev-parse --verify $Tag >nul 2>&1"
if ($LASTEXITCODE -ne 0) { git tag $Tag }
git push origin $Tag
if ($LASTEXITCODE -ne 0) { throw "Push tag $Tag that bai." }

$notesFile = Join-Path $projectRoot ("docs\RELEASE-NOTES-$Tag.md")
$assets = @('release\SetupKit.exe', 'release\SetupKit-win-x64.zip') | Where-Object { Test-Path $_ }
if (-not $assets) { throw 'Khong tim thay file trong release\ de dinh kem.' }

cmd /c "gh release view $Tag >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  Write-Host "[SetupKit] Dang tao release $Tag..."
  if (Test-Path $notesFile) {
    gh release create $Tag @assets --title "SetupKit $Tag" --notes-file $notesFile
  } else {
    gh release create $Tag @assets --title "SetupKit $Tag" --generate-notes
  }
  if ($LASTEXITCODE -ne 0) { throw 'Tao release that bai.' }
} else {
  Write-Host "[SetupKit] Release $Tag da ton tai - cap nhat file dinh kem..."
  gh release upload $Tag @assets --clobber
  if ($LASTEXITCODE -ne 0) { throw 'Upload file release that bai.' }
}

Write-Host ''
Write-Host '=============================================='
Write-Host '  XONG!'
Write-Host "  Repo   : https://github.com/$login/$RepoName"
Write-Host "  Release: https://github.com/$login/$RepoName/releases/tag/$Tag"
Write-Host '=============================================='
