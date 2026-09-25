import axios from 'axios';

export const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    // If accessed through standard web ports (80 / 443 via Nginx / reverse proxy)
    if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
      return `${window.location.origin}/api`;
    }
    // If accessed directly on developer ports (e.g. Next.js on 3000 -> Backend on 5000)
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
      return window.location.origin;
    }
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically update baseURL and attach Authorization token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('cse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
