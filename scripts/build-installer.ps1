param(
  [switch]$SkipNativeBuild
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$packageFile = Join-Path $projectRoot 'package.json'
$nativeBuildScript = Join-Path $PSScriptRoot 'build-native.ps1'
$installerDefinition = Join-Path $projectRoot 'installer\SetupKit.iss'
$executable = Join-Path $projectRoot 'release\SetupKit.exe'

function Find-InnoSetupCompiler {
  $command = Get-Command 'ISCC.exe' -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6\ISCC.exe'),
    (Join-Path $env:ProgramFiles 'Inno Setup 6\ISCC.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Inno Setup 6\ISCC.exe')
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
      return $candidate
    }
  }

  return $null
}

$package = Get-Content -LiteralPath $packageFile -Raw | ConvertFrom-Json
$version = [string]$package.version
if ($version -notmatch '^\d+\.\d+\.\d+(?:\.\d+)?$') {
  throw "Invalid installer version in package.json: $version"
}

if (-not $SkipNativeBuild) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $nativeBuildScript
  if ($LASTEXITCODE -ne 0) {
    throw 'Native application build failed.'
  }
}

if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
  throw "Native executable not found: $executable. Run without -SkipNativeBuild first."
}

$compiler = Find-InnoSetupCompiler
if (-not $compiler) {
  throw @'
Inno Setup 6 is required to build SetupKit-Setup.exe.
Install it with: winget install --id JRSoftware.InnoSetup -e
Then run this script again.
'@
}

Write-Output "Building SetupKit installer v$version with $compiler"
& $compiler "/DMyAppVersion=$version" $installerDefinition
if ($LASTEXITCODE -ne 0) {
  throw 'Installer build failed.'
}

$installer = Join-Path $projectRoot "release\SetupKit-Setup-$version-win-x64.exe"
if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) {
  throw "Expected installer was not created: $installer"
}

$artifact = Get-Item -LiteralPath $installer
$hash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash
Write-Output ('Built {0:N2} MB: {1}' -f ($artifact.Length / 1MB), $artifact.FullName)
Write-Output "SHA256: $hash"