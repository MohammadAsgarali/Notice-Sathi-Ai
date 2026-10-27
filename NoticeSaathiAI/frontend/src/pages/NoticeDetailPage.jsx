import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, CheckCircle2, Circle, AlertTriangle, ShieldCheck, 
  HelpCircle, Printer, Download, Globe, Sparkles, RefreshCw, 
  FileSearch, Trash2, ArrowLeft, Info, Calendar, UserCheck
} from 'lucide-react';
import { 
  fetchNoticeDetails, updateChecklistTask, translateNotice, 
  reanalyzeNotice, deleteNotice, getReportUrl 
} from '../services/api';
import AudioPlayer from '../components/AudioPlayer';

const NoticeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLang, setActiveLang] = useState('en'); // 'en' | 'hi'
  const [showRawText, setShowRawText] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const loadNotice = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNoticeDetails(id);
      setNotice(data);
      setActiveLang(data.selected_language || 'en');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to retrieve notice details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotice();
  }, [id]);

  // Toggle checklist task status
  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      setUpdatingTaskId(taskId);
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const updated = await updateChecklistTask(taskId, { status: newStatus });
      
      // Update local state immediately
      setNotice(prev => ({
        ...prev,
        checklist_tasks: prev.checklist_tasks.map(t => 
          t.id === taskId ? { ...t, status: updated.status, completed_at: updated.completed_at } : t
        )
      }));
    } catch (err) {
      alert('Failed to update task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Switch language dynamically
  const handleLanguageSwitch = async (lang) => {
    setActiveLang(lang);
    try {
      await translateNotice(id, lang);
    } catch (err) {
      console.warn('Language preference sync error:', err);
    }
  };

  const handleReanalyze = async () => {
    try {
      setIsReanalyzing(true);
      const updated = await reanalyzeNotice(id);
      setNotice(updated);
    } catch (err) {
      alert('Re-analysis failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this notice and all associated analysis records?')) {
      return;
    }
    try {
      await deleteNotice(id);
      navigate('/history');
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading notice analysis and evidence...</p>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Notice Not Found</h2>
        <p className="text-sm text-slate-600">{error || 'The requested notice does not exist.'}</p>
        <Link to="/history" className="inline-block px-4 py-2 bg-teal-600 text-white rounded text-sm font-semibold">
          Return to History
        </Link>
      </div>
    );
  }

  // Calculate checklist progress
  const totalTasks = notice.checklist_tasks?.length || 0;
  const completedTasks = notice.checklist_tasks?.filter(t => t.status === 'completed').length || 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Active summary text based on selected language
  const currentSummary = activeLang === 'hi' 
    ? (notice.summary_hi || notice.summary_en) 
    : notice.summary_en;

  const currentWhy = activeLang === 'hi' ? notice.why_it_matters_hi : notice.why_it_matters_en;
  const currentAudience = activeLang === 'hi' ? notice.who_should_pay_attention_hi : notice.who_should_pay_attention_en;
  const currentMissing = activeLang === 'hi' ? notice.missing_information_hi : notice.missing_information_en;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Navigation & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/history" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Notices</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/ask?notice_id=${notice.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ask NoticeSaathi Q&A</span>
          </Link>

          <a
            href={getReportUrl(notice.id, 'html')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable View</span>
          </a>

          <a
            href={getReportUrl(notice.id, 'pdf')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>

          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm transition"
            title="Re-run Gemma 4 analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            <span>Reanalyze</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
            title="Delete this notice"
            aria-label="Delete notice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notice Title Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
            {notice.category}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            Input: {notice.input_type.toUpperCase()} ({notice.page_count} page{notice.page_count > 1 ? 's' : ''})
          </span>
          {notice.has_ocr_used && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              OCR Engine Processed
            </span>
          )}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            notice.is_mock_inference 
              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            Provenance: {notice.ai_provider_used} ({notice.is_mock_inference ? 'Transparent Dev Mock' : 'Gemma 4 Live'})
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {notice.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 pt-1">
          <span><strong>Issuing Org:</strong> {notice.issuing_org || 'Not stated in notice'}</span>
          <span><strong>Processed:</strong> {new Date(notice.created_at).toLocaleString()}</span>
          {notice.source_url && (
            <span>
              <strong>Source URL:</strong>{' '}
              <a href={notice.source_url} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
                {notice.source_url.slice(0, 35)}...
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Plain-Language Multilingual Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Card Header with Language Toggle */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Plain-Language Simplification
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
            <button
              onClick={() => handleLanguageSwitch('en')}
              className={`px-3 py-1 text-xs font-bold rounded transition ${
                activeLang === 'en' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageSwitch('hi')}
              className={`px-3 py-1 text-xs font-bold rounded transition ${
                activeLang === 'hi' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी (Hindi)
            </button>
          </div>
        </div>

        {/* Audio Narration Bar */}
        <div className="p-4 bg-teal-50/50 border-b border-teal-100">
          <AudioPlayer 
            text={currentSummary} 
            language={activeLang} 
            label={`Listen in ${activeLang === 'hi' ? 'Hindi' : 'English'}`} 
          />
        </div>

        {/* Summary Body */}
        <div className="p-6 space-y-4">
          <p className="text-base text-slate-800 leading-relaxed font-normal">
            {currentSummary || 'No summary generated.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {currentWhy && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-700 block mb-1">Why It Matters:</span>
                <p className="text-xs text-slate-600 leading-relaxed">{currentWhy}</p>
              </div>
            )}

            {currentAudience && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-700 block mb-1">Who Should Pay Attention:</span>
                <p className="text-xs text-slate-600 leading-relaxed">{currentAudience}</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Translation and simplification are generated by AI to enhance accessibility. They do not constitute an official government translation.
          </p>
        </div>

      </div>

      {/* Missing or Ambiguous Information Alert */}
      {currentMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Missing or Unspecified Information in this Notice:</span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed pl-6">
            {currentMissing}
          </p>
          <p className="text-[11px] text-amber-800 pl-6">
            NoticeSaathi does not invent missing deadlines or portals. Contact the issuing department for confirmation.
          </p>
        </div>
      )}

      {/* Actionable Checklist (Module F) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span>Actionable Checklist ({completedTasks}/{totalTasks} Completed)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any action item to mark it complete. Saves automatically to the database.
            </p>
          </div>

          <div className="w-full sm:w-48 space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {notice.checklist_tasks && notice.checklist_tasks.length > 0 ? (
          <div className="space-y-3">
            {notice.checklist_tasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className={`p-4 rounded-lg border transition cursor-pointer flex items-start gap-3.5 ${
                    isDone 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  role="checkbox"
                  aria-checked={isDone}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleToggleTask(task.id, task.status);
                    }
                  }}
                >
                  <button 
                    type="button"
                    className="mt-0.5 text-teal-600 focus:outline-hidden"
                    aria-label={`Mark task ${task.task_title} as ${isDone ? 'incomplete' : 'complete'}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {task.order_index}. {task.task_title}
                      </span>
                      <div className="flex items-center gap-2">
                        {task.deadline && (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Deadline: {task.deadline}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          task.is_confirmed_requirement 
                            ? 'bg-teal-100 text-teal-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.is_confirmed_requirement ? 'Confirmed Requirement' : 'Suggested Best Practice'}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {task.supporting_evidence_ref && (
                      <p className="text-[11px] text-slate-400 italic">
                        Evidence: "{task.supporting_evidence_ref.slice(0, 100)}..."
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No action tasks generated for this notice.</p>
        )}
      </div>

      {/* Evidence and Verification Matrix (Module E) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Evidence & Verification Matrix (Verbatim Source Grounding)
            </h2>
          </div>
          <span className="text-xs text-slate-500">Hallucination Prevention</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-1/5">Field</th>
                <th className="px-5 py-3 w-1/4">Extracted Information</th>
                <th className="px-5 py-3 w-28">Status</th>
                <th className="px-5 py-3 w-32">Verification</th>
                <th className="px-5 py-3">Supporting Source Quotation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notice.extracted_fields && notice.extracted_fields.map((field) => {
                const statusColor = 
                  field.status === 'found' ? 'bg-emerald-100 text-emerald-800' :
                  field.status === 'missing' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800';

                return (
                  <tr key={field.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {field.field_label}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-medium">
                      {field.extracted_value}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${statusColor}`}>
                        {field.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {field.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified {field.page_number ? `(P. ${field.page_number})` : ''}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 italic">
                      {field.supporting_quotation ? (
                        <span>"{field.supporting_quotation}"</span>
                      ) : (
                        <span className="text-slate-400 not-italic">No quote (Field missing in notice)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Raw Extracted Notice Text Accordion */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="w-full px-6 py-3.5 text-left text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition"
        >
          <span className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-teal-600" />
            <span>Inspect Extracted Source Text ({notice.extracted_text.length} characters)</span>
          </span>
          <span className="text-teal-600 font-semibold">{showRawText ? 'Hide' : 'View Text'}</span>
        </button>

        {showRawText && (
          <div className="p-6 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
            {notice.extracted_text}
          </div>
        )}
      </div>

    </div>
  );
};

export default NoticeDetailPage;
