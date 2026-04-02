export interface SoundPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  audioFiles?: string[]; // paths to real audio files in public/sounds/
}

export const soundPacks: SoundPack[] = [
  {
    id: "fart",
    name: "Fart Mode",
    emoji: "💨",
    description: "Every key is a different fart. Spacebar is devastating.",
    color: "#8B4513",
    audioFiles: ["/sounds/fart.wav"],
  },
  {
    id: "cat",
    name: "Cat Meow",
    emoji: "🐱",
    description: "Meows, purrs, and the occasional angry hiss.",
    color: "#FF6B6B",
    audioFiles: ["/sounds/cat.ogg"],
  },
  {
    id: "gun",
    name: "Gun Shots",
    emoji: "🔫",
    description: "Pew pew pew. Enter key is an explosion.",
    color: "#4A4A4A",
  },
  {
    id: "typewriter",
    name: "Typewriter",
    emoji: "⌨️",
    description: "Classic mechanical typewriter. Ding on Enter.",
    color: "#D4A574",
  },
  {
    id: "moan",
    name: "Moaning",
    emoji: "😩",
    description: "A different moan on every keypress. You've been warned.",
    color: "#E91E63",
    audioFiles: Array.from({ length: 25 }, (_, i) => `/sounds/moan/moan-${i + 1}.wav`),
  },
];

// Sound synthesis parameters for each pack
// These create sounds using Web Audio API oscillators and noise
export type SynthParams = {
  type: OscillatorType | "noise";
  frequency: number;
  frequencyRange: number; // random variation range
  duration: number;
  attack: number;
  decay: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  pitchSlide?: number; // slide pitch down/up over duration
  gain: number;
};

export const synthPresets: Record<
  string,
  { normal: SynthParams; special: SynthParams }
> = {
  fart: {
    normal: {
      type: "sawtooth",
      frequency: 80,
      frequencyRange: 40,
      duration: 0.15,
      attack: 0.01,
      decay: 0.14,
      filterFreq: 300,
      filterType: "lowpass",
      pitchSlide: -30,
      gain: 0.4,
    },
    special: {
      type: "sawtooth",
      frequency: 60,
      frequencyRange: 30,
      duration: 0.5,
      attack: 0.01,
      decay: 0.49,
      filterFreq: 250,
      filterType: "lowpass",
      pitchSlide: -40,
      gain: 0.5,
    },
  },
  cat: {
    normal: {
      type: "sine",
      frequency: 700,
      frequencyRange: 300,
      duration: 0.2,
      attack: 0.02,
      decay: 0.18,
      filterFreq: 2000,
      filterType: "bandpass",
      pitchSlide: 200,
      gain: 0.3,
    },
    special: {
      type: "sawtooth",
      frequency: 400,
      frequencyRange: 200,
      duration: 0.5,
      attack: 0.01,
      decay: 0.49,
      filterFreq: 1500,
      filterType: "bandpass",
      pitchSlide: -300,
      gain: 0.35,
    },
  },
  gun: {
    normal: {
      type: "noise",
      frequency: 0,
      frequencyRange: 0,
      duration: 0.08,
      attack: 0.001,
      decay: 0.079,
      filterFreq: 3000,
      filterType: "highpass",
      gain: 0.5,
    },
    special: {
      type: "noise",
      frequency: 0,
      frequencyRange: 0,
      duration: 0.6,
      attack: 0.001,
      decay: 0.599,
      filterFreq: 800,
      filterType: "lowpass",
      gain: 0.6,
    },
  },
  typewriter: {
    normal: {
      type: "noise",
      frequency: 0,
      frequencyRange: 0,
      duration: 0.04,
      attack: 0.001,
      decay: 0.039,
      filterFreq: 4000,
      filterType: "bandpass",
      gain: 0.3,
    },
    special: {
      type: "sine",
      frequency: 2000,
      frequencyRange: 0,
      duration: 0.3,
      attack: 0.001,
      decay: 0.299,
      filterFreq: 5000,
      filterType: "lowpass",
      gain: 0.25,
    },
  },
  moan: {
    normal: {
      type: "sine",
      frequency: 300,
      frequencyRange: 150,
      duration: 0.3,
      attack: 0.05,
      decay: 0.25,
      filterFreq: 1200,
      filterType: "bandpass",
      pitchSlide: 100,
      gain: 0.35,
    },
    special: {
      type: "sine",
      frequency: 250,
      frequencyRange: 100,
      duration: 0.8,
      attack: 0.1,
      decay: 0.7,
      filterFreq: 1000,
      filterType: "bandpass",
      pitchSlide: 300,
      gain: 0.45,
    },
  },
};
