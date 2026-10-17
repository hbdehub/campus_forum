import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api', // 这里的 /api 会被 vite.config.js 代理转发到 localhost:3000
  timeout: 5000
})

// 请求拦截器：每次发请求前，自动带上 token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}` // 对应你后端 index.js 里的格式
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：处理后端返回的错误
request.interceptors.response.use(
  response => {
    return response.data // 直接返回后端的 { code: 200, msg: "...", data: ... }
  },
  error => {
    // 如果后端返回 401，说明 token 过期了
    if (error.response && error.response.status === 401) {
      ElMessage.error('登录过期，请重新登录')
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else {
      ElMessage.error(error.response?.data?.msg || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request