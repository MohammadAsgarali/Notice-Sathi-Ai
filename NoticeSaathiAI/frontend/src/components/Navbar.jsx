import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, LayoutDashboard, UploadCloud, HelpCircle, 
  History, Settings, SunMoon, Type, Menu, X, Globe, Sparkles
} from 'lucide-react';
import { useAccessibility } from '../hooks/useAccessibility';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { 
    highContrast, 
    toggleHighContrast, 
    fontScale, 
    setFontScale, 
    appLanguage, 
    setAppLanguage 
  } = useAccessibility();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Notice', path: '/upload', icon: UploadCloud },
    { name: 'Ask NoticeSaathi', path: '/ask', icon: HelpCircle },
    { name: 'Notice History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const cycleFontSize = () => {
    if (fontScale === 'normal') setFontScale('large');
    else if (fontScale === 'large') setFontScale('xlarge');
    else setFontScale('normal');
  };

  const toggleLanguage = () => {
    setAppLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <>
      {/* Skip to Main Content Link for Screen Readers and Keyboard Nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Branding */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="p-2 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-lg text-slate-950 font-black shadow-md group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    NoticeSaathi <span className="text-teal-400">AI</span>
                  </span>
                  <span className="hidden sm:block text-[10px] text-teal-300 tracking-wide font-medium">
                    Gemma 4 · Accessibility Assistant
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Accessibility Controls Toolbar */}
            <div className="flex items-center gap-2">
              
              {/* Text Size Switcher */}
              <button
                onClick={cycleFontSize}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
                title={`Text size: ${fontScale.toUpperCase()}. Click to change.`}
                aria-label={`Cycle text size, currently ${fontScale}`}
              >
                <Type className="w-3.5 h-3.5" />
                <span className="uppercase text-[11px]">{fontScale === 'normal' ? 'A' : fontScale === 'large' ? 'A+' : 'A++'}</span>
              </button>

              {/* High Contrast Mode Toggle */}
              <button
                onClick={toggleHighContrast}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 border transition ${
                  highContrast
                    ? 'bg-yellow-400 text-black border-yellow-300 shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Toggle High Contrast Mode (WCAG 2.2 AA)"
                aria-pressed={highContrast}
                aria-label="Toggle high contrast mode"
              >
                <SunMoon className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">{highContrast ? 'Contrast ON' : 'Contrast'}</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 rounded-md bg-teal-900/60 hover:bg-teal-800 text-teal-300 text-xs font-bold flex items-center gap-1 border border-teal-700 transition"
                title="Switch Language (English / हिंदी)"
                aria-label={`Switch language from ${appLanguage === 'en' ? 'English to Hindi' : 'Hindi to English'}`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{appLanguage === 'en' ? 'HI' : 'EN'}</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-base font-medium transition ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
