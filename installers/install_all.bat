@echo off
setlocal
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
echo 1. Microsoft Visual C++ 2015-2022 x64 Runtime
echo 2. Node.js LTS - Runtime Server dan Web App
echo 3. Mesin Audio FFmpeg DSP
echo 4. Python 3.11 64-bit resmi - Runtime Interpreter AI
echo 5. Modul AI Demucs, UVR MDX-Net, PyTorch, dan ONNX Runtime
echo.
echo ======================================================================
echo.

cd /d "%~dp0"

REM -------------------------------------------------------------------
REM 1. Pasang Microsoft Visual C++ Redistributable (Wajib untuk AI C++ DLLs)
REM -------------------------------------------------------------------
echo [1/5] Memeriksa Microsoft Visual C++ x64 Runtime...
if exist "%~dp0vc_redist.x64.exe" (
    echo [*] Memasang Microsoft Visual C++ 2015-2022 x64 Runtime...
    start /wait "" "%~dp0vc_redist.x64.exe" /install /passive /norestart
    echo [OK] Microsoft Visual C++ siap!
) else (
    echo [INFO] vc_redist.x64.exe tidak ditemukan di folder installers. Melanjutkan...
)
echo.

REM -------------------------------------------------------------------
REM 2. Cek dan Pasang Node.js
REM -------------------------------------------------------------------
echo [2/5] Memeriksa Node.js...
set "NODE_CMD="
where node >nul 2>&1
if not errorlevel 1 set "NODE_CMD=node"

if not defined NODE_CMD (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    )
    if exist "%ProgramW6432%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramW6432%\nodejs\node.exe"
    )
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    )
    if exist "%LocalAppData%\Programs\nodejs\node.exe" (
        set "NODE_CMD=%LocalAppData%\Programs\nodejs\node.exe"
    )
    if exist "%SystemDrive%\Program Files (x86)\nodejs\node.exe" (
        set "NODE_CMD=%SystemDrive%\Program Files (x86)\nodejs\node.exe"
    )
)

if defined NODE_CMD (
    set "NODE_VER=Aktif"
    for /f "tokens=*" %%v in ('"%NODE_CMD%" -v 2^>nul') do set "NODE_VER=%%v"
    echo [OK] Node.js sudah terpasang: %NODE_VER%
) else (
    echo [!] Node.js belum terpasang di perangkat ini.
    if exist "%~dp0node-v20.18.0-x64.msi" (
        echo [*] Memulai pemasangan Node.js dari installer offline...
        start /wait msiexec /i "%~dp0node-v20.18.0-x64.msi" /passive
        set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
        if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
        if exist "%ProgramW6432%\nodejs\node.exe" set "NODE_CMD=%ProgramW6432%\nodejs\node.exe"
        if exist "C:\Program Files\nodejs\node.exe" set "NODE_CMD=C:\Program Files\nodejs\node.exe"
        if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_CMD=%LocalAppData%\Programs\nodejs\node.exe"
        where node >nul 2>&1
        if not errorlevel 1 if not defined NODE_CMD set "NODE_CMD=node"
        if defined NODE_CMD (
            echo [OK] Node.js berhasil dipasang!
        )
    ) else (
        echo [!] File node-v20.18.0-x64.msi tidak ditemukan.
        start https://nodejs.org/en/download/
    )
)

if not exist "%~dp0..\node_modules\" (
    if exist "%~dp0node_modules.zip" (
        echo [*] Menyiapkan paket node_modules dari folder installers [Offline]...
        where tar >nul 2>&1
        if not errorlevel 1 (
            tar -xf "%~dp0node_modules.zip" -C "%~dp0.." >nul 2>&1
        ) else (
            powershell -NoProfile -Command "Expand-Archive -Path '%~dp0node_modules.zip' -DestinationPath '%~dp0..' -Force" >nul 2>&1
        )
        if exist "%~dp0..\node_modules\" (
            echo [OK] Paket node_modules offline berhasil disiapkan!
        )
    )
)
echo.

REM -------------------------------------------------------------------
REM 3. Ekstrak Modul Audio FFmpeg
REM -------------------------------------------------------------------
echo [3/5] Memeriksa Modul Audio FFmpeg...
if exist "%~dp0..\node_modules\ffmpeg-static\ffmpeg.exe" (
    echo [OK] Mesin Audio FFmpeg DSP siap.
    goto :ffmpeg_ready
)
if exist "%~dp0ffmpeg.zip" (
    echo [*] Mengekstrak FFmpeg dari folder installers...
    if not exist "%~dp0..\node_modules\ffmpeg-static\" mkdir "%~dp0..\node_modules\ffmpeg-static\"
    where tar >nul 2>&1
    if not errorlevel 1 (
        tar -xf "%~dp0ffmpeg.zip" -C "%~dp0..\node_modules\ffmpeg-static\" >nul 2>&1
    ) else (
        powershell -NoProfile -Command "Expand-Archive -Path '%~dp0ffmpeg.zip' -DestinationPath '%~dp0..\node_modules\ffmpeg-static\' -Force" >nul 2>&1
    )
    if exist "%~dp0..\node_modules\ffmpeg-static\ffmpeg.exe" (
        echo [OK] FFmpeg berhasil disiapkan!
        goto :ffmpeg_ready
    )
)
where ffmpeg >nul 2>&1
if not errorlevel 1 (
    echo [OK] Mesin Audio FFmpeg terdeteksi di System PATH.
) else (
    echo [INFO] FFmpeg akan disiapkan saat pertama kali menjalankan start.bat.
)
:ffmpeg_ready
echo.

REM -------------------------------------------------------------------
REM 4. Cek dan Pasang Python 3.11 Resmi
REM -------------------------------------------------------------------
echo [4/5] Memeriksa Python 3.11 (Khusus AI)...
set "PY_CMD="

if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
    goto :py_ready
)
if exist "C:\Python311\python.exe" (
    set "PY_CMD=C:\Python311\python.exe"
    goto :py_ready
)
if exist "%ProgramFiles%\Python311\python.exe" (
    set "PY_CMD=%ProgramFiles%\Python311\python.exe"
    goto :py_ready
)
if exist "%ProgramW6432%\Python311\python.exe" (
    set "PY_CMD=%ProgramW6432%\Python311\python.exe"
    goto :py_ready
)

where py >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%x in ('py -3.11 -c "import sys; print(sys.executable)" 2^>nul') do (
        set "PY_CMD=%%x"
        goto :py_ready
    )
    for /f "tokens=*" %%x in ('py -3.10 -c "import sys; print(sys.executable)" 2^>nul') do (
        set "PY_CMD=%%x"
        goto :py_ready
    )
    for /f "tokens=*" %%x in ('py -3.12 -c "import sys; print(sys.executable)" 2^>nul') do (
        set "PY_CMD=%%x"
        goto :py_ready
    )
)

where python >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%x in ('python -c "import sys; sys.stdout.write(sys.executable if (3, 9) <= sys.version_info < (3, 13) and sys.maxsize > 2**32 else '')" 2^>nul') do (
        if not "%%x"=="" (
            set "PY_CMD=%%x"
            goto :py_ready
        )
    )
    echo [!] Python di PATH tidak kompatibel dengan library AI.
)

if exist "%~dp0python-3.11.9-amd64.exe" (
    echo [*] Memasang Python 3.11.9 64-bit resmi dari folder installers...
    start /wait "" "%~dp0python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0 SimpleInstall=1
    if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
        set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
        echo [OK] Python 3.11.9 berhasil dipasang!
    )
    if exist "C:\Python311\python.exe" (
        set "PY_CMD=C:\Python311\python.exe"
        echo [OK] Python 3.11.9 berhasil dipasang!
    )
    if exist "%ProgramFiles%\Python311\python.exe" (
        set "PY_CMD=%ProgramFiles%\Python311\python.exe"
        echo [OK] Python 3.11.9 berhasil dipasang!
    )
    if exist "%ProgramW6432%\Python311\python.exe" (
        set "PY_CMD=%ProgramW6432%\Python311\python.exe"
        echo [OK] Python 3.11.9 berhasil dipasang!
    )
) else (
    echo [!] File python-3.11.9-amd64.exe tidak ditemukan.
)

:py_ready
if defined PY_CMD (
    set "PY_VER=Python Siap"
    for /f "tokens=*" %%p in ('"%PY_CMD%" --version 2^>nul') do set "PY_VER=%%p"
    echo [OK] Python siap: %PY_VER%
) else (
    echo [!] Python belum siap.
)
echo.

REM -------------------------------------------------------------------
REM 5. Cek dan Pasang Paket AI Demucs dan UVR MDX-Net
REM -------------------------------------------------------------------
echo [5/5] Menyiapkan Paket AI Demucs dan UVR MDX-Net...
if exist "%~dp0setup_ai_packages.bat" (
    call "%~dp0setup_ai_packages.bat" --no-pause
) else (
    echo [!] File setup_ai_packages.bat tidak ditemukan.
)
echo.

echo ======================================================================
echo  [OK] Semua instalasi dan konfigurasi berhasil diselesaikan!
echo ======================================================================
echo.
set "START_APP="
set /p "START_APP=Apakah Anda ingin langsung menjalankan aplikasi web sekarang? (Y/T) [Y]: "
if /i not "%START_APP%"=="t" (
    echo [*] Memulai server FYJ Channel Voice via start.bat...
    start "" "%~dp0..\start.bat"
    echo Server web telah dijalankan di jendela baru.
    pause
    exit /b 0
)
echo.
echo Untuk memulai aplikasi nanti, silakan jalankan start.bat di folder utama.
pause
exit /b 0