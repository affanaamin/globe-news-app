"use client";

let activeUtterances: SpeechSynthesisUtterance[] = [];
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export const isSpeaking = () => activeUtterances.length > 0;

export const stopBroadcast = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    activeUtterances = [];
  }
};

export const broadcastNews = (
  headlines: string[], 
  speed: number = 1.0, 
  onStart?: () => void, 
  onEnd?: () => void
) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  
  window.speechSynthesis.cancel(); // Stop any ongoing speech
  activeUtterances = [];

  let voices = cachedVoices;
  if (voices.length === 0) {
    voices = window.speechSynthesis.getVoices();
    cachedVoices = voices;
  }
  
  // Strict prioritization for the most human-sounding neural/cloud voices
  const selectedVoice = 
    voices.find(v => v.name.includes("Online (Natural)") && v.lang.startsWith("en")) || // Edge Azure Neural (Best)
    voices.find(v => v.name.includes("Google US English")) || // Chrome Cloud (Good)
    voices.find(v => v.name.includes("Google UK English")) ||
    voices.find(v => v.name.includes("Premium") || v.name.includes("Enhanced")) || // Mac High-Quality
    voices.find(v => v.name.includes("Aria")) ||
    voices.find(v => v.name.includes("Jenny")) ||
    voices.find(v => v.name.includes("Samantha")) || 
    voices.find(v => v.lang === "en-US" && !v.localService) || // Any other cloud voice
    voices[0];

  const utterances: SpeechSynthesisUtterance[] = [];

  const intro = new SpeechSynthesisUtterance("Broadcasting latest intel.");
  intro.voice = selectedVoice;
  intro.pitch = 1.05; // Slightly higher pitch for intro
  intro.rate = speed * 0.95; 
  utterances.push(intro);

  headlines.forEach((text, i) => {
    // Clean up text for better reading (remove URLs, weird chars)
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, 'link removed')
                        .replace(/[^\p{L}\p{N}\s.,?!-]/gu, '');

    // Add a pause before reading the headline number
    const numUtterance = new SpeechSynthesisUtterance(`Headline ${i + 1}.`);
    numUtterance.voice = selectedVoice;
    numUtterance.pitch = 0.95; // Slightly authoritative
    numUtterance.rate = speed * 0.9;
    utterances.push(numUtterance);

    // Split text into sentences for more natural breathing pauses
    const sentences = cleanText.replace(/([.!?])\s+/g, '$1|||').split('|||');
    
    sentences.forEach((sentence, sIdx) => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      utterance.voice = selectedVoice;
      // Alternate pitch very slightly to simulate natural human inflection
      utterance.pitch = sIdx % 2 === 0 ? 1.0 : 1.02;
      utterance.rate = speed * 0.95;
      utterances.push(utterance);
    });
  });

  // Track start and end state
  if (utterances.length > 0) {
    utterances[0].onstart = () => { if (onStart) onStart(); };
    utterances[utterances.length - 1].onend = () => { 
      activeUtterances = [];
      if (onEnd) onEnd(); 
    };
    
    // Fallback if it gets interrupted/cancelled
    utterances.forEach(u => {
      u.onerror = () => { 
        activeUtterances = [];
        if (onEnd) onEnd(); 
      };
    });
  }

  activeUtterances = utterances;
  utterances.forEach(u => window.speechSynthesis.speak(u));
};
