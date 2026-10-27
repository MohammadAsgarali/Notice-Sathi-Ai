import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, ShieldCheck, Sparkles, Volume2, Globe2, 
  CheckSquare2, HelpCircle, ArrowRight, UploadCloud, Layers
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Hacktoberfest Hackday 2026 · Track 1: Best Use of Gemma 4 · PS 02
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            From Complex Notices to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
              Clear, Accessible Action
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 font-normal leading-relaxed">
            NoticeSaathi AI transforms lengthy, image-based, or multilingual college notices and scholarship announcements into evidence-backed, simplified checklists so no student misses a deadline.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/upload"
              className="flex items-center gap-2 px-6 py-3.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-base shadow-lg shadow-teal-500/25 transition transform hover:-translate-y-0.5 focus:ring-4 focus:ring-teal-500/40"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Start Now — Analyze Notice</span>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base border border-slate-700 transition"
            >
              <span>View Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Accessibility pill indicators */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-teal-400" /> English & Hindi Output
            </span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-teal-400" /> Screen-Reader & Read-Aloud
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Verbatim Source Evidence
            </span>
          </div>
        </div>
      </section>

      {/* Problem Background & How It Works */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            The Accessibility Problem We Solve
          </h2>
          <p className="mt-3 text-slate-600 leading-relaxed text-sm sm:text-base">
            College circulars, admission guides, and government announcements are frequently published as dense scanned PDFs or complex image posters. First-generation students, applicants with disabilities, or non-native English readers often miss eligibility criteria or deadlines.
          </p>
        </div>

        {/* 4-Step Process Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Multi-Modal Upload</h3>
            <p className="text-xs text-slate-600">
              Upload PDF documents, photos/screenshots via OCR, paste notice text, or import public notice URLs securely.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Gemma 4 Interpretation</h3>
            <p className="text-xs text-slate-600">
              Google Gemma 4 extracts purpose, eligibility, deadlines, required documents, fees, and contact links with strict grounding.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Evidence Verification</h3>
            <p className="text-xs text-slate-600">
              Every single claim is matched against the original source text to prevent AI hallucinations, tagging exact page numbers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-4">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Actionable Checklist</h3>
            <p className="text-xs text-slate-600">
              Converts complex circulars into an ordered task list with completion tracking, speech narration, and downloadable reports.
            </p>
          </div>
        </div>

        {/* Core Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="p-2.5 w-fit rounded-lg bg-teal-50 text-teal-600 mb-4">
              <CheckSquare2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Persistent Action Checklist</h3>
            <p className="text-sm text-slate-600">
              Step-by-step verified tasks that separate official mandatory requirements from recommended next steps. Tasks save automatically to the database.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="p-2.5 w-fit rounded-lg bg-teal-50 text-teal-600 mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Grounded Follow-Up Q&A</h3>
            <p className="text-sm text-slate-600">
              Ask questions directly about the notice. When a requirement is not mentioned, NoticeSaathi transparently reports that it is absent rather than guessing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="p-2.5 w-fit rounded-lg bg-teal-50 text-teal-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Transparent Disclosures</h3>
            <p className="text-sm text-slate-600">
              Full provenance disclosure on AI models, OCR confidence levels, and unverified quotations. Never pretends a mock response is real Gemma 4 inference.
            </p>
          </div>
        </div>

      </section>

      {/* Preloaded Demo Callout */}
      <section className="bg-teal-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Ready for the Hackathon Evaluation?</h2>
            <p className="text-teal-200 text-sm mt-1">
              One-click synthetic test notices (Scholarship, Exam circular, Public Health PSA) are preloaded and ready to test instantly.
            </p>
          </div>
          <Link
            to="/upload"
            className="px-5 py-3 rounded-lg bg-white text-teal-950 font-bold text-sm shadow hover:bg-teal-50 transition whitespace-nowrap"
          >
            Load Sample Notices
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
