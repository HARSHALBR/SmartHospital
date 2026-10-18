import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
});

export const getHealth = () => api.get('/health').then(res => res.data);
export const getMetricsAll = () => api.get('/metrics/all').then(res => res.data);
export const getCentralizedBaselines = () => api.get('/metrics/centralized-baselines').then(res => res.data);
export const getMultimodalConfounding = () => api.get('/metrics/multimodal-confounding').then(res => res.data);
export const getCentralizedVsFederated = () => api.get('/metrics/centralized-vs-federated').then(res => res.data);
export const getNonIidMetrics = () => api.get('/metrics/non-iid').then(res => res.data);
export const getFedproxMetrics = () => api.get('/metrics/fedprox').then(res => res.data);
export const getPersonalizationMetrics = () => api.get('/metrics/personalization').then(res => res.data);
export const getByzantineMetrics = () => api.get('/metrics/byzantine').then(res => res.data);
export const getDpMetrics = () => api.get('/metrics/dp').then(res => res.data);
export const getSecureAggMetrics = () => api.get('/metrics/secure-aggregation').then(res => res.data);
export const getAttackSurface = () => api.get('/metrics/attack-surface').then(res => res.data);
export const runInference = (features) => api.post('/inference', { features }).then(res => res.data);

export default api;

