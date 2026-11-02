<p align="center">
  <img src="public/img/logo.png" alt="FYJ Channel Voice Logo" width="140" />
</p>

# FYJ Channel Voice - AI & DSP Vocal & Music Separator

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

1. **Pemeriksaan & Self-Healing Otomatis**: Script akan memeriksa runtime Microsoft Visual C++, Node.js, paket dependensi `node_modules`, modul audio FFmpeg, serta Python 3.11 khusus AI.
2. **Pemasangan 100% Offline di Komputer Baru**: Jika dijalankan di komputer lain yang belum memiliki aplikasi pendukung atau tidak terhubung internet, `start.bat` akan **otomatis mengambil dan memasang paket offline lengkap yang sudah disediakan di folder `installers/`** (Visual C++, Node.js, `node_modules.zip`, FFmpeg, Python 3.11, dan 75 paket biner wheels AI Demucs & UVR MDX-Net).
3. **Langsung Berjalan**: Sistem langsung menjalankan server dan **otomatis membuka peramban web di `http://localhost:3032`** dalam 2 detik.
4. **Installer Lengkap 1-Klik**: Anda juga dapat menjalankan file **[`installers/install_all.bat`](installers/install_all.bat)** untuk memasang seluruh kebutuhan komputer baru secara menyeluruh tanpa koneksi internet.

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

### 3. Deploy ke Domain Web & Cloud Hosting (VPS / Docker / PaaS)

Aplikasi ini sudah **100% Domain & Production Ready**. Anda dapat menghubungkannya dengan domain sendiri (contoh: `suara.domainanda.com`).

> 📖 **Panduan Lengkap Domain**: Silakan baca panduan lengkap step-by-step di file **[`PANDUAN_DOMAIN.md`](PANDUAN_DOMAIN.md)** atau jalankan script otomatis **[`domain_setup.bat`](domain_setup.bat)** di Windows.

#### A. Konfigurasi Cepat Domain Windows (`domain_setup.bat`)
Cukup klik ganda file `domain_setup.bat` di Windows untuk memasukkan domain Anda, mengatur port, atau menghubungkan dengan Cloudflare Tunnel (gratis tanpa IP publik & tanpa port-forwarding).

#### B. Menggunakan Docker / Docker Compose (Rekomendasi VPS Linux & Domain Web)

Jika Anda memiliki server VPS (Ubuntu/Debian) dengan domain terpasang:

```bash
# 1. Clone repositori ke server VPS
git clone https://github.com/01dell18-gif/App-VoiceRemover.git
cd App-VoiceRemover

# 2. Bangun dan jalankan kontainer secara instan
docker compose up -d --build
```

Aplikasi langsung aktif berjalan di port `3032` dengan seluruh modul AI Demucs dan FFmpeg terisolasi sempurna. Anda tinggal mengarahkan Nginx reverse proxy domain Anda ke `http://127.0.0.1:3032`.

#### B. Menggunakan PaaS Cloud (Render, Railway, Heroku)

Repositori ini telah menyertakan **`Procfile`** dan **`requirements.txt`**:
- Hubungkan akun GitHub Anda ke Render / Railway.
- Pilih repositori `App-VoiceRemover`.
- Sistem cloud akan otomatis mendeteksi `Procfile` (`web: node server.js`) dan memasang dependensi dari `package.json` dan `requirements.txt`.

#### C. Manual di VPS Linux (Nginx + PM2)

```bash
# 1. Pasang dependensi sistem
sudo apt update && sudo apt install -y nodejs npm python3 python3-pip ffmpeg git

# 2. Clone repositori dan pasang dependensi
git clone https://github.com/01dell18-gif/App-VoiceRemover.git
cd App-VoiceRemover
npm install
pip3 install -r requirements.txt

# 3. Jalankan server dengan PM2
sudo npm install -g pm2
pm2 start server.js --name "fyj-voice"
pm2 save
```

#### D. Konfigurasi Nginx Reverse Proxy (Domain Web & HTTPS SSL)

Jika aplikasi dihubungkan dengan domain web (contoh: `suara.domainanda.com`), gunakan konfigurasi Nginx berikut pada `/etc/nginx/sites-available/fyj-voice`:

```nginx
server {
    listen 80;
    server_name suara.domainanda.com;

    # Izinkan upload lagu hingga 100MB
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3032;
        proxy_http_version 1.1;

        # Dukungan WebSocket Socket.IO real-time
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Forward headers domain & IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout pemrosesan AI untuk lagu berdurasi panjang
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

Kemudian aktifkan SSL HTTPS gratis dengan Certbot:
```bash
sudo certbot --nginx -d suara.domainanda.com
```

## 📦 Paket Installer Offline (Perangkat Lain)

Di dalam folder **[`installers/`](installers/)** telah disediakan file instalasi resmi agar aplikasi dapat langsung dipasang dan dijalankan di komputer mana saja secara mandiri:

| File | Keterangan | Status |
| --- | --- | --- |
| **`vc_redist.x64.exe`** | Microsoft Visual C++ 2015-2022 x64 Runtime untuk library AI | **Wajib** |
| **`node-v20.18.0-x64.msi`** | Runtime Node.js LTS 64-bit untuk menjalankan server | **Wajib** |
| **`python-3.11.9-amd64.exe`** | Python 3.11.9 64-bit resmi untuk modul AI Demucs & UVR MDX-Net | Direkomendasikan |
| **`ffmpeg.zip`** | Arsip biner audio FFmpeg static bawaan Windows | Mesin Audio |
| **`install_all.bat`** | Script 1-klik untuk memasang seluruh paket secara otomatis | Utilitas |
| **`setup_ai_packages.bat`** | Script otomatis memasang paket AI Demucs & UVR via binary wheels | Utilitas AI |
| **`README_INSTALLER.txt`** | Panduan petunjuk instalasi di perangkat lain | Dokumentasi |

---

## 📁 Struktur Proyek

```text
App-VoiceRemover/
├── installers/                   # Paket installer offline untuk komputer lain
│   ├── vc_redist.x64.exe         # Visual C++ 2015-2022 x64 Runtime
│   ├── node-v20.18.0-x64.msi     # Installer Node.js LTS
│   ├── python-3.11.9-amd64.exe   # Installer Python 3.11.9 64-bit
│   ├── ffmpeg.zip                # Arsip biner audio FFmpeg static
│   ├── install_all.bat           # Script pasang otomatis paket pendukung
│   ├── setup_ai_packages.bat     # Script pasang modul AI Demucs & UVR
│   └── README_INSTALLER.txt      # Petunjuk installer
├── nginx/                        # Konfigurasi reverse proxy domain
│   └── fyj-voice.conf            # Template konfigurasi Nginx + SSL
├── tunnel/                       # Konfigurasi Cloudflare Tunnel
│   └── cloudflared-config.example.yml
├── public/                       # Frontend Web App
│   ├── audio/
│   │   └── demo_song.mp3         # Lagu demo sampel stereo
│   ├── css/
│   │   └── styles.css            # Desain tampilan UI tema gelap & glassmorphism
│   ├── js/
│   │   └── app.js                # Logika pemutar, mixer, upload & Socket.IO
│   ├── img/
│   │   ├── logo.svg              # Logo vektor SVG resmi FYJ Channel
│   │   ├── logo.png              # Logo resolusi tinggi PNG
│   │   └── favicon.svg           # Ikon aplikasi
│   └── index.html                # Halaman utama aplikasi
├── uploads/                      # Folder upload audio (dibersihkan otomatis)
├── outputs/                      # Folder hasil pemisahan (dibersihkan otomatis)
├── temp/                         # File pemrosesan sementara
├── Dockerfile                    # Konfigurasi container Docker untuk cloud & VPS
├── docker-compose.yml            # Konfigurasi 1-klik deploy Docker Compose
├── Caddyfile                     # Konfigurasi Caddy Web Server (Automatic HTTPS)
├── ecosystem.config.js           # Konfigurasi PM2 Process Manager
├── requirements.txt              # Daftar pustaka AI Python (PyTorch CPU, Demucs, UVR)
├── Procfile                      # Konfigurasi proses web untuk PaaS (Render, Railway, Heroku)
├── .env.example                  # Template variabel lingkungan & domain
├── PANDUAN_DOMAIN.md             # Panduan lengkap menghubungkan domain ke web app
├── domain_setup.bat              # Script interaktif pengaturan domain di Windows
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
