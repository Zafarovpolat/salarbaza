// services/adminService.ts

const API_URL = import.meta.env.VITE_API_URL

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Admin-Password': localStorage.getItem('adminPassword') || ''
})

export const adminService = {
    // Stats
    async getStats() {
        const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    // Products - ✅ ОБНОВЛЕНО: добавлена поддержка фильтров
    async getProducts(params?: { categoryId?: string; search?: string }) {
        const queryParams = new URLSearchParams()
        if (params?.categoryId) queryParams.append('categoryId', params.categoryId)
        if (params?.search) queryParams.append('search', params.search)

        const queryString = queryParams.toString()
        const url = `${API_URL}/admin/products${queryString ? `?${queryString}` : ''}`

        const res = await fetch(url, { headers: getHeaders() })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async getProduct(id: string) {
        const res = await fetch(`${API_URL}/admin/products/${id}`, { headers: getHeaders() })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async createProduct(product: any) {
        const res = await fetch(`${API_URL}/admin/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product)
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async updateProduct(id: string, product: any) {
        const res = await fetch(`${API_URL}/admin/products/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(product)
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async deleteProduct(id: string) {
        const res = await fetch(`${API_URL}/admin/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    // Product Images
    async addProductImage(productId: string, url: string, isMain: boolean = false) {
        const res = await fetch(`${API_URL}/admin/products/${productId}/images`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ url, alt: '', isMain })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async deleteProductImage(productId: string, imageId: string) {
        const res = await fetch(`${API_URL}/admin/products/${productId}/images/${imageId}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    // Categories
    async getCategories() {
        const res = await fetch(`${API_URL}/admin/categories`, { headers: getHeaders() })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async createCategory(category: any) {
        const res = await fetch(`${API_URL}/admin/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(category)
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async updateCategory(id: string, category: any) {
        const res = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(category)
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async deleteCategory(id: string) {
        const res = await fetch(`${API_URL}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    // Orders
    async getOrders() {
        const res = await fetch(`${API_URL}/admin/orders`, { headers: getHeaders() })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async updateOrderStatus(id: string, status: string) {
        const res = await fetch(`${API_URL}/admin/orders/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    }

        // Wholesale Templates
    async getWholesaleTemplates() {
        const res = await fetch(`${API_URL}/admin/wholesale-templates`, { headers: getHeaders() })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async getWholesaleTemplate(id: string) {
        const res = await fetch(`${API_URL}/admin/wholesale-templates/${id}`, { headers: getHeaders() })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async createWholesaleTemplate(template: any) {
        const res = await fetch(`${API_URL}/admin/wholesale-templates`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(template)
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async updateWholesaleTemplate(id: string, template: any) {
        const res = await fetch(`${API_URL}/admin/wholesale-templates/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(template)
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    },

    async deleteWholesaleTemplate(id: string) {
        const res = await fetch(`${API_URL}/admin/wholesale-templates/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        return data.data
    }
}