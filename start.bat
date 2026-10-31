@echo off
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
if %ERRORLEVEL% EQU 0 set "NODE_CMD=node"

if not defined NODE_CMD (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
        set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles(x86)%\nodejs\node.exe"
        set "PATH=%ProgramFiles(x86)%\nodejs;%APPDATA%\npm;%PATH%"
    ) else if exist "%LocalAppData%\Programs\nodejs\node.exe" (
        set "NODE_CMD=%LocalAppData%\Programs\nodejs\node.exe"
        set "PATH=%LocalAppData%\Programs\nodejs;%APPDATA%\npm;%PATH%"
    )
)

if not defined NODE_CMD (
    echo.
    echo ======================================================================
    echo  [!] Node.js TIDAK ditemukan di perangkat ini!
    echo ======================================================================
    echo  Aplikasi web ini membutuhkan Node.js untuk dapat dijalankan.
    echo.
    if exist "%~dp0installers\node-v20.18.0-x64.msi" (
        echo  [*] Ditemukan file installer Node.js di folder installers.
        echo  [*] Memulai instalasi Node.js secara otomatis...
        echo.
        echo  Silakan ikuti petunjuk wizard di layar hingga selesai.
        start /wait msiexec /i "%~dp0installers\node-v20.18.0-x64.msi"
        set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
        if exist "%ProgramFiles%\nodejs\node.exe" (
            set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
            echo  [OK] Node.js berhasil dipasang!
        )
    )
    if not defined NODE_CMD (
        echo  Membuka halaman download Node.js resmi di peramban Anda...
        start https://nodejs.org/en/download/
        echo  Silakan unduh dan pasang Node.js LTS, lalu jalankan kembali start.bat ini.
        echo.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('"%NODE_CMD%" -v') do set "NODE_VER=%%v"
echo [OK] Node.js siap: %NODE_VER%
echo.

REM -------------------------------------------------------------------
REM 2. Pemeriksaan Dependensi (node_modules)
REM -------------------------------------------------------------------
echo [2/3] Memeriksa dependensi aplikasi web (node_modules)...
if not exist "%~dp0node_modules\" (
    echo  Dependensi belum terpasang. Menjalankan npm install...
    echo  Harap tunggu beberapa saat...
    where npm >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        call npm install
    ) else if exist "%ProgramFiles%\nodejs\npm.cmd" (
        call "%ProgramFiles%\nodejs\npm.cmd" install
    ) else (
        echo  [!] npm tidak ditemukan. Silakan pasang Node.js dengan benar.
        pause
        exit /b 1
    )
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [!] Gagal menginstal dependensi melalui npm!
        echo Pastikan komputer Anda terhubung ke internet.
        pause
        exit /b 1
    )
    echo [OK] Semua dependensi node_modules berhasil dipasang!
) else (
    echo [OK] Dependensi node_modules sudah siap.
)
echo.

REM -------------------------------------------------------------------
REM 3. Pemeriksaan Mesin Pemisah Audio (FFmpeg, Python, Demucs AI)
REM -------------------------------------------------------------------
echo [3/3] Memeriksa Mesin Pemisah Audio (FFmpeg dan Demucs AI)...

if exist "%~dp0node_modules\ffmpeg-static\ffmpeg.exe" (
    echo [OK] Mesin Audio FFmpeg DSP siap - Internal bawaan aplikasi.
) else (
    where ffmpeg >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Mesin Audio FFmpeg siap - System PATH.
    ) else (
        echo [INFO] Menyiapkan modul FFmpeg...
        call npm install ffmpeg-static
    )
)

set "PY_CMD="
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
) else if exist "%ProgramFiles%\Python311\python.exe" (
    set "PY_CMD=%ProgramFiles%\Python311\python.exe"
) else (
    where python >nul 2>&1 && set "PY_CMD=python"
)

REM Jika Python belum ada, pasang otomatis dari folder installers
if not defined PY_CMD (
    if exist "%~dp0installers\python-3.11.9-amd64.exe" (
        echo.
        echo [*] Python belum terdeteksi. Memasang Python 3.11 dari folder installers...
        start /wait "" "%~dp0installers\python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 SimpleInstall=1
        if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
            set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
            echo [OK] Python 3.11 berhasil dipasang!
        )
    )
)

REM Jika Python tersedia, periksa apakah paket AI Demucs & UVR sudah terpasang
if defined PY_CMD (
    "%PY_CMD%" -m demucs --help >nul 2>&1
    set "DEMUCS_ERR=%ERRORLEVEL%"
    "%PY_CMD%" -m audio_separator.utils.cli --version >nul 2>&1
    set "UVR_ERR=%ERRORLEVEL%"

    if %DEMUCS_ERR% EQU 0 if %UVR_ERR% EQU 0 (
        echo [OK] Mesin AI UVR MDX-Net dan Demucs SIAP - Kualitas Studio Zero-Bleed.
    ) else (
        echo.
        echo [*] Menyiapkan paket AI pemisahan audio (Demucs dan UVR MDX-Net)...
        if exist "%~dp0installers\setup_ai_packages.bat" (
            call "%~dp0installers\setup_ai_packages.bat"
        ) else (
            "%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
            "%PY_CMD%" -m pip install numpy demucs soundfile lameenc onnxruntime audio-separator
        )
        echo [OK] Paket AI berhasil disiapkan!
    )
) else (
    echo [INFO] Python tidak tersedia. Mode FFmpeg DSP aktif.
)
echo.

REM -------------------------------------------------------------------
REM 4. Deteksi Alamat IP Jaringan Lokal (Akses Multi-Device / HP)
REM -------------------------------------------------------------------
set "LOCAL_IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not "%%b"=="127.0.0.1" set "LOCAL_IP=%%b"
    )
)

REM -------------------------------------------------------------------
REM 5. Lanjut Jalankan Server dan Buka di Browser
REM -------------------------------------------------------------------
echo ======================================================================
echo  [OK] Program yang diperlukan sudah siap!
echo  Memulai server FYJ Channel Voice dan membuka browser...
echo.
echo  Akses di komputer ini      : http://localhost:3032
echo  Akses dari HP atau laptop  : http://%LOCAL_IP%:3032
echo.
echo  Browser akan terbuka secara otomatis dalam 2 detik.
echo  Untuk menghentikan server, tekan [Ctrl + C] di jendela ini.
echo ======================================================================
echo.

start "" /b cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:3032"

"%NODE_CMD%" server.js

pause
