"use client";

let audioCtx: AudioContext | null = null;

// Initialize audio context only on user interaction to comply with browser autoplay policies
const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playClickSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "sine";
  // A high-pitched targeting blip
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
  const ctx = getAudioContext();
  if (!ctx) return;

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.02, ctx.currentTime); // Very quiet
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  noise.start();
};
