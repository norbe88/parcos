# scripts/notebooklm_reauth.ps1
param(
    [string]$Account = "carvana.gemini3@gmail.com",
    [string]$Browser = "chrome"
)

Write-Host "=== [NOTEBOOKLM REAUTH PROTOCOL] ===" -ForegroundColor Cyan
Write-Host "Target Account: $Account"
Write-Host "Browser: $Browser"

# 1. Pre-check & Clean Lockfiles
$ProfileDir = "$env:USERPROFILE\.notebooklm\profiles\default"
if (Test-Path $ProfileDir) {
    Write-Host "Cleaning stale lockfiles in $ProfileDir..." -ForegroundColor Yellow
    Get-ChildItem -Path $ProfileDir -Filter "*.lock" | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 2. Check for hanging notebooklm processes (not touching user's normal Chrome)
Write-Host "Checking for orphan processes locking browser profile..." -ForegroundColor Yellow
$OrphanProcs = Get-CimInstance Win32_Process | Where-Object { 
    $_.CommandLine -like "*notebooklm*browser_profile*" -or 
    ($_.Name -eq "chrome.exe" -and $_.CommandLine -like "*--user-data-dir=*notebooklm*")
}
if ($OrphanProcs) {
    foreach ($p in $OrphanProcs) {
        Write-Host "Terminating orphan process $($p.ProcessId): $($p.Name)" -ForegroundColor Red
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

# 3. Locate notebooklm.exe
$NblmExe = (Get-Command notebooklm -ErrorAction SilentlyContinue).Source
if (-not $NblmExe) {
    $PotentialPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts\notebooklm.exe",
        "$env:APPDATA\Python\Python314\Scripts\notebooklm.exe"
    )
    foreach ($p in $PotentialPaths) {
        if (Test-Path $p) {
            $NblmExe = $p
            break
        }
    }
}

if (-not $NblmExe) {
    Write-Error "notebooklm.exe not found on system PATH or known Python paths."
    exit 1
}

Write-Host "Found notebooklm: $NblmExe" -ForegroundColor Green
Write-Host "Launching OAuth Google Sign-in via Chrome window..." -ForegroundColor Cyan

# 4. Launch login
& $NblmExe login --browser $Browser --fresh

# 5. Confirm status
Write-Host "Verifying session status..." -ForegroundColor Cyan
& $NblmExe status
