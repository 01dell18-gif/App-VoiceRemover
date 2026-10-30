================================================================================
          FYJ CHANNEL VOICE - FOLDER INSTALLER APLIKASI PENDUKUNG
================================================================================

Folder ini berisi file installer aplikasi pendukung yang dibutuhkan agar web app
FYJ Channel Voice dapat dijalankan secara lancar di perangkat / komputer lain.

DAFTAR FILE INSTALLER:
--------------------------------------------------------------------------------
1. node-v20.18.0-x64.msi
   - Fungsi: Runtime utama Node.js untuk menjalankan server Express & Web App.
   - Status: WAJIB (Harus terpasang agar start.bat dapat berjalan).
   - Cara Pasang: Cukup klik ganda (double-click) file ini dan ikuti petunjuk
     di layar hingga selesai.

2. python-3.11.9-amd64.exe
   - Fungsi: Interpreter bahasa Python untuk mendukung modul pemisahan AI (Demucs).
   - Status: OPSIONAL (Sistem tetap dapat memisahkan audio menggunakan 
     FFmpeg Engine internal berkualitas tinggi jika Python tidak dipasang).
   - PENTING saat pasang: Pastikan centang opsi "Add python.exe to PATH" pada 
     layar pertama instalasi!

3. install_all.bat
   - Fungsi: Script otomatis 1-klik untuk memasang Node.js dan Python secara 
     berurutan tanpa perlu membuka browser.

CARA MENGGUNAKAN DI PERANGKAT / KOMPUTER LAIN:
--------------------------------------------------------------------------------
1. Salin seluruh folder project "App-VoiceRemover" ke perangkat lain.
2. Jalankan "start.bat" di folder utama project.
   - Jika perangkat lain belum memiliki Node.js, "start.bat" akan otomatis 
     mendeteksi installer di folder ini dan menjalankannya secara otomatis.
3. Setelah instalasi selesai, web app akan langsung terbuka di browser pada 
   alamat http://localhost:3032.

Dibuat untuk: FYJ Channel Voice
Repository: https://github.com/01dell18-gif/App-VoiceRemover.git
================================================================================
