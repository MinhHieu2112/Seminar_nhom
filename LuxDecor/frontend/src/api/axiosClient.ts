import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080', // Cổng Backend bạn đã cài đặt
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bạn có thể thêm Interceptors tại đây để tự động chèn Token vào Header
export default axiosClient;