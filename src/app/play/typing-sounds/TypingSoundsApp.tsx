"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { soundPacks, synthPresets, type SynthParams } from "@/data/sound-packs";

const FREE_SECONDS = 180; // 3 minutes
const STORAGE_KEY_TIME = "typing-sounds-time";
const STORAGE_KEY_LICENSE = "typing-sounds-license";

const SPECIAL_KEYS = new Set(["Enter", " ", "Backspace"]);

function playSound(
  ctx: AudioContext,
  params: SynthParams,
  volume: number
) {
  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = params.filterType || "lowpass";
  filter.frequency.value = params.filterFreq || 2000;
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(
    params.gain * volume,
    now + params.attack
  );
  gainNode.gain.linearRampToValueAtTime(
    0,
    now + params.attack + params.decay
  );

  const freq =
    params.frequency +
    (Math.random() - 0.5) * params.frequencyRange;

  if (params.type === "noise") {
    const bufferSize = ctx.sampleRate * params.duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.connect(filter);
    noise.start(now);
    noise.stop(now + params.duration);
  } else {
    const osc = ctx.createOscillator();
    osc.type = params.type;
    osc.frequency.setValueAtTime(freq, now);
    if (params.pitchSlide) {
      osc.frequency.linearRampToValueAtTime(
        freq + params.pitchSlide,
        now + params.duration
      );
    }
    osc.connect(filter);
    osc.start(now);
    osc.stop(now + params.duration);
  }
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const packEmojis: Record<string, string[]> = {
  fart: ["💨", "🌬️", "💩", "😤"],
  cat: ["🐱", "🐾", "😺", "😸"],
  gun: ["💥", "🔥", "💣", "⚡"],
  typewriter: ["📝", "✒️", "📄", "🔔"],
  moan: ["😩", "🫦", "💋", "🔥"],
};

let particleId = 0;

export default function TypingSoundsApp() {
  const [selectedPack, setSelectedPack] = useState<string>("fart");
  const [typedText, setTypedText] = useState("");
  const [volume, setVolume] = useState(0.7);
  const [secondsLeft, setSecondsLeft] = useState(FREE_SECONDS);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [keyCount, setKeyCount] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lastPlayedRef = useRef<number>(-1);

  useEffect(() => {
    const savedTime = localStorage.getItem(STORAGE_KEY_TIME);
    const savedLicense = localStorage.getItem(STORAGE_KEY_LICENSE);

    if (savedLicense) {
      setIsUnlocked(true);
    } else if (savedTime) {
      const used = parseInt(savedTime, 10);
      setSecondsLeft(Math.max(0, FREE_SECONDS - used));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive && !isUnlocked && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const newVal = prev - 1;
          const used = FREE_SECONDS - newVal;
          localStorage.setItem(STORAGE_KEY_TIME, used.toString());
          if (newVal <= 0) {
            setShowPaywall(true);
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return newVal;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isUnlocked, secondsLeft]);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Preload all audio files for the selected pack
  useEffect(() => {
    const pack = soundPacks.find((p) => p.id === selectedPack);
    audioBuffersRef.current = [];
    lastPlayedRef.current = -1;

    if (!pack?.audioFiles || pack.audioFiles.length === 0) return;

    const ctx = getAudioContext();

    Promise.all(
      pack.audioFiles.map((file) =>
        fetch(file)
          .then((res) => res.arrayBuffer())
          .then((buf) => ctx.decodeAudioData(buf))
          .catch(() => null)
      )
    ).then((buffers) => {
      audioBuffersRef.current = buffers.filter(
        (b): b is AudioBuffer => b !== null
      );
    });
  }, [selectedPack, getAudioContext]);

  // Stop the currently playing sound immediately
  const stopActiveSound = useCallback(() => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {
        /* already stopped */
      }
      activeSourceRef.current = null;
    }
  }, []);

  // Play a random audio file from the pack — stops previous one first
  const playRandomClip = useCallback(
    (vol: number) => {
      const ctx = getAudioContext();
      const buffers = audioBuffersRef.current;
      if (!ctx || buffers.length === 0) return;

      // Stop whatever is currently playing
      stopActiveSound();

      // Pick a random buffer, avoid repeating the same one
      let idx = Math.floor(Math.random() * buffers.length);
      if (buffers.length > 1 && idx === lastPlayedRef.current) {
        idx = (idx + 1) % buffers.length;
      }
      lastPlayedRef.current = idx;

      const source = ctx.createBufferSource();
      source.buffer = buffers[idx];

      const gainNode = ctx.createGain();
      gainNode.gain.value = vol;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();

      activeSourceRef.current = source;

      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
        }
      };
    },
    [getAudioContext, stopActiveSound]
  );

  const spawnParticle = useCallback((packId: string) => {
    const emojis = packEmojis[packId] || ["✨"];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const id = particleId++;
    const x = 20 + Math.random() * 60; // 20-80% horizontal
    const y = 30 + Math.random() * 40; // 30-70% vertical

    setParticles((prev) => [...prev.slice(-8), { id, x, y, emoji }]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1000);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isUnlocked && secondsLeft <= 0) {
        e.preventDefault();
        setShowPaywall(true);
        return;
      }

      if (!isActive) setIsActive(true);

      const ctx = getAudioContext();
      const isSpecial = SPECIAL_KEYS.has(e.key);

      // Use real audio files if loaded, otherwise fall back to synth
      if (audioBuffersRef.current.length > 0) {
        playRandomClip(volume);
      } else {
        const preset = synthPresets[selectedPack];
        const params = isSpecial ? preset.special : preset.normal;
        playSound(ctx, params, volume);
      }
      spawnParticle(selectedPack);
      setKeyCount((prev) => prev + 1);

      // Flash effect
      setFlash(true);
      setTimeout(() => setFlash(false), 50);
    },
    [selectedPack, volume, isActive, isUnlocked, secondsLeft, getAudioContext, spawnParticle]
  );

  const validateLicense = useCallback(async () => {
    if (!licenseInput.trim()) return;
    setLicenseError("");

    try {
      const res = await fetch("/api/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: licenseInput.trim(),
          appSlug: "typing-sounds",
        }),
      });

      if (res.ok) {
        localStorage.setItem(STORAGE_KEY_LICENSE, licenseInput.trim());
        setIsUnlocked(true);
        setShowPaywall(false);
        setShowLicenseForm(false);
      } else {
        setLicenseError("Invalid license key.");
      }
    } catch {
      setLicenseError("Something went wrong.");
    }
  }, [licenseInput]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const currentPack = soundPacks.find((p) => p.id === selectedPack)!;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none text-3xl z-40 animate-[float_1s_ease-out_forwards]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 0,
            animation: "particle-rise 1s ease-out forwards",
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Flash overlay */}
      {flash && (
        <div
          className="fixed inset-0 pointer-events-none z-30"
          style={{ backgroundColor: currentPack.color + "15" }}
        />
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <Link
          href="/apps/typing-sounds"
          className="text-sm text-foreground/50 hover:text-foreground transition-colors mb-4 inline-block"
        >
          &larr; Back to app details
        </Link>
        <div className="text-6xl mb-4 animate-float">⌨️</div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
          Typing Sound{" "}
          <span className="gradient-text">Customizer</span>
        </h1>
        <p className="text-foreground/50">
          Pick a sound pack. Start typing. Annoy everyone.
        </p>
      </div>

      {/* Sound Pack Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {soundPacks.map((pack) => (
          <button
            key={pack.id}
            onClick={() => {
              setSelectedPack(pack.id);
              // Resume audio context on user interaction
              getAudioContext();
            }}
            className={`px-3 py-4 rounded-xl font-medium text-sm transition-all ${
              selectedPack === pack.id
                ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                : "bg-card border border-white/10 text-foreground/70 hover:border-primary/30 hover:bg-card-hover"
            }`}
          >
            <span className="text-2xl block mb-1">{pack.emoji}</span>
            {pack.name}
          </button>
        ))}
      </div>

      {/* Pack description */}
      <p className="text-center text-sm text-foreground/40 mb-6">
        {currentPack.emoji} {currentPack.description}
      </p>

      {/* Controls row */}
      <div className="flex items-center justify-between mb-4">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/50">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>

        {/* Timer / Status */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground/40">
            Keys: {keyCount}
          </span>
          {!isUnlocked ? (
            <span
              className={`text-sm font-mono ${
                secondsLeft <= 30
                  ? "text-red-400"
                  : "text-foreground/50"
              }`}
            >
              {formatTime(secondsLeft)}
            </span>
          ) : (
            <span className="text-sm text-green-400">Unlimited</span>
          )}
        </div>
      </div>

      {/* Typing Area */}
      <div className="relative mb-6">
        <textarea
          ref={textAreaRef}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Start typing to hear ${currentPack.name.toLowerCase()} sounds...`}
          className="w-full h-64 bg-card border-2 border-white/10 rounded-2xl p-6 text-lg text-foreground/90 placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 resize-none transition-colors"
          style={{
            borderColor: flash ? currentPack.color : undefined,
          }}
          autoFocus
        />
        {typedText.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-20">{currentPack.emoji}</div>
              <p className="text-foreground/20 text-sm">
                Click here and start typing!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => {
            setTypedText("");
            setKeyCount(0);
          }}
          className="px-4 py-2 bg-card border border-white/10 rounded-lg text-sm text-foreground/50 hover:text-foreground hover:border-white/20 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={() => {
            const text = `${typedText}\n\n— Typed with ${currentPack.name} on StupidApps.io`;
            navigator.clipboard.writeText(text);
          }}
          className="px-4 py-2 bg-card border border-white/10 rounded-lg text-sm text-foreground/50 hover:text-foreground hover:border-white/20 transition-colors"
        >
          Copy Text
        </button>
      </div>

      {/* Paywall */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⏰</div>
            <h2 className="text-2xl font-extrabold mb-2">
              Your 3 Free Minutes Are Up!
            </h2>
            <p className="text-foreground/60 mb-6">
              Unlock unlimited typing with all sound packs.
              One-time purchase. Type forever. Annoy everyone.
            </p>
            <div className="text-3xl font-extrabold gradient-text mb-6">
              $4.99
            </div>
            <form action="/api/checkout" method="POST" className="mb-4">
              <input type="hidden" name="appSlug" value="typing-sounds" />
              <button
                type="submit"
                className="w-full bg-accent hover:bg-accent-light text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                Unlock Unlimited Typing
              </button>
            </form>

            <button
              onClick={() => setShowLicenseForm(!showLicenseForm)}
              className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Already purchased? Enter license key
            </button>

            {showLicenseForm && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  placeholder="Enter your license key"
                  className="flex-1 bg-card border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={validateLicense}
                  className="bg-primary hover:bg-primary-light text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Activate
                </button>
              </div>
            )}
            {licenseError && (
              <p className="text-red-400 text-sm mt-2">{licenseError}</p>
            )}

            <button
              onClick={() => setShowPaywall(false)}
              className="block mx-auto mt-4 text-sm text-foreground/30 hover:text-foreground/50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
