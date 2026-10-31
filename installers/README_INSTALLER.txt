================================================================================
          FYJ CHANNEL VOICE - FOLDER INSTALLER APLIKASI PENDUKUNG
================================================================================

Folder ini berisi file installer dan utilitas aplikasi pendukung yang dibutuhkan
agar aplikasi web FYJ Channel Voice dapat dijalankan secara lancar di perangkat
atau komputer lain mana pun.

DAFTAR FILE INSTALLER & KODE PEMASANGAN:
--------------------------------------------------------------------------------
1. node-v20.18.0-x64.msi
   - Fungsi: Runtime utama Node.js untuk menjalankan backend Express & Web App.
   - Status: WAJIB (Harus terpasang agar start.bat dapat berjalan).

2. python-3.11.9-amd64.exe
   - Fungsi: Interpreter bahasa Python 3.11 resmi untuk menjalankan modul AI.
   - Status: Diperlukan untuk pemisahan suara kualitas studio (Demucs AI).

3. setup_ai_packages.bat
   - Fungsi: Script otomatis untuk menginstal PyTorch CPU dan modul Demucs v4.1,
     NumPy, SoundFile, dan LameEnc via pip.

4. install_all.bat
   - Fungsi: Script 1-klik untuk memeriksa dan memasang seluruh paket secara 
     lengkap (Node.js, Python 3.11, dan paket AI Demucs) tanpa perlu langkah manual.

CARA MENGGUNAKAN DI PERANGKAT / KOMPUTER LAIN:
--------------------------------------------------------------------------------
1. Salin seluruh folder project "App-VoiceRemover" ke komputer tujuan.
2. Cukup jalankan "start.bat" di folder utama project.
   - "start.bat" otomatis mendeteksi apakah Node.js, Python, dan Demucs sudah ada.
   - Jika belum ada, "start.bat" akan otomatis memandu pemasangannya dari folder
     installers ini.
3. Setelah siap, server langsung berjalan dan peramban web otomatis terbuka di
   alamat: http://localhost:3032.

Dibuat untuk: FYJ Channel Voice
Repository: https://github.com/01dell18-gif/App-VoiceRemover.git
================================================================================
