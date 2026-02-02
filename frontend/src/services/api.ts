import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import WebApp from '@twa-dev/sdk'
import { API_URL } from '@/utils/constants'

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // ✅ Добавь логирование
        console.log('🔗 API Request:', config.method?.toUpperCase(), config.url)
        console.log('📱 WebApp.initData exists:', !!WebApp.initData)
        console.log('📱 WebApp.initData length:', WebApp.initData?.length || 0)

        // Add Telegram init data for authentication
        if (WebApp.initData) {
            config.headers['X-Telegram-Init-Data'] = WebApp.initData
        } else {
            console.warn('⚠️ No initData - request may fail auth')
        }
        return config
    },
    (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.status, response.config.url)
        return response
    },
    (error: AxiosError) => {
        console.error('❌ API Error:', error.response?.status, error.config?.url)
        console.error('❌ Error data:', error.response?.data)

        if (error.response) {
            const message = (error.response.data as { message?: string })?.message ||
                'An error occurred'
            return Promise.reject(new Error(message))
        } else if (error.request) {
            return Promise.reject(new Error('Network error. Please check your connection.'))
        } else {
            return Promise.reject(error)
        }
    }
)

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.get<T>(url, config)
    return response.data
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    console.log('📤 POST data:', JSON.stringify(data).substring(0, 500))
    const response = await api.post<T>(url, data, config)
    return response.data
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.put<T>(url, data, config)
    return response.data
}

export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.patch<T>(url, data, config)
    return response.data
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.delete<T>(url, config)
    return response.data
}

export default api