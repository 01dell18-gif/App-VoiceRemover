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

if exist "%ProgramW6432%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramW6432%\nodejs\node.exe"
    set "PATH=%ProgramW6432%\nodejs;%APPDATA%\npm;%PATH%"
    goto :node_found
)

if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
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
    echo  [*] Mencoba memasang Node.js LTS via winget...
    winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
        set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
        goto :node_found
    )
    if exist "%ProgramW6432%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramW6432%\nodejs\node.exe"
        set "PATH=%ProgramW6432%\nodejs;%APPDATA%\npm;%PATH%"
        goto :node_found
    )
)

if exist "%~dp0installers\node-v20.18.0-x64.msi" (
    echo  [*] Menjalankan paket installer Node.js dari folder installers...
    start /wait msiexec /i "%~dp0installers\node-v20.18.0-x64.msi" /passive
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
        goto :node_found
    )
    if exist "%ProgramW6432%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramW6432%\nodejs\node.exe"
        goto :node_found
    )
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files\nodejs\node.exe"
        goto :node_found
    )
    if exist "%LocalAppData%\Programs\nodejs\node.exe" (
        set "NODE_CMD=%LocalAppData%\Programs\nodejs\node.exe"
        goto :node_found
    )
    where node >nul 2>&1
    if not errorlevel 1 (
        set "NODE_CMD=node"
        goto :node_found
    )
)

echo.
echo ======================================================================
echo  [!] Node.js belum dapat disiapkan secara otomatis.
echo  Membuka halaman download Node.js resmi di browser Anda...
echo ======================================================================
start https://nodejs.org/en/download/
echo  Silakan unduh dan pasang Node.js LTS, lalu jalankan kembali start.bat ini.
echo.
pause
exit /b 1

:node_found
set "NODE_VER=Aktif"
for /f "tokens=*" %%v in ('"%NODE_CMD%" -v 2^>nul') do set "NODE_VER=%%v"
echo [OK] Node.js siap: %NODE_VER%
echo.

REM -------------------------------------------------------------------
REM 2. Pemeriksaan Dependensi (node_modules)
REM -------------------------------------------------------------------
echo [2/3] Memeriksa dependensi aplikasi web [node_modules]...
if exist "%~dp0node_modules\" goto :deps_ready

if exist "%~dp0installers\node_modules.zip" (
    echo  [*] Menyiapkan paket node_modules dari folder installers [Offline]...
    where tar >nul 2>&1
    if not errorlevel 1 (
        tar -xf "%~dp0installers\node_modules.zip" -C "%~dp0" >nul 2>&1
    ) else (
        powershell -NoProfile -Command "Expand-Archive -Path '%~dp0installers\node_modules.zip' -DestinationPath '%~dp0' -Force" >nul 2>&1
    )
    if exist "%~dp0node_modules\" (
        echo [OK] Paket node_modules offline berhasil diekstrak!
        goto :deps_ready
    )
)

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

if exist "%ProgramW6432%\nodejs\npm.cmd" (
    call "%ProgramW6432%\nodejs\npm.cmd" install
    goto :check_npm_result
)

if exist "C:\Program Files\nodejs\npm.cmd" (
    call "C:\Program Files\nodejs\npm.cmd" install
    goto :check_npm_result
)

if exist "%LocalAppData%\Programs\nodejs\npm.cmd" (
    call "%LocalAppData%\Programs\nodejs\npm.cmd" install
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
REM 3. Pemeriksaan Runtime C++, Mesin Pemisah FFmpeg, dan Python AI
REM -------------------------------------------------------------------
echo [3/3] Memeriksa Runtime Sistem, Mesin Audio FFmpeg, dan AI Engine...

REM 3.1 Pasang Visual C++ Redistributable (Jika Tersedia)
if exist "%~dp0installers\vc_redist.x64.exe" (
    reg query "HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X64" /v Installed >nul 2>&1
    if errorlevel 1 (
        echo  [*] Memasang Microsoft Visual C++ 2015-2022 x64 Runtime...
        start /wait "" "%~dp0installers\vc_redist.x64.exe" /install /passive /norestart
    )
)

REM 3.2 Mesin Audio FFmpeg
if exist "%~dp0node_modules\ffmpeg-static\ffmpeg.exe" (
    echo [OK] Mesin Audio FFmpeg DSP siap - Internal bawaan aplikasi.
    goto :check_python
)

if exist "%~dp0installers\ffmpeg.zip" (
    echo  [*] Mengekstrak modul audio FFmpeg dari installers...
    if not exist "%~dp0node_modules\ffmpeg-static\" mkdir "%~dp0node_modules\ffmpeg-static\"
    where tar >nul 2>&1
    if not errorlevel 1 (
        tar -xf "%~dp0installers\ffmpeg.zip" -C "%~dp0node_modules\ffmpeg-static\" >nul 2>&1
    ) else (
        powershell -NoProfile -Command "Expand-Archive -Path '%~dp0installers\ffmpeg.zip' -DestinationPath '%~dp0node_modules\ffmpeg-static\' -Force" >nul 2>&1
    )
    if exist "%~dp0node_modules\ffmpeg-static\ffmpeg.exe" (
        echo [OK] Mesin Audio FFmpeg siap - Berhasil diekstrak.
        goto :check_python
    )
)

where ffmpeg >nul 2>&1
if not errorlevel 1 (
    echo [OK] Mesin Audio FFmpeg siap - System PATH.
    goto :check_python
)

echo  [INFO] Menyiapkan modul FFmpeg...
call npm install ffmpeg-static

:check_python
set "PY_CMD="

REM Prioritas 1: Python 3.11 resmi
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
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
if exist "%ProgramW6432%\Python311\python.exe" (
    set "PY_CMD=%ProgramW6432%\Python311\python.exe"
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

REM Prioritas 2: py launcher (mengambil path absolut python.exe)
where py >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%x in ('py -3.11 -c "import sys; print(sys.executable)" 2^>nul') do (
        set "PY_CMD=%%x"
        goto :python_found
    )
    for /f "tokens=*" %%x in ('py -3.10 -c "import sys; print(sys.executable)" 2^>nul') do (
        set "PY_CMD=%%x"
        goto :python_found
    )
    for /f "tokens=*" %%x in ('py -3.12 -c "import sys; print(sys.executable)" 2^>nul') do (
        set "PY_CMD=%%x"
        goto :python_found
    )
)

REM Prioritas 3: Cek apakah python di system PATH kompatibel dengan PyTorch (Python 3.9 - 3.12 64-bit)
where python >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%x in ('python -c "import sys; sys.stdout.write(sys.executable if (3, 9) <= sys.version_info < (3, 13) and sys.maxsize > 2**32 else '')" 2^>nul') do (
        if not "%%x"=="" (
            set "PY_CMD=%%x"
            goto :python_found
        )
    )
    echo  [!] Python di PATH tidak kompatibel dengan modul AI - Ditemukan versi non-standar.
)

REM Prioritas 4: Pasang Python 3.11.9 64-bit resmi dari folder installers
if exist "%~dp0installers\python-3.11.9-amd64.exe" (
    echo.
    echo  [*] Memasang Python 3.11.9 64-bit resmi dari folder installers...
    echo      Mohon tunggu sebentar proses instalasi berlangsung...
    start /wait "" "%~dp0installers\python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0 SimpleInstall=1
    if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
        set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
        echo  [OK] Python 3.11.9 berhasil dipasang di komputer ini!
        goto :python_found
    )
    if exist "C:\Python311\python.exe" (
        set "PY_CMD=C:\Python311\python.exe"
        echo  [OK] Python 3.11.9 berhasil dipasang di komputer ini!
        goto :python_found
    )
    if exist "%ProgramFiles%\Python311\python.exe" (
        set "PY_CMD=%ProgramFiles%\Python311\python.exe"
        echo  [OK] Python 3.11.9 berhasil dipasang di komputer ini!
        goto :python_found
    )
    if exist "%ProgramW6432%\Python311\python.exe" (
        set "PY_CMD=%ProgramW6432%\Python311\python.exe"
        echo  [OK] Python 3.11.9 berhasil dipasang di komputer ini!
        goto :python_found
    )
)

echo  [INFO] Python 3.11 belum siap. Menggunakan mode internal FFmpeg DSP (Aplikasi tetap berjalan normal).
goto :network_detect

:python_found
set "PY_VER=Python Siap"
for /f "tokens=*" %%p in ('"%PY_CMD%" --version 2^>nul') do set "PY_VER=%%p"
echo [OK] Python terdeteksi: %PY_VER%

set "DEMUCS_READY=0"
set "UVR_READY=0"

"%PY_CMD%" -m demucs --help >nul 2>&1
if not errorlevel 1 set "DEMUCS_READY=1"

"%PY_CMD%" -c "import audio_separator; import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 set "UVR_READY=1"

if "%DEMUCS_READY%"=="1" if "%UVR_READY%"=="1" (
    echo [OK] Mesin AI UVR MDX-Net dan Demucs SIAP - Kualitas Studio Zero-Bleed.
    goto :network_detect
)

echo.
echo [*] Menyiapkan modul AI pemisahan audio Demucs dan UVR MDX-Net...
if exist "%~dp0installers\setup_ai_packages.bat" (
    call "%~dp0installers\setup_ai_packages.bat" --no-pause
    goto :ai_setup_done
)
if exist "%~dp0installers\wheels\" (
    if not exist "%~dp0installers\wheels\torch-2.15.0+cpu-cp311-cp311-win_amd64.whl" (
        if exist "%~dp0installers\wheels\torch_cpu.part1" (
            echo [*] Menggabungkan arsip PyTorch CPU wheel...
            copy /b "%~dp0installers\wheels\torch_cpu.part1"+"%~dp0installers\wheels\torch_cpu.part2"+"%~dp0installers\wheels\torch_cpu.part3" "%~dp0installers\wheels\torch-2.15.0+cpu-cp311-cp311-win_amd64.whl" >nul 2>&1
        )
        if not exist "%~dp0installers\wheels\torch-2.15.0+cpu-cp311-cp311-win_amd64.whl" if exist "%~dp0installers\wheels\rejoin_torch.ps1" (
            powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installers\wheels\rejoin_torch.ps1"
        )
    )
    "%PY_CMD%" -m pip install --no-index --find-links="%~dp0installers\wheels" --prefer-binary torch torchaudio numpy soundfile lameenc onnxruntime audio-separator demucs
    goto :ai_setup_done
)
"%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu --prefer-binary
"%PY_CMD%" -m pip install --prefer-binary numpy demucs soundfile lameenc onnxruntime audio-separator
:ai_setup_done
echo [OK] Pemeriksaan paket AI selesai.

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
    goto :domain_display_done
)
if defined APP_URL (
    echo  Akses Domain Publik        : %APP_URL%
    goto :domain_display_done
)
echo  Akses Domain Publik        : Belum diset - Lihat domain_setup.bat / .env
:domain_display_done
echo.
echo  Browser akan terbuka secara otomatis dalam 2 detik.
echo  Untuk menghentikan server, tekan [Ctrl + C] di jendela ini.
echo ======================================================================
echo.

start "" /b cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:%APP_PORT%"

"%NODE_CMD%" server.js
if errorlevel 1 (
    echo.
    echo ======================================================================
    echo  [!] Server berhenti dengan kesalahan [error code %errorlevel%].
    echo ======================================================================
)

echo.
echo ======================================================================
echo Server telah berhenti.
echo ======================================================================
pause
exit /b 0