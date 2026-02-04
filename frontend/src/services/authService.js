import api from './api';

export const authService = {
  // Register user
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Attempting login for:', credentials.identifier || credentials.email);
      const response = await api.post('/auth/login', credentials);
      console.log('Login response:', response);

      if (response.success && response.data.token) {
        console.log('Token received:', response.data.token.substring(0, 20) + '...');

        // Store token and user
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Verify storage
        console.log('Token stored in localStorage:', !!localStorage.getItem('token'));
        console.log('User stored in localStorage:', localStorage.getItem('user'));
      } else {
        console.error('No token in response:', response);
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Call backend to set user offline in database
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout');
        console.log('User set to offline in database');
      }
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get user profile
  getProfile: async () => {
    return api.get('/auth/me');
  },
};