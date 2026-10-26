@echo off
setlocal enabledelayedexpansion
title CARVANA SRL - Sync Repo Desy -^> Google Drive (ParcOS)

echo ===============================================================================
echo   CARVANA SRL / ParcOS - SINCRONIZARE REPO DESY -^> GOOGLE DRIVE
echo   Node Sursa: Desy (Desktop-Norby)   -^>   Cloud Hub: Google Drive I:\
echo ===============================================================================
echo.

:: 1. Verificare folder sursa local pe Desy
set "SRC_DIR=C:\project\Parcos"
if not exist "%SRC_DIR%" (
    if exist "C:\Projects\parcos" (
        set "SRC_DIR=C:\Projects\parcos"
    ) else (
        set "SRC_DIR=%~dp0"
        if "!SRC_DIR:~-1!"=="\" set "SRC_DIR=!SRC_DIR:~0,-1!"
    )
)
pushd "%SRC_DIR%"
set "SRC_DIR=%CD%"
popd

if not exist "%SRC_DIR%\package.json" (
    echo [EROARE] Folderul sursa %SRC_DIR% nu contine repo-ul ParcOS!
    pause
    exit /b 1
)

:: 2. Detectare Google Drive Mount
set "GDRIVE_HUB="
if exist "I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS" (
    set "GDRIVE_HUB=I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
) else if exist "G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS" (
    set "GDRIVE_HUB=G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
)

if "%GDRIVE_HUB%"=="" (
    echo [EROARE] Nu s-a putut detecta Google Drive pe I:\ sau G:\!
    pause
    exit /b 1
)

if not exist "%GDRIVE_HUB%" mkdir "%GDRIVE_HUB%"

echo [*] Sursa Desy:        %SRC_DIR%
echo [*] Destinatie GDrive: %GDRIVE_HUB%
echo.
echo Se porneste sincronizarea Robocopy spre Google Drive...
echo -------------------------------------------------------------------------------

robocopy "%SRC_DIR%" "%GDRIVE_HUB%" /MIR /XD node_modules dist .next .vite /XF *.log *.tmp /R:2 /W:2 /MT:8 /NP /NDL

set "RC_EXIT=%ERRORLEVEL%"

echo.
echo -------------------------------------------------------------------------------
if %RC_EXIT% LSS 8 (
    echo [OK] Modificarile de pe Desy au fost urcate cu succes pe Google Drive! (Cod: %RC_EXIT%)
    echo Cand revii pe Zety, ruleaza: SYNC_GDRIVE_TO_ZETY.bat
) else (
    echo [EROARE] Robocopy a intampinat erori! (Cod: %RC_EXIT%)
)
echo ===============================================================================
echo.
pause
