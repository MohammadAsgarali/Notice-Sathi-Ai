import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export const fetchHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const fetchOCRHealth = async () => {
  const res = await api.get('/health/ocr');
  return res.data;
};

export const fetchAIHealth = async () => {
  const res = await api.get('/health/ai');
  return res.data;
};

export const fetchDashboardStats = async () => {
  const res = await api.get('/stats');
  return res.data;
};

export const fetchNotices = async (params = {}) => {
  const res = await api.get('/notices', { params });
  return res.data;
};

export const fetchNoticeDetails = async (id) => {
  const res = await api.get(`/notices/${id}`);
  return res.data;
};

export const deleteNotice = async (id) => {
  await api.delete(`/notices/${id}`);
};

export const reanalyzeNotice = async (id) => {
  const res = await api.post(`/notices/${id}/analyze`);
  return res.data;
};

export const uploadNoticeFile = async (formData) => {
  const res = await api.post('/notices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const uploadNoticeText = async (payload) => {
  const res = await api.post('/notices/text', payload);
  return res.data;
};

export const uploadNoticeUrl = async (payload) => {
  const res = await api.post('/notices/url', payload);
  return res.data;
};

export const translateNotice = async (id, targetLanguage) => {
  const res = await api.post(`/notices/${id}/translate`, { target_language: targetLanguage });
  return res.data;
};

export const fetchNoticeChecklist = async (id) => {
  const res = await api.get(`/notices/${id}/checklist`);
  return res.data;
};

export const updateChecklistTask = async (taskId, data) => {
  const res = await api.patch(`/checklist/${taskId}`, data);
  return res.data;
};

export const addChecklistTask = async (noticeId, data) => {
  const res = await api.post(`/notices/${noticeId}/checklist`, data);
  return res.data;
};

export const askNoticeQuestion = async (noticeId, question, language = 'en') => {
  const res = await api.post(`/notices/${noticeId}/questions`, { question, language });
  return res.data;
};

export const fetchSampleNotices = async () => {
  const res = await api.get('/samples');
  return res.data;
};

export const loadSampleNotice = async (idKey) => {
  const res = await api.post(`/samples/load/${idKey}`);
  return res.data;
};

export const getReportUrl = (noticeId, format = 'html') => {
  return `/api/notices/${noticeId}/report?format=${format}`;
};

export default api;
