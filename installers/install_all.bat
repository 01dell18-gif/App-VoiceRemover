@echo off
chcp 65001 >nul
title FYJ Channel Voice - Installer Aplikasi Pendukung
color 0A

echo ======================================================================
echo       📦 FYJ Channel Voice - Installer Aplikasi Pendukung 📦
echo ======================================================================
echo.
echo Installer ini akan memasang aplikasi yang dibutuhkan oleh 
echo FYJ Channel Voice agar dapat berjalan di perangkat ini.
echo.
echo 1. Node.js LTS (Wajib - Runtime Server & Web App)
echo 2. Python 3.11 (Opsional - Mesin AI Pemisah Audio)
echo.
echo ======================================================================
echo.

:: 1. Cek & Pasang Node.js
echo [1/2] Memeriksa Node.js...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo [OK] Node.js sudah terpasang: %NODE_VER%
) else (
    echo [!] Node.js belum terpasang.
    if exist "%~dp0node-v20.18.0-x64.msi" (
        echo [*] Menjalankan installer Node.js...
        echo Silakan ikuti wizard instalasi di layar hingga selesai.
        start /wait msiexec /i "%~dp0node-v20.18.0-x64.msi"
        echo [OK] Instalasi Node.js selesai.
    ) else (
        echo [!] File node-v20.18.0-x64.msi tidak ditemukan di folder ini.
        start https://nodejs.org/en/download/
    )
)
echo.

:: 2. Cek & Pasang Python
echo [2/2] Memeriksa Python...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('python --version') do set PY_VER=%%v
    echo [OK] Python sudah terpasang: %PY_VER%
) else (
    echo [!] Python belum terpasang.
    if exist "%~dp0python-3.11.9-amd64.exe" (
        echo [*] Menjalankan installer Python 3.11...
        echo PENTING: Centang opsi "Add python.exe to PATH" saat instalasi!
        start /wait "" "%~dp0python-3.11.9-amd64.exe"
        echo [OK] Instalasi Python selesai.
    ) else (
        echo [!] File python-3.11.9-amd64.exe tidak ditemukan di folder ini.
        start https://www.python.org/downloads/
    )
)
echo.

echo ======================================================================
echo  ✅ Semua pemeriksaan dan instalasi selesai!
echo  Silakan jalankan "start.bat" di folder utama untuk memulai web app.
echo ======================================================================
echo.
pause
