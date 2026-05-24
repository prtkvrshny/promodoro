@echo off
echo ========================================
echo   PROMODORO - Setup ^& Launch
echo ========================================
echo.

REM Extract fonts if zip files exist in Downloads
echo [1/3] Setting up fonts...
if not exist "fonts" mkdir fonts

if exist "%USERPROFILE%\Downloads\hackensack.zip" (
    echo   Extracting Hackensack font...
    tar -xf "%USERPROFILE%\Downloads\hackensack.zip" -C fonts 2>nul
)

if exist "%USERPROFILE%\Downloads\honfleur.zip" (
    echo   Extracting Honfleur font...
    tar -xf "%USERPROFILE%\Downloads\honfleur.zip" -C fonts 2>nul
)

if exist "%USERPROFILE%\Downloads\gohan_2.zip" (
    echo   Extracting Gohan font...
    tar -xf "%USERPROFILE%\Downloads\gohan_2.zip" -C fonts 2>nul
)

echo   Done.

REM Copy background image
echo.
echo [2/3] Setting up background image...
if not exist "assets" mkdir assets

set "BG1=%USERPROFILE%\.gemini\antigravity\brain\5485cb57-1444-445a-a68e-c9efbb1ae8da\cabin_no_rain_1779615655514.png"
set "BG2=%USERPROFILE%\.gemini\antigravity\brain\5485cb57-1444-445a-a68e-c9efbb1ae8da\media__1779615072686.png"

if not exist "assets\bg-cabin.png" (
    if exist "%BG1%" (
        copy "%BG1%" "assets\bg-cabin.png" >nul
        echo   Background image copied!
    ) else if exist "%BG2%" (
        copy "%BG2%" "assets\bg-cabin.png" >nul
        echo   Background image copied!
    ) else (
        echo   No background found - server will auto-discover it.
    )
) else (
    echo   Background image: OK
)

REM Start server
echo.
echo [3/3] Starting server...
echo.
start http://localhost:3000
node server.js
pause
