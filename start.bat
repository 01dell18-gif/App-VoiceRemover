@echo off
chcp 65001 >nul
title FYJ Channel Voice - AI Vocal & Music Separator
color 0B

echo ======================================================================
echo          🎵 FYJ Channel Voice - AI Vocal & Music Separator 🎵
echo ======================================================================
echo.

cd /d "%~dp0"

:: -------------------------------------------------------------------
:: 1. Pemeriksaan & Konfigurasi Node.js
:: -------------------------------------------------------------------
echo [1/4] Memeriksa Node.js...
set "NODE_CMD="

:: Cek apakah 'node' sudah ada di PATH
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 set "NODE_CMD=node"

:: Cek path instalasi standar jika belum ada di PATH
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

:: Jika Node.js belum terpasang, pasang via winget atau installer
if not defined NODE_CMD (
    echo.
    echo ======================================================================
    echo  [!] Node.js TIDAK ditemukan di komputer ini!
    echo ======================================================================
    echo  Aplikasi web ini membutuhkan Node.js (v18+) untuk dapat dijalankan.
    echo.
    where winget >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo  [*] Memasang Node.js LTS secara otomatis via Windows Package Manager (winget)...
        winget install OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
        if exist "%ProgramFiles%\nodejs\node.exe" (
            set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
            set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
            echo  [OK] Node.js berhasil dipasang!
        )
    )
    if not defined NODE_CMD (
        if exist "%~dp0installers\node-v20.18.0-x64.msi" (
            echo  [*] Ditemukan paket installer Node.js di folder "installers\".
            echo  [*] Menjalankan instalasi Node.js...
            start /wait msiexec /i "%~dp0installers\node-v20.18.0-x64.msi" /qb
            set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
            if exist "%ProgramFiles%\nodejs\node.exe" (
                set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
                echo  [OK] Node.js berhasil dipasang!
            )
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
echo [OK] Node.js aktif: %NODE_VER%
echo.

:: -------------------------------------------------------------------
:: 2. Pemeriksaan Dependensi (node_modules)
:: -------------------------------------------------------------------
echo [2/4] Memeriksa dependensi aplikasi web (node_modules)...
if not exist "%~dp0node_modules\" (
    echo  Dependensi belum terpasang. Menjalankan "npm install"...
    echo  Harap tunggu sebentar, proses ini mengunduh modul server dan FFmpeg...
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

:: -------------------------------------------------------------------
:: 3. Pemeriksaan & Konfigurasi Mesin AI (Python, UVR MDX-Net & Demucs)
:: -------------------------------------------------------------------
echo [3/4] Memeriksa Mesin AI Pemisah Audio (Demucs & UVR MDX-Net)...
set "PY_CMD="

:: Deteksi instalasi Python (diutamakan Python 3.11/3.10 yang mendukung PyTorch & ONNX)
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
) else if exist "%LocalAppData%\Programs\Python\Python310\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python310\python.exe"
) else if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python312\python.exe"
) else if exist "%ProgramFiles%\Python311\python.exe" (
    set "PY_CMD=%ProgramFiles%\Python311\python.exe"
) else if exist "C:\Python311\python.exe" (
    set "PY_CMD=C:\Python311\python.exe"
) else (
    where py >nul 2>&1 && py -3.11 -c "import sys" >nul 2>&1 && set "PY_CMD=py -3.11"
)

if not defined PY_CMD (
    where python >nul 2>&1 && set "PY_CMD=python"
)

:: Jika Python belum ada sama sekali, pasang via winget atau installer
if not defined PY_CMD (
    where winget >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo  [*] Python belum terpasang. Memasang Python 3.11 via Windows Package Manager (winget)...
        winget install Python.Python.3.11 -e --silent --accept-source-agreements --accept-package-agreements
        if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
            set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
            echo  [OK] Python 3.11 berhasil dipasang!
        )
    )
    if not defined PY_CMD (
        if exist "%~dp0installers\python-3.11.9-amd64.exe" (
            echo  [*] Menjalankan installer Python 3.11 otomatis...
            start /wait "" "%~dp0installers\python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 SimpleInstall=1
            if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
                set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
                echo  [OK] Python 3.11 berhasil dipasang!
            )
        )
    )
)

:: Cek apakah modul Demucs AI sudah terpasang di Python
set "DEMUCS_READY=0"
if defined PY_CMD (
    "%PY_CMD%" -m demucs --help >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "DEMUCS_READY=1"
        for /f "tokens=*" %%p in ('"%PY_CMD%" --version') do set "PY_VER=%%p"
        echo [OK] Mesin AI Demucs SIAP! (via %PY_VER%)
    ) else (
        echo  [*] Menyiapkan modul AI Demucs (Meta Research)...
        "%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
        "%PY_CMD%" -m pip install demucs numpy
        "%PY_CMD%" -m demucs --help >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            set "DEMUCS_READY=1"
            echo  [OK] Mesin AI Demucs berhasil dipasang!
        )
    )

    :: Cek apakah modul UVR MDX-Net (Zero Bleed Vocal/Music Isolator) sudah terpasang
    set "UVR_READY=0"
    "%PY_CMD%" -m audio_separator.utils.cli --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "UVR_READY=1"
        echo [OK] Mesin AI UVR MDX-Net SIAP! (Zero Bleed Studio Quality)
    ) else (
        echo  [*] Menyiapkan modul AI UVR MDX-Net untuk pemisahan vokal/musik 100%% tanpa bocor suara...
        "%PY_CMD%" -m pip install audio-separator onnxruntime
        "%PY_CMD%" -m audio_separator.utils.cli --version >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            set "UVR_READY=1"
            echo  [OK] Mesin AI UVR MDX-Net berhasil dipasang!
        )
    )
) else (
    echo [INFO] Python tidak terdeteksi. Aplikasi tetap berjalan menggunakan FFmpeg DSP Engine internal.
)
echo.

:: -------------------------------------------------------------------
:: 4. Deteksi Alamat IP Jaringan Lokal (Akses Multi-Device / HP)
:: -------------------------------------------------------------------
set "LOCAL_IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not "%%b"=="127.0.0.1" set "LOCAL_IP=%%b"
    )
)

:: -------------------------------------------------------------------
:: 5. Jalankan Server dan Buka Peramban
:: -------------------------------------------------------------------
echo ======================================================================
echo  🚀 Memulai server FYJ Channel Voice...
echo.
echo  📍 Akses di komputer ini      : http://localhost:3032
echo  📱 Akses dari HP / laptop lain : http://%LOCAL_IP%:3032
echo.
echo  Peramban akan terbuka secara otomatis dalam 2 detik.
echo  Untuk menghentikan aplikasi, tekan kombinasi tombol [Ctrl + C].
echo ======================================================================
echo.

start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3032"

"%NODE_CMD%" server.js

pause
