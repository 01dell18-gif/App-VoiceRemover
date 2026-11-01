@echo off
title FYJ Channel Voice - Pemasangan Paket AI Pemisah Audio
color 0B

echo ======================================================================
echo    FYJ Channel Voice - Pemasangan Paket AI (Demucs dan UVR MDX-Net)
echo ======================================================================
echo.

set "PY_CMD="
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
) else if exist "%ProgramFiles%\Python311\python.exe" (
    set "PY_CMD=%ProgramFiles%\Python311\python.exe"
) else (
    where python >nul 2>&1 && set "PY_CMD=python"
)

if not defined PY_CMD (
    echo [!] Python tidak ditemukan di perangkat ini!
    echo Silakan jalankan installer Python terlebih dahulu di folder installers.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('"%PY_CMD%" --version') do set "PY_VER=%%v"
echo [*] Menggunakan: %PY_VER% (%PY_CMD%)
echo.

echo [1/4] Memeriksa dan memperbarui pip...
"%PY_CMD%" -m pip install --upgrade pip

echo.
echo [2/4] Memasang PyTorch CPU Engine...
"%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

echo.
echo [3/4] Memasang Demucs AI, NumPy, SoundFile, dan LameEnc...
"%PY_CMD%" -m pip install numpy demucs soundfile lameenc

echo.
echo [4/4] Memasang UVR MDX-Net dan ONNX Runtime (Zero Bleed Studio Quality)...
"%PY_CMD%" -m pip install onnxruntime audio-separator

echo.
echo ======================================================================
echo  Verifikasi Instalasi AI...
echo ======================================================================
"%PY_CMD%" -m demucs --help >nul 2>&1
if not errorlevel 1 (
    echo [OK] Mesin AI Demucs SIAP! (Pemisahan 4 dan 5+ Stems)
) else (
    echo [!] Terjadi kendala saat memverifikasi Demucs.
)

"%PY_CMD%" -m audio_separator.utils.cli --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Mesin AI UVR MDX-Net SIAP! (Isolasi Vokal dan Musik Zero-Bleed)
) else (
    echo [!] Modul UVR audio-separator belum aktif.
)

echo ======================================================================
echo.
pause
