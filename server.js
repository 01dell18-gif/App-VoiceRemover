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
  cors: { origin: '*' },
  transports: ['polling', 'websocket']
});

const PORT = process.env.PORT || 3032;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.set('trust proxy', 1);
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

// Check Python & Demucs & UVR availability
let pythonCmd = null;
let demucsAvailable = false;
let uvrAvailable = false;
let uvrExec = { cmd: 'audio-separator', args: [] };

async function findPythonAndDemucs() {
  const candidates = [
    process.env.PYTHON_PATH,
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python310', 'python.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe'),
    'C:\\Python311\\python.exe',
    'C:\\Program Files\\Python311\\python.exe',
    'python3',
    'python',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    'py -3.11',
    'py -3.10',
    'py'
  ].filter(Boolean);

  // Tahap 1: Temukan Python yang valid
  for (const candidate of candidates) {
    if ((candidate.includes('\\') || candidate.startsWith('/')) && !fs.existsSync(candidate)) continue;
    try {
      await new Promise((resolve, reject) => {
        exec(`"${candidate}" --version`, (err, stdout) => {
          if (err) reject(err);
          else resolve(stdout);
        });
      });
      pythonCmd = candidate;
      break;
    } catch (e) {}
  }

  // Tahap 2: Cek apakah Demucs terpasang
  if (pythonCmd) {
    try {
      await new Promise((resolve, reject) => {
        exec(`"${pythonCmd}" -m demucs --help`, (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
      demucsAvailable = true;
      console.log(`✅ Mesin AI Demucs aktif melalui: ${pythonCmd}`);
    } catch (e) {
      demucsAvailable = false;
    }

    // Tahap 3: Cek apakah audio-separator (UVR MDX-Net) terpasang (Windows, Linux, Docker)
    const scriptsDir = path.join(path.dirname(pythonCmd), 'Scripts');
    const uvrExeWin = path.join(scriptsDir, 'audio-separator.exe');
    const uvrExeLin = path.join(path.dirname(pythonCmd), 'audio-separator');

    if (fs.existsSync(uvrExeWin)) {
      uvrExec = { cmd: uvrExeWin, args: [] };
      uvrAvailable = true;
      console.log(`✅ Mesin AI UVR MDX-Net Studio aktif: ${uvrExeWin}`);
    } else if (fs.existsSync(uvrExeLin)) {
      uvrExec = { cmd: uvrExeLin, args: [] };
      uvrAvailable = true;
      console.log(`✅ Mesin AI UVR MDX-Net Studio aktif: ${uvrExeLin}`);
    } else {
      try {
        await new Promise((resolve, reject) => {
          exec('audio-separator --version', (err) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
        uvrExec = { cmd: 'audio-separator', args: [] };
        uvrAvailable = true;
        console.log(`✅ Mesin AI UVR MDX-Net Studio aktif via system PATH`);
      } catch (e) {
        try {
          await new Promise((resolve, reject) => {
            exec(`"${pythonCmd}" -m audio_separator.utils.cli --version`, (err) => {
              if (err) reject(err);
              else resolve(true);
            });
          });
          let pyBin = pythonCmd;
          let pyPrefixArgs = [];
          if (pythonCmd.startsWith('py -')) {
            const parts = pythonCmd.split(' ');
            pyBin = parts[0];
            pyPrefixArgs = parts.slice(1);
          }
          uvrExec = { cmd: pyBin, args: [...pyPrefixArgs, '-m', 'audio_separator.utils.cli'] };
          uvrAvailable = true;
          console.log(`✅ Mesin AI UVR MDX-Net Studio aktif via modul Python`);
        } catch (e2) {
          uvrAvailable = false;
        }
      }
    }
  }

  if (!demucsAvailable && !uvrAvailable) {
    console.log('ℹ️ Mesin AI tidak terdeteksi. Menggunakan FFmpeg DSP Engine sebagai fallback.');
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
    uvr: uvrAvailable,
    ffmpeg: ffmpegAvailable,
    engine: uvrAvailable ? 'UVR MDX-Net AI (Zero Bleed)' : (demucsAvailable ? 'Demucs AI' : 'FFmpeg DSP Engine')
  });
});

// Upload and process audio
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }

    // Jika pengguna meminta pemisahan lagi dengan membawa previousJobId, bersihkan file lama segera
    if (req.body.previousJobId) {
      cleanupJobFiles(req.body.previousJobId);
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

// Helper untuk menghapus data musik asli dan seluruh hasil pemisahan agar penyimpanan tidak penuh
function cleanupJobFiles(jobId) {
  if (!jobId || typeof jobId !== 'string') return false;
  console.log(`🧹 Membersihkan data musik & hasil pemisahan untuk Job: ${jobId}`);

  let deleted = false;

  // 1. Hapus file audio upload asli jika ada di memori
  const job = activeJobs.get(jobId);
  if (job && job.filepath && fs.existsSync(job.filepath)) {
    try {
      fs.unlinkSync(job.filepath);
      deleted = true;
      console.log(`   🗑️ File upload asli dihapus: ${job.filepath}`);
    } catch (e) {
      console.warn(`   ⚠️ Gagal menghapus ${job.filepath}:`, e.message);
    }
  }

  // 2. Hapus folder output hasil pemisahan (MP3, stems, instrumental karaoke, zip)
  const outputDir = path.join(__dirname, 'outputs', jobId);
  if (fs.existsSync(outputDir)) {
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
      deleted = true;
      console.log(`   🗑️ Folder output hasil pemisahan dihapus: ${outputDir}`);
    } catch (e) {
      console.warn(`   ⚠️ Gagal menghapus folder output ${outputDir}:`, e.message);
    }
  }

  // 3. Scan folder uploads untuk file yang berawalan UUID job ini
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    try {
      fs.readdirSync(uploadsDir).forEach(f => {
        if (f !== '.gitkeep' && f.includes(jobId)) {
          const p = path.join(uploadsDir, f);
          try {
            fs.unlinkSync(p);
            deleted = true;
            console.log(`   🗑️ File upload dicocokkan & dihapus: ${p}`);
          } catch (err) {}
        }
      });
    } catch (e) {}
  }

  // 4. Hapus dari daftar activeJobs
  activeJobs.delete(jobId);

  return deleted;
}

// Endpoint manual untuk membersihkan data pemisahan (misalnya saat klik 'Pisahkan Lagu Lain')
app.post('/api/cleanup/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const success = cleanupJobFiles(jobId);
  res.json({
    status: 'ok',
    message: `Data musik dan hasil pemisahan untuk job ${jobId} berhasil dihapus dari penyimpanan.`,
    cleaned: success
  });
});

app.delete('/api/job/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const success = cleanupJobFiles(jobId);
  res.json({
    status: 'ok',
    message: `Data musik dan hasil pemisahan untuk job ${jobId} berhasil dihapus.`,
    cleaned: success
  });
});

// Helper untuk mengambil job aktif atau merekonstruksi dari disk jika server di-restart
function getOrRecoverJob(jobId) {
  let job = activeJobs.get(jobId);
  if (job) return job;

  const outputDir = path.join(__dirname, 'outputs', jobId);
  if (fs.existsSync(outputDir)) {
    const fakeJobInfo = { id: jobId, filename: 'audio_file.mp3', separationType: 'unknown' };
    const results = findOutputFiles(outputDir, fakeJobInfo);
    if (results && results.length > 0) {
      job = {
        id: jobId,
        filename: 'Audio_Pemisahan',
        filepath: '',
        separationType: results.length > 2 ? `${results.length}stems` : 'vocals_music',
        outputFormat: 'mp3',
        status: 'completed',
        progress: 100,
        createdAt: new Date().toISOString(),
        results: results
      };
      activeJobs.set(jobId, job);
      return job;
    }
  }
  return null;
}

// Get job status
app.get('/api/status/:jobId', (req, res) => {
  const job = getOrRecoverJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job tidak ditemukan' });
  }
  res.json(job);
});

// Download separated track
app.get('/api/download/:jobId/:track', (req, res) => {
  const job = getOrRecoverJob(req.params.jobId);
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
  const job = getOrRecoverJob(req.params.jobId);
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
  const job = getOrRecoverJob(req.params.jobId);
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
  const job = getOrRecoverJob(req.params.jobId);
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

    // Untuk pemisahan Vokal & Musik (2 track), gunakan UVR MDX-Net jika tersedia (zero-bleed)
    if (jobInfo.separationType === 'vocals_music' && uvrAvailable) {
      await processWithUVR(jobId, jobInfo, outputDir);
    } else if (demucsAvailable) {
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

async function processWithUVR(jobId, jobInfo, outputDir) {
  return new Promise((resolve, reject) => {
    emitProgress(jobId, 15, 'Memulai isolasi studio dengan AI UVR MDX-Net (Zero Bleed)...');

    const ffmpegDir = path.dirname(ffmpegBin);
    const env = Object.assign({}, process.env);
    env.PATH = `${ffmpegDir}${path.delimiter}${env.PATH || ''}`;

    const modelDir = path.join(__dirname, 'models');
    const args = [
      jobInfo.filepath,
      '--output_dir', outputDir,
      '--model_file_dir', modelDir,
      '--model_filename', 'UVR-MDX-NET-Inst_HQ_3.onnx',
      '--output_format', 'MP3',
      '--output_bitrate', '320k',
      '--mdx_overlap', '0.5',
      '--mdx_enable_denoise'
    ];

    const cmd = uvrExec ? uvrExec.cmd : 'audio-separator';
    const prefixArgs = uvrExec ? uvrExec.args : [];
    const fullArgs = [...prefixArgs, ...args];
    console.log(`[Job ${jobId}] Menjalankan AI UVR MDX-Net: ${cmd} ${fullArgs.join(' ')}`);

    const proc = spawn(cmd, fullArgs, { env, windowsHide: true });
    let lastProgress = 20;

    function handleData(data) {
      const output = data.toString();
      const match = output.match(/(\d+)%/);
      if (match) {
        const pct = Math.min(95, Math.max(lastProgress, parseInt(match[1])));
        if (pct > lastProgress) {
          lastProgress = pct;
          emitProgress(jobId, lastProgress, `Memproses isolasi studio AI UVR MDX-Net: ${lastProgress}%`);
        }
      }
    }

    proc.stdout.on('data', handleData);
    proc.stderr.on('data', handleData);

    proc.on('close', async (code) => {
      if (code !== 0) {
        console.warn(`UVR keluar dengan kode ${code}, beralih ke Demucs AI fallback...`);
        return processWithDemucs(jobId, jobInfo, outputDir).then(resolve).catch(reject);
      }

      const results = findOutputFiles(outputDir, jobInfo);
      if (results.length === 0) {
        console.warn('UVR selesai namun file tidak ditemukan, beralih ke Demucs AI fallback...');
        return processWithDemucs(jobId, jobInfo, outputDir).then(resolve).catch(reject);
      }

      jobInfo.results = results;
      jobInfo.status = 'completed';
      emitProgress(jobId, 100, 'Selesai! Vokal dan instrumen berhasil dipisahkan 100% bersih tanpa bocor.');
      resolve();
    });

    proc.on('error', (err) => {
      console.warn('UVR spawn error, beralih ke Demucs AI fallback:', err);
      processWithDemucs(jobId, jobInfo, outputDir).then(resolve).catch(reject);
    });
  });
}

async function processWithDemucs(jobId, jobInfo, outputDir) {
  return new Promise((resolve, reject) => {
    emitProgress(jobId, 15, 'Memulai pemisahan AI Demucs (Meta Research)...');

    const ffmpegDir = path.dirname(ffmpegBin);
    const env = Object.assign({}, process.env);
    env.PATH = `${ffmpegDir}${path.delimiter}${env.PATH || ''}`;

    let model = 'htdemucs_ft';
    switch (jobInfo.separationType) {
      case 'vocals_music':
        model = 'htdemucs_ft';
        break;
      case '4stems':
        model = 'htdemucs_ft';
        break;
      case '5stems':
        model = 'htdemucs_6s';
        break;
    }

    const isTwoStems = jobInfo.separationType === 'vocals_music';
    const args = [
      '-m', 'demucs',
      '-n', model,
      '--out', outputDir,
      '--mp3',
      '--mp3-bitrate', '320',
      '--shifts', '1',
      '--overlap', '0.5'
    ];

    if (isTwoStems) {
      args.push('--two-stems', 'vocals');
      args.push('--other-method', 'add');
    }

    args.push(jobInfo.filepath);

    let cmd = pythonCmd;
    let cmdArgs = [];
    if (pythonCmd.startsWith('py -')) {
      const parts = pythonCmd.split(' ');
      cmd = parts[0];
      cmdArgs = parts.slice(1);
    }
    const fullArgs = [...cmdArgs, ...args];

    console.log(`[Job ${jobId}] Menjalankan AI Demucs: ${cmd} ${fullArgs.join(' ')}`);

    const proc = spawn(cmd, fullArgs, { env, windowsHide: true });
    
    let lastProgress = 20;

    function handleData(data) {
      const output = data.toString();
      const match = output.match(/(\d+)%/);
      if (match) {
        const pct = parseInt(match[1]);
        if (pct > lastProgress && pct < 98) {
          lastProgress = pct;
          emitProgress(jobId, lastProgress, `Memproses pemisahan audio dengan AI Demucs (${lastProgress}%)...`);
        }
      }
    }

    proc.stdout.on('data', handleData);
    proc.stderr.on('data', handleData);

    proc.on('close', async (code) => {
      if (code !== 0) {
        console.warn(`Demucs keluar dengan kode ${code}, beralih ke FFmpeg DSP fallback`);
        processWithFFmpeg(jobId, jobInfo, outputDir).then(resolve).catch(reject);
        return;
      }

      // Jika 4 stems atau 5 stems, gabungkan stem non-vokal menjadi instrumental karaoke
      if (jobInfo.separationType === '4stems' || jobInfo.separationType === '5stems') {
        await createCombinedInstrumental(outputDir, jobInfo);
      }

      const results = findOutputFiles(outputDir, jobInfo);
      if (results.length === 0) {
        console.warn('Demucs selesai namun file output tidak ditemukan, beralih ke FFmpeg DSP fallback');
        processWithFFmpeg(jobId, jobInfo, outputDir).then(resolve).catch(reject);
        return;
      }

      jobInfo.results = results;
      jobInfo.status = 'completed';
      emitProgress(jobId, 100, 'Selesai! Vokal dan instrumen berhasil dipisahkan bersih dengan AI.');
      resolve();
    });

    proc.on('error', (err) => {
      console.warn('Demucs spawn error, beralih ke FFmpeg DSP fallback:', err);
      processWithFFmpeg(jobId, jobInfo, outputDir).then(resolve).catch(reject);
    });
  });
}

async function createCombinedInstrumental(outputDir, jobInfo) {
  try {
    const nonVocalFiles = [];
    function scan(d) {
      if (!fs.existsSync(d)) return;
      fs.readdirSync(d).forEach(f => {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) scan(p);
        else if (['.mp3', '.wav'].includes(path.extname(f).toLowerCase())) {
          const base = path.parse(f).name.toLowerCase();
          if (!base.includes('vocal') && !base.includes('instrumental')) {
            nonVocalFiles.push(p);
          }
        }
      });
    }
    scan(outputDir);

    if (nonVocalFiles.length > 1) {
      const destPath = path.join(outputDir, 'instrumental.mp3');
      const ffmpegArgs = [];
      nonVocalFiles.forEach(f => {
        ffmpegArgs.push('-i', f);
      });
      ffmpegArgs.push(
        '-filter_complex', `amix=inputs=${nonVocalFiles.length}:normalize=0`,
        '-b:a', '320k',
        '-y', destPath
      );
      await runFFmpeg(ffmpegArgs);
      console.log(`[Job ${jobInfo.id}] Berhasil menggabungkan ${nonVocalFiles.length} stem ke instrumental.mp3`);
    }
  } catch (e) {
    console.warn('Gagal membuat instrumental gabungan:', e.message);
  }
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
      '[0:a]asplit=2[low][high];[low]lowpass=f=160,volume=1.0[bass];[high]highpass=f=160,pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0,equalizer=f=1100:width_type=o:w=2.0:g=-10,equalizer=f=2800:width_type=o:w=1.6:g=-8[sides];[bass][sides]amix=inputs=2:weights=1.0 1.0:normalize=0[out]',
      '-map', '[out]',
      '-b:a', '192k',
      '-y', instrumentalPath
    ]);

    // 2. Ekstrak Vokal untuk STEREO (Isolasi Vokal Tengah + Bandpass Filter)
    emitProgress(jobId, 65, 'Mengekstrak Suara Vokal (Isolasi Frekuensi Vokal)...');
    await runFFmpeg([
      '-i', inputFile,
      '-filter_complex',
      '[0:a]pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1,highpass=f=200,lowpass=f=4500,equalizer=f=1200:width_type=o:w=1.8:g=3,volume=1.3[vocal]',
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
  const seen = new Set();
  
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
          const rawName = path.parse(item).name.toLowerCase();
          let name = rawName;
          let label = item;
          let icon = 'music';
          
          // PENTING: Periksa 'no_vocals' / instrumental terlebih dahulu sebelum 'vocal'
          // karena string 'no_vocals' mengandung substring 'vocal'!
          if (rawName === 'no_vocals' || rawName.includes('no_vocal') || rawName.includes('instrumental')) {
            name = 'instrumental';
            label = 'Instrumental / Musik';
            icon = 'music';
          } else if (rawName === 'vocals' || rawName.includes('vocal')) {
            name = 'vocals';
            label = 'Vokal';
            icon = 'mic';
          } else if (rawName.includes('drum')) {
            name = 'drums';
            label = 'Drum & Perkusi';
            icon = 'drum';
          } else if (rawName.includes('bass')) {
            name = 'bass';
            label = 'Bass';
            icon = 'bass';
          } else if (rawName.includes('piano')) {
            name = 'piano';
            label = 'Piano';
            icon = 'piano';
          } else if (rawName.includes('guitar')) {
            name = 'guitar';
            label = 'Gitar';
            icon = 'guitar';
          } else if (rawName.includes('other')) {
            name = 'other';
            label = 'Instrumen Lain (Melodi)';
            icon = 'other';
          }

          if (!seen.has(name)) {
            seen.add(name);
            results.push({
              name,
              label,
              path: fullPath,
              icon
            });
          }
        }
      }
    }
  }

  searchDir(outputDir);

  const orderPriority = {
    instrumental: 1,
    vocals: 2,
    bass: 3,
    drums: 4,
    piano: 5,
    guitar: 6,
    other: 7
  };

  results.sort((a, b) => {
    const prioA = orderPriority[a.name] || 99;
    const prioB = orderPriority[b.name] || 99;
    return prioA - prioB;
  });

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

// Cleanup berkala untuk file yatim / tidak terhapus (dijalankan setiap 15 menit, batas 30 menit)
setInterval(() => {
  const maxAge = 30 * 60 * 1000; // 30 menit
  ['uploads', 'outputs', 'temp'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) return;
    
    fs.readdirSync(dirPath).forEach(file => {
      if (file === '.gitkeep') return;
      const filePath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(filePath);
        const fileAge = Date.now() - (stat.birthtimeMs || stat.ctimeMs || stat.mtimeMs);
        if (fileAge > maxAge) {
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      } catch (e) { /* ignore */ }
    });
  });
}, 15 * 60 * 1000);

// Initialize and start server
async function init() {
  console.log('\n🎵 ═══════════════════════════════════════');
  console.log('   FYJ Channel Voice - Audio Separator');
  console.log('═══════════════════════════════════════════\n');
  
  await checkFFmpeg();
  await findPythonAndDemucs();
  
  console.log('\n─── Status Sistem ───');
  console.log(`FFmpeg:  ${ffmpegAvailable ? '✅ Ready (' + ffmpegBin + ')' : '❌ Not found'}`);
  console.log(`Python:  ${pythonCmd ? '✅ ' + pythonCmd : '❌ Tidak terdeteksi'}`);
  console.log(`UVR AI:  ${uvrAvailable ? '✅ UVR MDX-Net Siap (Zero Bleed Studio Quality)' : '❌ Not installed'}`);
  console.log(`Demucs:  ${demucsAvailable ? '✅ Demucs AI (htdemucs_ft / htdemucs_6s) Siap!' : 'ℹ️ DSP Mode Aktif (Gunakan pip install demucs untuk kualitas studio)'}`);
  
  server.listen(PORT, HOST, () => {
    console.log(`\n🚀 Server berjalan di http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log('═══════════════════════════════════════════\n');
  });
}

init();
