param(
  [Parameter(Mandatory = $true)]
  [string]$Executable,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,
  [int]$Width = 1360,
  [int]$Height = 900,
  [ValidateSet('catalog', 'queue')]
  [string]$View = 'catalog',
  [switch]$Dark,
  [switch]$RunSimulation,
  [int]$WaitSeconds = 4
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;

public static class SetupKitQANative {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }

  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

  [DllImport("user32.dll")]
  public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int width, int height, bool repaint);

  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int command);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);

  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr insertAfter, int x, int y, int width, int height, uint flags);

  [DllImport("user32.dll")]
  public static extern bool SetCursorPos(int x, int y);

  [DllImport("user32.dll")]
  public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extraInfo);
}
'@

function Invoke-WindowClick {
  param(
    [IntPtr]$WindowHandle,
    [int]$ScreenX,
    [int]$ScreenY
  )
  [SetupKitQANative]::SetWindowPos($WindowHandle, [IntPtr](-1), 0, 0, 0, 0, 0x0003) | Out-Null
  [SetupKitQANative]::SetForegroundWindow($WindowHandle) | Out-Null
  [SetupKitQANative]::SetCursorPos($ScreenX, $ScreenY) | Out-Null
  [SetupKitQANative]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
  [SetupKitQANative]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 500
}

$resolvedExecutable = (Resolve-Path -LiteralPath $Executable).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$appProcess = Start-Process -FilePath $resolvedExecutable -PassThru
try {
  $deadline = [DateTime]::UtcNow.AddSeconds(20)
  do {
    Start-Sleep -Milliseconds 250
    $appProcess.Refresh()
  } while ($appProcess.MainWindowHandle -eq [IntPtr]::Zero -and [DateTime]::UtcNow -lt $deadline)

  if ($appProcess.MainWindowHandle -eq [IntPtr]::Zero) {
    throw 'SetupKit did not create a visible window.'
  }

  $handle = $appProcess.MainWindowHandle
  [SetupKitQANative]::ShowWindow($handle, 5) | Out-Null
  [SetupKitQANative]::MoveWindow($handle, 40, 40, $Width, $Height, $true) | Out-Null
  [SetupKitQANative]::SetForegroundWindow($handle) | Out-Null
  Start-Sleep -Seconds 4

  $rect = New-Object SetupKitQANative+RECT
  if (-not [SetupKitQANative]::GetWindowRect($handle, [ref]$rect)) {
    throw 'Could not read the SetupKit window bounds.'
  }

  if ($Dark) {
    Invoke-WindowClick -WindowHandle $handle -ScreenX ($rect.Right - 85) -ScreenY ($rect.Top + 85)
  }
  if ($View -eq 'queue') {
    $queueX = if ($Width -le 880) { $rect.Left + 38 } else { $rect.Left + 112 }
    Invoke-WindowClick -WindowHandle $handle -ScreenX $queueX -ScreenY ($rect.Top + 198)
  }
  if ($RunSimulation -and $View -eq 'queue' -and $Width -gt 880) {
    Start-Sleep -Seconds 6
    Invoke-WindowClick -WindowHandle $handle -ScreenX ($rect.Right - 226) -ScreenY ($rect.Top + 602)
    Start-Sleep -Seconds 3
  }
  else {
    Start-Sleep -Seconds $WaitSeconds
  }

  [SetupKitQANative]::ShowWindow($handle, 9) | Out-Null
  [SetupKitQANative]::SetForegroundWindow($handle) | Out-Null
  Start-Sleep -Milliseconds 300
  if (-not [SetupKitQANative]::GetWindowRect($handle, [ref]$rect)) {
    throw 'Could not read the SetupKit window bounds.'
  }

  $captureWidth = $rect.Right - $rect.Left
  $captureHeight = $rect.Bottom - $rect.Top
  $bitmap = New-Object System.Drawing.Bitmap $captureWidth, $captureHeight
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $deviceContext = $graphics.GetHdc()
    try {
      if (-not [SetupKitQANative]::PrintWindow($handle, $deviceContext, 2)) {
        throw 'Could not render the SetupKit window.'
      }
    }
    finally {
      $graphics.ReleaseHdc($deviceContext)
    }
    $bitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }

  [SetupKitQANative]::SetWindowPos($handle, [IntPtr](-2), 0, 0, 0, 0, 0x0003) | Out-Null
  if ($Dark) {
    Invoke-WindowClick -WindowHandle $handle -ScreenX ($rect.Right - 85) -ScreenY ($rect.Top + 85)
  }
  Write-Output $resolvedOutput
}
finally {
  if (-not $appProcess.HasExited) {
    $appProcess.CloseMainWindow() | Out-Null
    if (-not $appProcess.WaitForExit(2500)) {
      Stop-Process -Id $appProcess.Id -Force
    }
  }
}
