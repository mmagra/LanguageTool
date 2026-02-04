import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('🚀 [API] Configured Base URL:', API_BASE_URL || '(UNDEFINED - Using Relative Paths)');

if (!API_BASE_URL) {
  console.error('CRITICAL: VITE_API_BASE_URL is missing! Requests will fail.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request Interceptor - Token exists:', !!token);
    console.log('Request URL:', config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization.substring(0, 20) + '...');
    } else {
      console.warn('No token found for request to:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// --- Language Management (Super Admin) ---
api.getSystemLanguages = () => api.get('/system/languages');
api.getAllLanguages = () => api.get('/super-admin/languages');
api.addLanguage = (data) => api.post('/super-admin/languages', data);
api.updateLanguage = (id, data) => api.put(`/super-admin/languages/${id}`, data);
api.toggleLanguage = (id) => api.patch(`/super-admin/languages/${id}/toggle`);
api.deleteLanguage = (id) => api.delete(`/super-admin/languages/${id}`);

// --- School Management (Super Admin) ---
api.getAllSchools = () => api.get('/super-admin/schools');
api.getPublicSchools = () => api.get('/public/schools'); // Public endpoint
api.getSchoolById = (id) => api.get(`/super-admin/schools/${id}`);
api.createSchool = (data) => api.post('/super-admin/schools', data);
api.updateSchool = (id, data) => api.put(`/super-admin/schools/${id}`, data);
api.updateSchoolLogo = (id, logoUrl) => api.post(`/super-admin/schools/${id}/logo`, { logo_url: logoUrl });
api.getSchoolAdmins = (id) => api.get(`/super-admin/schools/${id}/admins`);
api.checkSchoolAvailability = (data) => api.post('/super-admin/schools/check-availability', data);

// --- Payment Management (Super Admin) ---
api.getSchoolPayments = (id, params) => api.get(`/super-admin/schools/${id}/payments`, { params });
api.createPayment = (schoolId, data) => api.post(`/super-admin/schools/${schoolId}/payments`, data);
api.updatePayment = (schoolId, paymentId, data) => api.put(`/super-admin/schools/${schoolId}/payments/${paymentId}`, data);
api.deletePayment = (schoolId, paymentId) => api.delete(`/super-admin/schools/${schoolId}/payments/${paymentId}`);
api.downloadInvoice = async (schoolId, paymentId) => {
  const response = await api.get(`/super-admin/schools/${schoolId}/payments/${paymentId}/invoice`, {
    responseType: 'blob'
  });
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice-${paymentId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return { success: true };
};
api.getPaymentsSummary = () => api.get('/super-admin/payments/summary');

// --- Usage Analytics (Super Admin) ---
api.getSchoolUsageStats = (id) => api.get(`/super-admin/schools/${id}/usage-stats`);
api.getAnalyticsOverview = () => api.get('/super-admin/analytics/overview');

// --- School Admin Management ---
api.getMySchool = () => api.get('/my-school');
api.getMySchoolLanguages = () => api.get('/my-school/languages');
api.updateMySchool = (data) => api.put('/admin/school', data);

// --- In-Person Session Management ---
api.startSession = (studentId) => api.post('/sessions/start', { student_id: studentId });
api.endSession = (sessionId) => api.post('/sessions/end', { session_id: sessionId });
api.getActiveSession = () => api.get('/sessions/active');

// --- User Management (Super Admin) ---
api.getAllUsers = (params) => api.get('/super-admin/users', { params });
api.createUser = (data) => api.post('/super-admin/users', data);
api.createUser = (data) => api.post('/super-admin/users', data);
api.updateUser = (id, data) => api.put(`/super-admin/users/${id}`, data);
api.checkUserAvailability = (data) => api.post('/super-admin/users/check-availability', data);

// --- System / Branding ---
api.getBranding = () => api.get('/system/branding');

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.config.url, response.status);
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Clearing token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;