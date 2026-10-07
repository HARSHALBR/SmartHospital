import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
});

export const getMetricsAll = () => api.get('/metrics/all').then(res => res.data);
export const runInference = (features) => api.post('/inference', { features }).then(res => res.data);

export default api;
