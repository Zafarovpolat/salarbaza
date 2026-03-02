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
        // ✅ Убраны console.log — они замедляли работу
        if (WebApp.initData) {
            config.headers['X-Telegram-Init-Data'] = WebApp.initData
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status

            // ✅ 429 — отдельная обработка
            if (status === 429) {
                return Promise.reject(new Error('TOO_MANY_REQUESTS'))
            }

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