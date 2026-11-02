================================================================================
          FYJ CHANNEL VOICE - FOLDER INSTALLER APLIKASI PENDUKUNG
================================================================================

Folder ini berisi file installer dan utilitas aplikasi pendukung yang dibutuhkan
agar aplikasi web FYJ Channel Voice dapat dijalankan secara lancar di perangkat
atau komputer lain mana pun (Offline & Multi-Device Ready).

DAFTAR FILE INSTALLER & KODE PEMASANGAN:
--------------------------------------------------------------------------------
1. vc_redist.x64.exe
   - Fungsi: Microsoft Visual C++ 2015-2022 x64 Runtime.
   - Status: WAJIB untuk mendukung pustaka neural network PyTorch, ONNX, dan audio C++ DLLs.

2. node-v20.18.0-x64.msi
   - Fungsi: Runtime utama Node.js untuk menjalankan backend Express & Web App.
   - Status: WAJIB (Harus terpasang agar start.bat dapat berjalan).

3. python-3.11.9-amd64.exe
   - Fungsi: Interpreter bahasa Python 3.11 64-bit resmi untuk menjalankan modul AI.
   - Status: Diperlukan untuk pemisahan suara kualitas studio (Demucs & UVR MDX-Net).
   - Catatan: Aplikasi sengaja menggunakan Python 3.11 karena memiliki paket pre-compiled 
     binary wheel resmi sehingga TIDAK memerlukan Visual Studio C++ compiler manual.

4. ffmpeg.zip
   - Fungsi: Paket arsip biner mesin audio FFmpeg static bawaan untuk Windows.
   - Status: Mesin pemroses audio DSP dan konversi audio format MP3/WAV/FLAC.

5. setup_ai_packages.bat
   - Fungsi: Script otomatis untuk menginstal PyTorch CPU dan modul Demucs v4.1,
     UVR MDX-Net (audio-separator), ONNX Runtime, NumPy, SoundFile, dan LameEnc via pip.

6. install_all.bat
   - Fungsi: Script 1-klik untuk memeriksa dan memasang seluruh paket secara 
     lengkap (Visual C++, Node.js, FFmpeg, Python 3.11, dan paket AI Demucs & UVR)
     tanpa perlu langkah manual.

CARA MENGGUNAKAN DI PERANGKAT / KOMPUTER LAIN:
--------------------------------------------------------------------------------
1. Salin seluruh folder project "App-VoiceRemover" ke komputer tujuan.
2. Cukup jalankan "start.bat" di folder utama project.
   - "start.bat" otomatis mendeteksi apakah Visual C++, Node.js, Python 3.11, dan
     FFmpeg sudah ada.
   - Jika belum ada atau versi di komputer tidak kompatibel (misalnya Python 3.15),
     "start.bat" otomatis memasang installer resmi dari folder installers ini.
3. Setelah siap, server langsung berjalan dan peramban web otomatis terbuka di
   alamat: http://localhost:3032.

Dibuat untuk: FYJ Channel Voice
Repository: https://github.com/01dell18-gif/App-VoiceRemover.git
================================================================================
