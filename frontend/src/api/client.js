import axios from 'axios';
import { setupAxiosTelemetry } from '../utils/nexisTelemetry';
import { ENDPOINTS, API_BASE_URL } from './endpoints';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Telemetry: stream API calls to Nexis
setupAxiosTelemetry(apiClient);

// Request Interceptor: Injects Active Bearer Token & normalizes URL
apiClient.interceptors.request.use(
  (config) => {
    if (config.baseURL && config.url && config.url.startsWith(config.baseURL)) {
      config.url = config.url.substring(config.baseURL.length);
    }
    const token = localStorage.getItem('apex_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const tenantSubdomain = localStorage.getItem('apex_tenant_subdomain');
    if (tenantSubdomain) {
      config.headers['X-Tenant-Subdomain'] = tenantSubdomain;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Token Refresh on 401 Unauthorized
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login/') || originalRequest.url?.includes('/auth/refresh/')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('apex_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(ENDPOINTS.AUTH.REFRESH, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('apex_access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('apex_refresh_token', newRefreshToken);
        }

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        processQueue(null, access_token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('apex_access_token');
        localStorage.removeItem('apex_refresh_token');
        localStorage.removeItem('apex_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
