@echo off
setlocal enabledelayedexpansion
title CARVANA SRL - Sync Repo Google Drive -> Zety (ParcOS)

echo ===============================================================================
echo   CARVANA SRL / ParcOS - SINCRONIZARE REPO GOOGLE DRIVE -^> ZETY
echo   Cloud Hub: Google Drive   -^>   Node Destinatie: Zety (zbook-norby)
echo ===============================================================================
echo.

:: 1. Detectare Google Drive Mount
set "GDRIVE_HUB="
if exist "I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync" (
    set "GDRIVE_HUB=I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
) else if exist "G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync" (
    set "GDRIVE_HUB=G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
)

if "%GDRIVE_HUB%"=="" (
    echo [EROARE] Nu s-a gasit folderul Repo_Sync pe I:\ sau G:\!
    pause
    exit /b 1
)

:: 2. Folder Zety
set "DEST_DIR=C:\Projects\parcos"
if not exist "%DEST_DIR%" (
    set "DEST_DIR=%~dp0.."
)
pushd "%DEST_DIR%"
set "DEST_DIR=%CD%"
popd

echo [*] Sursa GDrive:      %GDRIVE_HUB%
echo [*] Destinatie Zety:   %DEST_DIR%
echo [*] Excluderi active:  node_modules, dist, .next, .vite, *.log, *.tmp
echo.
echo Se porneste transferul Robocopy spre Zety...
echo -------------------------------------------------------------------------------

robocopy "%GDRIVE_HUB%" "%DEST_DIR%" /MIR /XD node_modules dist .next .vite /XF *.log *.tmp /R:2 /W:2 /MT:8 /NP /NDL

set "RC_EXIT=%ERRORLEVEL%"

echo.
echo -------------------------------------------------------------------------------
if %RC_EXIT% LSS 8 (
    echo [OK] Sincronizare reusita pe Zety in %DEST_DIR%! (Cod Robocopy: %RC_EXIT%)
) else (
    echo [EROARE] Robocopy a intampinat erori critice! (Cod eroare: %RC_EXIT%)
)
echo ===============================================================================
echo.
pause
