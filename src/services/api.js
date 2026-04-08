import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.SOCKET_SERVER_URL) {
    return process.env.SOCKET_SERVER_URL;
  }

  const isEmulator = NativeModules.PlatformConstants.isTesting;

  const API_URL = isEmulator
    ? 'http://10.0.2.2:5001/api'
    : 'http://192.168.1.12:5001/api';
  // const API_URL = 'https://chat-app-backend-efle.onrender.com';

  // Android emulator cannot access localhost directly.
  return API_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Handle token expiration
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigate to login - you'll need to implement this
    }
    return Promise.reject(error);
  },
);

export default {
  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),

  // Messages
  // getMessages: userId => api.get(`/users/messages/${userId}`),
};
