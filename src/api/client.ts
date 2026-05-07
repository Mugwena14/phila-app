import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

console.log('API BASE URL:', BASE_URL)

const TOKEN_KEY = 'phila_token'

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    if (token !== null && config.headers !== undefined) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('REQUEST:', config.method?.toUpperCase(), (config.baseURL ?? '') + (config.url ?? ''))
    return config
  },
  (error: AxiosError): Promise<never> => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    console.log('RESPONSE:', response.status, response.config.url)
    return response
  },
  async (error: AxiosError): Promise<never> => {
    console.log('API ERROR:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    })
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
    }
    return Promise.reject(error)
  }
)

export default apiClient