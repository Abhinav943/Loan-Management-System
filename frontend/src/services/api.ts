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

// Register callbacks for token updates so React state stays synced
export const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
  return () => {
    refreshSubscribers = refreshSubscribers.filter((sub) => sub !== cb);
  };
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
};

// Register callback for when authentication completely fails (e.g. invalid refresh cookie)
export const registerOnLogout = (cb: () => void) => {
  onLogoutCallback = cb;
};

// Request Interceptor: Inject bearer token if available
api.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized errors automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are already refreshing, queue this request to resolve once refreshed
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
        // Fetch new token using root axios directly to avoid interceptor loop
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

        // Replay original request
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
