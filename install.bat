@echo off
setlocal EnableDelayedExpansion

:: ─────────────────────────────────────────────────────────────────
::  JumpRoute – Native Messaging Host Installer
::  Run this AFTER loading the extension in Chrome to register
::  the native host. Requires Node.js to be installed.
:: ─────────────────────────────────────────────────────────────────

echo.
echo  ==========================================
echo  =         JumpRoute Installer v1.0       =
echo  ==========================================
echo.

:: ── Check Node.js ───────────────────────────────────────────────

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo          Download it from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js found: %NODE_VER%

:: ── Get Extension ID ────────────────────────────────────────────

echo.
echo  Open chrome://extensions, enable Developer Mode,
echo  and copy the extension ID for JumpRoute.
echo.
set /p EXT_ID="  Enter extension ID: "

if "%EXT_ID%"=="" (
    echo  [ERROR] Extension ID cannot be empty.
    pause
    exit /b 1
)

echo  [OK] Extension ID: %EXT_ID%

:: ── Resolve Paths ───────────────────────────────────────────────

set "SCRIPT_DIR=%~dp0"
set "HOST_DIR=%SCRIPT_DIR%native_host"
set "HOST_JS=%HOST_DIR%\host.js"
set "HOST_BAT=%HOST_DIR%\host.bat"
set "MANIFEST=%HOST_DIR%\com.profilelink.host.json"
set "HOST_NAME=com.profilelink.host"

:: ── Create host.bat (Node.js wrapper) ───────────────────────────

echo @echo off> "%HOST_BAT%"
echo node "%HOST_JS%">> "%HOST_BAT%"

echo  [OK] Created host.bat

:: ── Generate Native Messaging Manifest ──────────────────────────

:: Escape backslashes in path for JSON
set "ESCAPED_BAT=%HOST_BAT:\=\\%"

(
echo {
echo   "name": "%HOST_NAME%",
echo   "description": "ProfileLink native messaging host - opens links in specified Chrome profile",
echo   "path": "%ESCAPED_BAT%",
echo   "type": "stdio",
echo   "allowed_origins": ["chrome-extension://%EXT_ID%/"]
echo }
) > "%MANIFEST%"

echo  [OK] Created native messaging manifest

:: ── Register in Windows Registry ────────────────────────────────

reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\%HOST_NAME%" /ve /t REG_SZ /d "%MANIFEST%" /f >nul 2>&1

if %errorlevel% equ 0 (
    echo  [OK] Registered in Windows Registry
) else (
    echo  [ERROR] Failed to write registry key.
    echo          Try running as Administrator.
    pause
    exit /b 1
)

:: ── Done ────────────────────────────────────────────────────────

echo.
echo  ============================================
echo   Installation complete!
echo.
echo   Next steps:
echo     1. Reload the extension in chrome://extensions
echo     2. Click the JumpRoute icon to verify connection
echo     3. Right-click any link to open in your chosen profile
echo  ============================================
echo.
pause
