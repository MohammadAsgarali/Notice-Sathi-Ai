import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  // High Contrast
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('ns_high_contrast') === 'true';
  });

  // Font Scale
  const [fontScale, setFontScale] = useState(() => {
    return localStorage.getItem('ns_font_scale') || 'normal';
  });

  // Language preference: en or hi
  const [appLanguage, setAppLanguage] = useState(() => {
    return localStorage.getItem('ns_language') || 'en';
  });

  // Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  // Apply high contrast class
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('ns_high_contrast', highContrast.toString());
  }, [highContrast]);

  // Apply font scale
  useEffect(() => {
    const scaleMap = {
      normal: '1rem',
      large: '1.15rem',
      xlarge: '1.3rem',
    };
    document.documentElement.style.setProperty('--font-scale', scaleMap[fontScale] || '1rem');
    localStorage.setItem('ns_font_scale', fontScale);
  }, [fontScale]);

  // Persist language
  useEffect(() => {
    localStorage.setItem('ns_language', appLanguage);
  }, [appLanguage]);

  // Speech Synthesis controls
  const speak = (text, lang = 'en-US') => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (lang.startsWith('hi')) {
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const engVoice = voices.find(v => v.lang.includes('en'));
      if (engVoice) utterance.voice = engVoice;
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const pauseSpeaking = () => {
    if ('speechSynthesis' in window && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if ('speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        toggleHighContrast: () => setHighContrast(prev => !prev),
        fontScale,
        setFontScale,
        appLanguage,
        setAppLanguage,
        isSpeaking,
        isPaused,
        speechRate,
        setSpeechRate,
        speak,
        stopSpeaking,
        pauseSpeaking,
        resumeSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
