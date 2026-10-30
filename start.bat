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
    echo  [!] PERINGATAN: Node.js TIDAK ditemukan di komputer ini!
    echo ======================================================================
    echo  Aplikasi web ini membutuhkan Node.js (versi 18 ke atas) untuk berjalan.
    echo.
    echo  Membuka halaman download Node.js resmi di browser Anda...
    start https://nodejs.org/en/download/
    echo.
    echo  Silakan unduh dan pasang (install) Node.js LTS, lalu jalankan kembali
    echo  file batch ini setelah instalasi selesai.
    echo.
    echo  Jika komputer Anda mendukung winget, Anda juga dapat membuka PowerShell
    echo  dan mengetikkan:
    echo      winget install OpenJS.NodeJS.LTS
    echo ======================================================================
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js terdeteksi: %NODE_VER%
echo.

:: -------------------------------------------------------------------
:: 2. Pemeriksaan Dependensi (node_modules)
:: -------------------------------------------------------------------
echo [2/3] Memeriksa paket dependensi aplikasi...
if not exist "node_modules\" (
    echo  Dependensi belum terpasang. Menjalankan "npm install"...
    echo  Harap tunggu beberapa saat...
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
    echo [OK] Python terdeteksi. AI Demucs dapat aktif jika model terpasang.
) else (
    echo [INFO] FFmpeg DSP Engine internal aktif (siap pakai tanpa konfigurasi tambahan).
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

:: Jadwalkan browser terbuka setelah server siap
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3032"

:: Jalankan server
node server.js

pause
