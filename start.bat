@echo off
chcp 65001 >nul
title FYJ Channel Voice - AI & DSP Vocal Separator
color 0B

echo ======================================================================
echo          🎵 FYJ Channel Voice - AI & DSP Vocal Separator 🎵
echo ======================================================================
echo.

:: -------------------------------------------------------------------
:: 1. Pemeriksaan Node.js (Wajib)
:: -------------------------------------------------------------------
echo [1/3] Memeriksa Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo  [!] Node.js TIDAK ditemukan di komputer ini!
    echo ======================================================================
    echo  Aplikasi web ini membutuhkan Node.js untuk berjalan.
    echo.
    if exist "%~dp0installers\node-v20.18.0-x64.msi" (
        echo  [*] Ditemukan paket installer Node.js di folder "installers".
        echo  [*] Menjalankan installer Node.js sekarang...
        echo.
        echo  Silakan ikuti wizard instalasi di layar hingga selesai (klik Next/Install).
        start /wait msiexec /i "%~dp0installers\node-v20.18.0-x64.msi"
        echo.
        echo  [OK] Instalasi Node.js selesai.
        echo.
        echo  Menyegarkan environment system...
        :: Perbarui PATH untuk sesi command prompt ini
        set "PATH=%ProgramFiles%\nodejs\;%APPDATA%\npm;%PATH%"
        where node >nul 2>&1
        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo  [INFO] Silakan tutup dan buka kembali file "start.bat" ini
            echo  agar sistem mengenali Node.js yang baru saja dipasang.
            echo.
            pause
            exit /b 0
        )
    ) else (
        echo  File installer tidak ditemukan di folder "installers\".
        echo  Membuka halaman download Node.js resmi di browser Anda...
        start https://nodejs.org/en/download/
        echo.
        echo  Silakan unduh dan pasang (install) Node.js LTS, lalu jalankan kembali
        echo  file batch ini setelah instalasi selesai.
        echo.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js terdeteksi: %NODE_VER%
echo.

:: -------------------------------------------------------------------
:: 2. Pemeriksaan Dependensi (node_modules)
:: -------------------------------------------------------------------
echo [2/3] Memeriksa paket dependensi aplikasi...
if not exist "%~dp0node_modules\" (
    echo  Dependensi belum terpasang. Menjalankan "npm install"...
    echo  Harap tunggu beberapa saat...
    cd /d "%~dp0"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [!] Gagal menginstal dependensi melalui npm!
        echo Pastikan komputer Anda terhubung ke internet.
        pause
        exit /b 1
    )
    echo [OK] Semua dependensi berhasil dipasang!
) else (
    echo [OK] Dependensi node_modules sudah siap.
)
echo.

:: -------------------------------------------------------------------
:: 3. Info Engine Pemrosesan Audio
:: -------------------------------------------------------------------
echo [3/3] Memeriksa Mesin Pemisah Audio...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%p in ('python --version') do set PY_VER=%%p
    echo [OK] Python terdeteksi (%PY_VER%). AI Demucs Engine dapat aktif.
) else (
    echo [INFO] FFmpeg DSP Engine internal aktif (siap pakai tanpa konfigurasi tambahan).
    if exist "%~dp0installers\python-3.11.9-amd64.exe" (
        echo        (Tersedia installer Python di folder "installers\" jika ingin memasang AI Engine).
    )
)
echo.

:: -------------------------------------------------------------------
:: 4. Jalankan Server dan Buka Browser
:: -------------------------------------------------------------------
echo ======================================================================
echo  🚀 Memulai server FYJ Channel Voice di http://localhost:3032 ...
echo  Browser akan terbuka secara otomatis dalam 2 detik.
echo  Untuk menghentikan aplikasi, tekan tombol [Ctrl + C] di jendela ini.
echo ======================================================================
echo.

cd /d "%~dp0"
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3032"

node server.js

pause
