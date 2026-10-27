import React from 'react';
import { Heart, ShieldCheck, Terminal, BookOpen, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          <div>
            <h3 className="text-white text-base font-bold mb-2 flex items-center gap-2">
              <span className="text-teal-400">NoticeSaathi</span> AI
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Notice-to-Action Accessibility Assistant built for Hacktoberfest Hackday 2026 (Track 1: Best Use of Gemma 4 · PS 02 Accessibility).
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-teal-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>WCAG 2.2 AA Accessibility Standards</span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Quick Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/api/health" target="_blank" rel="noreferrer" className="hover:text-teal-400 transition flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> Backend Health & Diagnostics
                </a>
              </li>
              <li>
                <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="hover:text-teal-400 transition flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> FastAPI Swagger Documentation
                </a>
              </li>
              <li>
                <span className="text-xs text-slate-500">Multilingual: English & Hindi Output</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-2">Legal & Accuracy Disclaimer</h4>
            <p className="text-xs text-slate-400 leading-normal">
              NoticeSaathi AI uses Google Gemma 4 to extract and explain information. Output is provided for accessibility and personal comprehension. 
              Always verify critical requirements, deadlines, and submission instructions directly with the issuing college or authority.
            </p>
          </div>

        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 NoticeSaathi AI Team · Open Source Accessibility Project</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-teal-400 fill-teal-400" /> for inclusive education
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
