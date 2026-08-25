"use client";

export const stopBroadcast = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
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

  const voices = window.speechSynthesis.getVoices();
  
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
    let cleanText = text.replace(/https?:\/\/[^\s]+/g, 'link removed')
                        .replace(/[^\w\s.,?!-]/g, '');

    // Add a pause before reading the headline number
    const numUtterance = new SpeechSynthesisUtterance(`Headline ${i + 1}.`);
    numUtterance.voice = selectedVoice;
    numUtterance.pitch = 0.95; // Slightly authoritative
    numUtterance.rate = speed * 0.9;
    utterances.push(numUtterance);

    // Split text into sentences for more natural breathing pauses
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    
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
    utterances[utterances.length - 1].onend = () => { if (onEnd) onEnd(); };
    
    // Fallback if it gets interrupted/cancelled
    utterances.forEach(u => {
      u.onerror = () => { if (onEnd) onEnd(); };
    });
  }

  utterances.forEach(u => window.speechSynthesis.speak(u));
};
