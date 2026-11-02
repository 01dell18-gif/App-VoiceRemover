@echo off
setlocal
title FYJ Channel Voice - Pemasangan Paket AI Pemisah Audio
color 0B

echo ======================================================================
echo    FYJ Channel Voice - Pemasangan Paket AI (Demucs dan UVR MDX-Net)
echo ======================================================================
echo.

set "NO_PAUSE=0"
if "%1"=="--no-pause" set "NO_PAUSE=1"
if "%2"=="--no-pause" set "NO_PAUSE=1"

REM -------------------------------------------------------------------
REM 0. Pasang Microsoft Visual C++ Redistributable (Jika Tersedia)
REM -------------------------------------------------------------------
if exist "%~dp0vc_redist.x64.exe" (
    echo [*] Memastikan runtime Microsoft Visual C++ x64 terpasang...
    start /wait "" "%~dp0vc_redist.x64.exe" /install /passive /norestart
)

REM -------------------------------------------------------------------
REM 1. Deteksi Interpreter Python 3.11 Kompatibel
REM -------------------------------------------------------------------
set "PY_CMD="

REM Prioritas 1: Python 3.11 resmi
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
    goto :python_ready
)
if exist "C:\Python311\python.exe" (
    set "PY_CMD=C:\Python311\python.exe"
    goto :python_ready
)
if exist "%ProgramFiles%\Python311\python.exe" (
    set "PY_CMD=%ProgramFiles%\Python311\python.exe"
    goto :python_ready
)

REM Prioritas 2: py launcher 3.11
where py >nul 2>&1
if not errorlevel 1 (
    py -3.11 -c "import sys; sys.exit(0 if sys.version_info[:2] == (3, 11) else 1)" >nul 2>&1
    if not errorlevel 1 (
        set "PY_CMD=py -3.11"
        goto :python_ready
    )
)

REM Prioritas 3: Cek apakah python di system PATH kompatibel (Python 3.9 s.d 3.12 64-bit)
where python >nul 2>&1
if not errorlevel 1 (
    python -c "import sys; sys.exit(0 if (3, 9) <= sys.version_info < (3, 13) and sys.maxsize > 2**32 else 1)" >nul 2>&1
    if not errorlevel 1 (
        set "PY_CMD=python"
        goto :python_ready
    ) else (
        echo [!] Python di PATH tidak kompatibel dengan modul AI - Ditemukan versi non-standar.
    )
)

REM Prioritas 4: Pasang Python 3.11.9 resmi dari folder installers
if exist "%~dp0python-3.11.9-amd64.exe" (
    echo.
    echo [*] Memasang Python 3.11.9 64-bit resmi dari folder installers...
    echo     Harap tunggu sejenak hingga proses instalasi selesai...
    start /wait "" "%~dp0python-3.11.9-amd64.exe" /passive InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0 SimpleInstall=1
    if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
        set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
        echo [OK] Python 3.11.9 berhasil dipasang!
        goto :python_ready
    )
    if exist "C:\Python311\python.exe" (
        set "PY_CMD=C:\Python311\python.exe"
        echo [OK] Python 3.11.9 berhasil dipasang!
        goto :python_ready
    )
    if exist "%ProgramFiles%\Python311\python.exe" (
        set "PY_CMD=%ProgramFiles%\Python311\python.exe"
        echo [OK] Python 3.11.9 berhasil dipasang!
        goto :python_ready
    )
)

echo [!] Python 3.11 yang kompatibel tidak dapat disiapkan.
echo     Aplikasi tetap dapat berjalan menggunakan mode FFmpeg DSP internal.
if "%NO_PAUSE%"=="0" pause
exit /b 1

:python_ready
for /f "tokens=*" %%v in ('"%PY_CMD%" --version 2^>nul') do set "PY_VER=%%v"
echo [*] Menggunakan: %PY_VER% (%PY_CMD%)
echo.

REM -------------------------------------------------------------------
REM 2. Pemasangan Pustaka AI (Demucs, UVR MDX-Net, PyTorch, dsb.)
REM -------------------------------------------------------------------
set "WHEELS_DIR=%~dp0wheels"

if exist "%WHEELS_DIR%\" (
    echo [*] Mendeteksi paket Python wheels offline di folder installers\wheels...

    REM Gabungkan kembali PyTorch wheel jika belum ada
    if not exist "%WHEELS_DIR%\torch-2.15.0+cpu-cp311-cp311-win_amd64.whl" (
        if exist "%WHEELS_DIR%\rejoin_torch.ps1" (
            powershell -NoProfile -ExecutionPolicy Bypass -File "%WHEELS_DIR%\rejoin_torch.ps1"
        )
    )

    echo [*] Memasang paket AI secara OFFLINE [Tanpa perlu koneksi internet]...
    "%PY_CMD%" -m pip install --no-index --find-links="%WHEELS_DIR%" --prefer-binary torch torchaudio numpy soundfile lameenc onnxruntime audio-separator demucs
    goto :verify_ai
)

echo [INFO] Folder wheels offline tidak ditemukan, mengunduh via online...
echo [1/3] Memperbarui pip, setuptools, dan wheel...
"%PY_CMD%" -m pip install --upgrade pip setuptools wheel --prefer-binary >nul 2>&1

echo.
echo [2/3] Memasang PyTorch CPU Engine (Kualitas Studio)...
"%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu --prefer-binary

echo.
echo [3/3] Memasang Demucs AI, UVR MDX-Net, ONNX Runtime, dan modul audio...
"%PY_CMD%" -m pip install --prefer-binary numpy soundfile lameenc onnxruntime audio-separator demucs

:verify_ai

echo.
echo ======================================================================
echo  Verifikasi Instalasi AI...
echo ======================================================================
set "DEMUCS_OK=0"
set "UVR_OK=0"

"%PY_CMD%" -m demucs --help >nul 2>&1
if not errorlevel 1 (
    set "DEMUCS_OK=1"
    echo [OK] Mesin AI Demucs SIAP! [Pemisahan 4 dan 5+ Stems]
) else (
    echo [!] Mesin Demucs belum aktif.
)

"%PY_CMD%" -m audio_separator.utils.cli --version >nul 2>&1
if not errorlevel 1 (
    set "UVR_OK=1"
    echo [OK] Mesin AI UVR MDX-Net SIAP! [Isolasi Vokal dan Musik Zero-Bleed]
) else (
    echo [!] Modul UVR audio-separator belum aktif.
)

echo ======================================================================
echo.

if "%NO_PAUSE%"=="0" pause
exit /b 0
