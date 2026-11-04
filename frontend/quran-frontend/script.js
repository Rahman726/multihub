// Surah names array
const surahNames = ["Al-Fatiha","Al-Baqarah","Aal-Imran","An-Nisa","Al-Ma'idah","Al-An'am","Al-A'raf","Al-Anfal","At-Tawbah","Yunus","Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf","Maryam","Taha","Al-Anbiya","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Ash-Shu'ara","An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum","Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir","Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiya","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf","Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadila","Al-Hashr","Al-Mumtahinah","As-Saff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij","Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba'","An-Nazi'at","Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Ad-Duha","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat","Al-Qari'ah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"];

// State variables
let currentSurahId = 1, currentView = "arabic", currentLang = "urdu", currentSpeed = "normal";
let urduAudioEnabled = false;
let continuousMode = false;
let currentPlayingAyah = null;
const speedRates = { slow: 0.7, normal: 1.0, fast: 1.3 };
let ayahCache = new Map();
let currentAyahsData = null;
let activeSearchTerm = "", searchResults = new Set();
let currentAudio = null, playingCard = null;

// Surah lengths for displaying ayah counts and audio calculation
const surahLengths = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,18,12,12,30,12,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

// DOM elements
const surahSelect = document.getElementById("surahSelect");
const quranContainer = document.getElementById("quranContent");
const duaContainer = document.getElementById("duaContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const saveBookmarkBtn = document.getElementById("saveBookmarkBtn");
const gotoBookmarkBtn = document.getElementById("gotoBookmarkBtn");
const bookmarkStatus = document.getElementById("bookmarkStatus");
const darkModeBtn = document.getElementById("darkModeBtn");
const urduBtn = document.getElementById("urduBtn");
const englishBtn = document.getElementById("englishBtn");
const speedSlowBtn = document.getElementById("speedSlowBtn");
const speedNormalBtn = document.getElementById("speedNormalBtn");
const speedFastBtn = document.getElementById("speedFastBtn");
const urduAudioBtn = document.getElementById("urduAudioBtn");
const continuousBtn = document.getElementById("continuousBtn");
const manzilBtn = document.getElementById("manzilBtn");
const manzilContainer = document.getElementById("manzilContainer");
const surahListBtn = document.getElementById("surahListBtn");
const surahModal = document.getElementById("surahModal");
const surahListContainer = document.getElementById("surahListContainer");
const closeSurahModal = document.getElementById("closeSurahModal");

// ===== Surah List Modal Functions =====

function populateSurahList() {
  surahListContainer.innerHTML = '';
  
  for (let i = 0; i < 114; i++) {
    const surahItem = document.createElement('div');
    surahItem.className = 'surah-item';
    surahItem.dataset.surah = i + 1;
    
    surahItem.innerHTML = `
      <div class="surah-number">${i + 1}</div>
      <div class="surah-info">
        <div class="surah-name-ar">سورة ${surahNames[i]}</div>
        <div class="surah-name-en">${surahNames[i]}</div>
      </div>
      <div class="surah-ayahs">${surahLengths[i]} Ayahs</div>
    `;
    
    surahItem.addEventListener('click', () => {
      openSurah(i + 1);
    });
    
    surahListContainer.appendChild(surahItem);
  }
}

function openSurah(surahId) {
  surahModal.classList.remove('active');
  
  if (manzilBtn.classList.contains('active')) {
    closeManzil();
  }
  
  currentSurahId = surahId;
  surahSelect.value = surahId;
  loadSurah(surahId);
  clearSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSurahModal() {
  populateSurahList();
  surahModal.classList.add('active');
}

function hideSurahModal() {
  surahModal.classList.remove('active');
}

// ===== Core Functions =====

function populateDropdown() {
  for (let i = 0; i < 114; i++) {
    const option = document.createElement("option");
    option.value = i + 1;
    option.textContent = `${i + 1}. ${surahNames[i]} (${surahNames[i]})`;
    surahSelect.appendChild(option);
  }
  surahSelect.value = "1";
}

async function fetchCompleteSurahData(surahId) {
  if (ayahCache.has(surahId)) return ayahCache.get(surahId);
  try {
    const [arabicRes, englishRes, urduRes, translitRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`),
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.asad`),
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ur.jalandhari`),
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.transliteration`)
    ]);
    if (!arabicRes.ok) throw new Error("Network error");
    const arabicJson = await arabicRes.json();
    const englishJson = await englishRes.json();
    const urduJson = await urduRes.json();
    const translitJson = await translitRes.json();
    const data = {
      arabic: arabicJson.data.ayahs.map(a => a.text),
      english: englishJson.data.ayahs.map(t => t.text),
      urdu: urduJson.data.ayahs.map(u => u.text),
      transliteration: translitJson.data.ayahs.map(tr => tr.text)
    };
    ayahCache.set(surahId, data);
    return data;
  } catch (e) {
    console.error(e);
    throw new Error("Unable to load Surah. Please check connection.");
  }
}

// ===== Audio Functions =====

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (playingCard) {
    playingCard.classList.remove('playing');
    const btn = playingCard.querySelector('.play-ayah');
    if (btn) btn.textContent = '🔊 Listen';
    playingCard = null;
  }
  currentPlayingAyah = null;
}

function playNextAyah() {
  if (!currentPlayingAyah || !continuousMode) return;
  
  const { surahId, ayahNum } = currentPlayingAyah;
  const totalAyahs = currentAyahsData ? currentAyahsData.arabic.length : 0;
  
  if (ayahNum < totalAyahs) {
    const nextAyahNum = ayahNum + 1;
    const nextCard = document.querySelector(`.ayah-card[data-ayah="${nextAyahNum}"]`);
    if (nextCard) {
      nextCard.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => playAyah(surahId, nextAyahNum, nextCard), 500);
    }
  } else if (surahId < 114) {
    const nextSurahId = surahId + 1;
    surahSelect.value = nextSurahId;
    currentSurahId = nextSurahId;
    loadSurah(nextSurahId, 1);
    setTimeout(() => {
      const firstCard = document.querySelector('.ayah-card[data-ayah="1"]');
      if (firstCard) playAyah(nextSurahId, 1, firstCard);
    }, 2000);
  }
}

function getGlobalAyahNumber(surahId, ayahNum) {
  let globalNum = 0;
  for (let i = 0; i < surahId - 1; i++) {
    globalNum += surahLengths[i];
  }
  return globalNum + ayahNum;
}

function playAyah(surahId, ayahNum, cardElement = null) {
  stopCurrentAudio();
  currentPlayingAyah = { surahId, ayahNum };
  
  const globalAyah = getGlobalAyahNumber(surahId, ayahNum);
  const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyah}.mp3`;
  currentAudio = new Audio(audioUrl);

  currentAudio.playbackRate = speedRates[currentSpeed] || 1.0;

  if (cardElement) {
    playingCard = cardElement;
    cardElement.classList.add('playing');
    const btn = cardElement.querySelector('.play-ayah');
    if (btn) btn.textContent = '⏹ Stop';
  }

  currentAudio.addEventListener('ended', () => {
    if (urduAudioEnabled && currentLang === 'urdu' && currentAyahsData) {
      const ayahIndex = ayahNum - 1;
      const urduText = currentAyahsData.urdu[ayahIndex];
      speakUrduTranslation(urduText, () => {
        if (continuousMode) {
          setTimeout(() => playNextAyah(), 1000);
        } else {
          stopCurrentAudio();
        }
      });
    } else {
      if (continuousMode) {
        setTimeout(() => playNextAyah(), 1000);
      } else {
        stopCurrentAudio();
      }
    }
  });
  
  currentAudio.addEventListener('error', () => {
    console.log("Audio load error");
    stopCurrentAudio();
  });

  currentAudio.play().catch(e => {
    console.log("Audio play error", e);
    stopCurrentAudio();
  });
}

function speakUrduTranslation(text, onComplete = null) {
  if (!window.speechSynthesis) {
    if (onComplete) onComplete();
    else stopCurrentAudio();
    return;
  }
  
  const cleanText = text.replace(/<[^>]*>/g, '');
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ur-PK';
  utterance.rate = speedRates[currentSpeed] || 1.0;
  utterance.pitch = 1.0;
  
  const voices = window.speechSynthesis.getVoices();
  const urduVoice = voices.find(v => v.lang.includes('ur'));
  if (urduVoice) utterance.voice = urduVoice;
  
  utterance.onend = () => {
    if (onComplete) onComplete();
    else stopCurrentAudio();
  };
  utterance.onerror = () => {
    if (onComplete) onComplete();
    else stopCurrentAudio();
  };
  
  window.speechSynthesis.speak(utterance);
}

// ===== Rendering Functions =====

function renderContent(data, surahId) {
  const { arabic, english, urdu, transliteration } = data;
  let html = "";
  for (let i = 0; i < arabic.length; i++) {
    const ayahIdx = i + 1;
    const isHighlight = activeSearchTerm && searchResults.has(`${surahId}:${ayahIdx}`);
    const highlightClass = isHighlight ? "highlight" : "";
    const translationText = (currentLang === "urdu") ? urdu[i] : english[i];
    const translationClass = (currentLang === "urdu") ? "translation-urdu" : "translation-english";
    const translationLabel = (currentLang === "urdu") ? "📖 اردو ترجمہ:" : "📖 English Translation:";

    if (currentView === "arabic") {
      html += `<div class="ayah-card ${highlightClass}" data-ayah="${ayahIdx}">
        <div class="ayah-meta">
          <span class="ayah-number">Ayah ${ayahIdx}</span>
          <div class="audio-control">
            <button class="play-ayah" data-surah="${surahId}" data-ayah="${ayahIdx}">🔊 Listen</button>
          </div>
        </div>
        <div class="aya-text-ar">${arabic[i]}</div>
        <div class="${translationClass}">${translationLabel} ${translationText}</div>
      </div>`;
    } else {
      html += `<div class="ayah-card ${highlightClass}" data-ayah="${ayahIdx}">
        <div class="ayah-meta">
          <span class="ayah-number">Ayah ${ayahIdx}</span>
          <div class="audio-control">
            <button class="play-ayah" data-surah="${surahId}" data-ayah="${ayahIdx}">🔊 Listen</button>
          </div>
        </div>
        <div class="aya-text-ar">${arabic[i]}</div>
        <div class="transliteration-text">📖 Transliteration: ${transliteration[i]}</div>
        <div class="${translationClass}">${translationLabel} ${translationText}</div>
      </div>`;
    }
  }
  quranContainer.innerHTML = html;

  document.querySelectorAll('.ayah-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      const s = parseInt(card.querySelector('.play-ayah').dataset.surah);
      const a = parseInt(card.dataset.ayah);
      if (playingCard === card) { stopCurrentAudio(); return; }
      playAyah(s, a, card);
    });
  });

  document.querySelectorAll('.play-ayah').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const s = parseInt(btn.dataset.surah);
      const a = parseInt(btn.dataset.ayah);
      const card = btn.closest('.ayah-card');
      if (playingCard === card) { stopCurrentAudio(); return; }
      playAyah(s, a, card);
    });
  });

  if (surahId === 114) showCompletionDua();
  else duaContainer.innerHTML = "";
}

function showCompletionDua() {
  duaContainer.innerHTML = `<div class="dua-section">
    <h3>🤲 ختم القرآن کی دعا (Khatm al-Qur'an Dua)</h3>
    <div class="aya-text-ar" style="font-size:1.4rem">اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً</div>
    <div class="translation-urdu">اے اللہ! مجھ پر قرآن کے ذریعے رحم فرما، اور اسے میرا پیشوا، نور، ہدایت اور رحمت بنا دے</div>
    <div class="translation-english">O Allah, have mercy on me through the Quran, make it my guide, light, guidance and mercy.</div>
  </div>`;
}

async function loadSurah(surahId, scrollToAyah = null) {
  quranContainer.innerHTML = '<div class="loading">🌟 Loading Surah... 🌟<br>📡 Fetching Arabic, Urdu & English</div>';
  try {
    const data = await fetchCompleteSurahData(surahId);
    currentAyahsData = data;
    renderContent(data, surahId);
    if (scrollToAyah) {
      const el = document.querySelector(`.ayah-card[data-ayah="${scrollToAyah}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } catch (err) {
    quranContainer.innerHTML = `<div class="error">⚠️ ${err.message}</div>`;
  }
}

// ===== Search Functions =====

async function performSearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) { clearSearch(); return; }
  activeSearchTerm = term;
  searchResults.clear();
  if (!currentAyahsData) return;
  const { arabic, english, urdu } = currentAyahsData;
  for (let i = 0; i < arabic.length; i++) {
    const ayahNum = i + 1;
    if (arabic[i].toLowerCase().includes(term) || english[i].toLowerCase().includes(term) || urdu[i].toLowerCase().includes(term)) {
      searchResults.add(`${currentSurahId}:${ayahNum}`);
    }
  }
  renderContent(currentAyahsData, currentSurahId);
  if (searchResults.size === 0) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'no-results';
    msgDiv.innerText = '🔍 No matching ayahs found in this Surah. Try another word.';
    quranContainer.appendChild(msgDiv);
  }
}

function clearSearch() {
  activeSearchTerm = "";
  searchResults.clear();
  searchInput.value = "";
  if (currentAyahsData) renderContent(currentAyahsData, currentSurahId);
}

// ===== Bookmark Functions =====

function saveBookmark() {
  const firstCard = document.querySelector('.ayah-card');
  let ayah = 1;
  if (firstCard && firstCard.dataset.ayah) ayah = parseInt(firstCard.dataset.ayah);
  const bookmark = { surah: currentSurahId, ayah: ayah };
  localStorage.setItem('quranBookmark', JSON.stringify(bookmark));
  bookmarkStatus.innerText = `✅ Saved: Surah ${bookmark.surah}, Ayah ${bookmark.ayah}`;
  setTimeout(() => bookmarkStatus.innerText = "", 2000);
}

function goToBookmark() {
  const raw = localStorage.getItem('quranBookmark');
  if (!raw) { bookmarkStatus.innerText = "No bookmark found."; setTimeout(() => bookmarkStatus.innerText = "", 1500); return; }
  const { surah, ayah } = JSON.parse(raw);
  currentSurahId = surah;
  surahSelect.value = surah;
  loadSurah(surah, ayah);
  bookmarkStatus.innerText = `📍 Jumped to Surah ${surah}, Ayah ${ayah}`;
}

// ===== Toggle Functions =====

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
  darkModeBtn.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function setView(view) {
  currentView = view;
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  if (currentAyahsData) renderContent(currentAyahsData, currentSurahId);
}

function setLanguage(lang) {
  currentLang = lang;
  urduBtn.classList.toggle('active', lang === 'urdu');
  englishBtn.classList.toggle('active', lang === 'english');
  if (currentAyahsData) renderContent(currentAyahsData, currentSurahId);
}

function setSpeed(speed) {
  currentSpeed = speed;
  speedSlowBtn.classList.toggle('active', speed === 'slow');
  speedNormalBtn.classList.toggle('active', speed === 'normal');
  speedFastBtn.classList.toggle('active', speed === 'fast');
  localStorage.setItem('quranSpeed', speed);
}

function toggleUrduAudio() {
  urduAudioEnabled = !urduAudioEnabled;
  urduAudioBtn.classList.toggle('active', urduAudioEnabled);
  urduAudioBtn.textContent = urduAudioEnabled ? '🔊 اردو: ON' : '🔊 اردو ترجمہ';
  localStorage.setItem('urduAudioEnabled', urduAudioEnabled);
  
  if (!urduAudioEnabled && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function toggleContinuousMode() {
  continuousMode = !continuousMode;
  continuousBtn.classList.toggle('active', continuousMode);
  continuousBtn.textContent = continuousMode ? '🔁 Continuous: ON' : '🔁 Continuous';
  localStorage.setItem('continuousMode', continuousMode);
}

// ===== Manzil Functions =====

const manzilData = [
  { name: "Manzil 1", verses: [{s:1,a:1},{s:2,a:1},{s:2,a:2},{s:2,a:3},{s:2,a:4},{s:2,a:5}] },
  { name: "Manzil 2", verses: [{s:2,a:163},{s:2,a:164},{s:2,a:255},{s:2,a:285},{s:2,a:286}] },
  { name: "Manzil 3", verses: [{s:3,a:18},{s:3,a:19},{s:7,a:54},{s:17,a:45},{s:17,a:48}] },
  { name: "Manzil 4", verses: [{s:23,a:115},{s:23,a:116},{s:23,a:117},{s:23,a:118},{s:37,a:1},{s:37,a:2},{s:37,a:3},{s:37,a:4},{s:37,a:5},{s:37,a:6},{s:37,a:7},{s:37,a:8},{s:37,a:9},{s:37,a:10},{s:37,a:11}] },
  { name: "Manzil 5", verses: [{s:59,a:21},{s:59,a:22},{s:59,a:23},{s:59,a:24}] },
  { name: "Manzil 6", verses: [{s:72,a:1},{s:72,a:2},{s:72,a:3},{s:72,a:4},{s:109,a:1},{s:109,a:2},{s:109,a:3},{s:109,a:4},{s:109,a:5},{s:109,a:6}] },
  { name: "Manzil 7", verses: [{s:112,a:1},{s:112,a:2},{s:112,a:3},{s:112,a:4},{s:113,a:1},{s:113,a:2},{s:113,a:3},{s:113,a:4},{s:113,a:5},{s:114,a:1},{s:114,a:2},{s:114,a:3},{s:114,a:4},{s:114,a:5},{s:114,a:6}] }
];

let manzilCache = {};
let currentManzilSection = null;

async function fetchAyahText(surah, ayah) {
  const key = `${surah}:${ayah}`;
  if (manzilCache[key]) return manzilCache[key];
  
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/editions/quran-uthmani,urdu.jalandhry,en.asad`);
    const data = await response.json();
    if (data.data) {
      const result = {
        arabic: data.data[0].text,
        urdu: data.data[1]?.text || '',
        english: data.data[2]?.text || ''
      };
      manzilCache[key] = result;
      return result;
    }
  } catch (e) {
    console.error('Error fetching ayah:', e);
  }
  return null;
}

async function showManzil() {
  quranContainer.style.display = 'none';
  duaContainer.style.display = 'none';
  manzilContainer.style.display = 'block';
  manzilContainer.innerHTML = '<div class="manzil-loading">Loading Manzil...</div>';
  
  let html = '<div class="manzil-header"><h2>🤲 دعا منزل (Dua Manzil)</h2><p>Protective verses for spiritual healing and blessings</p><button onclick="closeManzil()" class="btn-close">✕ Close</button></div>';
  
  for (let i = 0; i < manzilData.length; i++) {
    const section = manzilData[i];
    html += `<div class="manzil-section" id="manzil-${i}"><h3>${section.name}</h3>`;
    
    for (const verse of section.verses) {
      const data = await fetchAyahText(verse.s, verse.a);
      if (data) {
        html += `
          <div class="ayah-card manzil-ayah" data-surah="${verse.s}" data-ayah="${verse.a}">
            <div class="ayah-header">
              <span class="ayah-badge">${verse.s}:${verse.a}</span>
              <button class="play-ayah" data-surah="${verse.s}" data-ayah="${verse.a}">🔊 Listen</button>
            </div>
            <div class="aya-text-ar">${data.arabic}</div>
            ${currentLang === 'urdu' ? `<div class="translation-urdu">${data.urdu}</div>` : `<div class="translation-english">${data.english}</div>`}
          </div>
        `;
      }
    }
    
    html += '</div>';
  }
  
  html += '<div class="manzil-footer"><p>🤲 Recite these verses for protection from evil eye, jinn, and spiritual ailments</p><button onclick="closeManzil()" class="btn-close">✕ Close Manzil</button></div>';
  
  manzilContainer.innerHTML = html;
  
  manzilContainer.querySelectorAll('.ayah-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      const s = parseInt(card.dataset.surah);
      const a = parseInt(card.dataset.ayah);
      if (playingCard === card) { stopCurrentAudio(); return; }
      playAyah(s, a, card);
    });
  });
  
  manzilContainer.querySelectorAll('.play-ayah').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const s = parseInt(btn.dataset.surah);
      const a = parseInt(btn.dataset.ayah);
      const card = btn.closest('.ayah-card');
      if (playingCard === card) { stopCurrentAudio(); return; }
      playAyah(s, a, card);
    });
  });
}

window.closeManzil = function() {
  stopCurrentAudio();
  manzilContainer.style.display = 'none';
  quranContainer.style.display = 'block';
  duaContainer.style.display = currentSurahId === 114 ? 'block' : 'none';
  manzilBtn.classList.remove('active');
};

// ===== Event Listeners =====

surahSelect.addEventListener("change", (e) => {
  currentSurahId = parseInt(e.target.value);
  loadSurah(currentSurahId);
  clearSearch();
});

searchBtn.addEventListener("click", performSearch);
clearSearchBtn.addEventListener("click", clearSearch);
searchInput.addEventListener("keypress", (e) => { if (e.key === "Enter") performSearch(); });
saveBookmarkBtn.addEventListener("click", saveBookmark);
gotoBookmarkBtn.addEventListener("click", goToBookmark);
darkModeBtn.addEventListener("click", toggleDarkMode);
urduBtn.addEventListener("click", () => setLanguage('urdu'));
englishBtn.addEventListener("click", () => setLanguage('english'));
speedSlowBtn.addEventListener("click", () => setSpeed('slow'));
speedNormalBtn.addEventListener("click", () => setSpeed('normal'));
speedFastBtn.addEventListener("click", () => setSpeed('fast'));
urduAudioBtn.addEventListener("click", toggleUrduAudio);
continuousBtn.addEventListener("click", toggleContinuousMode);

manzilBtn.addEventListener("click", () => {
  manzilBtn.classList.toggle('active');
  if (manzilBtn.classList.contains('active')) {
    showManzil();
  } else {
    closeManzil();
  }
});

surahListBtn.addEventListener("click", showSurahModal);
closeSurahModal.addEventListener("click", hideSurahModal);

surahModal.addEventListener("click", (e) => {
  if (e.target === surahModal) {
    hideSurahModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && surahModal.classList.contains('active')) {
    hideSurahModal();
  }
});

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

// ===== Initialization =====

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  darkModeBtn.innerText = "☀️ Light Mode";
}

const savedSpeed = localStorage.getItem('quranSpeed');
if (savedSpeed) setSpeed(savedSpeed);

const savedUrduAudio = localStorage.getItem('urduAudioEnabled');
if (savedUrduAudio === 'true') toggleUrduAudio();

const savedContinuous = localStorage.getItem('continuousMode');
if (savedContinuous === 'true') toggleContinuousMode();

if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// Start the app
populateDropdown();
loadSurah(1);
