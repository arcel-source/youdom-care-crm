import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Intercepteur requête : ajoute le token Bearer
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('youdom_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur réponse : gestion des erreurs globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('youdom_token');
        localStorage.removeItem('youdom_user');
        window.location.href = '/login';
      }
      if (status === 403) {
        console.error('Accès refusé');
      }
      if (status >= 500) {
        console.error('Erreur serveur:', error.response.data?.message || 'Erreur interne');
      }
    } else if (error.request) {
      console.error('Pas de réponse du serveur. Vérifiez votre connexion.');
    }
    return Promise.reject(error);
  }
);

// Helpers HTTP
export const api = {
  get: (url, params = {}) => apiClient.get(url, { params }),
  post: (url, data = {}) => apiClient.post(url, data),
  put: (url, data = {}) => apiClient.put(url, data),
  patch: (url, data = {}) => apiClient.patch(url, data),
  delete: (url) => apiClient.delete(url),
};

// ==========================================
// Auth
// ==========================================
export const authApi = {
  loginWithGoogle: (token) => api.post('/api/v1/auth/google', { token }),
  loginWithEmail: (email) => api.post('/api/v1/auth/email', { email }),
  verifyOtp: (email, code) => api.post('/api/v1/auth/verify-otp', { email, code }),
  me: () => api.get('/api/v1/auth/me'),
  logout: () => api.post('/api/v1/auth/logout'),
};

// ==========================================
// Bénéficiaires
// ==========================================
export const beneficiairesApi = {
  list: (params) => api.get('/api/v1/beneficiaires', params),
  get: (id) => api.get(`/api/v1/beneficiaires/${id}`),
  create: (data) => api.post('/api/v1/beneficiaires', data),
  update: (id, data) => api.put(`/api/v1/beneficiaires/${id}`, data),
  delete: (id) => api.delete(`/api/v1/beneficiaires/${id}`),
  getInterventions: (id, params) => api.get(`/api/v1/beneficiaires/${id}/interventions`, params),
  getDocuments: (id) => api.get(`/api/v1/beneficiaires/${id}/documents`),
};

// ==========================================
// Familles
// ==========================================
export const famillesApi = {
  list: (params) => api.get('/api/v1/familles', params),
  get: (id) => api.get(`/api/v1/familles/${id}`),
  create: (data) => api.post('/api/v1/familles', data),
  update: (id, data) => api.put(`/api/v1/familles/${id}`, data),
  delete: (id) => api.delete(`/api/v1/familles/${id}`),
};

// ==========================================
// Intervenants
// ==========================================
export const intervenantsApi = {
  list: (params) => api.get('/api/v1/intervenants', params),
  get: (id) => api.get(`/api/v1/intervenants/${id}`),
  create: (data) => api.post('/api/v1/intervenants', data),
  update: (id, data) => api.put(`/api/v1/intervenants/${id}`, data),
  delete: (id) => api.delete(`/api/v1/intervenants/${id}`),
  getDisponibilites: (id) => api.get(`/api/v1/intervenants/${id}/disponibilites`),
};

// ==========================================
// Leads
// ==========================================
export const leadsApi = {
  list: (params) => api.get('/api/v1/leads', params),
  get: (id) => api.get(`/api/v1/leads/${id}`),
  create: (data) => api.post('/api/v1/leads', data),
  update: (id, data) => api.put(`/api/v1/leads/${id}`, data),
  updateStatus: (id, status) => api.patch(`/api/v1/leads/${id}/status`, { status }),
  delete: (id) => api.delete(`/api/v1/leads/${id}`),
};

// ==========================================
// Planning / Interventions
// ==========================================
export const planningApi = {
  list: (params) => api.get('/api/v1/interventions', params),
  get: (id) => api.get(`/api/v1/interventions/${id}`),
  create: (data) => api.post('/api/v1/interventions', data),
  update: (id, data) => api.put(`/api/v1/interventions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/interventions/${id}`),
};

// ==========================================
// Devis
// ==========================================
export const devisApi = {
  list: (params) => api.get('/api/v1/devis', params),
  get: (id) => api.get(`/api/v1/devis/${id}`),
  create: (data) => api.post('/api/v1/devis', data),
  update: (id, data) => api.put(`/api/v1/devis/${id}`, data),
  delete: (id) => api.delete(`/api/v1/devis/${id}`),
  send: (id) => api.post(`/api/v1/devis/${id}/send`),
};

// ==========================================
// Factures
// ==========================================
export const facturesApi = {
  list: (params) => api.get('/api/v1/factures', params),
  get: (id) => api.get(`/api/v1/factures/${id}`),
  create: (data) => api.post('/api/v1/factures', data),
  update: (id, data) => api.put(`/api/v1/factures/${id}`, data),
  delete: (id) => api.delete(`/api/v1/factures/${id}`),
  markPaid: (id) => api.patch(`/api/v1/factures/${id}/paid`),
};

// ==========================================
// Qualité
// ==========================================
export const qualiteApi = {
  list: (params) => api.get('/api/v1/qualite/tickets', params),
  get: (id) => api.get(`/api/v1/qualite/tickets/${id}`),
  create: (data) => api.post('/api/v1/qualite/tickets', data),
  update: (id, data) => api.put(`/api/v1/qualite/tickets/${id}`, data),
  delete: (id) => api.delete(`/api/v1/qualite/tickets/${id}`),
};

// ==========================================
// Notifications
// ==========================================
export const notificationsApi = {
  list: (params) => api.get('/api/v1/notifications', params),
  markRead: (id) => api.patch(`/api/v1/notifications/${id}/read`),
  markAllRead: () => api.post('/api/v1/notifications/mark-all-read'),
  delete: (id) => api.delete(`/api/v1/notifications/${id}`),
};

// ==========================================
// Prescripteurs
// ==========================================
export const prescripteursApi = {
  list: (params) => api.get('/api/v1/prescripteurs', params),
  get: (id) => api.get(`/api/v1/prescripteurs/${id}`),
  create: (data) => api.post('/api/v1/prescripteurs', data),
  update: (id, data) => api.put(`/api/v1/prescripteurs/${id}`, data),
  delete: (id) => api.delete(`/api/v1/prescripteurs/${id}`),
};

// ==========================================
// Services
// ==========================================
export const servicesApi = {
  list: (params) => api.get('/api/v1/services', params),
  get: (id) => api.get(`/api/v1/services/${id}`),
  create: (data) => api.post('/api/v1/services', data),
  update: (id, data) => api.put(`/api/v1/services/${id}`, data),
  delete: (id) => api.delete(`/api/v1/services/${id}`),
};

// ==========================================
// Dashboard
// ==========================================
export const dashboardApi = {
  getStats: () => api.get('/api/v1/dashboard/stats'),
  getHeuresMois: () => api.get('/api/v1/dashboard/heures-mois'),
  getServicesRepartition: () => api.get('/api/v1/dashboard/services-repartition'),
  getAlertes: () => api.get('/api/v1/dashboard/alertes'),
  getLeadsRecents: () => api.get('/api/v1/dashboard/leads-recents'),
};

export default apiClient;
