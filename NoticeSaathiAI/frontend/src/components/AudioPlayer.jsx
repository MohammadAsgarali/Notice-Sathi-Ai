import React from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react';
import { useAccessibility } from '../hooks/useAccessibility';

const AudioPlayer = ({ text, language = 'en', label = 'Read Aloud' }) => {
  const {
    isSpeaking,
    isPaused,
    speak,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    speechRate,
    setSpeechRate,
  } = useAccessibility();

  const handleTogglePlay = () => {
    if (isSpeaking && !isPaused) {
      pauseSpeaking();
    } else if (isPaused) {
      resumeSpeaking();
    } else {
      speak(text, language === 'hi' ? 'hi-IN' : 'en-US');
    }
  };

  const handleStop = () => {
    stopSpeaking();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-teal-900"
      role="region"
      aria-label="Audio read-aloud controls"
    >
      <div className="flex items-center gap-1.5 font-medium text-sm">
        <Volume2 className="w-4 h-4 text-teal-700" aria-hidden="true" />
        <span>{label}:</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleTogglePlay}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded transition shadow-sm focus:ring-2 focus:ring-teal-500"
          aria-label={isSpeaking && !isPaused ? 'Pause narration' : 'Play narration'}
        >
          {isSpeaking && !isPaused ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> {isPaused ? 'Resume' : 'Play'}
            </>
          )}
        </button>

        {isSpeaking && (
          <button
            onClick={handleStop}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded transition"
            aria-label="Stop narration"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Stop
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto text-xs text-slate-600">
        <label htmlFor="speed-select" className="sr-only">Playback speed</label>
        <span className="hidden sm:inline">Speed:</span>
        <select
          id="speed-select"
          value={speechRate}
          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
          className="text-xs bg-white border border-teal-200 rounded px-1.5 py-0.5 text-slate-700"
        >
          <option value="0.75">0.75x</option>
          <option value="1.0">1.0x (Normal)</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
        </select>
      </div>
    </div>
  );
};

export default AudioPlayer;
