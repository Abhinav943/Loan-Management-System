import axios from "axios";

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let onLogoutCallback: (() => void) | null = null;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
  return () => {
    refreshSubscribers = refreshSubscribers.filter((sub) => sub !== cb);
  };
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
};

export const registerOnLogout = (cb: () => void) => {
  onLogoutCallback = cb;
};

api.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("Access token missing in refresh response");
        }

        setAccessToken(newAccessToken);
        onRefreshed(newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        if (onLogoutCallback) {
          onLogoutCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
