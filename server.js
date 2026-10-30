const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const http = require('http');
const { Server } = require('socket.io');
const archiver = require('archiver');

// Try to load ffmpeg-static
let ffmpegBin = 'ffmpeg';
let ffmpegAvailable = false;
try {
  const ffmpegStatic = require('ffmpeg-static');
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    ffmpegBin = ffmpegStatic;
    ffmpegAvailable = true;
    console.log(`✅ FFmpeg static ready: ${ffmpegBin}`);
  }
} catch (e) {
  console.log('ℹ️ ffmpeg-static not available, will check system PATH');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3032;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Ensure directories exist
const dirs = ['uploads', 'outputs', 'temp'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
      'audio/flac', 'audio/ogg', 'audio/aac', 'audio/x-m4a',
      'audio/mp4', 'video/mp4', 'audio/webm', 'audio/x-wav'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.mp4', '.webm', '.wma'];
    
    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan MP3, WAV, FLAC, OGG, AAC, M4A, atau MP4.'));
    }
  }
});

// Track active jobs
const activeJobs = new Map();

// Check Python & Demucs availability
let pythonCmd = null;
let demucsAvailable = false;

async function findPython() {
  const cmds = ['python', 'python3', 'py'];
  for (const cmd of cmds) {
    try {
      await new Promise((resolve, reject) => {
        exec(`${cmd} --version`, (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout);
        });
      });
      pythonCmd = cmd;
      console.log(`✅ Python found: ${cmd}`);
      return cmd;
    } catch (e) {
      continue;
    }
  }
  console.log('ℹ️ Python not found. Separation will use built-in FFmpeg DSP separation.');
  return null;
}

async function checkDemucs() {
  if (!pythonCmd) return false;
  try {
    await new Promise((resolve, reject) => {
      exec(`${pythonCmd} -m demucs --help`, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
    demucsAvailable = true;
    console.log('✅ Demucs is available');
    return true;
  } catch (e) {
    console.log('ℹ️ Demucs not found. Using built-in high-quality FFmpeg audio separator.');
    return false;
  }
}

async function checkFFmpeg() {
  if (ffmpegAvailable && ffmpegBin) {
    return true;
  }
  try {
    await new Promise((resolve, reject) => {
      exec('ffmpeg -version', (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
    ffmpegAvailable = true;
    ffmpegBin = 'ffmpeg';
    console.log('✅ FFmpeg is available in system PATH');
    return true;
  } catch (e) {
    console.log('⚠️ FFmpeg not found in system PATH.');
    return false;
  }
}

// === API ROUTES ===

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    python: !!pythonCmd,
    demucs: demucsAvailable,
    ffmpeg: ffmpegAvailable,
    engine: demucsAvailable ? 'Demucs AI' : (ffmpegAvailable ? 'FFmpeg DSP Engine' : 'Basic')
  });
});

// Upload and process audio
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }

    const jobId = uuidv4();
    const separationType = req.body.separationType || 'vocals_music'; // vocals_music, 4stems, 5stems
    const outputFormat = req.body.outputFormat || 'mp3';
    
    const jobInfo = {
      id: jobId,
      filename: req.file.originalname,
      filepath: req.file.path,
      separationType,
      outputFormat,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
      results: null
    };

    activeJobs.set(jobId, jobInfo);

    // Send immediate response
    res.json({
      jobId,
      status: 'processing',
      message: 'File berhasil diunggah. Memproses pemisahan audio...'
    });

    // Process in background
    processAudio(jobId, jobInfo);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat mengunggah file' });
  }
});

// Get job status
app.get('/api/status/:jobId', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job tidak ditemukan' });
  }
  res.json(job);
});

// Download separated track
app.get('/api/download/:jobId/:track', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job || !job.results) {
    return res.status(404).json({ error: 'File tidak ditemukan' });
  }

  const track = req.params.track;
  let targetPath = null;
  let downloadName = '';
  const baseName = path.parse(job.filename).name;

  if (track === 'original') {
    targetPath = job.filepath;
    downloadName = job.filename;
  } else {
    const trackInfo = job.results.find(r => r.name === track);
    if (trackInfo && fs.existsSync(trackInfo.path)) {
      targetPath = trackInfo.path;
      const ext = path.extname(trackInfo.path);
      downloadName = `${baseName}_${track}${ext}`;
    }
  }
  
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'Track tidak ditemukan' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
  res.download(targetPath, downloadName);
});

// Download all tracks as a real ZIP file
app.get('/api/download-zip/:jobId', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job || !job.results || job.results.length === 0) {
    return res.status(404).json({ error: 'Hasil pemisahan tidak ditemukan' });
  }

  const baseName = path.parse(job.filename).name;
  const zipFilename = `${baseName}_FYJ_Separated.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFilename)}"`);

  function createZip() {
    if (typeof archiver === 'function') return archiver('zip', { zlib: { level: 6 } });
    if (archiver.ZipArchive) return new archiver.ZipArchive({ zlib: { level: 6 } });
    if (archiver.default && typeof archiver.default === 'function') return archiver.default('zip', { zlib: { level: 6 } });
    throw new Error('Unsupported archiver format');
  }

  const archive = createZip();
  
  archive.on('error', (err) => {
    console.error('Archive error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal membuat file ZIP' });
    }
  });

  archive.pipe(res);

  // Add each separated track
  job.results.forEach(track => {
    if (fs.existsSync(track.path)) {
      const ext = path.extname(track.path);
      const entryName = `${baseName}_${track.name}${ext}`;
      archive.file(track.path, { name: entryName });
    }
  });

  // Add original audio file as well
  if (fs.existsSync(job.filepath)) {
    archive.file(job.filepath, { name: `Original_${job.filename}` });
  }

  // Add info readme
  const infoText = `FYJ Channel Voice - Hasil Pemisahan Audio
File Asli: ${job.filename}
Tanggal: ${new Date().toLocaleString('id-ID')}
Mode: ${job.separationType}

Daftar Track:
${job.results.map(r => `- ${r.label} (${r.name}.mp3)`).join('\n')}

Dibuat dengan FYJ Channel Voice (https://github.com/01dell18-gif/App-VoiceRemover)
`;
  archive.append(infoText, { name: 'FYJ_Voice_Info.txt' });

  archive.finalize();
});

// Download all tracks info list (JSON fallback)
app.get('/api/download-all/:jobId', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job || !job.results) {
    return res.status(404).json({ error: 'File tidak ditemukan' });
  }
  
  res.json({
    zipUrl: `/api/download-zip/${req.params.jobId}`,
    tracks: job.results.map(r => ({
      name: r.name,
      label: r.label,
      url: `/api/download/${req.params.jobId}/${r.name}`
    }))
  });
});

// Stream audio for preview
app.get('/api/stream/:jobId/:track', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'File tidak ditemukan' });
  }

  const track = req.params.track;
  let trackPath;
  
  if (track === 'original') {
    trackPath = job.filepath;
  } else {
    if (!job.results) return res.status(404).json({ error: 'Track belum siap' });
    const trackInfo = job.results.find(r => r.name === track);
    if (!trackInfo) {
      return res.status(404).json({ error: 'Track tidak ditemukan' });
    }
    trackPath = trackInfo.path;
  }

  if (!fs.existsSync(trackPath)) {
    return res.status(404).json({ error: 'File tidak ditemukan' });
  }

  const stat = fs.statSync(trackPath);
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(trackPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': stat.size,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(200, head);
    fs.createReadStream(trackPath).pipe(res);
  }
});

// === AUDIO PROCESSING ===

async function processAudio(jobId, jobInfo) {
  const outputDir = path.join(__dirname, 'outputs', jobId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    emitProgress(jobId, 10, 'Menganalisis file audio...');

    if (demucsAvailable) {
      await processWithDemucs(jobId, jobInfo, outputDir);
    } else {
      await processWithFFmpeg(jobId, jobInfo, outputDir);
    }

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    jobInfo.status = 'error';
    jobInfo.error = error.message;
    emitProgress(jobId, -1, `Error: ${error.message}`);
  }
}

async function processWithDemucs(jobId, jobInfo, outputDir) {
  return new Promise((resolve, reject) => {
    emitProgress(jobId, 20, 'Memulai pemisahan dengan AI Demucs...');

    let model = 'htdemucs';
    switch (jobInfo.separationType) {
      case 'vocals_music':
        model = 'htdemucs';
        break;
      case '4stems':
        model = 'htdemucs';
        break;
      case '5stems':
        model = 'htdemucs_6s';
        break;
    }

    const args = [
      '-m', 'demucs',
      '--two-stems', jobInfo.separationType === 'vocals_music' ? 'vocals' : undefined,
      '-n', model,
      '--out', outputDir,
      '--mp3',
      jobInfo.filepath
    ].filter(Boolean);

    const proc = spawn(pythonCmd, args);
    
    let lastProgress = 20;
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/(\d+)%/);
      if (match) {
        lastProgress = Math.min(90, parseInt(match[1]));
        emitProgress(jobId, lastProgress, 'Memproses pemisahan audio dengan AI...');
      }
    });

    proc.stderr.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/(\d+)%/);
      if (match) {
        lastProgress = Math.min(90, parseInt(match[1]));
        emitProgress(jobId, lastProgress, 'Memproses pemisahan audio dengan AI...');
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.log('Demucs exited with error, falling back to FFmpeg DSP');
        processWithFFmpeg(jobId, jobInfo, outputDir).then(resolve).catch(reject);
        return;
      }

      const results = findOutputFiles(outputDir, jobInfo);
      jobInfo.results = results;
      jobInfo.status = 'completed';
      emitProgress(jobId, 100, 'Selesai! Track siap diunduh.');
      resolve();
    });

    proc.on('error', (err) => {
      console.log('Demucs spawn error, falling back to FFmpeg DSP:', err);
      processWithFFmpeg(jobId, jobInfo, outputDir).then(resolve).catch(reject);
    });
  });
}

async function processWithFFmpeg(jobId, jobInfo, outputDir) {
  const inputFile = jobInfo.filepath;
  const baseName = path.parse(jobInfo.filename).name;
  const results = [];

  emitProgress(jobId, 25, 'Menganalisis frekuensi dan kanal audio...');

  // Deteksi kanal audio (mono vs stereo)
  let isMono = false;
  try {
    const probeOutput = await new Promise((resolve) => {
      exec(`"${ffmpegBin}" -i "${inputFile}"`, (err, stdout, stderr) => {
        resolve((stderr || '') + (stdout || ''));
      });
    });
    if (probeOutput.includes('mono,') || probeOutput.includes('1 channels')) {
      isMono = true;
      console.log(`ℹ️ [Job ${jobId}] Terdeteksi format audio MONO`);
    } else {
      console.log(`ℹ️ [Job ${jobId}] Terdeteksi format audio STEREO`);
    }
  } catch (e) {
    isMono = false;
  }

  const instrumentalPath = path.join(outputDir, `${baseName}_instrumental.mp3`);
  const vocalsPath = path.join(outputDir, `${baseName}_vocals.mp3`);

  if (isMono) {
    // 1. Ekstrak Musik / Instrumental untuk MONO
    emitProgress(jobId, 45, 'Mengekstrak Musik / Instrumental (Notch Filter Mono)...');
    await runFFmpeg([
      '-i', inputFile,
      '-af', 'equalizer=f=1100:width_type=o:w=2.2:g=-16,equalizer=f=2800:width_type=o:w=1.6:g=-14',
      '-b:a', '192k',
      '-y', instrumentalPath
    ]);

    // 2. Ekstrak Vokal untuk MONO
    emitProgress(jobId, 65, 'Mengekstrak Suara Vokal (Bandpass Filter Mono)...');
    await runFFmpeg([
      '-i', inputFile,
      '-af', 'highpass=f=220,lowpass=f=4200,volume=1.3',
      '-b:a', '192k',
      '-y', vocalsPath
    ]);
  } else {
    // 1. Ekstrak Musik / Instrumental untuk STEREO (Out-of-phase center vocal cancellation + Bass preservation)
    emitProgress(jobId, 45, 'Mengekstrak Musik / Instrumental (Karaoke)...');
    await runFFmpeg([
      '-i', inputFile,
      '-filter_complex',
      '[0:a]asplit=2[low][high];[low]lowpass=f=160,volume=1.0[bass];[high]highpass=f=160,pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0[sides];[bass][sides]amix=inputs=2:weights=1.0 1.0:normalize=0[out]',
      '-map', '[out]',
      '-b:a', '192k',
      '-y', instrumentalPath
    ]);

    // 2. Ekstrak Vokal untuk STEREO (Subtraksi Fase: Lagu Asli dikurangi Instrumental = Vokal Murni)
    emitProgress(jobId, 65, 'Mengekstrak Suara Vokal (Subtraksi Audio Murni)...');
    await runFFmpeg([
      '-i', inputFile,
      '-i', instrumentalPath,
      '-filter_complex',
      '[1:a]volume=-1.0[inv];[0:a][inv]amix=inputs=2:weights=1.0 1.0:normalize=0,highpass=f=180,lowpass=f=5000,volume=1.2[vocal]',
      '-map', '[vocal]',
      '-b:a', '192k',
      '-y', vocalsPath
    ]);
  }

  results.push({
    name: 'instrumental',
    label: 'Instrumental / Musik',
    path: instrumentalPath,
    icon: 'music'
  });

  results.push({
    name: 'vocals',
    label: 'Vokal',
    path: vocalsPath,
    icon: 'mic'
  });

  // Jika opsi 4 stems atau 5 stems dipilih
  if (jobInfo.separationType === '4stems' || jobInfo.separationType === '5stems') {
    emitProgress(jobId, 75, 'Mengekstrak Stem Bass...');
    const bassPath = path.join(outputDir, `${baseName}_bass.mp3`);
    await runFFmpeg([
      '-i', inputFile,
      '-af', 'lowpass=f=220,volume=1.4',
      '-b:a', '192k',
      '-y', bassPath
    ]);
    results.push({
      name: 'bass',
      label: 'Bass',
      path: bassPath,
      icon: 'bass'
    });

    emitProgress(jobId, 85, 'Mengekstrak Stem Drum & Perkusi...');
    const drumsPath = path.join(outputDir, `${baseName}_drums.mp3`);
    await runFFmpeg([
      '-i', inputFile,
      '-filter_complex',
      '[0:a]asplit=2[kick][snare];[kick]bandpass=f=80:width_type=h:w=60,volume=1.3[k_out];[snare]bandpass=f=3200:width_type=h:w=2600,acompressor=threshold=-20dB:ratio=4:attack=0.5:release=50[s_out];[k_out][s_out]amix=inputs=2[out]',
      '-map', '[out]',
      '-b:a', '192k',
      '-y', drumsPath
    ]);
    results.push({
      name: 'drums',
      label: 'Drum & Perkusi',
      path: drumsPath,
      icon: 'drum'
    });

    if (jobInfo.separationType === '5stems') {
      emitProgress(jobId, 90, 'Mengekstrak Instrumen Lain / Melodi...');
      const otherPath = path.join(outputDir, `${baseName}_other.mp3`);
      await runFFmpeg([
        '-i', inputFile,
        '-af', 'highpass=f=2200,lowpass=f=12000,volume=1.1',
        '-b:a', '192k',
        '-y', otherPath
      ]);
      results.push({
        name: 'other',
        label: 'Instrumen Lain (Melodi)',
        path: otherPath,
        icon: 'other'
      });
    }
  }

  emitProgress(jobId, 96, 'Menyelesaikan pemisahan audio...');

  jobInfo.results = results;
  jobInfo.status = 'completed';
  emitProgress(jobId, 100, 'Selesai! Semua track siap diunduh dan diputar.');
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegBin, args);
    let stderr = '';
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('FFmpeg error:', stderr);
        reject(new Error(`FFmpeg error (exit ${code}): ${stderr.slice(-300)}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      console.error('FFmpeg spawn error:', err);
      reject(err);
    });
  });
}

function findOutputFiles(outputDir, jobInfo) {
  const results = [];
  
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (['.mp3', '.wav', '.flac', '.ogg'].includes(ext)) {
          const name = path.parse(item).name.toLowerCase();
          let label = item;
          let icon = 'music';
          
          if (name.includes('vocal')) { label = 'Vokal'; icon = 'mic'; }
          else if (name.includes('drum')) { label = 'Drum & Perkusi'; icon = 'drum'; }
          else if (name.includes('bass')) { label = 'Bass'; icon = 'bass'; }
          else if (name.includes('other') || name.includes('no_vocal')) { 
            label = 'Instrumental / Musik'; icon = 'music'; 
          }
          else if (name.includes('piano')) { label = 'Piano'; icon = 'piano'; }
          else if (name.includes('guitar')) { label = 'Gitar'; icon = 'guitar'; }

          results.push({
            name: path.parse(item).name,
            label,
            path: fullPath,
            icon
          });
        }
      }
    }
  }

  searchDir(outputDir);
  return results;
}

function emitProgress(jobId, progress, message) {
  const job = activeJobs.get(jobId);
  if (job) {
    job.progress = progress;
    job.statusMessage = message;
  }
  io.emit(`progress-${jobId}`, {
    progress,
    message,
    status: progress === 100 ? 'completed' : (progress === -1 ? 'error' : 'processing')
  });
}

// Socket.IO connection
io.on('connection', (socket) => {
  // console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    // console.log('Client disconnected:', socket.id);
  });
});

// Cleanup old files (runs every hour)
setInterval(() => {
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  ['uploads', 'outputs'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) return;
    
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(filePath);
        if (Date.now() - stat.mtime.getTime() > maxAge) {
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      } catch (e) { /* ignore */ }
    });
  });
}, 60 * 60 * 1000);

// Initialize and start server
async function init() {
  console.log('\n🎵 ═══════════════════════════════════════');
  console.log('   FYJ Channel Voice - Audio Separator');
  console.log('═══════════════════════════════════════════\n');
  
  await checkFFmpeg();
  await findPython();
  await checkDemucs();
  
  console.log('\n─── Status Sistem ───');
  console.log(`FFmpeg:  ${ffmpegAvailable ? '✅ Ready (' + ffmpegBin + ')' : '❌ Not found'}`);
  console.log(`Python:  ${pythonCmd ? '✅ ' + pythonCmd : 'ℹ️ Menggunakan FFmpeg Engine'}`);
  console.log(`Demucs:  ${demucsAvailable ? '✅ Available' : 'ℹ️ DSP Mode Aktif'}`);
  
  server.listen(PORT, () => {
    console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
    console.log('═══════════════════════════════════════════\n');
  });
}

init();
