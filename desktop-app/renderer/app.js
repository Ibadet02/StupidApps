const soundPacks = [
  { id: "fart", name: "Fart Mode", emoji: "💨", color: "#8B4513" },
  { id: "cat", name: "Cat Meow", emoji: "🐱", color: "#FF6B6B" },
  { id: "gun", name: "Gun Shots", emoji: "🔫", color: "#4A4A4A" },
  { id: "typewriter", name: "Typewriter", emoji: "⌨️", color: "#D4A574" },
  { id: "moan", name: "Moaning", emoji: "😩", color: "#E91E63" },
];

let selectedPack = "moan";
let volume = 0.7;
let isListening = true;
let keyCount = 0;
let audioCtx = null;
let loadedBuffers = {}; // { packId: AudioBuffer[] }
let activeSource = null;
let soundsBasePath = "";

// DOM elements
const packsEl = document.getElementById("packs");
const volumeEl = document.getElementById("volume");
const volumeValueEl = document.getElementById("volumeValue");
const lastKeyEl = document.getElementById("lastKey");
const keyCountEl = document.getElementById("keyCount");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const flashOverlay = document.getElementById("flashOverlay");

// Initialize audio context on first interaction
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Render sound pack buttons
function renderPacks() {
  packsEl.innerHTML = "";
  soundPacks.forEach((pack) => {
    const el = document.createElement("div");
    el.className = `pack ${pack.id === selectedPack ? "selected" : ""}`;
    el.innerHTML = `<div class="emoji">${pack.emoji}</div><div class="name">${pack.name}</div>`;
    el.addEventListener("click", () => {
      selectedPack = pack.id;
      renderPacks();
      loadSoundsForPack(pack.id);
    });
    packsEl.appendChild(el);
  });
}

// Load sound files for a pack
async function loadSoundsForPack(packId) {
  if (loadedBuffers[packId]) return; // already loaded

  const ctx = getAudioContext();
  const basePath = soundsBasePath || "sounds";

  // Try to load numbered files: {pack}/{pack}-1.m4a, {pack}-2.m4a, etc.
  // Also try .wav, .ogg, .mp3 extensions
  const extensions = ["m4a", "mp3", "wav", "ogg"];
  const buffers = [];

  // Try numbered files first
  for (let i = 1; i <= 30; i++) {
    let loaded = false;
    for (const ext of extensions) {
      const filePath = `file://${basePath}/${packId}/${packId}-${i}.${ext}`;
      try {
        const res = await fetch(filePath);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(buf);
          buffers.push(decoded);
          loaded = true;
          break;
        }
      } catch {
        // file doesn't exist, skip
      }
    }
    if (!loaded && i > 1) break; // stop when we run out of numbered files
  }

  // Try single file: {pack}.m4a, {pack}.wav, etc.
  if (buffers.length === 0) {
    for (const ext of extensions) {
      const filePath = `file://${basePath}/${packId}.${ext}`;
      try {
        const res = await fetch(filePath);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(buf);
          buffers.push(decoded);
          break;
        }
      } catch {
        // skip
      }
    }
  }

  if (buffers.length > 0) {
    loadedBuffers[packId] = buffers;
  }
}

// Stop currently playing sound
function stopActiveSound() {
  if (activeSource) {
    try {
      activeSource.stop();
    } catch {}
    activeSource = null;
  }
}

// Play a random sound from the selected pack
let lastPlayedIndex = -1;

function playSound() {
  const ctx = getAudioContext();
  const buffers = loadedBuffers[selectedPack];

  if (!buffers || buffers.length === 0) {
    // Fallback: play a synth sound
    playSynthFallback(ctx);
    return;
  }

  stopActiveSound();

  // Pick random buffer, avoid repeat
  let idx = Math.floor(Math.random() * buffers.length);
  if (buffers.length > 1 && idx === lastPlayedIndex) {
    idx = (idx + 1) % buffers.length;
  }
  lastPlayedIndex = idx;

  const source = ctx.createBufferSource();
  source.buffer = buffers[idx];
  source.playbackRate.value = 0.85 + Math.random() * 0.3;

  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();

  activeSource = source;
  source.onended = () => {
    if (activeSource === source) activeSource = null;
  };
}

// Simple synth fallback when no audio files are loaded
function playSynthFallback(ctx) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(300 + Math.random() * 400, now);
  osc.frequency.linearRampToValueAtTime(200, now + 0.15);

  gain.gain.setValueAtTime(volume * 0.3, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

// Handle global keypress from main process
function handleKeypress(keyName) {
  if (!isListening) return;

  keyCount++;
  keyCountEl.textContent = keyCount;

  // Show key name
  lastKeyEl.textContent = keyName.length === 1 ? keyName.toUpperCase() : keyName;
  lastKeyEl.classList.add("flash");
  setTimeout(() => lastKeyEl.classList.remove("flash"), 100);

  // Flash overlay
  const pack = soundPacks.find((p) => p.id === selectedPack);
  if (pack) {
    flashOverlay.style.background = pack.color;
    flashOverlay.classList.add("active");
    setTimeout(() => flashOverlay.classList.remove("active"), 50);
  }

  playSound();
}

// Volume control
volumeEl.addEventListener("input", (e) => {
  volume = parseFloat(e.target.value);
  volumeValueEl.textContent = Math.round(volume * 100) + "%";
});

// Toggle button
toggleBtn.addEventListener("click", () => {
  isListening = !isListening;
  statusEl.textContent = isListening ? "ACTIVE" : "PAUSED";
  statusEl.className = `status ${isListening ? "active" : "paused"}`;
  toggleBtn.textContent = isListening ? "Pause" : "Resume";
  window.electronAPI.toggleListening(isListening);
});

// Listen for global keypresses from main process
window.electronAPI.onGlobalKeypress((data) => {
  // Don't play sounds when paused or when the app window itself is focused
  if (!isListening) return;
  if (data.windowFocused) return;
  handleKeypress(data.keyName);
});

window.electronAPI.onListeningChanged((value) => {
  isListening = value;
  statusEl.textContent = isListening ? "ACTIVE" : "PAUSED";
  statusEl.className = `status ${isListening ? "active" : "paused"}`;
  toggleBtn.textContent = isListening ? "Pause" : "Resume";
});

// Close button
document.getElementById("closeBtn").addEventListener("click", () => {
  window.electronAPI.quitApp();
});

// License activation
const API_BASE = "https://project-xi-neon-45.vercel.app";
const licenseScreen = document.getElementById("licenseScreen");
const mainApp = document.getElementById("mainApp");
const licenseInput = document.getElementById("licenseInput");
const licenseBtn = document.getElementById("licenseBtn");
const licenseError = document.getElementById("licenseError");
const licenseCloseBtn = document.getElementById("licenseCloseBtn");
const buyLink = document.getElementById("buyLink");

function showLicenseScreen() {
  licenseScreen.style.display = "flex";
  mainApp.style.display = "none";
}

function showMainApp() {
  licenseScreen.style.display = "none";
  mainApp.style.display = "flex";
  window.electronAPI.licenseVerified();
}

licenseCloseBtn.addEventListener("click", () => {
  window.electronAPI.quitApp();
});

buyLink.addEventListener("click", () => {
  window.electronAPI.openExternal(`${API_BASE}/apps/typing-sounds`);
});

licenseBtn.addEventListener("click", async () => {
  const key = licenseInput.value.trim();
  if (!key) return;

  licenseBtn.disabled = true;
  licenseBtn.textContent = "Checking...";
  licenseError.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/api/license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, appSlug: "typing-sounds" }),
    });

    if (res.ok) {
      await window.electronAPI.saveLicense(key);
      showMainApp();
    } else {
      licenseError.textContent = "Invalid license key. Please check and try again.";
    }
  } catch (err) {
    licenseError.textContent = "Could not verify. Check your internet connection.";
  }

  licenseBtn.disabled = false;
  licenseBtn.textContent = "Activate";
});

// Allow Enter key to submit license
licenseInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") licenseBtn.click();
});

// Initialize
async function init() {
  // Check if already licensed
  const savedKey = await window.electronAPI.getLicense();
  if (savedKey) {
    // Verify the saved key is still valid
    try {
      const res = await fetch(`${API_BASE}/api/license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: savedKey, appSlug: "typing-sounds" }),
      });
      if (res.ok) {
        showMainApp();
      } else {
        showLicenseScreen();
      }
    } catch {
      // Offline — trust the saved key
      showMainApp();
    }
  } else {
    showLicenseScreen();
  }

  soundsBasePath = await window.electronAPI.getSoundsPath();
  renderPacks();
  await loadSoundsForPack(selectedPack);
}

init();
