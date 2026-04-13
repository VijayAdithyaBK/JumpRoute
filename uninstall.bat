@echo off
:: ─────────────────────────────────────────────────────────────────
::  ProfileLink – Uninstaller
::  Removes the native messaging host registration from the registry.
:: ─────────────────────────────────────────────────────────────────

echo.
echo  Uninstalling ProfileLink native host...

set "HOST_NAME=com.profilelink.host"

reg delete "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\%HOST_NAME%" /f >nul 2>&1

if %errorlevel% equ 0 (
    echo  [OK] Registry entry removed.
) else (
    echo  [INFO] Registry entry not found (already removed?).
)

echo  [OK] Uninstall complete.
echo.
pause
