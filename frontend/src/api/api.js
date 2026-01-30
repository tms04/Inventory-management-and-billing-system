import axios from 'axios';

// Backend API URL from .env (REACT_APP_API_URL). Fallback for local dev if not set.
const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getAvailable: () => api.get('/products/stock/available'),
};

// Bills API
export const billsAPI = {
  getAll: () => api.get('/bills'),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  search: (query) => api.get(`/bills/search/${query}`),
  getWhatsAppLink: (id) => api.get(`/bills/${id}/whatsapp`),
};

// Reports API
export const reportsAPI = {
  getSales: (period) => api.get(`/reports/sales/${period}`),
  getInventory: (period) => api.get(`/reports/inventory/${period}`),
  getCash: (period) => api.get(`/reports/cash/${period}`),
  getComprehensive: (period) => api.get(`/reports/comprehensive/${period}`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Credit Notes API
export const creditNotesAPI = {
  getAll: () => api.get('/credit-notes'),
  getById: (id) => api.get(`/credit-notes/${id}`),
  getByBillId: (billId) => api.get(`/credit-notes/bill/${billId}`),
  create: (data) => api.post('/credit-notes', data),
};

export default api;
