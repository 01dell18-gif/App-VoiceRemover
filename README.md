# FYJ Channel Voice - AI & DSP Vocal & Music Separator

![FYJ Channel Voice Logo](public/img/logo.png)

### 🎵 Pisahkan Vokal dari Musik Lagu Secara Cepat & Akurat 🎵

Aplikasi web modern untuk memisahkan suara vokal dari instrumen / musik lagu secara instan. Dilengkapi dengan kontrol pemutar lagu mandiri, mixer audio interaktif, pemutar demo lagu bawaan, dan fitur ekspor ZIP 1-klik.

[Fitur Utama](#-fitur-utama) • [Cara Menjalankan](#-cara-menjalankan-aplikasi) • [Kontrol Pemutar & Mixer](#-kontrol-pemutar--mixer) • [Installer Offline](#-paket-installer-offline-perangkat-lain) • [Struktur Proyek](#-struktur-proyek)

---

## ✨ Fitur Utama

- 🧠 **Pemisahan Suara AI Mutakhir (Meta Research Demucs HTDemucs)**:
  - **Zero Vocal Bleed (100% Bersih)**: Menggunakan arsitektur jaringan syaraf tiruan *Hybrid Transformer Demucs (HTDemucs)* terlatih dari Meta AI Research.
  - **Instrumental / Musik Murni**: Musik instrumental bebas 100% dari suara vokal (termasuk vokal stereo, reverb, backing vocal, dan echo).
  - **Vokal Acapella Murni**: Isolasi vokal manusia yang jernih berstandar rekaman studio.
  - **Bass Murni**: Ekstraksi instrumen bass terisolasi secara neural tanpa distorsi atau kebocoran dari drum/vokal.
  - **Drum & Perkusi Murni**: Ekstraksi ketukan drum, snare, hi-hat, dan simbal secara mandiri.
  - **Dual Engine System**: Otomatis mendeteksi Demucs AI Neural Network untuk kualitas studio, serta FFmpeg DSP Engine sebagai fallback cepat.
- 🎚️ **Mode Pemisahan Fleksibel**:
  - **2 Stems (Vokal & Musik)**: Menghasilkan track Vokal murni dan Instrumental / Musik (Karaoke) terisolasi total.
  - **4 Stems**: Menghasilkan track Vokal, Drum & Perkusi, Bass, dan Instrumen Lainnya (Melodi).
  - **5 Stems**: Menghasilkan pemisahan instrumen lebih rinci.
- 🎧 **Mode Pemutar Instan (Quick Mode Pills)**:
  - `[ 🎵 Musik Saja (Karaoke) ]` : Hanya memutar musik instrumental tanpa suara vokal.
  - `[ 🎤 Vokal Saja ]` : Hanya memutar suara vokal tanpa instrumen.
  - `[ 🎚️ Mix Keduanya ]` : Memutar vokal dan musik secara sinkron untuk penyesuaian volume mandiri.
  - `[ 🎧 Lagu Asli ]` : Memutar lagu asli sebagai referensi perbandingan.
- ⏯️ **Pemutaran Mandiri Per-Track**:
  - Setiap kartu track dilengkapi tombol **`▶ Putar`** / **`⏸ Jeda`** sendiri.
  - Saat satu track diputar (misal: Vokal atau Bass), track lain otomatis dinonaktifkan sehingga Anda dapat mendengarkan hasil pemisahan secara terisolasi tanpa tumpang tindih suara.
- 🎛️ **Master Audio Mixer & Efek**:
  - Slider Volume mandiri (0% - 100%) untuk setiap track.
  - Tombol **Solo [S]** untuk mengisolasi track pilihan dan membisukan track lainnya.
  - Tombol **Mute [M]** untuk mematikan suara track terpilih.
  - Visualizer gelombang suara animasi responsif pada track yang sedang aktif.
  - Pengatur Tempo pemutaran (`0.75x`, `1.0x Normal`, `1.25x`, `1.5x`).
  - Scrubber progress bar dan penunjuk durasi waktu realtime.
- 📦 **Download Fleksibel & ZIP 1-Klik**:
  - Unduh per track individu dalam format MP3 320kbps / 192kbps.
  - Unduh seluruh track sekaligus dalam satu file ZIP (`.zip`) lengkap dengan dokumen informasi hasil pemisahan.
- ✨ **Lagu Demo Sampel Terpasang**:
  - Tersedia tombol *"✨ Coba Demo Lagu Sampel"* di area upload untuk mencoba dan menguji aplikasi secara langsung tanpa harus menyiapkan file audio terlebih dahulu.
- 📱 **Dukungan Jaringan Lokal (Multi-Device / HP)**:
  - Server otomatis mendeteksi alamat IP jaringan lokal sehingga web app dapat dibuka dari HP, tablet, atau laptop lain di jaringan Wi-Fi yang sama.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi berjalan pada port default **`3032`** (`http://localhost:3032`).

### 1. Cara Cepat (Windows 1-Click Run)

Cukup klik ganda (double-click) file **`start.bat`** di folder utama:

1. **Pemeriksaan Otomatis**: Script akan memeriksa apakah program yang diperlukan (Node.js & dependensi) sudah ada di perangkat.
2. **Langsung Berjalan**: Jika program sudah ada, sistem **langsung menjalankan server** dan **otomatis membuka peramban web di `http://localhost:3032`** dalam 2 detik tanpa menunggu lama.
3. **Pemasangan Mandiri**: Jika dijalankan di komputer baru yang belum memiliki Node.js, `start.bat` akan otomatis mendeteksi dan memasang file installer Node.js dari folder `installers/`.

---

### 2. Cara Manual (Command Line)

```bash
# 1. Masuk ke direktori aplikasi
cd App-VoiceRemover

# 2. Pasang dependensi aplikasi (hanya pertama kali)
npm install

# 3. Jalankan server
node server.js
```

Setelah server aktif, buka peramban web di alamat:

- **Komputer Lokal**: [http://localhost:3032](http://localhost:3032)
- **Akses dari HP / Laptop Lain**: `http://<IP-Lokal-Anda>:3032`

---

## 📦 Paket Installer Offline (Perangkat Lain)

Di dalam folder **[`installers/`](installers/)** telah disediakan file instalasi resmi agar aplikasi dapat langsung dipasang dan dijalankan di komputer mana saja tanpa koneksi internet:

| File | Keterangan | Status |
| --- | --- | --- |
| **`node-v20.18.0-x64.msi`** | Runtime Node.js LTS 64-bit untuk menjalankan server | **Wajib** |
| **`python-3.11.9-amd64.exe`** | Python 3.11 resmi untuk mendukung modul AI Demucs | Opsional |
| **`install_all.bat`** | Script 1-klik untuk memasang Node.js & Python | Utilitas |
| **`setup_ai_packages.bat`** | Script otomatis memasang paket AI Demucs & PyTorch CPU | Utilitas AI |
| **`README_INSTALLER.txt`** | Panduan petunjuk instalasi di perangkat lain | Dokumentasi |

> **Catatan**: Aplikasi sudah menyertakan paket internal `ffmpeg-static` bawaan sehingga pemisahan audio langsung berfungsi tanpa konfigurasi rumit.

---

## 📁 Struktur Proyek

```text
App-VoiceRemover/
├── installers/                   # Paket installer offline untuk komputer lain
│   ├── node-v20.18.0-x64.msi     # Installer Node.js LTS
│   ├── python-3.11.9-amd64.exe   # Installer Python 3.11
│   ├── install_all.bat           # Script pasang otomatis Node.js & Python
│   ├── setup_ai_packages.bat     # Script pasang modul AI Demucs
│   └── README_INSTALLER.txt      # Petunjuk installer
├── public/                       # Frontend Web App
│   ├── audio/
│   │   └── demo_song.mp3         # Lagu demo sampel stereo
│   ├── css/
│   │   └── styles.css            # Desain tampilan UI tema gelap & glassmorphism
│   ├── js/
│   │   └── app.js                # Logika pemutar, mixer, upload & Socket.IO
│   ├── img/
│   │   └── favicon.svg           # Ikon aplikasi
│   └── index.html                # Halaman utama aplikasi
├── uploads/                      # Penyimpanan sementara file yang diunggah
├── outputs/                      # Penyimpanan hasil file audio yang dipisahkan
├── temp/                         # File pemrosesan sementara
├── server.js                     # Backend API & Mesin Pemroses Audio Express
├── package.json                  # Konfigurasi dependensi Node.js
├── start.bat                     # Peluncur otomatis 1-klik untuk Windows
├── .gitignore                    # Pengaturan berkas yang diabaikan Git
└── README.md                     # Dokumentasi resmi proyek
```

---

## 🛠️ Spesifikasi Teknologi

| Komponen | Teknologi |
| --- | --- |
| **Runtime & Server** | Node.js (v18+) + Express |
| **Realtime Progress** | Socket.IO |
| **Mesin AI Utama** | Demucs HTDemucs (Meta Research Neural Network - Zero Vocal Bleed) |
| **Mesin Audio Fallback** | FFmpeg DSP Engine (Phase Cancellation) |
| **Arsip & Ekspor** | Archiver (ZIP Generator) |
| **Frontend UI** | HTML5, CSS3 murni (Modern Glassmorphism & Responsive Layout), JavaScript Modern |
| **Port Default** | `3032` |

---

## 📋 Panduan Penggunaan Web

1. **Pilih atau Unggah Lagu**:
   - Tarik & lepas (*drag & drop*) file lagu (MP3, WAV, FLAC, M4A, AAC, OGG) ke area unggah, atau
   - Klik tombol **"✨ Coba Demo Lagu Sampel"** untuk langsung mencoba lagu contoh.
2. **Pilih Mode Pemisahan**:
   - Pilih *Vokal & Musik* (2 track), *4 Stems*, atau *5 Stems*.
3. **Mulai Pemisahan**:
   - Klik tombol **"Mulai Pisahkan"** dan perhatikan animasi progres pemrosesan.
4. **Dengarkan & Atur Suara**:
   - Klik mode pemutar instan seperti `Musik Saja` untuk karaoke, atau `Vokal Saja` untuk mendengarkan vokal.
   - Gunakan tombol `Putar` pada masing-masing kartu track untuk mendengarkan track secara mandiri.
   - Sesuaikan volume masing-masing track atau gunakan tombol `Solo` / `Mute`.
5. **Download Hasil**:
   - Klik tombol **Download** pada kartu track untuk mengunduh lagu yang diinginkan, atau
   - Klik tombol **"Download Semua (ZIP)"** untuk mengunduh seluruh file dalam satu paket zip.

---

## 🌐 Sinkronisasi Repository GitHub

Aplikasi ini tersinkronisasi penuh dengan repositori GitHub:

- **URL Repository**: [https://github.com/01dell18-gif/App-VoiceRemover.git](https://github.com/01dell18-gif/App-VoiceRemover.git)
- **Branch**: `main`

---

## 📝 Lisensi

Hak Cipta © 2026 FYJ Channel Voice. Didistribusikan di bawah lisensi MIT.
