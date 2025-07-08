import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://back-hamse.vercel.app/api',
  //baseURL: 'http://127.0.0.1:1072/api',
});

// Interceptor de solicitud
axiosInstance.interceptors.request.use(
  (config) => {
    const currentUser = localStorage.getItem('currentUser') 
      ? JSON.parse(localStorage.getItem('currentUser')!)
      : null;
    
    if (currentUser?.accessToken) {
      config.headers.Authorization = `Bearer ${currentUser.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const response = await axiosInstance.post('/auth/refresh-token', {
          refreshToken: currentUser.refreshToken
        });

        if (response.data.data.accessToken) {  // Cambiado de token a accessToken
          localStorage.setItem('currentUser', JSON.stringify(response.data.data));
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;