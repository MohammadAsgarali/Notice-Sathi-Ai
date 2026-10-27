import React, { useState, useEffect } from 'react';
import { 
  Settings, SunMoon, Type, Globe, Volume2, 
  Terminal, ShieldCheck, AlertCircle, CheckCircle2, Cpu 
} from 'lucide-react';
import { useAccessibility } from '../hooks/useAccessibility';
import { fetchHealth, fetchOCRHealth, fetchAIHealth } from '../services/api';

const SettingsPage = () => {
  const { 
    highContrast, 
    toggleHighContrast, 
    fontScale, 
    setFontScale, 
    appLanguage, 
    setAppLanguage,
    speechRate,
    setSpeechRate,
    speak
  } = useAccessibility();

  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const checkSystem = async () => {
      try {
        setLoadingHealth(true);
        const data = await fetchHealth();
        setHealthData(data);
      } catch (err) {
        console.warn('System diagnostic fetch error:', err);
      } finally {
        setLoadingHealth(false);
      }
    };
    checkSystem();
  }, []);

  const testSpeech = () => {
    const sample = appLanguage === 'hi'
      ? 'नमस्ते! यह नोटिस साथी का वाक् परीक्षण है। सुगम्यता हमारी प्राथमिकता है।'
      : 'Hello! This is a speech test from NoticeSaathi AI. Accessibility is our priority.';
    speak(sample, appLanguage === 'hi' ? 'hi-IN' : 'en-US');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-600" />
          <span>Accessibility & System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize reading preferences, speech narration, and inspect AI runtime diagnostics.
        </p>
      </div>

      {/* Accessibility Preferences Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <span>User Accessibility Preferences</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* High Contrast Mode */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <SunMoon className="w-4 h-4 text-teal-600" />
                <span>High-Contrast Mode</span>
              </span>
              <button
                type="button"
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-teal-500 ${
                  highContrast ? 'bg-teal-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={highContrast}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enhances text borders and switches to high contrast palette conforming to WCAG 2.2 AA standards.
            </p>
          </div>

          {/* Text Size Scaling */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-teal-600" />
              <span>Base Font Size</span>
            </span>
            <div className="flex gap-2 pt-1">
              {[
                { key: 'normal', label: 'Normal (100%)' },
                { key: 'large', label: 'Large (115%)' },
                { key: 'xlarge', label: 'Extra Large (130%)' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setFontScale(item.key)}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition ${
                    fontScale === item.key 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Scales the typography across the entire interface without breaking layouts.
            </p>
          </div>

          {/* Default Output Language */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-600" />
              <span>Preferred Output Language</span>
            </span>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAppLanguage('en')}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition ${
                  appLanguage === 'en'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setAppLanguage('hi')}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition ${
                  appLanguage === 'hi'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Initial language for plain-language summaries and checklist interpretations.
            </p>
          </div>

          {/* Speech Read-Aloud Speed */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-teal-600" />
                <span>Text-to-Speech Speed</span>
              </span>
              <button
                type="button"
                onClick={testSpeech}
                className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition"
              >
                Test Voice
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              {[0.75, 1.0, 1.25, 1.5].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                    speechRate === rate
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Web Speech API synthesizer playback speed.
            </p>
          </div>

        </div>
      </div>

      {/* System Diagnostics & Gemma 4 Provenance Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-teal-600" />
          <span>System Diagnostics & AI Provenance</span>
        </h2>

        {loadingHealth ? (
          <p className="text-xs text-slate-400">Querying backend health status...</p>
        ) : healthData ? (
          <div className="space-y-4">
            
            {/* AI Runtime */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-teal-600" />
                  <span>Google Gemma 4 AI Runtime</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  healthData.ai.is_mock_mode 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {healthData.ai.active_provider}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Model:</strong> {healthData.ai.model_name}
              </p>
              <p className="text-xs text-slate-500">
                {healthData.ai.message}
              </p>
            </div>

            {/* OCR Engine */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Tesseract OCR Engine</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  healthData.ocr.available
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {healthData.ocr.available ? 'Active' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Supported OCR Languages:</strong> {healthData.ocr.supported_languages.join(', ')}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {healthData.ocr.message}
              </p>
            </div>

          </div>
        ) : (
          <p className="text-xs text-rose-500">Unable to reach backend diagnostic endpoint at /api/health.</p>
        )}
      </div>

    </div>
  );
};

export default SettingsPage;
