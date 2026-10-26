@echo off
setlocal enabledelayedexpansion
title CARVANA SRL - Sync Repo Zety -> Google Drive (ParcOS)

echo ===============================================================================
echo   CARVANA SRL / ParcOS - SINCRONIZARE REPO ZETY -^> GOOGLE DRIVE
echo   Node Sursa: Zety (zbook-norby)   -^>   Cloud Hub: Google Drive I:\
echo ===============================================================================
echo.

:: 1. Verificare folder sursa local (Zety)
set "SRC_DIR=C:\Projects\parcos"
if not exist "%SRC_DIR%" (
    set "SRC_DIR=%~dp0.."
)
pushd "%SRC_DIR%"
set "SRC_DIR=%CD%"
popd

if not exist "%SRC_DIR%\package.json" (
    echo [EROARE] Folderul sursa %SRC_DIR% nu pare a fi radacina ParcOS!
    echo Nu s-a gasit package.json.
    pause
    exit /b 1
)

:: 2. Detectare Google Drive Mount (I: implicit, G: fallback)
set "GDRIVE_HUB="
if exist "I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS" (
    set "GDRIVE_HUB=I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
) else if exist "G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS" (
    set "GDRIVE_HUB=G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
)

if "%GDRIVE_HUB%"=="" (
    echo [EROARE] Nu s-a putut detecta Google Drive pe I:\ sau G:\!
    echo Asigurati-va ca aplicatia Google Drive for Desktop ruleaza in mod Stream.
    pause
    exit /b 1
)

if not exist "%GDRIVE_HUB%" (
    echo [*] Creare director tranzit pe Google Drive: %GDRIVE_HUB%
    mkdir "%GDRIVE_HUB%"
)

echo [*] Sursa Zety:       %SRC_DIR%
echo [*] Destinatie GDrive: %GDRIVE_HUB%
echo [*] Excluderi active: node_modules, dist, .next, .vite, *.log, *.tmp
echo.
echo Se porneste sincronizarea Robocopy... Va rugam asteptati...
echo -------------------------------------------------------------------------------

:: 3. Executie Robocopy Mirror (/MIR) cu excluderi de foldere grele
robocopy "%SRC_DIR%" "%GDRIVE_HUB%" /MIR /XD node_modules dist .next .vite /XF *.log *.tmp /R:2 /W:2 /MT:8 /NP /NDL

set "RC_EXIT=%ERRORLEVEL%"

echo.
echo -------------------------------------------------------------------------------
if %RC_EXIT% LSS 8 (
    echo [OK] Sincronizare finalizata cu succes pe Google Drive! (Cod Robocopy: %RC_EXIT%)
    if %RC_EXIT% EQU 0 echo       ^> Nicio modificare detectata (deja 100%% sincronizat).
    if %RC_EXIT% EQU 1 echo       ^> Fisiere noi/modificate copiate cu succes.
    if %RC_EXIT% EQU 2 echo       ^> Fisiere orfane sterse conform oglindirii /MIR.
    if %RC_EXIT% EQU 3 echo       ^> Fisiere copiate si orfane curatate.
    echo.
    echo Pasul urmator pe DESY (Desktop-Norby):
    echo 1. Deschide Google Drive: %GDRIVE_HUB%
    echo 2. Ruleaza scriptul: SYNC_TO_DESY.bat
) else (
    echo [EROARE] Robocopy a intampinat erori critice! (Cod eroare: %RC_EXIT%)
    echo Verificati daca fisierele nu sunt blocate de alt proces sau editor.
)
echo ===============================================================================
echo.
pause
