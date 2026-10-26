@echo off
setlocal enabledelayedexpansion
title CARVANA SRL - Sync Repo Google Drive -^> Desy (ParcOS)

echo ===============================================================================
echo   CARVANA SRL / ParcOS - SINCRONIZARE REPO GOOGLE DRIVE -^> DESY
echo   Cloud Hub: Google Drive   -^>   Node Destinatie: Desy (Desktop-Norby)
echo ===============================================================================
echo.

:: 1. Detectare folder sursa GDrive Hub (I: implicit, G: fallback sau directorul curent al scriptului)
set "GDRIVE_HUB="
if exist "%~dp0package.json" (
    set "GDRIVE_HUB=%~dp0"
    :: eliminare trailing backslash daca exista
    if "!GDRIVE_HUB:~-1!"=="\" set "GDRIVE_HUB=!GDRIVE_HUB:~0,-1!"
) else if exist "I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync\package.json" (
    set "GDRIVE_HUB=I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
) else if exist "G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync\package.json" (
    set "GDRIVE_HUB=G:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync"
)

if "%GDRIVE_HUB%"=="" (
    echo [EROARE] Nu s-a gasit folderul Repo_Sync cu package.json pe I:\, G:\ sau in directorul curent!
    echo Asigurati-va ca Google Drive for Desktop este pornit si sincronizat pe Desy.
    pause
    exit /b 1
)

:: 2. Stabilire cale tinta pe Desy (C:\project\Parcos conform cerintei, fallback C:\Projects\parcos)
set "DEST_DIR=C:\project\Parcos"
if not exist "%DEST_DIR%" (
    if exist "C:\Projects\parcos" (
        set "DEST_DIR=C:\Projects\parcos"
    ) else (
        echo [*] Folderul tinta nu exista. Se creeaza: %DEST_DIR%
        mkdir "%DEST_DIR%"
    )
)

echo [*] Sursa GDrive:      %GDRIVE_HUB%
echo [*] Destinatie Desy:   %DEST_DIR%
echo [*] Excluderi active:  node_modules, dist, .next, .vite, *.log, *.tmp
echo     (node_modules local NU va fi sters pe Desy daca exista deja)
echo.
echo Se porneste transferul Robocopy... Va rugam asteptati...
echo -------------------------------------------------------------------------------

:: 3. Executie Robocopy Mirror (/MIR) spre Desy
robocopy "%GDRIVE_HUB%" "%DEST_DIR%" /MIR /XD node_modules dist .next .vite /XF *.log *.tmp /R:2 /W:2 /MT:8 /NP /NDL

set "RC_EXIT=%ERRORLEVEL%"

echo.
echo -------------------------------------------------------------------------------
if %RC_EXIT% LSS 8 (
    echo [OK] Sincronizare reusita pe Desy in %DEST_DIR%! (Cod Robocopy: %RC_EXIT%)
    echo.
    if not exist "%DEST_DIR%\node_modules" (
        echo [INFO] Prima instalare detectata (lipseste node_modules).
        echo Pentru a instala dependintele si a porni serverul:
        echo   1. cd /d %DEST_DIR%
        echo   2. npm install
        echo   3. npm run dev
    ) else (
        echo [OK] node_modules existent si protejat.
        echo Poti continua dezvoltarea imediat pe Desy:
        echo   cd /d %DEST_DIR% ^&^& npm run dev
    )
) else (
    echo [EROARE] Robocopy a intampinat erori critice! (Cod eroare: %RC_EXIT%)
)
echo ===============================================================================
echo.
pause
