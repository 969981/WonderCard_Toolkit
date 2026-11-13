# Install the actual NSIS artifact in an ephemeral Windows runner, then launch it.
# Explicitly NOT a native file dialog/UI test; that remains a manual acceptance gate.
$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\..\apps\studio\src-tauri\target\release\bundle\nsis"
$installer = Get-ChildItem -LiteralPath $root -Filter "*.exe" -File | Select-Object -First 1
if (-not $installer) { throw "No NSIS installer generated" }

$installDir = Join-Path $env:RUNNER_TEMP "WCProInstalled"
Write-Output "Installing packaged NSIS build to an ephemeral user directory"
$run = Start-Process -FilePath $installer.FullName -ArgumentList @("/S", "/D=$installDir") -PassThru -Wait
if ($run.ExitCode -ne 0) { throw "NSIS installer failed ($($run.ExitCode))" }

$installed = @(Get-ChildItem -LiteralPath $installDir -Filter "wondercard-studio.exe" -File -Recurse -ErrorAction SilentlyContinue)
if ($installed.Count -eq 0) {
  # Some NSIS per-user install modes ignore the suggested directory. Search the
  # current-user uninstall registry rather than asserting that installation failed.
  $entries = @()
  foreach ($key in @("HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
                       "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall")) {
    if (Test-Path $key) { $entries += Get-ChildItem $key -ErrorAction SilentlyContinue }
  }
  foreach ($entry in $entries) {
    $item = Get-ItemProperty $entry.PSPath -ErrorAction SilentlyContinue
    if ($item.DisplayName -like "*WonderCard*") {
      $dir = $item.InstallLocation
      if ($dir -and (Test-Path $dir)) {
        $installed += @(Get-ChildItem -LiteralPath $dir -Recurse -Filter "wondercard-studio.exe" -File -ErrorAction SilentlyContinue)
      }
    }
  }
}
if ($installed.Count -eq 0) { throw "Installer exited successfully but installed executable was not found" }
$installedExe = $installed[0].FullName
Write-Output ("Installed executable found: " + $installedExe)
Set-Content -LiteralPath (Join-Path $env:RUNNER_TEMP "wondercard-installed-exe.txt") -Value $installedExe -Encoding UTF8
$process = Start-Process -FilePath $installedExe -PassThru -ErrorAction Stop
try {
  Start-Sleep -Seconds 7
  $process.Refresh()
  if ($process.HasExited) { throw "Installed Tauri app exited early: $($process.ExitCode)" }
  Write-Output "PASS: actual NSIS installer installed WonderCard and installed EXE launched without immediate exit"
  Write-Output "LIMIT: Windows dialog/FS open and save interactions still need automated GUI or manual QA"
} finally {
  try { $process.Refresh(); if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } } catch {}
}
