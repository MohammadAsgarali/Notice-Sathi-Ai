import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, Image as ImageIcon, Link as LinkIcon, 
  AlertCircle, CheckCircle2, Loader2, Sparkles, HelpCircle 
} from 'lucide-react';
import { uploadNoticeFile, uploadNoticeText, uploadNoticeUrl, loadSampleNotice } from '../services/api';

const UploadPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'text' | 'url'
  
  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // Text state
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  
  // URL state
  const [noticeUrl, setNoticeUrl] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  
  // Global form state
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processingStep, setProcessingStep] = useState('');

  // Handle file select & preview
  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('File exceeds maximum 15 MB limit. Please select a smaller file.');
      return;
    }

    setSelectedFile(file);

    // Create preview if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a PDF or image file to upload.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStep('Extracting text and scanning document with OCR pipeline...');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', language);

      const notice = await uploadNoticeFile(formData);
      setProcessingStep('Gemma 4 notice interpretation and evidence verification...');
      navigate(`/notices/${notice.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during file processing.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleTextUpload = async (e) => {
    e.preventDefault();
    if (!pastedText.trim() || pastedText.trim().length < 10) {
      setError('Please enter notice text with at least 10 characters.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStep('Interpreting text and grounding evidence with Gemma 4...');

      const notice = await uploadNoticeText({
        title: pastedTitle.trim() || 'Pasted Notice',
        text: pastedText,
        language
      });
      navigate(`/notices/${notice.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to process pasted notice text.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleUrlUpload = async (e) => {
    e.preventDefault();
    if (!noticeUrl.trim() || !noticeUrl.startsWith('http')) {
      setError('Please enter a valid HTTP or HTTPS public notice URL.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStep('Securely fetching public web notice and sanitizing HTML...');

      const notice = await uploadNoticeUrl({
        url: noticeUrl.trim(),
        title: urlTitle.trim() || undefined,
        language
      });
      navigate(`/notices/${notice.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Could not fetch or parse notice from URL.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleSampleLoad = async (idKey) => {
    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStep(`Loading synthetic test notice (${idKey}) into database...`);
      const notice = await loadSampleNotice(idKey);
      navigate(`/notices/${notice.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load sample notice.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Notice for Accessibility Interpretation
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Provide a PDF, photo/screenshot, pasted text, or public webpage URL. NoticeSaathi AI extracts key facts, checks source evidence, and builds an action checklist.
        </p>
      </div>

      {/* Quick Sample Notice Selector for Judges */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>One-Click Synthetic Demos (Instant Test Cases)</span>
        </div>
        <p className="text-xs text-teal-900 mb-3">
          Select any pre-configured test notice to explore the full pipeline without finding a file:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleSampleLoad('scholarship')}
            disabled={isProcessing}
            className="px-3 py-2 text-xs font-semibold bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-lg transition text-left shadow-xs"
          >
            🎓 Merit Scholarship
          </button>
          <button
            type="button"
            onClick={() => handleSampleLoad('exam')}
            disabled={isProcessing}
            className="px-3 py-2 text-xs font-semibold bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-lg transition text-left shadow-xs"
          >
            📝 Exam Schedule
          </button>
          <button
            type="button"
            onClick={() => handleSampleLoad('psa')}
            disabled={isProcessing}
            className="px-3 py-2 text-xs font-semibold bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-lg transition text-left shadow-xs"
          >
            🏥 Dengue Health PSA
          </button>
          <button
            type="button"
            onClick={() => handleSampleLoad('ambiguous')}
            disabled={isProcessing}
            className="px-3 py-2 text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-lg transition text-left shadow-xs"
          >
            ⚠️ Ambiguous Edge-Case
          </button>
        </div>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Method Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setError(null); }}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'file'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Document Upload (PDF / Image)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('text'); setError(null); }}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'text'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Notice Text</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('url'); setError(null); }}
            className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'url'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Import from Public URL</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Notice Processing Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Processing Your Notice...</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">{processingStep}</p>
              </div>
              <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: File Upload */}
              {activeTab === 'file' && (
                <form onSubmit={handleFileUpload} className="space-y-6">
                  <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center transition bg-slate-50/50">
                    <input
                      type="file"
                      id="notice-file-input"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="notice-file-input" className="cursor-pointer block">
                      <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedFile ? selectedFile.name : 'Click to select or drag and drop a notice'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supported: PDF (.pdf), Photos or Scanned Notices (.png, .jpg, .jpeg) · Max 15 MB
                      </p>
                      {selectedFile && (
                        <p className="text-xs font-semibold text-teal-600 mt-2">
                          File size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      )}
                    </label>
                  </div>

                  {filePreview && (
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-center">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Image Preview</p>
                      <img src={filePreview} alt="Uploaded notice preview" className="max-h-48 mx-auto rounded shadow-sm" />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Initial Output Language:</span>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedFile}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
                    >
                      Interpret Notice
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Paste Text */}
              {activeTab === 'text' && (
                <form onSubmit={handleTextUpload} className="space-y-4">
                  <div>
                    <label htmlFor="pasted-title" className="block text-xs font-bold text-slate-700 mb-1">
                      Notice Title (Optional)
                    </label>
                    <input
                      id="pasted-title"
                      type="text"
                      placeholder="e.g. University Scholarship Announcement 2026"
                      value={pastedTitle}
                      onChange={(e) => setPastedTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="pasted-body" className="block text-xs font-bold text-slate-700 mb-1">
                      Notice Body Text *
                    </label>
                    <textarea
                      id="pasted-body"
                      rows={8}
                      placeholder="Paste the full text of the circular, announcement, or poster here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 leading-relaxed"
                      required
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Characters: {pastedText.length}</span>
                      <span>Words: {pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Initial Output Language:</span>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={pastedText.trim().length < 10}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
                    >
                      Process Pasted Text
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: URL Import */}
              {activeTab === 'url' && (
                <form onSubmit={handleUrlUpload} className="space-y-4">
                  <div>
                    <label htmlFor="notice-url" className="block text-xs font-bold text-slate-700 mb-1">
                      Public Notice Web Address (URL) *
                    </label>
                    <input
                      id="notice-url"
                      type="url"
                      placeholder="https://university.edu/notices/exam-schedule-2026.html"
                      value={noticeUrl}
                      onChange={(e) => setNoticeUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      NoticeSaathi securely fetches the official webpage or PDF directly. Internal or private network IP addresses are protected against SSRF.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="url-title" className="block text-xs font-bold text-slate-700 mb-1">
                      Custom Label (Optional)
                    </label>
                    <input
                      id="url-title"
                      type="text"
                      placeholder="e.g. Official University Notice Link"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Initial Output Language:</span>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!noticeUrl.trim()}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
                    >
                      Fetch & Analyze URL
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
};

export default UploadPage;
