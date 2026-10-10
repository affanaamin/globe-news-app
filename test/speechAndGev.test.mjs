import test from 'node:test';
import assert from 'node:assert/strict';
import { isSpeaking, stopBroadcast, broadcastNews } from '../utils/speech.ts';
import { GEV_AVAILABLE_STYLES, GEV_AVAILABLE_LAYERS, GEV_ANNOTATION_TYPES, GEV_ANNOTATION_COLORS } from '../types/gev.ts';

test('speech module: safe defaults when window is undefined', () => {
  assert.equal(isSpeaking(), false);
  assert.doesNotThrow(() => stopBroadcast());
  assert.doesNotThrow(() => broadcastNews(['Test Headline', 'Second Headline']));
});

test('speech module: handles utterance generation and sanitization with mock speechSynthesis', () => {
  const spokenUtterances = [];
  let cancelled = false;

  class MockUtterance {
    constructor(text) {
      this.text = text;
      this.voice = null;
      this.pitch = 1.0;
      this.rate = 1.0;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
    }
  }

  const mockVoices = [
    { name: 'Microsoft Steffan Online (Natural) (en-US)', lang: 'en-US', localService: false },
    { name: 'Google US English', lang: 'en-US', localService: false },
  ];

  globalThis.SpeechSynthesisUtterance = MockUtterance;
  globalThis.window = {
    speechSynthesis: {
      cancel: () => { cancelled = true; },
      getVoices: () => mockVoices,
      speak: (u) => { spokenUtterances.push(u); },
    },
  };

  try {
    let started = false;
    let ended = false;

    broadcastNews(
      ['Breaking News: Visit https://news.example.com/live for details! Check $#@ specials.'],
      1.5,
      () => { started = true; },
      () => { ended = true; }
    );

    assert.ok(cancelled, 'Existing speech was cancelled before starting');
    assert.ok(spokenUtterances.length >= 3, 'Created intro, headline number, and sentence utterances');
    assert.equal(isSpeaking(), true, 'isSpeaking returns true while speech is active');

    // Verify intro
    assert.equal(spokenUtterances[0].text, 'Broadcasting latest intel.');

    // Verify sanitized sentence text does not contain raw URLs or illegal chars
    const sentenceUtterances = spokenUtterances.slice(2);
    const combinedSentenceText = sentenceUtterances.map(u => u.text).join(' ');
    assert.ok(!combinedSentenceText.includes('https://'), 'URLs are stripped or replaced');
    assert.ok(combinedSentenceText.includes('link removed'), 'Replaces URLs with link removed phrase');
    assert.ok(!combinedSentenceText.includes('$#@'), 'Special punctuation chars are stripped');

    // Trigger start and end callbacks
    spokenUtterances[0].onstart();
    assert.equal(started, true);

    spokenUtterances[spokenUtterances.length - 1].onend();
    assert.equal(ended, true);
    assert.equal(isSpeaking(), false, 'isSpeaking returns false once finished');

    // Stop broadcast directly resets state
    stopBroadcast();
    assert.equal(isSpeaking(), false);
  } finally {
    delete globalThis.SpeechSynthesisUtterance;
    delete globalThis.window;
  }
});

test('GEV type definitions export valid catalog schemas', () => {
  assert.ok(GEV_AVAILABLE_STYLES.includes('normal'));
  assert.ok(GEV_AVAILABLE_STYLES.includes('retro'));
  assert.ok(GEV_AVAILABLE_STYLES.includes('surveillance'));
  assert.ok(GEV_AVAILABLE_STYLES.includes('thermal'));

  assert.ok(GEV_ANNOTATION_TYPES.includes('pin'));
  assert.ok(GEV_ANNOTATION_TYPES.includes('highlight'));
  assert.ok(GEV_ANNOTATION_TYPES.includes('label'));

  assert.ok(GEV_ANNOTATION_COLORS.includes('primary'));
  assert.ok(GEV_ANNOTATION_COLORS.includes('amber'));
  assert.ok(GEV_ANNOTATION_COLORS.includes('red'));
  assert.ok(GEV_ANNOTATION_COLORS.includes('cyan'));
  assert.ok(GEV_ANNOTATION_COLORS.includes('green'));

  const layerIds = GEV_AVAILABLE_LAYERS.map(l => l.id);
  assert.ok(layerIds.includes('flights'));
  assert.ok(layerIds.includes('military'));
  assert.ok(layerIds.includes('ais-live-vessels'));
  assert.ok(layerIds.includes('satellites'));
  assert.ok(layerIds.includes('earthquakes'));
});
