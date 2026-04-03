const API_BASE = "https://project-xi-neon-45.vercel.app";

let volume = 0.8;
let previousVolume = 0.8;
let isMuted = false;
let isEnabled = true;
let isLooping = true;
let audioCtx = null;
let plugSounds = []; // { name, buffer }[]
let unplugSounds = []; // { name, buffer }[]
let soundsBasePath = "";
let selectedPlugIndex = -1; // -1 = random
let selectedUnplugIndex = -1; // -1 = random
let lastPlugIndex = -1;
let lastUnplugIndex = -1;
let activeSource = null;
let activeGainNode = null;

// DOM
const display = document.getElementById("display");
const emoji = document.getElementById("emoji");
const statusText = document.getElementById("statusText");
const eventText = document.getElementById("eventText");
const flash = document.getElementById("flash");
const toggleBtn = document.getElementById("toggleBtn");
const volumeEl = document.getElementById("volume");
const licenseScreen = document.getElementById("licenseScreen");
const mainApp = document.getElementById("mainApp");
const licenseInput = document.getElementById("licenseInput");
const licenseBtn = document.getElementById("licenseBtn");
const licenseError = document.getElementById("licenseError");
const licenseCloseBtn = document.getElementById("licenseCloseBtn");
const buyLink = document.getElementById("buyLink");

function getAudioContext() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Load a sound file via main process
async function loadSound(filePath) {
  try {
    const buf = await window.electronAPI.loadSoundFile(filePath);
    if (!buf) return null;
    const ctx = getAudioContext();
    return await ctx.decodeAudioData(buf);
  } catch {
    return null;
  }
}

// Load sounds from a folder, returns array of { name, buffer }
async function loadSoundsFromFolder(folder, prefix) {
  const sep = soundsBasePath.includes("\\") ? "\\" : "/";
  const extensions = ["wav", "mp3", "ogg", "m4a"];
  const results = [];

  for (let i = 1; i <= 25; i++) {
    let loaded = false;
    for (const ext of extensions) {
      const filePath = `${soundsBasePath}${sep}${folder}${sep}${prefix}-${i}.${ext}`;
      const decoded = await loadSound(filePath);
      if (decoded) {
        results.push({ name: `${prefix}-${i}.${ext}`, buffer: decoded });
        loaded = true;
        break;
      }
    }
    if (!loaded && i > 1) break;
  }

  return results;
}

function populateDropdown(selectEl, sounds, label) {
  selectEl.innerHTML = "";

  const randomOpt = document.createElement("option");
  randomOpt.value = "-1";
  randomOpt.textContent = `🎲 Random (${sounds.length} sounds)`;
  selectEl.appendChild(randomOpt);

  const friendlyNames = {
    "plug-1": "Man moaning",
    "plug-2": "Oh yeaaahhh",
    "unplug-1": "No no no wait!",
    "unplug-2": "Man screaming",
    "unplug-3": "Woman crying",
  };

  sounds.forEach((s, i) => {
    const opt = document.createElement("option");
    opt.value = i.toString();
    const baseName = s.name.replace(/\.(wav|mp3|ogg|m4a)$/, "");
    opt.textContent = friendlyNames[baseName] || baseName;
    selectEl.appendChild(opt);
  });
}

async function loadAllSounds() {
  plugSounds = await loadSoundsFromFolder("plug", "plug");
  unplugSounds = await loadSoundsFromFolder("unplug", "unplug");

  console.log(`Loaded ${plugSounds.length} plug sounds, ${unplugSounds.length} unplug sounds`);

  populateDropdown(document.getElementById("plugSelect"), plugSounds, "Plug");
  populateDropdown(document.getElementById("unplugSelect"), unplugSounds, "Unplug");
}

function stopActiveSound() {
  if (activeSource) {
    try { activeSource.stop(); } catch {}
    activeSource = null;
    activeGainNode = null;
  }
}

function playSound(sounds, selectedIndex, lastIndex) {
  stopActiveSound();
  const ctx = getAudioContext();
  if (sounds.length === 0) {
    playSynthFallback(ctx);
    return -1;
  }

  let idx;
  if (selectedIndex >= 0 && selectedIndex < sounds.length) {
    idx = selectedIndex;
  } else {
    idx = Math.floor(Math.random() * sounds.length);
    if (sounds.length > 1 && idx === lastIndex) {
      idx = (idx + 1) % sounds.length;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = sounds[idx].buffer;
  source.loop = isLooping;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  activeSource = source;
  activeGainNode = gain;

  source.onended = () => {
    if (activeSource === source) {
      activeSource = null;
      activeGainNode = null;
    }
  };

  return idx;
}

function playSynthFallback(ctx) {
  // Simple moan-like synth
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(250 + Math.random() * 150, now);
  osc.frequency.linearRampToValueAtTime(400 + Math.random() * 200, now + 0.5);
  gain.gain.setValueAtTime(volume * 0.4, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.8);
}

// Handle charge events
window.electronAPI.onChargeEvent((type) => {
  if (!isEnabled) return;

  if (type === "plugged") {
    lastPlugIndex = playSound(plugSounds, selectedPlugIndex, lastPlugIndex);

    // Visual feedback
    emoji.textContent = "⚡";
    emoji.classList.add("bounce");
    setTimeout(() => emoji.classList.remove("bounce"), 500);

    statusText.textContent = "PLUGGED IN";
    statusText.className = "status-text plugged";
    display.className = "main-display plugged";
    eventText.textContent = "Ohhhh yeah... that's the stuff";

    flash.style.background = "#22c55e";
    flash.classList.add("active");
    setTimeout(() => flash.classList.remove("active"), 300);

    setTimeout(() => {
      emoji.textContent = "🔋";
      statusText.textContent = "Charging...";
      statusText.className = "status-text";
      display.className = "main-display";
      eventText.textContent = "Unplug to hear the scream";
    }, 3000);

  } else if (type === "unplugged") {
    lastUnplugIndex = playSound(unplugSounds, selectedUnplugIndex, lastUnplugIndex);

    // Visual feedback
    emoji.textContent = "😱";
    emoji.classList.add("bounce");
    setTimeout(() => emoji.classList.remove("bounce"), 500);

    statusText.textContent = "UNPLUGGED!";
    statusText.className = "status-text unplugged";
    display.className = "main-display unplugged";
    eventText.textContent = "NOOO! Don't leave me!";

    flash.style.background = "#ef4444";
    flash.classList.add("active");
    setTimeout(() => flash.classList.remove("active"), 300);

    setTimeout(() => {
      emoji.textContent = "🪫";
      statusText.textContent = "Running on battery...";
      statusText.className = "status-text";
      display.className = "main-display";
      eventText.textContent = "Plug in to hear the moan";
    }, 3000);
  }
});

// Controls
document.getElementById("loopBtn").addEventListener("click", () => {
  isLooping = !isLooping;
  document.getElementById("loopBtn").className = `toggle ${isLooping ? "on" : ""}`;
  if (activeSource) {
    activeSource.loop = isLooping;
  }
});

document.getElementById("plugSelect").addEventListener("change", (e) => {
  selectedPlugIndex = parseInt(e.target.value);
  if (activeSource) {
    stopActiveSound();
    document.getElementById("plugPreview").textContent = "▶";
    document.getElementById("plugPreview").classList.remove("playing");
  }
});

document.getElementById("unplugSelect").addEventListener("change", (e) => {
  selectedUnplugIndex = parseInt(e.target.value);
  if (activeSource) {
    stopActiveSound();
    document.getElementById("unplugPreview").textContent = "▶";
    document.getElementById("unplugPreview").classList.remove("playing");
  }
});

// Preview buttons
function previewSound(sounds, selectEl, btn) {
  // If already playing, stop it
  if (btn.classList.contains("playing")) {
    stopActiveSound();
    btn.textContent = "▶";
    btn.classList.remove("playing");
    return;
  }

  const idx = parseInt(selectEl.value);
  playSound(sounds, idx, -1);

  btn.textContent = "⏹";
  btn.classList.add("playing");

  // Reset button when sound ends (if not looping)
  const checkEnded = setInterval(() => {
    if (!activeSource) {
      btn.textContent = "▶";
      btn.classList.remove("playing");
      clearInterval(checkEnded);
    }
  }, 200);
}

document.getElementById("plugPreview").addEventListener("click", () => {
  previewSound(plugSounds, document.getElementById("plugSelect"), document.getElementById("plugPreview"));
});

document.getElementById("unplugPreview").addEventListener("click", () => {
  previewSound(unplugSounds, document.getElementById("unplugSelect"), document.getElementById("unplugPreview"));
});

volumeEl.addEventListener("input", (e) => {
  volume = parseFloat(e.target.value);
  previousVolume = volume;
  isMuted = false;
  document.getElementById("muteBtn").textContent = "🔊";
  if (activeGainNode) {
    activeGainNode.gain.value = volume;
  }
});

document.getElementById("muteBtn").addEventListener("click", () => {
  isMuted = !isMuted;
  if (isMuted) {
    previousVolume = volume;
    volume = 0;
    volumeEl.value = 0;
    document.getElementById("muteBtn").textContent = "🔇";
  } else {
    volume = previousVolume || 0.8;
    volumeEl.value = volume;
    document.getElementById("muteBtn").textContent = "🔊";
  }
  if (activeGainNode) {
    activeGainNode.gain.value = volume;
  }
});

document.getElementById("minimizeBtn").addEventListener("click", () => {
  window.electronAPI.minimizeApp();
});

document.getElementById("closeBtn").addEventListener("click", () => {
  window.electronAPI.quitApp();
});

// License
function showLicenseScreen() {
  licenseScreen.style.display = "flex";
  mainApp.style.display = "none";
}

function showMainApp() {
  licenseScreen.style.display = "none";
  mainApp.style.display = "flex";
}

licenseCloseBtn.addEventListener("click", () => window.electronAPI.quitApp());

buyLink.addEventListener("click", () => {
  window.electronAPI.openExternal(`${API_BASE}/apps/chargegasm`);
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
      body: JSON.stringify({ key, appSlug: "chargegasm" }),
    });
    if (res.ok) {
      await window.electronAPI.saveLicense(key);
      showMainApp();
    } else {
      licenseError.textContent = "Invalid license key.";
    }
  } catch {
    licenseError.textContent = "Could not verify. Check your internet.";
  }

  licenseBtn.disabled = false;
  licenseBtn.textContent = "Activate";
});

licenseInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") licenseBtn.click();
});

// Init
async function init() {
  const savedKey = await window.electronAPI.getLicense();
  if (savedKey) {
    try {
      const res = await fetch(`${API_BASE}/api/license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: savedKey, appSlug: "chargegasm" }),
      });
      if (res.ok) {
        showMainApp();
      } else {
        showLicenseScreen();
      }
    } catch {
      showMainApp(); // offline = trust saved key
    }
  } else {
    showLicenseScreen();
  }

  soundsBasePath = await window.electronAPI.getSoundsPath();
  await loadAllSounds();
}

init();
