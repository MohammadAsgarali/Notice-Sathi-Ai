import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, Search, Trash2, ArrowRight, FileText, 
  Printer, Download, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { fetchNotices, deleteNotice, getReportUrl } from '../services/api';

const HistoryPage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState(null);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const data = await fetchNotices(params);
      setNotices(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notice history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadNotices();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete notice "${title}" and all its tasks & messages?`)) {
      return;
    }
    try {
      await deleteNotice(id);
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const categories = ['All', 'Scholarship', 'Examination', 'Admission', 'Public Service', 'Campus Event', 'General'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-teal-600" />
            <span>Notice History & Database Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All notices processed and stored in SQLite. Search, inspect evidence, or delete records.
          </p>
        </div>

        <Link
          to="/upload"
          className="self-start sm:self-auto px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-sm"
        >
          + Upload New Notice
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by notice title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label htmlFor="cat-filter" className="text-xs font-bold text-slate-500 whitespace-nowrap">
            Category:
          </label>
          <select
            id="cat-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notice Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-2 text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <p>Loading database records...</p>
          </div>
        ) : notices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Notice Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">AI Engine</th>
                  <th className="px-5 py-3">Processed Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900 max-w-sm truncate">
                      <Link to={`/notices/${n.id}`} className="hover:text-teal-700 transition">
                        {n.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {n.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-500 uppercase text-[10px]">
                      {n.input_type} ({n.page_count}p)
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                        {n.ai_provider_used}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(n.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <Link
                        to={`/notices/${n.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 rounded transition"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      <a
                        href={getReportUrl(n.id, 'html')}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center p-1 text-slate-500 hover:text-slate-800 transition"
                        title="Print Report"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleDelete(n.id, n.title)}
                        className="inline-flex items-center p-1 text-rose-500 hover:text-rose-700 transition"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2 text-xs">
            <FileText className="w-10 h-10 text-slate-300 stroke-[1.5] mx-auto" />
            <p className="font-semibold text-slate-600">No notices matched your criteria</p>
            <p>Try clearing your search query or upload a new notice.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default HistoryPage;
