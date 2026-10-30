# FYJ Channel Voice - AI Vocal & Music Separator

<p align="center">
  <img src="public/img/favicon.svg" width="80" alt="FYJ Channel Voice Logo">
</p>

<h3 align="center">🎵 Pisahkan Vokal dari Musik dengan Teknologi AI 🎵</h3>

<p align="center">
  Aplikasi web untuk memisahkan suara vokal dari instrumen/musik lagu menggunakan teknologi AI canggih.
</p>

---

## ✨ Fitur

- 🎤 **Pemisahan Vokal & Musik** - Pisahkan vokal dari instrumental dengan AI
- 🥁 **Multi-Track Split** - Pisahkan menjadi 2, 4, atau 5+ track (Vokal, Drum, Bass, dll.)
- 🎧 **Preview Real-time** - Dengarkan preview setiap track di browser
- 📥 **Download Gratis** - Download semua track dalam format MP3
- 🎨 **UI/UX Premium** - Desain modern, responsif dengan tema gelap
- ⚡ **Proses Cepat** - Upload dan proses dalam hitungan menit
- 📱 **Responsif** - Bekerja di desktop, tablet, dan mobile

## 🛠️ Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Backend | Node.js + Express |
| Real-time | Socket.IO |
| AI Engine | Demucs (Meta Research) |
| Audio Processing | FFmpeg |
| Frontend | HTML5, CSS3, JavaScript |
| Styling | Custom CSS (Dark Theme, Glassmorphism) |

## 🚀 Cara Install

### Prasyarat
- **Node.js** v18+ ([Download](https://nodejs.org))
- **FFmpeg** (opsional, untuk pemisahan dasar) ([Download](https://ffmpeg.org))
- **Python 3.8+** (opsional, untuk AI Demucs) ([Download](https://python.org))

### Langkah Instalasi

1. **Clone repository**
```bash
git clone https://github.com/01dell18-gif/App-VoiceRemover.git
cd App-VoiceRemover
```

2. **Install dependencies**
```bash
npm install
```

3. **Jalankan aplikasi**
```bash
npm start
```

4. **Buka di browser**
```
http://localhost:3000
```

### Install Demucs (Opsional - untuk hasil AI terbaik)

```bash
pip install demucs
```

### Install FFmpeg (Opsional - untuk pemisahan dasar)

**Windows:**
```bash
winget install FFmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

## 📋 Cara Penggunaan

1. **Upload Lagu** - Drag & drop atau klik untuk upload file audio
2. **Pilih Mode** - Pilih mode pemisahan (2 Track, 4 Stems, atau 5+ Stems)
3. **Proses** - Klik "Mulai Pisahkan" dan tunggu AI memproses
4. **Preview & Download** - Dengarkan dan download setiap track

## 📁 Struktur Proyek

```
App-VoiceRemover/
├── public/
│   ├── css/
│   │   └── styles.css          # Premium CSS styles
│   ├── js/
│   │   └── app.js              # Frontend application
│   ├── img/
│   │   └── favicon.svg         # App icon
│   └── index.html              # Main HTML page
├── uploads/                     # Uploaded files (auto-created)
├── outputs/                     # Processed files (auto-created)
├── server.js                    # Express server
├── package.json                 # Dependencies
├── .gitignore                   # Git ignore rules
└── README.md                    # Documentation
```

## 🔧 Konfigurasi

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | 3000 | Port server |
| File Limit | 100MB | Ukuran file maksimum |

## 📊 Mode Pemisahan

| Mode | Track yang Dihasilkan | Engine |
|------|----------------------|--------|
| Vokal & Musik | Vokal, Instrumental | Demucs / FFmpeg |
| 4 Stems | Vokal, Drum, Bass, Other | Demucs / FFmpeg |
| 5+ Stems | Vokal, Drum, Bass, Piano, Guitar, Other | Demucs |

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat Pull Request atau Issue.

## 📝 Lisensi

MIT License © FYJ Channel

## 🙏 Credits

- [Demucs](https://github.com/facebookresearch/demucs) - AI Music Source Separation by Meta Research
- [FFmpeg](https://ffmpeg.org) - Audio/Video processing
- [Socket.IO](https://socket.io) - Real-time communication
- [Express](https://expressjs.com) - Web framework for Node.js
