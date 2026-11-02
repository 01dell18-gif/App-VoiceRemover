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

5. node_modules.zip
   - Fungsi: Arsip seluruh paket pustaka Node.js (Express, Multer, Socket.IO, Archiver, Dotenv, dsb).
   - Status: Memungkinkan server langsung berjalan 100% offline tanpa perlu `npm install` ke internet.

6. Folder wheels/ (75 file binary wheels Python AI)
   - Fungsi: Kumpulan seluruh wheel pustaka AI PyTorch CPU, Demucs, UVR MDX-Net, ONNX Runtime,
     NumPy, SoundFile, LameEnc, dan seluruh dependensi turunannya untuk Python 3.11 64-bit.
   - Status: Dipasang otomatis secara offline via pip (--no-index --find-links).
   - Catatan: File PyTorch CPU dibagi ke dalam bagian kecil (torch_cpu.part1 s.d part3) agar aman
     dari batasan ukuran file GitHub, dan digabungkan otomatis saat proses instalasi.

7. setup_ai_packages.bat
   - Fungsi: Script otomatis untuk menginstal paket AI dari folder wheels/ secara offline tanpa internet.

8. install_all.bat
   - Fungsi: Script 1-klik untuk memeriksa dan memasang seluruh paket secara 
     lengkap (Visual C++, Node.js, node_modules, FFmpeg, Python 3.11, dan paket AI Demucs & UVR)
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
