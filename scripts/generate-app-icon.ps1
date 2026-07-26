$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$buildDirectory = Join-Path $projectRoot 'build'
$windowsDirectory = Join-Path $buildDirectory 'windows'
New-Item -ItemType Directory -Path $windowsDirectory -Force | Out-Null

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-SetupKitBitmap {
  param([int]$Size)

  $bitmap = [System.Drawing.Bitmap]::new(
    $Size,
    $Size,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = $Size / 256.0
  $backgroundPath = New-RoundedRectanglePath -X (12 * $scale) -Y (12 * $scale) `
    -Width (232 * $scale) -Height (232 * $scale) -Radius (54 * $scale)
  $backgroundBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.ColorTranslator]::FromHtml('#2C7A68')
  )
  $graphics.FillPath($backgroundBrush, $backgroundPath)

  $pen = [System.Drawing.Pen]::new(
    [System.Drawing.Color]::White,
    [single][Math]::Max(1.4, 12 * $scale)
  )
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $top = [System.Drawing.PointF]::new([single](128 * $scale), [single](61 * $scale))
  $leftTop = [System.Drawing.PointF]::new([single](73 * $scale), [single](93 * $scale))
  $center = [System.Drawing.PointF]::new([single](128 * $scale), [single](126 * $scale))
  $rightTop = [System.Drawing.PointF]::new([single](183 * $scale), [single](93 * $scale))
  $leftBottom = [System.Drawing.PointF]::new([single](73 * $scale), [single](160 * $scale))
  $bottom = [System.Drawing.PointF]::new([single](128 * $scale), [single](193 * $scale))
  $rightBottom = [System.Drawing.PointF]::new([single](183 * $scale), [single](160 * $scale))

  $graphics.DrawLines($pen, [System.Drawing.PointF[]]@($top, $rightTop, $center, $leftTop, $top))
  $graphics.DrawLines($pen, [System.Drawing.PointF[]]@($leftTop, $leftBottom, $bottom, $rightBottom, $rightTop))
  $graphics.DrawLine($pen, $center, $bottom)

  $pen.Dispose()
  $backgroundBrush.Dispose()
  $backgroundPath.Dispose()
  $graphics.Dispose()
  return $bitmap
}

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$images = New-Object System.Collections.Generic.List[byte[]]
foreach ($size in $sizes) {
  $bitmap = New-SetupKitBitmap -Size $size
  $stream = New-Object System.IO.MemoryStream
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $images.Add($stream.ToArray())
  $stream.Dispose()
  $bitmap.Dispose()
}

$iconStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($iconStream)
$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]$sizes.Count)
$offset = 6 + (16 * $sizes.Count)
for ($index = 0; $index -lt $sizes.Count; $index++) {
  $size = $sizes[$index]
  $writer.Write([byte]$(if ($size -eq 256) { 0 } else { $size }))
  $writer.Write([byte]$(if ($size -eq 256) { 0 } else { $size }))
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([uint16]1)
  $writer.Write([uint16]32)
  $writer.Write([uint32]$images[$index].Length)
  $writer.Write([uint32]$offset)
  $offset += $images[$index].Length
}
foreach ($image in $images) {
  $writer.Write($image)
}
$writer.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $windowsDirectory 'icon.ico'), $iconStream.ToArray())
$writer.Dispose()
$iconStream.Dispose()

$appIcon = New-SetupKitBitmap -Size 512
$appIcon.Save((Join-Path $buildDirectory 'appicon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$appIcon.Dispose()
