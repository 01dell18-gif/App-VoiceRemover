/**
 * FYJ Channel Voice - Frontend Application
 * AI & DSP Powered Vocal & Music Separator
 */

document.addEventListener('DOMContentLoaded', () => {
  // === State ===
  const state = {
    selectedFile: null,
    jobId: null,
    isPlaying: false,
    playbackMode: 'instrumental', // 'instrumental', 'vocals', 'mix', 'original'
    currentPlaying: null,
    tracks: {},
    primaryTrack: null,
    separationType: 'vocals_music',
    soloTrack: null,
    tempo: 1.0
  };

  // === DOM Elements ===
  const els = {
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    uploadSection: document.getElementById('uploadSection'),
    optionsPanel: document.getElementById('optionsPanel'),

    // File Info
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    fileRemove: document.getElementById('fileRemove'),
    processBtn: document.getElementById('processBtn'),

    // Processing
    processingSection: document.getElementById('processingSection'),
    processingTitle: document.getElementById('processingTitle'),
    processingMessage: document.getElementById('processingMessage'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),

    // Results & Mixer
    resultsSection: document.getElementById('resultsSection'),
    resultsSubtitle: document.getElementById('resultsSubtitle'),
    masterMixer: document.getElementById('masterMixer'),
    masterPlayBtn: document.getElementById('masterPlayBtn'),
    masterBtnLabel: document.getElementById('masterBtnLabel'),
    masterStopBtn: document.getElementById('masterStopBtn'),
    currentTime: document.getElementById('currentTime'),
    totalDuration: document.getElementById('totalDuration'),
    masterScrubber: document.getElementById('masterScrubber'),
    tempoSelect: document.getElementById('tempoSelect'),
    tracksContainer: document.getElementById('tracksContainer'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    newUploadBtn: document.getElementById('newUploadBtn'),

    // Navigation
    navbar: document.getElementById('navbar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    navLinks: document.querySelector('.nav-links'),
    systemStatus: document.getElementById('systemStatus'),

    // Other
    particles: document.getElementById('particles'),
    toastContainer: document.getElementById('toastContainer')
  };

  // === Initialize Socket.IO ===
  let socket;
  try {
    socket = io();
    socket.on('connect', () => {
      updateSystemStatus(true);
    });
    socket.on('disconnect', () => {
      updateSystemStatus(false);
    });
  } catch (e) {
    console.warn('Socket.IO not available');
  }

  // === Initialize App ===
  init();

  function init() {
    setupEventListeners();
    setupModePills();
    createParticles();
    checkSystemHealth();
    setupScrollEffects();
    setupFAQ();
  }

  // === Event Listeners ===
  function setupEventListeners() {
    // Upload Area - Drag & Drop
    els.uploadArea.addEventListener('click', () => els.fileInput.click());
    els.uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      els.fileInput.click();
    });

    els.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.uploadArea.classList.add('drag-over');
    });

    els.uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      els.uploadArea.classList.remove('drag-over');
    });

    els.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      els.uploadArea.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    // File Input Change
    els.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    // Separation Type Options
    document.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          state.separationType = radio.value;
        }
      });
    });

    // File Remove
    els.fileRemove.addEventListener('click', () => {
      resetFileSelection();
    });

    // Process Button
    els.processBtn.addEventListener('click', () => {
      if (state.selectedFile) {
        startProcessing();
      }
    });

    // Master Mixer Controls
    if (els.masterPlayBtn) {
      els.masterPlayBtn.addEventListener('click', toggleMasterPlay);
    }

    if (els.masterStopBtn) {
      els.masterStopBtn.addEventListener('click', stopAllTracks);
    }

    if (els.masterScrubber) {
      els.masterScrubber.addEventListener('input', (e) => {
        seekAllTracks(parseFloat(e.target.value));
      });
    }

    if (els.tempoSelect) {
      els.tempoSelect.addEventListener('change', (e) => {
        const rate = parseFloat(e.target.value);
        state.tempo = rate;
        Object.values(state.tracks).forEach(t => {
          if (t.audio) t.audio.playbackRate = rate;
        });
      });
    }

    // Download All (ZIP)
    els.downloadAllBtn.addEventListener('click', () => {
      downloadZip();
    });

    // New Upload
    els.newUploadBtn.addEventListener('click', () => {
      resetAll();
    });

    // Mobile Menu
    els.mobileMenuBtn.addEventListener('click', () => {
      els.navLinks.classList.toggle('active');
      els.mobileMenuBtn.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        els.navLinks.classList.remove('active');
        els.mobileMenuBtn.classList.remove('active');
      });
    });
  }

  // === File Selection ===
  function handleFileSelect(file) {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/flac', 
                       'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/mp4', 'video/mp4',
                       'audio/webm', 'audio/x-wav'];
    const validExts = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.mp4', '.webm', '.wma'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      showToast('Format file tidak didukung. Gunakan MP3, WAV, FLAC, OGG, AAC, atau M4A.', 'error');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showToast('Ukuran file terlalu besar. Maksimum 100MB.', 'error');
      return;
    }

    state.selectedFile = file;
    
    // Update UI
    els.fileName.textContent = file.name;
    els.fileSize.textContent = formatFileSize(file.size);
    
    els.uploadArea.classList.add('hidden');
    els.fileInfo.classList.remove('hidden');
    
    showToast(`File "${file.name}" siap diproses`, 'success');
  }

  function resetFileSelection() {
    state.selectedFile = null;
    els.fileInput.value = '';
    els.uploadArea.classList.remove('hidden');
    els.fileInfo.classList.add('hidden');
  }

  // === Processing ===
  async function startProcessing() {
    if (!state.selectedFile) return;

    // Show processing UI
    els.uploadSection.classList.add('hidden');
    els.fileInfo.classList.add('hidden');
    els.processingSection.classList.remove('hidden');
    els.resultsSection.classList.add('hidden');

    updateProgress(5, 'Mengunggah file audio...');

    try {
      const formData = new FormData();
      formData.append('audio', state.selectedFile);
      formData.append('separationType', state.separationType);
      formData.append('outputFormat', 'mp3');
      if (state.jobId) {
        formData.append('previousJobId', state.jobId);
      }

      const response = await uploadWithProgress(formData);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload gagal');
      }

      const data = await response.json();
      state.jobId = data.jobId;

      // Socket.IO updates
      if (socket) {
        socket.on(`progress-${state.jobId}`, (progressData) => {
          updateProgress(progressData.progress, progressData.message);
          
          if (progressData.status === 'completed') {
            fetchResults();
          } else if (progressData.status === 'error') {
            showToast(progressData.message, 'error');
            resetAll();
          }
        });
      }

      // Polling fallback
      startPolling(state.jobId);

    } catch (error) {
      console.error('Processing error:', error);
      showToast(error.message || 'Terjadi kesalahan saat memproses', 'error');
      resetAll();
    }
  }

  function uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          updateProgress(Math.min(percent * 0.25, 25), `Mengunggah: ${percent}%`);
        }
      });

      xhr.addEventListener('load', () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          json: () => JSON.parse(xhr.responseText),
          status: xhr.status
        });
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }

  function startPolling(jobId) {
    let completed = false;
    const pollInterval = setInterval(async () => {
      if (completed) return;
      try {
        const response = await fetch(`/api/status/${jobId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          completed = true;
          clearInterval(pollInterval);
          updateProgress(100, 'Pemisahan selesai!');
          showResults(data);
        } else if (data.status === 'error') {
          completed = true;
          clearInterval(pollInterval);
          showToast(data.error || 'Terjadi kesalahan pemrosesan', 'error');
          resetAll();
        } else if (data.progress) {
          updateProgress(data.progress, data.statusMessage || 'Memproses pemisahan audio...');
        }
      } catch (e) {
        // Continue polling
      }
    }, 1500);

    setTimeout(() => {
      if (!completed) clearInterval(pollInterval);
    }, 600000);
  }

  function updateProgress(progress, message) {
    if (progress >= 0) {
      els.progressFill.style.width = `${progress}%`;
      els.progressText.textContent = `${Math.round(progress)}%`;
    }
    if (message) {
      els.processingMessage.textContent = message;
    }
  }

  async function fetchResults() {
    try {
      const response = await fetch(`/api/status/${state.jobId}`);
      const data = await response.json();
      if (data.status === 'completed') {
        showResults(data);
      }
    } catch (e) {
      console.error('Fetch results error:', e);
    }
  }

  // === Results & Mixer UI ===
  function showResults(data) {
    els.processingSection.classList.add('hidden');
    els.resultsSection.classList.remove('hidden');

    const tracks = data.results || [];
    els.resultsSubtitle.textContent = `${tracks.length} track berhasil dipisahkan dari "${data.filename}"`;

    els.tracksContainer.innerHTML = '';
    state.tracks = {};
    state.isPlaying = false;
    state.currentPlaying = null;
    state.soloTrack = null;
    state.playbackMode = 'instrumental';

    // Reset posisi waktu dan scrubber ke 00:00 agar tidak mewarisi waktu lama
    state.currentTime = 0;
    state.duration = 0;
    if (els.masterScrubber) els.masterScrubber.value = 0;
    if (els.currentTime) els.currentTime.textContent = '00:00';
    if (els.totalDuration) els.totalDuration.textContent = '00:00';

    updatePillsUI('instrumental');
    updateMasterPlayButton(false);

    const iconMap = {
      mic: '🎤',
      music: '🎵',
      drum: '🥁',
      bass: '🎸',
      piano: '🎹',
      guitar: '🎸',
      other: '🎼'
    };

    const colorMap = {
      mic: 'vocals',
      music: 'music',
      drum: 'drums',
      bass: 'bass',
      piano: 'other',
      guitar: 'other',
      other: 'other'
    };

    tracks.forEach((track, index) => {
      const card = createTrackCard(track, colorMap[track.icon] || 'music', iconMap[track.icon] || '🎵', index + 1);
      els.tracksContainer.appendChild(card);
    });

    // Also add original track
    const origTrack = {
      name: 'original',
      label: 'Original (Lagu Asli)',
      icon: 'music'
    };
    const origCard = createTrackCard(origTrack, 'music', '🎧', tracks.length + 1);
    els.tracksContainer.appendChild(origCard);

    // Pick primary track for duration and scrubbing
    const trackKeys = Object.keys(state.tracks);
    if (trackKeys.length > 0) {
      state.primaryTrack = state.tracks[trackKeys[0]];
      setupAudioSync();
    }

    // Preload otomatis track utama (instrumental & vokal) agar saat tombol Putar ditekan langsung berbunyi seketika
    if (state.tracks['instrumental']) state.tracks['instrumental'].audio.preload = 'auto';
    if (state.tracks['vocals']) state.tracks['vocals'].audio.preload = 'auto';

    showToast('Pemisahan selesai! Track siap didownload & diputar.', 'success');
  }

  function createTrackCard(track, colorClass, iconEmoji, index) {
    const card = document.createElement('div');
    card.className = `track-card ${colorClass}`;
    card.id = `card-${track.name}`;

    // Generate waveform bar placeholders
    let barsHtml = '';
    for (let i = 0; i < 28; i++) {
      const h = 4 + Math.sin(i * 0.4) * 8 + Math.random() * 8;
      barsHtml += `<div class="stem-bar" style="height: ${Math.round(h)}px; animation-delay: ${(i * 0.05).toFixed(2)}s"></div>`;
    }

    card.innerHTML = `
      <div class="track-icon ${colorClass}">
        ${iconEmoji}
      </div>
      <div class="track-info">
        <div class="track-name">${track.label || track.name}</div>
        <div class="track-details">Track ${index} • 192kbps MP3</div>
      </div>
      <div class="track-visual" title="Visual Gelombang Audio">
        ${barsHtml}
      </div>
      <div class="track-volume-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <input type="range" class="volume-slider" min="0" max="100" value="100" title="Atur Volume">
        <span class="volume-val">100%</span>
      </div>
      <div class="track-controls">
        <button class="solo-btn" data-track="${track.name}" title="Solo: Hanya dengarkan track ini">S</button>
        <button class="mute-btn" data-track="${track.name}" title="Mute: Matikan suara track ini">M</button>
        <button class="track-btn play-btn" data-track="${track.name}" title="Putar ${track.label}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span class="track-play-label">Putar</span>
        </button>
        <a href="/api/download/${state.jobId}/${track.name}" class="download-btn" download title="Download ${track.label}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </a>
      </div>
      <audio id="audio-${track.name}" preload="metadata" src="/api/stream/${state.jobId}/${track.name}"></audio>
    `;

    const audio = card.querySelector('audio');
    const playBtn = card.querySelector('.play-btn');
    const volumeSlider = card.querySelector('.volume-slider');
    const volumeVal = card.querySelector('.volume-val');
    const muteBtn = card.querySelector('.mute-btn');
    const soloBtn = card.querySelector('.solo-btn');

    const trackObj = {
      name: track.name,
      label: track.label,
      card,
      audio,
      playBtn,
      volumeSlider,
      muteBtn,
      soloBtn,
      volume: 1.0,
      isMuted: false,
      isSolo: false
    };

    state.tracks[track.name] = trackObj;

    // Fast-warmup saat kursor mendekati kartu track untuk memastikan buffer audio siap seketika
    card.addEventListener('mouseenter', () => {
      if (trackObj.audio.preload !== 'auto') {
        trackObj.audio.preload = 'auto';
      }
    }, { once: true });
    card.addEventListener('touchstart', () => {
      if (trackObj.audio.preload !== 'auto') {
        trackObj.audio.preload = 'auto';
      }
    }, { once: true, passive: true });

    // Volume Slider Event
    volumeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      volumeVal.textContent = `${val}%`;
      trackObj.volume = val / 100;
      applyVolume(trackObj);
    });

    // Mute Button Event
    muteBtn.addEventListener('click', () => {
      trackObj.isMuted = !trackObj.isMuted;
      muteBtn.classList.toggle('active', trackObj.isMuted);
      applyVolume(trackObj);
    });

    // Solo Button Event
    soloBtn.addEventListener('click', () => {
      toggleSolo(track.name);
    });

    // Individual Play/Pause Event
    playBtn.addEventListener('click', () => {
      toggleTrackPlay(track.name);
    });

    return card;
  }

  function applyVolume(trackObj) {
    if (!trackObj || !trackObj.audio) return;

    if (trackObj.isMuted) {
      trackObj.audio.volume = 0;
      return;
    }

    if (state.soloTrack) {
      trackObj.audio.volume = (state.soloTrack === trackObj.name) ? trackObj.volume : 0;
      return;
    }

    // Pemisahan ketat berdasarkan state.playbackMode agar suara vokal & musik murni tanpa bocor:
    if (state.playbackMode === 'vocals') {
      trackObj.audio.volume = (trackObj.name === 'vocals') ? trackObj.volume : 0;
    } else if (state.playbackMode === 'instrumental') {
      if (state.tracks['instrumental']) {
        trackObj.audio.volume = (trackObj.name === 'instrumental') ? trackObj.volume : 0;
      } else {
        trackObj.audio.volume = (trackObj.name !== 'vocals' && trackObj.name !== 'original') ? trackObj.volume : 0;
      }
    } else if (state.playbackMode === 'original') {
      trackObj.audio.volume = (trackObj.name === 'original') ? trackObj.volume : 0;
    } else if (state.playbackMode === 'mix') {
      if (trackObj.name === 'original') {
        trackObj.audio.volume = 0;
      } else if (trackObj.name === 'instrumental' && (state.tracks['drums'] || state.tracks['bass'] || state.tracks['other'])) {
        trackObj.audio.volume = 0;
      } else {
        trackObj.audio.volume = trackObj.volume;
      }
    } else if (state.playbackMode && state.tracks[state.playbackMode]) {
      // Pemutaran solo per-track (misal bass, drums, piano, dll.)
      trackObj.audio.volume = (trackObj.name === state.playbackMode) ? trackObj.volume : 0;
    } else {
      trackObj.audio.volume = trackObj.volume;
    }
  }

  function toggleSolo(trackName) {
    if (state.soloTrack === trackName) {
      state.soloTrack = null;
    } else {
      state.soloTrack = trackName;
    }

    Object.values(state.tracks).forEach(t => {
      t.soloBtn.classList.toggle('active', state.soloTrack === t.name);
      applyVolume(t);
    });
  }

  // === Audio Synchronization & Playback Engine ===
  function setupAudioSync() {
    Object.values(state.tracks).forEach(t => {
      t.audio.addEventListener('loadedmetadata', () => {
        if (t.audio.duration && (!state.duration || t.audio.duration > state.duration)) {
          state.duration = t.audio.duration;
          els.totalDuration.textContent = formatTime(state.duration);
        }
      });

      t.audio.addEventListener('timeupdate', () => {
        // Perbarui scrubber & penunjuk waktu jika track ini yang sedang berbunyi aktif
        const isActiveCurrent = (state.currentPlaying === t.name) ||
          (state.isPlaying && (t.name === state.playbackMode || (state.playbackMode === 'mix' && (t.name === 'vocals' || t === state.primaryTrack))));

        if (isActiveCurrent && t.audio.duration && !t.audio.paused) {
          state.currentTime = t.audio.currentTime;
          const percent = (t.audio.currentTime / t.audio.duration) * 100;
          if (els.masterScrubber) els.masterScrubber.value = percent;
          if (els.currentTime) els.currentTime.textContent = formatTime(t.audio.currentTime);
        }
      });

      t.audio.addEventListener('ended', () => {
        if (state.currentPlaying === t.name || (state.isPlaying && (t.name === state.playbackMode || t === state.primaryTrack))) {
          stopAllTracks();
        }
      });
    });
  }

  // === Playback Mode Selector Pills ===
  function setupModePills() {
    document.querySelectorAll('.mode-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const mode = pill.getAttribute('data-mode');
        switchPlaybackMode(mode);
      });
    });
  }

  function switchPlaybackMode(mode) {
    state.playbackMode = mode;
    updatePillsUI(mode);
    updateMasterPlayButton(state.isPlaying);

    // Buffer track target secara instan di latar belakang agar saat tombol Putar ditekan langsung bersuara
    primeAudioForMode(mode);

    // Jika sedang berputar, langsung alihkan ke mode yang dipilih secara mulus
    if (state.isPlaying) {
      if (mode === 'mix') {
        playMix();
      } else if (mode === 'instrumental') {
        playInstrumentalOnly();
      } else if (mode === 'vocals') {
        playSingleTrack('vocals');
      } else if (mode === 'original') {
        playSingleTrack('original');
      } else if (state.tracks[mode]) {
        playSingleTrack(mode);
      }
    }
  }

  // Preload track target secara proaktif
  function primeAudioForMode(mode) {
    if (mode === 'vocals' && state.tracks['vocals']) {
      state.tracks['vocals'].audio.preload = 'auto';
    } else if (mode === 'instrumental' && state.tracks['instrumental']) {
      state.tracks['instrumental'].audio.preload = 'auto';
    } else if (mode === 'original' && state.tracks['original']) {
      state.tracks['original'].audio.preload = 'auto';
    } else if (mode === 'mix') {
      Object.values(state.tracks).forEach(t => {
        if (t.name !== 'original') t.audio.preload = 'auto';
      });
    } else if (state.tracks[mode]) {
      state.tracks[mode].audio.preload = 'auto';
    }
  }

  function updatePillsUI(activeMode) {
    document.querySelectorAll('.mode-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-mode') === activeMode);
    });
  }

  // Master Mixer Play (Sesuai mode yang dipilih)
  function toggleMasterPlay() {
    if (state.isPlaying) {
      pauseAllTracks();
    } else {
      if (state.playbackMode === 'mix') {
        playMix();
      } else if (state.playbackMode === 'instrumental') {
        playInstrumentalOnly();
      } else if (state.playbackMode === 'vocals') {
        playSingleTrack('vocals');
      } else if (state.tracks[state.playbackMode]) {
        playSingleTrack(state.playbackMode);
      } else if (state.tracks['instrumental']) {
        playSingleTrack('instrumental');
      } else {
        const firstKey = Object.keys(state.tracks)[0];
        if (firstKey) playSingleTrack(firstKey);
      }
    }
  }

  function playInstrumentalOnly() {
    state.playbackMode = 'instrumental';
    updatePillsUI('instrumental');

    // Jika track instrumental gabungan tersedia, langsung putar track tersebut secara solo instan
    if (state.tracks['instrumental']) {
      playSingleTrack('instrumental');
      return;
    }

    // Fallback: Jika tidak ada track gabungan instrumental, putar semua stem non-vokal
    if (state.tracks['original']) {
      if (!state.tracks['original'].audio.paused) state.tracks['original'].audio.pause();
      state.tracks['original'].audio.volume = 0;
      state.tracks['original'].card.classList.remove('playing');
      updateTrackButtonIcon(state.tracks['original'], false);
    }
    if (state.tracks['vocals']) {
      if (!state.tracks['vocals'].audio.paused) state.tracks['vocals'].audio.pause();
      state.tracks['vocals'].audio.volume = 0;
      state.tracks['vocals'].card.classList.remove('playing');
      updateTrackButtonIcon(state.tracks['vocals'], false);
    }

    const syncTime = state.currentTime || 0;

    // Respon antarmuka seketika tanpa jeda
    state.isPlaying = true;
    state.currentPlaying = 'instrumental';
    updateMasterPlayButton(true);

    Object.values(state.tracks).forEach(t => {
      if (t.name !== 'vocals' && t.name !== 'original' && t.name !== 'instrumental') {
        if (Math.abs(t.audio.currentTime - syncTime) > 0.3) {
          t.audio.currentTime = syncTime;
        }
        t.audio.playbackRate = state.tempo || 1.0;
        applyVolume(t);
        t.card.classList.add('playing');
        updateTrackButtonIcon(t, true);
        const p = t.audio.play();
        if (p !== undefined) p.catch(() => {});
      }
    });
  }

  function playMix() {
    state.playbackMode = 'mix';
    updatePillsUI('mix');

    // Matikan track original agar tidak menimpa hasil pemisahan
    if (state.tracks['original']) {
      if (!state.tracks['original'].audio.paused) state.tracks['original'].audio.pause();
      state.tracks['original'].audio.volume = 0;
      state.tracks['original'].card.classList.remove('playing');
      updateTrackButtonIcon(state.tracks['original'], false);
    }

    // Cek apakah ada stem individual (drums, bass, dll.)
    const hasIndividualStems = Boolean(state.tracks['drums'] || state.tracks['bass'] || state.tracks['other']);

    const syncTime = state.currentTime || 0;

    // Respon antarmuka seketika tanpa jeda
    state.isPlaying = true;
    state.currentPlaying = 'mix';
    updateMasterPlayButton(true);

    // Putar hanya stem hasil pemisahan (tanpa duplikasi instrumental gabungan)
    Object.values(state.tracks).forEach(t => {
      if (t.name === 'original') return;

      // Jika ada stem individual, jangan putar gabungan instrumental agar tidak tumpang tindih
      if (hasIndividualStems && t.name === 'instrumental') {
        if (!t.audio.paused) t.audio.pause();
        t.audio.volume = 0;
        t.card.classList.remove('playing');
        updateTrackButtonIcon(t, false);
        return;
      }

      if (Math.abs(t.audio.currentTime - syncTime) > 0.3) {
        t.audio.currentTime = syncTime;
      }
      t.audio.playbackRate = state.tempo || 1.0;
      applyVolume(t);
      t.card.classList.add('playing');
      updateTrackButtonIcon(t, true);
      const p = t.audio.play();
      if (p !== undefined) p.catch(() => {});
    });
  }

  // Pemutaran Independen Per-Track (Hanya track yang diklik yang berbunyi)
  function toggleTrackPlay(trackName) {
    if (state.isPlaying && state.currentPlaying === trackName) {
      // Jika track ini sedang berputar sendiri -> Jeda/Pause
      pauseSingleTrack(trackName);
    } else {
      // Putar HANYA track ini (matikan semua track lain)
      playSingleTrack(trackName);
    }
  }

  function playSingleTrack(trackName) {
    const track = state.tracks[trackName];
    if (!track) return;

    // 1. Hentikan dan bisukan semua track lainnya secara absolut (Zero Bleed)
    Object.values(state.tracks).forEach(t => {
      if (t.name !== trackName) {
        if (!t.audio.paused) t.audio.pause();
        t.audio.volume = 0;
        t.card.classList.remove('playing');
        updateTrackButtonIcon(t, false);
      }
    });

    // 2. Berikan respon visual & status aktif SEKETIKA (0 milidetik latency)
    state.playbackMode = trackName;
    updatePillsUI(trackName);
    state.isPlaying = true;
    state.currentPlaying = trackName;
    track.card.classList.add('playing');
    updateTrackButtonIcon(track, true);
    updateMasterPlayButton(true);

    // 3. Sinkronkan waktu HANYA jika terjadi pergeseran nyata > 0.3 detik
    // (Mencegah peramban membuang buffer audio yang sudah ada)
    const syncTime = state.currentTime || 0;
    if (Math.abs(track.audio.currentTime - syncTime) > 0.3) {
      track.audio.currentTime = syncTime;
    }

    track.audio.playbackRate = state.tempo || 1.0;
    applyVolume(track);

    // 4. Langsung putar audio seketika
    const playPromise = track.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('Playback notice:', err.message);
          // Jika peramban memblokir autoplay, sesuaikan ikon UI
          if (track.audio.paused && state.currentPlaying === trackName) {
            pauseSingleTrack(trackName);
          }
        }
      });
    }
  }

  function pauseSingleTrack(trackName) {
    const track = state.tracks[trackName];
    if (track) {
      track.audio.pause();
      track.audio.volume = 0;
      track.card.classList.remove('playing');
      updateTrackButtonIcon(track, false);
    }
    state.isPlaying = false;
    state.currentPlaying = null;
    updateMasterPlayButton(false);
  }

  function pauseAllTracks() {
    Object.values(state.tracks).forEach(t => {
      t.audio.pause();
      t.audio.volume = 0;
      t.card.classList.remove('playing');
      updateTrackButtonIcon(t, false);
    });
    state.isPlaying = false;
    state.currentPlaying = null;
    updateMasterPlayButton(false);
  }

  function stopAllTracks() {
    pauseAllTracks();
    seekAllTracks(0);
    state.currentTime = 0;
    if (els.masterScrubber) els.masterScrubber.value = 0;
    if (els.currentTime) els.currentTime.textContent = '00:00';
  }

  function updateTrackButtonIcon(trackObj, isPlaying) {
    if (!trackObj || !trackObj.playBtn) return;
    if (isPlaying) {
      trackObj.playBtn.classList.add('playing');
      trackObj.playBtn.setAttribute('title', `Jeda ${trackObj.label}`);
      trackObj.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
        <span class="track-play-label">Jeda</span>
      `;
    } else {
      trackObj.playBtn.classList.remove('playing');
      trackObj.playBtn.setAttribute('title', `Putar ${trackObj.label}`);
      trackObj.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span class="track-play-label">Putar</span>
      `;
    }
  }

  function seekAllTracks(percent) {
    const targetDuration = state.duration || (state.primaryTrack && state.primaryTrack.audio.duration) || 0;
    if (!targetDuration) return;
    const targetTime = (percent / 100) * targetDuration;
    state.currentTime = targetTime;
    
    Object.values(state.tracks).forEach(t => {
      t.audio.currentTime = targetTime;
    });
    els.currentTime.textContent = formatTime(targetTime);
  }

  function updateMasterPlayButton(playing) {
    if (!els.masterPlayBtn) return;
    const playIcon = els.masterPlayBtn.querySelector('.play-icon');
    const pauseIcon = els.masterPlayBtn.querySelector('.pause-icon');
    const label = document.getElementById('masterBtnLabel');

    if (playing) {
      els.masterPlayBtn.classList.add('playing');
      els.masterPlayBtn.setAttribute('title', 'Jeda / Pause');
      if (playIcon) playIcon.classList.add('hidden');
      if (pauseIcon) pauseIcon.classList.remove('hidden');
      if (label) label.textContent = 'Jeda';
    } else {
      els.masterPlayBtn.classList.remove('playing');
      els.masterPlayBtn.setAttribute('title', 'Putar Audio Sesuai Mode');
      if (playIcon) playIcon.classList.remove('hidden');
      if (pauseIcon) pauseIcon.classList.add('hidden');
      if (label) {
        if (state.playbackMode === 'vocals') label.textContent = 'Putar Vokal';
        else if (state.playbackMode === 'original') label.textContent = 'Putar Asli';
        else if (state.playbackMode === 'mix') label.textContent = 'Putar Mix';
        else label.textContent = 'Putar Musik';
      }
    }
  }

  // === Download All as ZIP ===
  function downloadZip() {
    if (!state.jobId) return;
    showToast('Menyiapkan file ZIP semua track...', 'info');
    window.location.href = `/api/download-zip/${state.jobId}`;
  }

  // === Reset All (Siap untuk pemisahan lagu berikutnya) ===
  function resetAll() {
    stopAllTracks();

    // Hapus data lagu & hasil pemisahan sebelumnya dari server agar penyimpanan tidak penuh
    const oldJobId = state.jobId;
    if (oldJobId) {
      fetch(`/api/cleanup/${oldJobId}`, { method: 'POST' }).catch(() => {});
    }

    state.selectedFile = null;
    state.jobId = null;
    state.isPlaying = false;
    state.soloTrack = null;
    state.tracks = {};

    els.fileInput.value = '';
    els.uploadArea.classList.remove('hidden');
    els.uploadSection.classList.remove('hidden');
    els.fileInfo.classList.add('hidden');
    els.processingSection.classList.add('hidden');
    els.resultsSection.classList.add('hidden');
    els.tracksContainer.innerHTML = '';

    updateProgress(0, '');
    els.uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Bersihkan data otomatis saat tab/peramban ditutup
  window.addEventListener('beforeunload', () => {
    if (state.jobId) {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/cleanup/${state.jobId}`);
      } else {
        fetch(`/api/cleanup/${state.jobId}`, { method: 'POST', keepalive: true }).catch(() => {});
      }
    }
  });

  // === System Health ===
  async function checkSystemHealth() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      updateSystemStatus(data.status === 'ok');
    } catch (e) {
      updateSystemStatus(false);
    }
  }

  function updateSystemStatus(online) {
    const dot = els.systemStatus.querySelector('.status-dot');
    const text = els.systemStatus.querySelector('span');
    
    if (online) {
      dot.style.background = 'var(--success)';
      text.textContent = 'Online';
      els.systemStatus.style.borderColor = 'rgba(16, 185, 129, 0.2)';
      els.systemStatus.style.background = 'rgba(16, 185, 129, 0.1)';
      els.systemStatus.style.color = 'var(--success)';
    } else {
      dot.style.background = 'var(--error)';
      text.textContent = 'Offline';
      els.systemStatus.style.borderColor = 'rgba(239, 68, 68, 0.2)';
      els.systemStatus.style.background = 'rgba(239, 68, 68, 0.1)';
      els.systemStatus.style.color = 'var(--error)';
    }
  }

  // === Scroll Effects ===
  function setupScrollEffects() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        els.navbar.classList.add('scrolled');
      } else {
        els.navbar.classList.remove('scrolled');
      }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // === FAQ ===
  function setupFAQ() {
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        const item = question.parentElement;
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(faq => faq.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    });
  }

  // === Particles ===
  function createParticles() {
    if (!els.particles) return;
    const count = 30;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${8 + Math.random() * 12}s`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particle.style.width = `${2 + Math.random() * 3}px`;
      particle.style.height = particle.style.width;
      
      const colors = [
        'rgba(139, 92, 246, 0.3)',
        'rgba(6, 182, 212, 0.3)',
        'rgba(244, 63, 94, 0.2)',
        'rgba(236, 72, 153, 0.2)'
      ];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      els.particles.appendChild(particle);
    }
  }

  // === Toast Notifications ===
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.classList.add('toast-out'); setTimeout(() => this.parentElement.remove(), 300)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    els.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // === Utilities ===
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
});
