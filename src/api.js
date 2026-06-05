import axios from 'axios';

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname === '');

const api = axios.create({
  baseURL: isLocal ? 'http://localhost:5000/api' : 'https://doctorxb.onrender.com/api',
});

api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const token = JSON.parse(userInfo).token;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRequest = error.config && error.config.url && (error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register'));
      if (!isAuthRequest) {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
    }
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data &&
      error.response.data.status
    ) {
      window.dispatchEvent(
        new CustomEvent('licenseValidationError', { detail: error.response.data })
      );
    }
    return Promise.reject(error);
  }
);

export default api;
