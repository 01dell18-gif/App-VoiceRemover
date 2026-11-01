@echo off
setlocal EnableDelayedExpansion
title FYJ Channel Voice - Konfigurasi Domain
chcp 65001 >nul 2>&1

:menu
cls
echo ======================================================================
echo          FYJ Channel Voice - Panduan & Pengaturan Domain Web         
echo ======================================================================
echo.
echo Aplikasi ini siap digunakan dengan domain sendiri (contoh: suara.domainanda.com).
echo.
echo Pilihlah menu di bawah ini:
echo.
echo  [1] Atur Nama Domain ke dalam File .env (Otomatis)
echo  [2] Panduan Cloudflare Tunnel (Domain dari PC lokal tanpa buka port router)
echo  [3] Tampilkan Konfigurasi Nginx Reverse Proxy (Untuk VPS Linux)
echo  [4] Tampilkan Konfigurasi Caddyfile (Automatic HTTPS)
echo  [5] Uji Sambungan Domain Web
echo  [6] Buka Panduan Lengkap (PANDUAN_DOMAIN.md)
echo  [7] Keluar
echo.
echo ======================================================================
set /p "PILIHAN=Masukkan nomor pilihan (1-7): "

if "%PILIHAN%"=="1" goto :setup_env
if "%PILIHAN%"=="2" goto :cloudflare_guide
if "%PILIHAN%"=="3" goto :nginx_guide
if "%PILIHAN%"=="4" goto :caddy_guide
if "%PILIHAN%"=="5" goto :test_domain
if "%PILIHAN%"=="6" goto :open_markdown
if "%PILIHAN%"=="7" exit /b 0
goto :menu

:setup_env
cls
echo ======================================================================
echo               Pengaturan Domain ke dalam File .env                    
echo ======================================================================
echo.
echo Masukkan nama domain yang ingin Anda gunakan.
echo Contoh: suara.domainanda.com atau pemisahvokal.id
echo (Ketik tanpa http:// atau https://)
echo.
set /p "USER_DOMAIN=Nama Domain: "
if "%USER_DOMAIN%"=="" (
    echo [!] Nama domain tidak boleh kosong.
    timeout /t 2 >nul
    goto :menu
)

echo.
echo Masukkan nomor port aplikasi (Tekan Enter untuk default: 3032):
set /p "USER_PORT=Nomor Port [3032]: "
if "%USER_PORT%"=="" set "USER_PORT=3032"

echo.
echo Apakah domain Anda sudah menggunakan HTTPS / SSL? (Y/T)
set /p "IS_HTTPS=Gunakan HTTPS [Y]: "
if /i "%IS_HTTPS%"=="t" (
    set "SCHEME=http"
) else (
    set "SCHEME=https"
)

echo.
echo [*] Menyimpan konfigurasi ke file .env...

(
echo # FYJ Channel Voice - Environment Configuration
echo PORT=%USER_PORT%
echo HOST=0.0.0.0
echo NODE_ENV=production
echo DOMAIN=%USER_DOMAIN%
echo APP_URL=%SCHEME%://%USER_DOMAIN%
echo TRUST_PROXY=1
echo CORS_ORIGIN=*
echo SSL_ENABLED=false
) > "%~dp0.env"

echo.
echo [OK] Konfigurasi berhasil disimpan ke file .env!
echo ----------------------------------------------------------------------
echo  Domain  : %USER_DOMAIN%
echo  App URL : %SCHEME%://%USER_DOMAIN%
echo  Port    : %USER_PORT%
echo ----------------------------------------------------------------------
echo.
echo Sekarang saat Anda menjalankan start.bat, aplikasi akan mengenali domain Anda.
echo.
pause
goto :menu

:cloudflare_guide
cls
echo ======================================================================
echo          Panduan Cloudflare Tunnel (Terbaik untuk PC Lokal)          
echo ======================================================================
echo.
echo Cloudflare Tunnel memungkinkan Anda menghubungkan domain Anda ke PC lokal:
echo  - GRATIS selamanya dari Cloudflare.
echo  - TANPA perlu IP Publik Statis.
echo  - TANPA perlu mengubah Port Forwarding di Router / Modem Wi-Fi.
echo  - Otomatis mendapatkan sertifikat HTTPS / SSL gratis dan proteksi DDoS.
echo.
echo Langkah mudah:
echo  1. Unduh 'cloudflared' dari: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
echo  2. Login ke akun Cloudflare Anda:
echo       cloudflared tunnel login
echo  3. Buat tunnel baru (contoh: fyj-tunnel):
echo       cloudflared tunnel create fyj-tunnel
echo  4. Arahkan domain Anda ke tunnel:
echo       cloudflared tunnel route dns fyj-tunnel suara.domainanda.com
echo  5. Jalankan tunnel mengarah ke port 3032:
echo       cloudflared tunnel run --url http://localhost:3032 fyj-tunnel
echo.
echo Template konfigurasi lengkap ada di: tunnel\cloudflared-config.example.yml
echo.
pause
goto :menu

:nginx_guide
cls
echo ======================================================================
echo       Konfigurasi Nginx Reverse Proxy (Untuk Server Linux / VPS)     
echo ======================================================================
echo.
echo File konfigurasi Nginx sudah disediakan di: nginx\fyj-voice.conf
echo.
echo Ringkasan konfigurasi:
echo   - Menghubungkan domain ke port lokal 3032.
echo   - Dukungan WebSocket Socket.IO (proxy_set_header Upgrade $http_upgrade).
echo   - Batas unggah file audio 100MB (client_max_body_size 100M).
echo   - Timeout pemrosesan AI 600 detik (proxy_read_timeout 600s).
echo.
echo Perintah memasang SSL gratis di Linux VPS:
echo   sudo certbot --nginx -d suara.domainanda.com
echo.
pause
goto :menu

:caddy_guide
cls
echo ======================================================================
echo               Konfigurasi Caddy (Otomatis HTTPS / SSL)               
echo ======================================================================
echo.
echo Caddy adalah web server modern yang otomatis mengurus sertifikat SSL gratis.
echo Cukup buat file 'Caddyfile' dengan isi:
echo.
echo   suara.domainanda.com {
echo       reverse_proxy 127.0.0.1:3032
echo       request_body {
echo           max_size 100MB
echo       }
echo   }
echo.
echo Lalu jalankan perintah: caddy run
echo Selesai! Domain langsung aktif dengan HTTPS aman.
echo.
pause
goto :menu

:test_domain
cls
echo ======================================================================
echo                     Uji Sambungan Domain Web                         
echo ======================================================================
echo.
set "CHECK_DOMAIN="
if exist "%~dp0.env" (
    for /f "usebackq tokens=1,* delims==" %%i in ("%~dp0.env") do (
        if /i "%%i"=="DOMAIN" set "CHECK_DOMAIN=%%j"
    )
)

if "%CHECK_DOMAIN%"=="" (
    set /p "CHECK_DOMAIN=Masukkan nama domain yang ingin diuji: "
) else (
    echo Domain terdaftar di .env: %CHECK_DOMAIN%
    echo Tekan Enter untuk menguji domain ini, atau ketik domain lain:
    set /p "ALT_DOMAIN="
    if not "!ALT_DOMAIN!"=="" set "CHECK_DOMAIN=!ALT_DOMAIN!"
)

if "%CHECK_DOMAIN%"=="" (
    echo [!] Tidak ada domain untuk diuji.
    pause
    goto :menu
)

echo.
echo [*] Memeriksa resolusi DNS untuk %CHECK_DOMAIN%...
nslookup %CHECK_DOMAIN%
echo.
echo [*] Melakukan ping tes ke %CHECK_DOMAIN%...
ping %CHECK_DOMAIN% -n 2
echo.
pause
goto :menu

:open_markdown
if exist "%~dp0PANDUAN_DOMAIN.md" (
    start "" "%~dp0PANDUAN_DOMAIN.md"
) else (
    echo File PANDUAN_DOMAIN.md belum ditemukan.
)
goto :menu
