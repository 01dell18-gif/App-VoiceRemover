# 🌐 Panduan Menghubungkan & Menggunakan Domain Web
## FYJ Channel Voice - AI & DSP Vocal Remover

Aplikasi web **FYJ Channel Voice** telah dirancang secara fleksibel (*Domain & Cloud Ready*) sehingga dapat langsung dihubungkan ke domain atau subdomain pribadi Anda (contoh: `suara.domainanda.com`, `vokal.my.id`, atau `ai.namasitus.com`).

---

## 📋 Daftar Isi

1. [Cara Cepat via `domain_setup.bat`](#1-cara-cepat-via-domain_setupbat-khusus-windows)
2. [Konfigurasi Environment (`.env`)](#2-konfigurasi-environment-env)
3. [Metode 1: Cloudflare Tunnel (Terbaik untuk PC Lokal & Tanpa Port Forwarding)](#metode-1-cloudflare-tunnel-gratis--rekomendasi-pc-lokal)
4. [Metode 2: VPS Linux dengan Nginx & Let's Encrypt SSL](#metode-2-vps-linux-dengan-nginx--lets-encrypt-ssl)
5. [Metode 3: Menggunakan Caddy (Automatic HTTPS)](#metode-3-menggunakan-caddy-server-automatic-https)
6. [Metode 4: Menjalankan Langsung dengan Sertifikat SSL Bawaan (Port 443 & 80)](#metode-4-ssl-langsung-di-nodejs-port-443--80)
7. [Metode 5: Cloud Hosting / PaaS (Render, Railway)](#metode-5-cloud-hosting--paas-render-railway)
8. [Tips Penting Reverse Proxy (Upload 100MB & Timeout AI)](#tips-penting-reverse-proxy)

---

## 1. Cara Cepat via `domain_setup.bat` (Khusus Windows)

Pada komputer Windows, Anda cukup klik ganda (double-click) file:
```
domain_setup.bat
```
Script interaktif ini akan membantu Anda:
* Memasukkan nama domain ke file `.env` secara otomatis.
* Menjalankan aplikasi web secara langsung (`start.bat`).
* Mengatur port aplikasi.
* Menguji resolusi DNS dan koneksi domain.
* Membuka panduan konfigurasi Nginx / Caddy / Cloudflare.

---

## 2. Konfigurasi Environment (`.env`)

Aplikasi membaca pengaturan domain dari file `.env`. Salin file contoh `.env.example` menjadi `.env`:

```bash
# Windows
copy .env.example .env

# Linux / Mac
cp .env.example .env
```

Buka file `.env` dan atur parameter berikut:

```env
# Port aplikasi
PORT=3032

# Mengikat ke semua interface jaringan
HOST=0.0.0.0

# Masukkan domain Anda
DOMAIN=suara.domainanda.com
APP_URL=https://suara.domainanda.com

# Izinkan reverse proxy membaca IP asli dan WebSocket
TRUST_PROXY=1

# Izinkan CORS
CORS_ORIGIN=*
```

Saat Anda menjalankan `start.bat` atau `node server.js`, banner server akan otomatis menampilkan alamat domain Anda.

---

## Metode 1: Cloudflare Tunnel (Gratis & Rekomendasi PC Lokal)

Jika Anda ingin menjalankan aplikasi dari komputer/laptop Windows di rumah atau kantor dan dapat diakses dari seluruh dunia menggunakan domain sendiri **tanpa perlu membeli VPS, tanpa IP publik statis, dan tanpa menyetel port forwarding di router WiFi**:

### Kelebihan Cloudflare Tunnel:
* ✅ **100% Gratis** disediakan oleh Cloudflare.
* ✅ **Otomatis SSL HTTPS** dengan gembok hijau aman.
* ✅ **Proteksi DDoS** dan CDN global.
* ✅ **Tidak membocorkan IP asli** komputer Anda ke internet.

### Langkah-langkah:
1. Hubungkan domain Anda ke akun [Cloudflare](https://dash.cloudflare.com/) (gratis).
2. Unduh alat [cloudflared untuk Windows](https://github.com/cloudflare/cloudflared/releases) atau jalankan di CMD:
   ```cmd
   winget install Cloudflare.cloudflared
   ```
3. Login ke akun Cloudflare Anda:
   ```cmd
   cloudflared tunnel login
   ```
4. Buat tunnel baru:
   ```cmd
   cloudflared tunnel create fyj-tunnel
   ```
5. Arahkan subdomain/domain Anda ke tunnel:
   ```cmd
   cloudflared tunnel route dns fyj-tunnel suara.domainanda.com
   ```
6. Jalankan tunnel mengarah ke port lokal `3032`:
   ```cmd
   cloudflared tunnel run --url http://localhost:3032 fyj-tunnel
   ```
7. Buka browser di `https://suara.domainanda.com` — Aplikasi Anda sudah online di domain publik!

---

## Metode 2: VPS Linux dengan Nginx & Let's Encrypt SSL

Jika Anda menyewa VPS Linux (Ubuntu 22.04 / 24.04 atau Debian 11 / 12):

### 1. Pasang Node.js, Python, FFmpeg & Nginx
```bash
sudo apt update && sudo apt install -y nodejs npm python3 python3-pip ffmpeg nginx git
```

### 2. Arahkan DNS Domain
Di dashboard penyedia domain Anda (Namecheap, Niagahoster, Cloudflare, dll.):
* Tambahkan **A Record**:
  * **Host/Name**: `suara` (atau `@` untuk domain utama)
  * **Value/IP**: `IP_VPS_ANDA`
  * **TTL**: Auto / 300

### 3. Salin Proyek & Pasang Dependensi
```bash
git clone https://github.com/01dell18-gif/App-VoiceRemover.git
cd App-VoiceRemover
npm install
pip3 install -r requirements.txt
cp .env.example .env
```

### 4. Pasang Konfigurasi Nginx
Salin file konfigurasi yang sudah disediakan di folder `nginx/`:
```bash
sudo cp nginx/fyj-voice.conf /etc/nginx/sites-available/fyj-voice
sudo sed -i 's/suara.domainanda.com/domain-anda-sebenarnya.com/g' /etc/nginx/sites-available/fyj-voice
sudo ln -s /etc/nginx/sites-available/fyj-voice /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Pasang Sertifikat SSL Gratis (HTTPS) dengan Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda-sebenarnya.com
```

### 6. Jalankan Aplikasi dengan PM2 (Auto-Restart 24/7)
```bash
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup
```

---

## Metode 3: Menggunakan Caddy Server (Automatic HTTPS)

Caddy adalah web server modern dengan fitur otomatisasi SSL paling mudah di dunia. Caddy akan otomatis membuat dan memperpanjang sertifikat Let's Encrypt tanpa konfigurasi rumit.

1. Pasang Caddy di server Anda:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install caddy
   ```
2. Salin file `Caddyfile` yang sudah disediakan ke `/etc/caddy/Caddyfile`:
   ```bash
   sudo cp Caddyfile /etc/caddy/Caddyfile
   # Ganti suara.domainanda.com dengan domain Anda
   sudo nano /etc/caddy/Caddyfile
   ```
3. Restart Caddy:
   ```bash
   sudo systemctl restart caddy
   ```

---

## Metode 4: SSL Langsung di Node.js (Port 443 & 80)

Jika Anda ingin Node.js langsung menangani koneksi HTTPS tanpa Nginx/Caddy:

1. Letakkan file sertifikat SSL Anda (misal `cert.pem` dan `privkey.pem`) di folder proyek.
2. Buka file `.env` dan atur:
   ```env
   PORT=443
   HOST=0.0.0.0
   SSL_ENABLED=true
   SSL_CERT_PATH=./cert.pem
   SSL_KEY_PATH=./privkey.pem
   REDIRECT_HTTP=true
   HTTP_PORT=80
   ```
3. Jalankan aplikasi:
   ```bash
   node server.js
   ```
   Aplikasi akan otomatis mendengarkan HTTPS di port 443 dan mengalihkan semua traffic HTTP port 80 ke HTTPS.

---

## Metode 5: Cloud Hosting / PaaS (Render, Railway)

Aplikasi ini sudah menyertakan `Procfile`, `Dockerfile`, dan `docker-compose.yml`.

### Di Render (render.com):
1. Buat **Web Service** baru dan hubungkan ke repositori GitHub `App-VoiceRemover`.
2. Di bagian **Settings** -> **Custom Domains**:
   * Masukkan domain Anda (misal: `suara.domainanda.com`).
   * Tambahkan CNAME record di DNS domain Anda sesuai petunjuk yang diberikan Render.
3. Render akan otomatis menerbitkan sertifikat SSL gratis untuk domain Anda.

### Di Railway (railway.app):
1. Buat project baru dari GitHub repo.
2. Buka **Service Settings** -> **Networking** -> **Custom Domain**.
3. Masukkan domain Anda dan arahkan DNS CNAME ke target yang ditentukan Railway.

---

## Tips Penting Reverse Proxy

Saat menggunakan domain di balik reverse proxy (Nginx, Apache, Cloudflare, Caddy), ada 3 konfigurasi krusial yang sudah disiapkan di repositori ini:

1. **Batas Ukuran Upload Audio (100MB)**:
   * *Nginx*: `client_max_body_size 100M;`
   * *Caddy*: `request_body { max_size 100MB }`
   * Hal ini mencegah error `413 Request Entity Too Large` saat mengunggah lagu berkualitas tinggi / FLAC.

2. **Dukungan WebSocket Realtime (Socket.IO)**:
   * Memungkinkan progress bar pemisahan suara ter-update secara real-time di layar pengguna.
   * *Nginx*: `proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";`

3. **Timeout Pemrosesan AI (600 Detik / 10 Menit)**:
   * Pemisahan audio menggunakan AI neural network pada lagu berdurasi panjang membutuhkan waktu pemrosesan.
   * *Nginx*: `proxy_read_timeout 600s;`
   * Hal ini mencegah munculnya error `504 Gateway Timeout`.

