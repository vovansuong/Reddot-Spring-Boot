import axios from "axios";

const axiosClient = axios.create({
  baseURL: "/reddot/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động thêm token
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
