import axiosClient from './axiosClient';

const authApi = {
  login: (params: any) => {
    const url = '/api/auth/login'; // Khớp với route BE bạn đã tạo
    return axiosClient.post(url, params);
  },
  register: (params: any) => {
    const url = '/api/auth/register';
    return axiosClient.post(url, params);
  },
};

export default authApi;