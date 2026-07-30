# publish-github.ps1 - publish SetupKit to GitHub end to end:
#   1. Install Git / GitHub CLI / Node / Go if missing (through winget)
#   2. Sign in to GitHub (opens a browser, first run only)
#   3. git init + commit the full source tree
#   4. Create the GitHub repo with description/topics and push
#   5. Build SetupKit.exe (validate + test + build)
#   6. Create a GitHub Release with SetupKit.exe and zip assets
#
# Usage:   PUBLISH-GITHUB.cmd  (double-click from the SetUpKit folder)
# Options: -RepoName another-name   -Private   -SkipBuild   -Tag v0.4.2
param(
  [string]$RepoName = 'setupkit',
  [switch]$Private,
  [string]$Tag = 'v0.9.1',
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
  Write-Host "[SetupKit] Installing $display..."
  winget install --id $wingetId --exact --source winget --silent `
    --accept-package-agreements --accept-source-agreements
  Refresh-Path
  if (-not (Test-Cmd $command)) {
    throw "$display was installed, but PowerShell has not picked up PATH yet. Close this window, reopen it, and run the script again."
  }
}

Write-Host '=============================================='
Write-Host '  SetupKit - publish to GitHub'
Write-Host '=============================================='

# --- 1. Tools --------------------------------------------------------------
Ensure-Tool 'git'  'Git.Git'           'Git'
Ensure-Tool 'gh'   'GitHub.cli'        'GitHub CLI'
Ensure-Tool 'node' 'OpenJS.NodeJS.LTS' 'Node.js'
Ensure-Tool 'go'   'GoLang.Go'         'Go'

# --- 2. GitHub sign-in ------------------------------------------------------
cmd /c "gh auth status >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  Write-Host '[SetupKit] Opening a browser to sign in to GitHub (first run only).'
  Write-Host '[SetupKit] NOTE: copy the one-time code shown in this window into the browser.'
  gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in failed.' }
}
$login = (gh api user --jq .login).Trim()
if (-not $login) { throw 'Could not read the GitHub account after sign-in.' }
Write-Host "[SetupKit] GitHub account: $login"

# --- 3. Git repo + commit ---------------------------------------------------
$userName = cmd /c "git config user.name 2>nul"
if (-not $userName) { git config --global user.name $login }
$userEmail = cmd /c "git config user.email 2>nul"
if (-not $userEmail) { git config --global user.email "$login@users.noreply.github.com" }

if (-not (Test-Path '.git')) {
  git init -b main | Out-Null
  Write-Host '[SetupKit] Created git repository (main branch).'
}
# Tidy layout before commit so moved/deleted files are recorded by git.
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'tidy-layout.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Could not tidy the project layout.' }
git add -A
$pending = git status --porcelain
if ($pending) {
  git commit -m "SetupKit $Tag" -m "Change details: CHANGELOG.md" | Out-Null
  Write-Host '[SetupKit] Committed source changes.'
} else {
  Write-Host '[SetupKit] No new changes to commit.'
}
$branch = (git branch --show-current).Trim()
if (-not $branch) { $branch = 'main' }

# --- 4. Create GitHub repo + push ------------------------------------------
$description = 'Build a fresh Windows workspace with 450 reviewed apps from winget and Microsoft Store. One ~12 MB WebView2 EXE with role-based workspaces, dry-run mode, and an embedded safety allowlist.'
cmd /c "gh repo view $login/$RepoName >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  $visibility = if ($Private) { '--private' } else { '--public' }
  Write-Host "[SetupKit] Creating repo $login/$RepoName ($visibility)..."
  gh repo create $RepoName $visibility --source . --remote origin --push --description $description
  if ($LASTEXITCODE -ne 0) { throw 'Repo creation failed.' }
} else {
  Write-Host "[SetupKit] Repo $login/$RepoName already exists - pushing new code."
  cmd /c "git remote get-url origin >nul 2>&1"
  if ($LASTEXITCODE -ne 0) { git remote add origin "https://github.com/$login/$RepoName.git" }
  git push -u origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Push failed.' }
}

# Update the repo About description and topics. Safe to run repeatedly.
Write-Host '[SetupKit] Updating repo description and topics...'
gh repo edit "$login/$RepoName" --description $description `
  --add-topic windows --add-topic winget --add-topic wails --add-topic webview2 `
  --add-topic installer --add-topic setup --add-topic devtools
if ($LASTEXITCODE -ne 0) { Write-Host '[SetupKit] (Skipped) Could not update About; publishing can continue.' }

# --- 5. Build ---------------------------------------------------------------
$needBuild = -not $SkipBuild
if ($SkipBuild -and -not (Test-Path 'release\SetupKit.exe')) {
  Write-Host '[SetupKit] release\SetupKit.exe does not exist, so build is still required.'
  $needBuild = $true
}
if ($needBuild) {
  Write-Host '[SetupKit] Building SetupKit.exe (validate + test + build)...'
  powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'build-native.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Build failed; release was not created.' }
}

# --- 6. Tag + Release -------------------------------------------------------
cmd /c "git rev-parse --verify $Tag >nul 2>&1"
if ($LASTEXITCODE -ne 0) { git tag $Tag }
git push origin $Tag
if ($LASTEXITCODE -ne 0) { throw "Pushing tag $Tag failed." }

$notesFile = Join-Path $projectRoot ("docs\RELEASE-NOTES-$Tag.md")
$assets = @('release\SetupKit.exe', 'release\SetupKit-win-x64.zip') | Where-Object { Test-Path $_ }
if (-not $assets) { throw 'Could not find files in release\ to attach.' }

cmd /c "gh release view $Tag >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  Write-Host "[SetupKit] Creating release $Tag..."
  if (Test-Path $notesFile) {
    gh release create $Tag @assets --title "SetupKit $Tag" --notes-file $notesFile
  } else {
    gh release create $Tag @assets --title "SetupKit $Tag" --generate-notes
  }
  if ($LASTEXITCODE -ne 0) { throw 'Release creation failed.' }
} else {
  Write-Host "[SetupKit] Release $Tag already exists - updating assets and notes..."
  gh release upload $Tag @assets --clobber
  if ($LASTEXITCODE -ne 0) { throw 'Release asset upload failed.' }
  if (Test-Path $notesFile) {
    gh release edit $Tag --title "SetupKit $Tag" --notes-file $notesFile | Out-Null
  }
}

Write-Host ''
Write-Host '=============================================='
Write-Host '  DONE!'
Write-Host "  Repo   : https://github.com/$login/$RepoName"
Write-Host "  Release: https://github.com/$login/$RepoName/releases/tag/$Tag"
Write-Host '=============================================='
