import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para log de requests em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(
    (config) => {
      console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      console.log(`✅ ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error('❌ Response error:', error.response?.status, error.response?.data);
      return Promise.reject(error);
    }
  );
}

export const playersAPI = {
  getAll: () => api.get('/players'),
  getById: (id) => api.get(`/players/${id}`),
  create: (data) => api.post('/players', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`),
  search: (name) => api.get(`/players/search/${name}`),
};

export const eventsAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  getCurrent: () => api.get('/events/current'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
};

export const confirmationsAPI = {
  getByEvent: (eventId) => api.get(`/confirmations/event/${eventId}`),
  getConfirmed: (eventId) => api.get(`/confirmations/event/${eventId}/confirmed`),
  getWaiting: (eventId) => api.get(`/confirmations/event/${eventId}/waiting`),
  create: (data) => api.post('/confirmations', data),
  update: (id, data) => api.put(`/confirmations/${id}`, data),
  delete: (id) => api.delete(`/confirmations/${id}`),
};

export const teamsAPI = {
  generate: (eventId) => api.post(`/teams/generate/${eventId}`),
  getPlayers: (eventId) => api.get(`/teams/players/${eventId}`),
};

export const csvAPI = {
  import: (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/csv/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  export: () => api.get('/csv/export', { responseType: 'blob' }),
  getTemplate: () => api.get('/csv/template', { responseType: 'blob' }),
};

export default api;