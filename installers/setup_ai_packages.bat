@echo off
title FYJ Channel Voice - Pemasangan Paket AI Demucs
color 0B

echo ======================================================================
echo       FYJ Channel Voice - Pemasangan Paket AI Demucs (Meta Research)
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

echo [1/3] Memeriksa dan memperbarui pip...
"%PY_CMD%" -m pip install --upgrade pip

echo.
echo [2/3] Memasang PyTorch CPU Engine...
"%PY_CMD%" -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

echo.
echo [3/3] Memasang Demucs AI, NumPy, SoundFile, dan LameEnc...
"%PY_CMD%" -m pip install numpy demucs soundfile lameenc

echo.
echo ======================================================================
echo  Verifikasi Instalasi AI Demucs...
echo ======================================================================
"%PY_CMD%" -m demucs --help >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Mesin AI Demucs BERHASIL terpasang dan siap digunakan!
    echo Kualitas Studio Zero-Bleed - Vokal, Musik, Bass, Drum - aktif.
) else (
    echo [!] Terjadi kendala saat memverifikasi Demucs.
)
echo ======================================================================
echo.
