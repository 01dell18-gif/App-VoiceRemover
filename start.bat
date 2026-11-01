@echo off
setlocal
title FYJ Channel Voice - Audio Separator
color 0B

echo ======================================================================
echo          FYJ Channel Voice - AI and DSP Vocal Separator
echo ======================================================================
echo.

cd /d "%~dp0"

REM -------------------------------------------------------------------
REM 1. Pemeriksaan Node.js (Wajib)
REM -------------------------------------------------------------------
echo [1/3] Memeriksa Node.js...
set "NODE_CMD="

where node >nul 2>&1
if not errorlevel 1 (
    set "NODE_CMD=node"
    goto :node_found
)

if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
    goto :node_found
)

if exist "%LocalAppData%\Programs\nodejs\node.exe" (
    set "NODE_CMD=%LocalAppData%\Programs\nodejs\node.exe"
    set "PATH=%LocalAppData%\Programs\nodejs;%APPDATA%\npm;%PATH%"
    goto :node_found
)

if exist "%SystemDrive%\Program Files (x86)\nodejs\node.exe" (
    set "NODE_CMD=%SystemDrive%\Program Files (x86)\nodejs\node.exe"
    set "PATH=%SystemDrive%\Program Files (x86)\nodejs;%APPDATA%\npm;%PATH%"
    goto :node_found
)

REM Jika Node.js belum terpasang
echo.
echo ======================================================================
echo  [!] Node.js TIDAK ditemukan di perangkat ini!
echo ======================================================================
echo  Aplikasi web ini membutuhkan Node.js untuk dapat dijalankan.
echo.

where winget >nul 2>&1
if not errorlevel 1 (
    echo  [*] Memasang Node.js LTS via winget...
    winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
        set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
        goto :node_found
    )
)

if exist "%~dp0installers\node-v20.18.0-x64.msi" (
    echo  [*] Menjalankan paket installer Node.js dari folder installers...
    start /wait msiexec /i "%~dp0installers\node-v20.18.0-x64.msi"
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
        goto :node_found
    )
)

echo  Membuka halaman download Node.js resmi di peramban Anda...
start https://nodejs.org/en/download/
echo  Silakan unduh dan pasang Node.js LTS, lalu jalankan kembali start.bat ini.
echo.
pause
exit /b 1

:node_found
for /f "tokens=*" %%v in ('"%NODE_CMD%" -v') do set "NODE_VER=%%v"
echo [OK] Node.js siap: %NODE_VER%
echo.

REM -------------------------------------------------------------------
REM 2. Pemeriksaan Dependensi (node_modules)
REM -------------------------------------------------------------------
echo [2/3] Memeriksa dependensi aplikasi web [node_modules]...
if exist "%~dp0node_modules\" goto :deps_ready

echo  Dependensi belum terpasang. Menjalankan npm install...
echo  Harap tunggu beberapa saat...

where npm >nul 2>&1
if not errorlevel 1 (
    call npm install
    goto :check_npm_result
)

if exist "%ProgramFiles%\nodejs\npm.cmd" (
    call "%ProgramFiles%\nodejs\npm.cmd" install
    goto :check_npm_result
)

echo  [!] npm tidak ditemukan. Silakan pasang Node.js dengan benar.
pause
exit /b 1

:check_npm_result
if errorlevel 1 (
    echo.
    echo [!] Gagal menginstal dependensi melalui npm!
    echo Pastikan komputer Anda terhubung ke internet.
    pause
    exit /b 1
)
echo [OK] Semua dependensi node_modules berhasil dipasang!

:deps_ready
echo [OK] Dependensi node_modules sudah siap.
echo.

REM -------------------------------------------------------------------
REM 3. Pemeriksaan Mesin Pemisah Audio (FFmpeg, Python, Demucs, UVR)
REM -------------------------------------------------------------------
echo [3/3] Memeriksa Mesin Pemisah Audio FFmpeg dan AI Engine...

if exist "%~dp0node_modules\ffmpeg-static\ffmpeg.exe" (
    echo [OK] Mesin Audio FFmpeg DSP siap - Internal bawaan aplikasi.
    goto :check_python
)

where ffmpeg >nul 2>&1
if not errorlevel 1 (
    echo [OK] Mesin Audio FFmpeg siap - System PATH.
    goto :check_python
)

echo [INFO] Menyiapkan modul FFmpeg...
call npm install ffmpeg-static

:check_python
set "PY_CMD="
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
    goto :python_found
)
if exist "%LocalAppData%\Programs\Python\Python310\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python310\python.exe"
    goto :python_found
)
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python312\python.exe"
    goto :python_found
)
if exist "C:\Python311\python.exe" (
    set "PY_CMD=C:\Python311\python.exe"
    goto :python_found
)
if exist "%ProgramFiles%\Python311\python.exe" (
    set "PY_CMD=%ProgramFiles%\Python311\python.exe"
    goto :python_found
)

where py >nul 2>&1
if not errorlevel 1 (
    py -3.11 -c "import sys" >nul 2>&1
    if not errorlevel 1 (
        set "PY_CMD=py -3.11"
        goto :python_found
    )
)

where python >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=python"
    goto :python_found
)

REM Jika Python belum ada, coba installer lokal
if exist "%~dp0installers\python-3.11.9-amd64.exe" (
    echo.
    echo [*] Python belum terdeteksi. Memasang Python 3.11 dari folder installers...
    start /wait "" "%~dp0installers\python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 SimpleInstall=1
    if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
        set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
        goto :python_found
    )
)

echo [INFO] Python tidak terdeteksi. Menggunakan mode internal FFmpeg DSP.
goto :network_detect

:python_found
for /f "tokens=*" %%p in ('"%PY_CMD%" --version 2^>nul') do set "PY_VER=%%p"
echo [OK] Python terdeteksi: %PY_VER%

set "DEMUCS_READY=0"
set "UVR_READY=0"

"%PY_CMD%" -m demucs --help >nul 2>&1
if not errorlevel 1 set "DEMUCS_READY=1"

"%PY_CMD%" -m audio_separator.utils.cli --version >nul 2>&1
if not errorlevel 1 set "UVR_READY=1"

if "%DEMUCS_READY%"=="1" if "%UVR_READY%"=="1" (
    echo [OK] Mesin AI UVR MDX-Net dan Demucs SIAP - Kualitas Studio Zero-Bleed.
    goto :network_detect
)

echo.
echo [*] Menyiapkan modul AI pemisahan audio Demucs dan UVR MDX-Net...
if exist "%~dp0installers\setup_ai_packages.bat" (
    call "%~dp0installers\setup_ai_packages.bat"
) else (
    "%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
    "%PY_CMD%" -m pip install numpy demucs soundfile lameenc onnxruntime audio-separator
)
echo [OK] Paket AI selesai disiapkan!

:network_detect
echo.

REM -------------------------------------------------------------------
REM 4. Deteksi Alamat IP Jaringan Lokal & Konfigurasi Domain (.env)
REM -------------------------------------------------------------------
set "LOCAL_IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not "%%b"=="127.0.0.1" set "LOCAL_IP=%%b"
    )
)

set "APP_PORT=3032"
set "APP_DOMAIN="
set "APP_URL="
if exist "%~dp0.env" (
    for /f "usebackq tokens=1,* delims==" %%i in ("%~dp0.env") do (
        if /i "%%i"=="PORT" if not "%%j"=="" set "APP_PORT=%%j"
        if /i "%%i"=="DOMAIN" if not "%%j"=="" set "APP_DOMAIN=%%j"
        if /i "%%i"=="APP_URL" if not "%%j"=="" set "APP_URL=%%j"
    )
)

REM -------------------------------------------------------------------
REM 5. Jalankan Server dan Buka di Browser
REM -------------------------------------------------------------------
echo ======================================================================
echo  [OK] Semua persiapan selesai!
echo  Memulai server FYJ Channel Voice dan membuka browser...
echo.
echo  Akses Komputer Lokal       : http://localhost:%APP_PORT%
echo  Akses dari HP atau Laptop  : http://%LOCAL_IP%:%APP_PORT%
if defined APP_DOMAIN (
echo  Akses Domain Publik        : https://%APP_DOMAIN%
) else if defined APP_URL (
echo  Akses Domain Publik        : %APP_URL%
) else (
echo  Akses Domain Publik        : Belum diset (Bisa diatur di .env / domain_setup.bat)
)
echo.
echo  Browser akan terbuka secara otomatis dalam 2 detik.
echo  Untuk menghentikan server, tekan [Ctrl + C] di jendela ini.
echo ======================================================================
echo.

start "" /b cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:%APP_PORT%"

"%NODE_CMD%" server.js

echo.
echo ======================================================================
echo Server telah berhenti.
echo ======================================================================
pause
