# Windows CI: native launch smoke only. This does NOT prove interactive dialog I/O.
param(
 [string]$Executable = "$PSScriptRoot\..\apps\studio\src-tauri\target\release\wondercard-studio.exe"
)
$ErrorActionPreference="Stop"
$resolved=[System.IO.Path]::GetFullPath($Executable)
if(-not (Test-Path -LiteralPath $resolved)){throw "Desktop EXE missing: $resolved"}
Write-Output "Starting Tauri executable: $resolved"
$process=Start-Process -FilePath $resolved -PassThru -ErrorAction Stop
try {
 Start-Sleep -Seconds 6
 $process.Refresh()
 if($process.HasExited){throw "Tauri process exited early with exit code $($process.ExitCode)"}
 Write-Output "PASS: desktop process launched and remained running for six seconds"
 Write-Output "LIMIT: native file dialog and Save As interactions require interactive Windows smoke"
} finally {
 try {$process.Refresh();if(-not $process.HasExited){Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue}}catch{}
}
