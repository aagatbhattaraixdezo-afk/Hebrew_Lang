'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SpeakButtonProps {
  text: string;
  lang?: string;
  size?: number | string;
  autoPlay?: boolean;
  [key: string]: any;
}

export default function SpeakButton({ text, lang = 'he-IL', size = 16, autoPlay = false, ...rest }: SpeakButtonProps) {
  let iconSize: number | string = 16;
  if (size === 'lg') iconSize = 24;
  else if (size === 'sm') iconSize = 14;
  else if (size !== undefined) iconSize = size;
  const [hasVoice, setHasVoice] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkVoice = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const hebrewVoice = voices.find((v) => v.lang.startsWith('he'));
      setHasVoice(voices.length === 0 || !!hebrewVoice);
    };
    checkVoice();
    window.speechSynthesis?.addEventListener('voiceschanged', checkVoice);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', checkVoice);
  }, []);

  useEffect(() => {
    if (autoPlay && text) {
      speak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text]);

  const speak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voices = window.speechSynthesis.getVoices();
    const hebrewVoice = voices.find((v) => v.lang.startsWith('he'));
    if (hebrewVoice) utterance.voice = hebrewVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={speak}
      className={`speak-btn ${!hasVoice ? 'muted' : ''} ${speaking ? 'ring-2 ring-primary/30' : ''}`}
      title={hasVoice ? `Listen: ${text}` : 'Hebrew voice not installed on this device'}
      aria-label={`Pronounce: ${text}`}
    >
      {hasVoice ? <Volume2 size={iconSize} /> : <VolumeX size={iconSize} />}
    </button>
  );
}
