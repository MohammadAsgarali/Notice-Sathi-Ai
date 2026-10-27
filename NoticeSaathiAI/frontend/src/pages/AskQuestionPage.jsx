import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  HelpCircle, Send, Sparkles, AlertCircle, Bot, User, 
  ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { fetchNotices, fetchNoticeDetails, askNoticeQuestion } from '../services/api';

const PRESET_QUESTIONS = [
  'Am I eligible according to this notice?',
  'Is an income certificate required?',
  'What is the last date to apply?',
  'What documents are required?',
  'What should I do first?',
  'Is there an application fee?'
];

const AskQuestionPage = () => {
  const [searchParams] = useSearchParams();
  const noticeIdParam = searchParams.get('notice_id');

  const [notices, setNotices] = useState([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState(noticeIdParam || '');
  const [notice, setNotice] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const chatBottomRef = useRef(null);

  // Load notices list
  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await fetchNotices();
        setNotices(list);
        if (!selectedNoticeId && list.length > 0) {
          setSelectedNoticeId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load notices list:', err);
      }
    };
    fetchList();
  }, []);

  // Load selected notice and conversation history
  useEffect(() => {
    if (!selectedNoticeId) return;
    const loadSelected = async () => {
      try {
        const data = await fetchNoticeDetails(selectedNoticeId);
        setNotice(data);
        setMessages(data.conversation_messages || []);
      } catch (err) {
        console.error('Failed to load notice:', err);
      }
    };
    loadSelected();
  }, [selectedNoticeId]);

  // Scroll to bottom on message update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  const handleSend = async (questionText) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || !selectedNoticeId) return;

    setInputQuestion('');
    setError(null);
    setIsSubmitting(true);

    // Optimistic user message
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      message: q,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await askNoticeQuestion(selectedNoticeId, q);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to get answer from assistant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-teal-600" />
            <span>Ask NoticeSaathi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Grounded question answering. Strictly extracts answers from the active notice.
          </p>
        </div>

        {/* Notice Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="notice-select" className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Active Notice:
          </label>
          <select
            id="notice-select"
            value={selectedNoticeId}
            onChange={(e) => setSelectedNoticeId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg bg-white max-w-xs truncate shadow-xs"
          >
            {notices.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center justify-between text-xs text-teal-950">
          <div className="truncate mr-2">
            <strong>Grounded in:</strong> {notice.title} ({notice.category})
          </div>
          <Link to={`/notices/${notice.id}`} className="font-bold text-teal-700 hover:underline whitespace-nowrap">
            View Analysis →
          </Link>
        </div>
      )}

      {/* Suggested Questions Pills */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Quick Questions for Testing:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pq)}
              disabled={isSubmitting || !selectedNoticeId}
              className="text-xs font-medium px-3 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-full transition shadow-2xs"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
            <HelpCircle className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-600">Have questions about this notice?</p>
            <p className="text-xs max-w-md">
              Ask about eligibility criteria, required documents, deadlines, or fees. NoticeSaathi answers strictly based on verified quotations in the notice.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-xl p-4 text-xs sm:text-sm space-y-2 ${
                  isUser 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed font-normal">
                    {msg.message}
                  </p>

                  {/* Clarification Interactive Prompt */}
                  {msg.is_clarification && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 mt-2 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Ambiguity Detected — Clarification Required:</span>
                      </div>
                      <p className="text-xs">
                        {msg.clarification_prompt || 'The notice provides tentative or ambiguous information on this point.'}
                      </p>
                      {msg.clarification_options && (
                        <div className="space-y-1.5 pt-1">
                          {JSON.parse(msg.clarification_options).map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleSend(`Selected choice: ${opt}`)}
                              className="w-full text-left px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-amber-100 border border-amber-200 rounded text-amber-900 transition flex items-center justify-between"
                            >
                              <span>{opt}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Supporting Source Quotation */}
                  {msg.supporting_evidence_refs && (
                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 italic flex items-start gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Evidence quote: "{msg.supporting_evidence_refs}"</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSubmitting && (
          <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
            <Bot className="w-4 h-4 text-teal-600 animate-pulse" />
            <span>NoticeSaathi is consulting the notice source text...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask anything about eligibility, deadlines, required documents..."
          disabled={isSubmitting || !selectedNoticeId}
          className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isSubmitting || !selectedNoticeId}
          className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>

    </div>
  );
};

export default AskQuestionPage;
