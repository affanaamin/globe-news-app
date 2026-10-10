"use client";

let audioCtx: AudioContext | null = null;
let masterMuted = false;
const muteListeners = new Set<(muted: boolean) => void>();

// Telemetry ambient drone hum nodes
let humOsc1: OscillatorNode | null = null;
let humOsc2: OscillatorNode | null = null;
let humGain: GainNode | null = null;
let humActive = false;

// Initialize mute state from localStorage if available
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("osint_master_mute");
    if (saved !== null) {
      masterMuted = saved === "true";
    }
  } catch {}
}

export const isMasterMuted = (): boolean => {
  return masterMuted;
};

export const setMasterMute = (muted: boolean) => {
  masterMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("osint_master_mute", String(muted));
    } catch {}
  }

  // If hum is active and we mute, dampen hum gain; if unmuted, restore hum
  if (humGain && audioCtx) {
    if (masterMuted) {
      humGain.gain.setValueAtTime(0, audioCtx.currentTime);
    } else if (humActive) {
      humGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    }
  }

  muteListeners.forEach((listener) => listener(masterMuted));
};

export const toggleMasterMute = (): boolean => {
  const next = !masterMuted;
  setMasterMute(next);
  return next;
};

export const subscribeMasterMute = (callback: (muted: boolean) => void): (() => void) => {
  muteListeners.add(callback);
  callback(masterMuted);
  return () => {
    muteListeners.delete(callback);
  };
};

// Initialize audio context on user interaction
const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playClickSound = () => {
  if (masterMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

let cachedNoiseBuffer: AudioBuffer | null = null;

const getNoiseBuffer = (ctx: AudioContext) => {
  if (!cachedNoiseBuffer) {
    const bufferSize = ctx.sampleRate * 0.01; // 10ms
    cachedNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = cachedNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }
  }
  return cachedNoiseBuffer;
};

export const playTypewriterSound = () => {
  if (masterMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  noise.start();
};

/**
 * Resonant tactical radar ping (military sonar / radar sweep blip)
 */
export const playRadarPing = () => {
  if (masterMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Fundamental ping
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1760, now); // A6
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.28);

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(2640, now); // Harmonic overtone
  osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.18);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1760, now);
  filter.Q.value = 4.0;

  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(0.12, now + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.36);
  osc2.stop(now + 0.36);
};

/**
 * Tactical tuner / scanner click (micro-chirp bandpass burst)
 */
export const playScannerClick = () => {
  if (masterMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(350, now + 0.035);

  gainNode.gain.setValueAtTime(0.08, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.036);
};

/**
 * High-tech dual-chirp target lock confirmation blip
 */
export const playTargetLockSound = () => {
  if (masterMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Chirp 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1046.5, now); // C6
  gain1.gain.setValueAtTime(0.1, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.065);

  // Chirp 2 (Higher, locked)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1567.98, now + 0.08); // G6
  gain2.gain.setValueAtTime(0.12, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.185);
};

/**
 * Ambient Tactical Telemetry Hum (55Hz drone with 110Hz harmonic)
 */
export const startTelemetryHum = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (humActive) return;
  humActive = true;

  try {
    const now = ctx.currentTime;
    humOsc1 = ctx.createOscillator();
    humOsc2 = ctx.createOscillator();
    humGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    humOsc1.type = "sine";
    humOsc1.frequency.value = 55; // Sub-bass fundamental

    humOsc2.type = "sine";
    humOsc2.frequency.value = 110; // First harmonic

    filter.type = "lowpass";
    filter.frequency.value = 140;

    const targetGain = masterMuted ? 0 : 0.015;
    humGain.gain.setValueAtTime(0.001, now);
    humGain.gain.linearRampToValueAtTime(targetGain, now + 1.0);

    humOsc1.connect(filter);
    humOsc2.connect(filter);
    filter.connect(humGain);
    humGain.connect(ctx.destination);

    humOsc1.start();
    humOsc2.start();
  } catch (err) {
    console.warn("Could not start telemetry hum:", err);
  }
};

export const stopTelemetryHum = () => {
  humActive = false;
  const currentOsc1 = humOsc1;
  const currentOsc2 = humOsc2;
  const currentGain = humGain;

  if (currentGain && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      currentGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      setTimeout(() => {
        try {
          currentOsc1?.stop();
          currentOsc2?.stop();
          currentOsc1?.disconnect();
          currentOsc2?.disconnect();
          currentGain?.disconnect();
        } catch {}
        if (humOsc1 === currentOsc1) humOsc1 = null;
        if (humOsc2 === currentOsc2) humOsc2 = null;
        if (humGain === currentGain) humGain = null;
      }, 500);
    } catch {
      if (humOsc1 === currentOsc1) humOsc1 = null;
      if (humOsc2 === currentOsc2) humOsc2 = null;
      if (humGain === currentGain) humGain = null;
    }
  } else {
    if (humOsc1 === currentOsc1) humOsc1 = null;
    if (humOsc2 === currentOsc2) humOsc2 = null;
    if (humGain === currentGain) humGain = null;
  }
};

export const toggleTelemetryHum = (): boolean => {
  if (humActive) {
    stopTelemetryHum();
    return false;
  } else {
    startTelemetryHum();
    return true;
  }
};

export const isTelemetryHumActive = (): boolean => {
  return humActive;
};
