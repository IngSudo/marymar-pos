import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const esIntentoDeCredenciales = url.includes("/auth/login") || url.includes("/auth/cambiar-password");
    if (error.response?.status === 401 && !esIntentoDeCredenciales) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("esElevada");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default client;
