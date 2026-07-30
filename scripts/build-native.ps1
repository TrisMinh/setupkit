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
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'tidy-layout.ps1')
  if ($LASTEXITCODE -ne 0) {
    throw 'Không thể dọn bố cục dự án.'
  }

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
      (Join-Path $projectRoot 'docs\CHANGELOG.md'),
      (Join-Path $projectRoot 'docs\CATALOG.md'),
      (Join-Path $projectRoot 'docs\RELEASE-NOTES-v0.9.1.md'),
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
