import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
api.getLanguageCatalog = () => api.get('/super-admin/languages/catalog');
api.importLanguages = (codes) => api.post('/super-admin/languages/import', codes ? { codes } : {});
api.clearAllLanguages = () => api.delete('/super-admin/languages/all');
api.getLanguageVoices = (languageCode) => api.get('/super-admin/languages/voices', { params: { languageCode } });
api.previewVoice = (data) => api.post('/super-admin/languages/preview-voice', data);

// --- School Management (Super Admin) ---
api.getAllSchools = () => api.get('/super-admin/schools');
api.getPublicSchools = () => api.get('/public/schools'); // Public endpoint
api.getPublicGrades = () => api.get('/grades/public'); // Public endpoint (registration)
api.getSchoolById = (id) => api.get(`/super-admin/schools/${id}`);
api.createSchool = (data) => api.post('/super-admin/schools', data);
api.updateSchool = (id, data) => api.put(`/super-admin/schools/${id}`, data);
api.deleteSchool = (id, confirmName) => api.delete(`/super-admin/schools/${id}`, { data: { confirmName } });
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
api.getBillingOverview = () => api.get('/super-admin/billing/overview');

// --- Stripe Subscriptions (Super Admin manages on the school's behalf) ---
api.createSubscriptionCheckout = (schoolId, data) => api.post(`/super-admin/schools/${schoolId}/subscription/checkout`, data || {});
api.getSubscription = (schoolId) => api.get(`/super-admin/schools/${schoolId}/subscription`);
api.cancelSubscription = (schoolId) => api.post(`/super-admin/schools/${schoolId}/subscription/cancel`);
api.resumeSubscription = (schoolId) => api.post(`/super-admin/schools/${schoolId}/subscription/resume`);
api.grantSchoolAccess = (schoolId, data) => api.post(`/super-admin/schools/${schoolId}/access`, data);

// --- Usage Analytics (Super Admin) ---
api.getSchoolUsageStats = (id) => api.get(`/super-admin/schools/${id}/usage-stats`);
api.getSchoolUsageHistory = (id, params = {}) => api.get(`/super-admin/schools/${id}/usage-history`, { params });
api.resetSchoolUsage = (id) => api.post(`/super-admin/schools/${id}/usage-reset`);
api.getAnalyticsOverview = () => api.get('/super-admin/analytics/overview');

// --- School Admin Management ---
api.getMySchool = () => api.get('/my-school');
api.getMySchoolLanguages = () => api.get('/my-school/languages');
api.updateMySchool = (data) => api.put('/admin/school', data);
api.getMyPayments = () => api.get('/my-school/payments');
api.getMyPaymentLink = () => api.get('/my-school/payment-link');
api.createMyCheckout = () => api.post('/my-school/subscription/checkout');

// --- Live Conversation Management ---
api.startSession = (studentId) => api.post('/sessions/start', { student_id: studentId });
api.endSession = (sessionId) => api.post('/sessions/end', { session_id: sessionId });
api.getActiveSession = () => api.get('/sessions/active');

// --- User Management (Super Admin) ---
api.getAllUsers = (params) => api.get('/super-admin/users', { params });
api.getAuditLogs = (params) => api.get('/super-admin/audit-logs', { params });
api.createUser = (data) => api.post('/super-admin/users', data);
api.updateUser = (id, data) => api.put(`/super-admin/users/${id}`, data);
api.checkUserAvailability = (data) => api.post('/super-admin/users/check-availability', data);

// --- Auth / Profile ---
api.updateProfile = (data) => api.put('/auth/profile', data);

// --- System / Branding ---
api.getBranding = () => api.get('/system/branding');

// --- Notifications ---
api.getNotifications = () => api.get('/notifications');
api.markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
api.markAllNotificationsRead = () => api.put('/notifications/read-all');
api.deleteNotification = (id) => api.delete(`/notifications/${id}`);

// --- Auth: Forgot / Reset Password ---
api.forgotPassword = (email) => api.post('/auth/forgot-password', { email });
api.resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, newPassword });

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // School not yet activated (no successful payment) → send the admin to their
    // Billing page where they can see status; everyone else just gets the message.
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_INACTIVE') {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'admin' && !window.location.pathname.startsWith('/admin/billing')) {
          window.location.href = '/admin/billing';
        }
      } catch (_) { /* ignore parse errors */ }
    }

    if (error.response?.status === 401) {
      // Don't bounce when on a public/auth page — a 401 there just means the
      // endpoint needs auth (e.g. the register page loading reference data),
      // not that a session expired.
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/privacy'];
      const onPublicPage = publicPaths.some(p => window.location.pathname.startsWith(p));
      if (!onPublicPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // Always reject with a consistent { success, message } shape so callers never
    // receive a bare string (e.g. on network errors with no response body).
    const normalized = error.response?.data && typeof error.response.data === 'object'
      ? error.response.data
      : { success: false, message: error.message || 'Network error. Please try again.' };
    return Promise.reject(normalized);
  }
);

export default api;