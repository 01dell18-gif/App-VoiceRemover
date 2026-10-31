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

:: 2. Cek & Pasang Python & Demucs AI
echo [2/2] Memeriksa Python & Modul AI Demucs...
set "PY_CMD="
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
) else if exist "%ProgramFiles%\Python311\python.exe" (
    set "PY_CMD=%ProgramFiles%\Python311\python.exe"
) else (
    where python >nul 2>&1 && set "PY_CMD=python"
)

if not defined PY_CMD (
    echo [!] Python belum terpasang.
    if exist "%~dp0python-3.11.9-amd64.exe" (
        echo [*] Menjalankan installer Python 3.11...
        start /wait "" "%~dp0python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 SimpleInstall=1
        if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
            set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
        )
        echo [OK] Instalasi Python 3.11 selesai.
    ) else (
        echo [!] File python-3.11.9-amd64.exe tidak ditemukan di folder ini.
        start https://www.python.org/downloads/
    )
)

if defined PY_CMD (
    for /f "tokens=*" %%p in ('"%PY_CMD%" --version') do set PY_VER=%%p
    echo [OK] Python terpasang: %PY_VER%
    echo [*] Memeriksa dan memasang modul AI Demucs...
    "%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
    "%PY_CMD%" -m pip install demucs numpy
    echo [OK] Modul AI Demucs berhasil dipasang!
)
echo.

echo ======================================================================
echo  ✅ Semua pemeriksaan dan instalasi selesai!
echo  Silakan jalankan "start.bat" di folder utama untuk memulai web app.
echo ======================================================================
echo.
pause
