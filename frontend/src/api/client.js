import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const serverDetail = error?.response?.data?.detail
    if (status === 400) return Promise.reject(new Error(serverDetail || 'Bad request'))
    if (status === 404) return Promise.reject(new Error(serverDetail || 'Not Found'))
    if (status >= 500) return Promise.reject(new Error('Server Error'))
    const message =
      serverDetail ||
      error?.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  },
)

export default client
