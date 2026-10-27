import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, CheckSquare2, Clock, AlertTriangle, 
  UploadCloud, ArrowRight, RefreshCw, BarChart2, ShieldAlert, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { fetchDashboardStats, fetchNotices, loadSampleNotice } from '../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, noticesData] = await Promise.all([
        fetchDashboardStats(),
        fetchNotices({ limit: 10 })
      ]);
      setStats(statsData);
      setRecentNotices(noticesData);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Could not connect to the backend server. Please verify FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickLoad = async (idKey) => {
    try {
      setSampleLoading(true);
      await loadSampleNotice(idKey);
      await loadData();
    } catch (err) {
      alert('Error loading sample notice: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSampleLoading(false);
    }
  };

  // Prepare chart data from real database category distribution
  const chartData = stats?.category_distribution 
    ? Object.entries(stats.category_distribution).map(([cat, count]) => ({
        name: cat,
        count: count
      }))
    : [];

  const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#e11d48', '#d97706'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Accessibility Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time statistics backed by the SQLite database & Gemma 4 extraction engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Notice</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Key Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Notices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Notices Processed</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : stats?.total_notices ?? 0}
            </p>
            <span className="text-[11px] text-teal-600 font-medium">Stored in database</span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Incomplete Action Checklist Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Checklist Tasks</p>
            <p className="text-3xl font-black text-amber-600 mt-1">
              {loading ? '...' : stats?.incomplete_checklist_actions ?? 0}
            </p>
            <span className="text-[11px] text-slate-500">
              Completed: {stats?.total_completed_actions ?? 0}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CheckSquare2 className="w-6 h-6" />
          </div>
        </div>

        {/* Notices with Missing or Uncertain Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Missing / Uncertain Info</p>
            <p className="text-3xl font-black text-rose-600 mt-1">
              {loading ? '...' : stats?.notices_with_missing_or_uncertain_info ?? 0}
            </p>
            <span className="text-[11px] text-rose-600 font-medium">Transparently flagged</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Notices Awaiting Review */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Awaiting Analysis</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : stats?.notices_awaiting_review ?? 0}
            </p>
            <span className="text-[11px] text-slate-500">Document extraction status</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Chart & Quick Loaders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Notice Category Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-teal-600" />
              <span>Notices by Category (Real Database Records)</span>
            </h2>
            <span className="text-xs text-slate-400">SQLite persistence</span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <FileText className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No notice records stored yet</p>
              <p className="text-xs mt-1">Upload a notice or load a sample notice below to populate live metrics.</p>
            </div>
          )}
        </div>

        {/* Quick Sample Notice Loader for Judges */}
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Hackathon Evaluation Sandbox</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">One-Click Sample Notices</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Explore the entire NoticeSaathi pipeline without uploading files manually:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleQuickLoad('scholarship')}
                disabled={sampleLoading}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition flex items-center justify-between"
              >
                <span>🎓 [Demo] Merit Scholarship Scheme</span>
                <span className="text-[10px] text-teal-400 font-bold">LOAD</span>
              </button>

              <button
                onClick={() => handleQuickLoad('exam')}
                disabled={sampleLoading}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition flex items-center justify-between"
              >
                <span>📝 [Demo] Winter Exam Schedule</span>
                <span className="text-[10px] text-teal-400 font-bold">LOAD</span>
              </button>

              <button
                onClick={() => handleQuickLoad('psa')}
                disabled={sampleLoading}
                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition flex items-center justify-between"
              >
                <span>🏥 [Demo] Dengue Public Health Advisory</span>
                <span className="text-[10px] text-teal-400 font-bold">LOAD</span>
              </button>

              <button
                onClick={() => handleQuickLoad('ambiguous')}
                disabled={sampleLoading}
                className="w-full text-left p-3 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium transition flex items-center justify-between"
              >
                <span>⚠️ [Edge Case] Ambiguous Deadline Notice</span>
                <span className="text-[10px] text-rose-300 font-bold">LOAD</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Synthetic notices are clearly labelled and strictly demonstrate grounded parsing.
          </div>
        </div>

      </div>

      {/* Recent Processing Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Notices</h2>
          <Link to="/history" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentNotices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Notice Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Input Type</th>
                  <th className="px-6 py-3">AI Engine</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {recentNotices.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                      {n.title}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {n.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 uppercase text-[11px] font-bold text-slate-500">
                      {n.input_type}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                        {n.ai_provider_used}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(n.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/notices/${n.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 rounded transition"
                      >
                        <span>Open Analysis</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No notices processed yet. Use the upload button or load a sample notice above.
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
