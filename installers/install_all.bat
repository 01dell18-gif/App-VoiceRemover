@echo off
title FYJ Channel Voice - Installer Lengkap Perangkat Baru
color 0A

echo ======================================================================
echo       FYJ Channel Voice - Installer Lengkap Perangkat Baru
echo ======================================================================
echo.
echo Installer ini akan memasang semua aplikasi dan modul yang dibutuhkan 
echo agar FYJ Channel Voice dapat memisahkan vokal, musik, bass, dan drum 
echo secara 100 persen bersih - Zero Bleed - di perangkat ini.
echo.
echo 1. Node.js LTS - Runtime Server dan Web App
echo 2. Python 3.11 - Runtime Interpreter AI
echo 3. Modul AI Demucs dan PyTorch CPU - Mesin Pemisah Kualitas Studio
echo.
echo ======================================================================
echo.

REM -------------------------------------------------------------------
REM 1. Cek dan Pasang Node.js
REM -------------------------------------------------------------------
echo [1/3] Memeriksa Node.js...
set "NODE_CMD="
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 set "NODE_CMD=node"

if not defined NODE_CMD (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    ) else if exist "%LocalAppData%\Programs\nodejs\node.exe" (
        set "NODE_CMD=%LocalAppData%\Programs\nodejs\node.exe"
    )
)

if defined NODE_CMD (
    for /f "tokens=*" %%v in ('"%NODE_CMD%" -v') do set "NODE_VER=%%v"
    echo [OK] Node.js sudah terpasang: %NODE_VER%
) else (
    echo [!] Node.js belum terpasang di perangkat ini.
    if exist "%~dp0node-v20.18.0-x64.msi" (
        echo [*] Memulai pemasangan Node.js dari installer offline...
        echo Harap ikuti wizard instalasi di layar hingga selesai.
        start /wait msiexec /i "%~dp0node-v20.18.0-x64.msi"
        set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
        if exist "%ProgramFiles%\nodejs\node.exe" (
            set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
            echo [OK] Node.js berhasil dipasang!
        )
    ) else (
        echo [!] File node-v20.18.0-x64.msi tidak ditemukan.
        start https://nodejs.org/en/download/
    )
)
echo.

REM -------------------------------------------------------------------
REM 2. Cek dan Pasang Python 3.11
REM -------------------------------------------------------------------
echo [2/3] Memeriksa Python 3.11...
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
        echo [*] Memasang Python 3.11 dari installer offline...
        start /wait "" "%~dp0python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 SimpleInstall=1
        if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
            set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
        )
        echo [OK] Python 3.11 berhasil dipasang!
    ) else (
        echo [!] File python-3.11.9-amd64.exe tidak ditemukan.
        start https://www.python.org/downloads/
    )
)

if defined PY_CMD (
    for /f "tokens=*" %%p in ('"%PY_CMD%" --version') do set "PY_VER=%%p"
    echo [OK] Python siap: %PY_VER%
)
echo.

REM -------------------------------------------------------------------
REM 3. Cek dan Pasang Paket AI Demucs dan UVR MDX-Net
REM -------------------------------------------------------------------
echo [3/3] Memeriksa Paket AI Demucs dan UVR MDX-Net...
if not defined PY_CMD goto :install_ai_done

set "DEMUCS_READY=0"
set "UVR_READY=0"

"%PY_CMD%" -m demucs --help >nul 2>&1
if not errorlevel 1 set "DEMUCS_READY=1"

"%PY_CMD%" -m audio_separator.utils.cli --version >nul 2>&1
if not errorlevel 1 set "UVR_READY=1"

if "%DEMUCS_READY%"=="1" if "%UVR_READY%"=="1" (
    echo [OK] Modul AI Demucs dan UVR MDX-Net sudah aktif dan siap digunakan!
    goto :install_ai_done
)

echo [!] Paket AI belum lengkap.
echo [*] Memasang modul AI Demucs, UVR MDX-Net, PyTorch CPU, ONNX, dan dependensi audio...
echo Harap tunggu beberapa saat...
if exist "%~dp0setup_ai_packages.bat" (
    call "%~dp0setup_ai_packages.bat"
) else (
    "%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
    "%PY_CMD%" -m pip install numpy demucs soundfile lameenc onnxruntime audio-separator
)
echo [OK] Paket AI berhasil disiapkan!

:install_ai_done
echo.

echo ======================================================================
echo  [OK] Semua instalasi dan konfigurasi berhasil diselesaikan!
echo  Untuk memulai aplikasi web, silakan jalankan start.bat
echo  yang berada di folder utama proyek.
echo ======================================================================
echo.
pause
