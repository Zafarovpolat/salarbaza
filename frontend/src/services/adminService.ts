// frontend/src/services/adminService.ts

const API_URL = import.meta.env.VITE_API_URL

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Admin-Password': localStorage.getItem('adminPassword') || '',
})

export const adminService = {
  // Stats
  async getStats() {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  // Products
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
      body: JSON.stringify(product),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async updateProduct(id: string, product: any) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(product),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
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
      body: JSON.stringify({ url, alt: '', isMain }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async deleteProductImage(productId: string, imageId: string) {
    const res = await fetch(`${API_URL}/admin/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
      headers: getHeaders(),
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
      body: JSON.stringify(category),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async updateCategory(id: string, category: any) {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(category),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async deleteCategory(id: string) {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
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
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

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
      body: JSON.stringify(template),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async updateWholesaleTemplate(id: string, template: any) {
    const res = await fetch(`${API_URL}/admin/wholesale-templates/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(template),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async deleteWholesaleTemplate(id: string) {
    const res = await fetch(`${API_URL}/admin/wholesale-templates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  // Customers
  async getCustomers(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    hasOrders?: 'all' | 'yes' | 'no'
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params?.hasOrders) queryParams.append('hasOrders', params.hasOrders)

    const queryString = queryParams.toString()
    const url = `${API_URL}/admin/customers${queryString ? `?${queryString}` : ''}`

    const res = await fetch(url, { headers: getHeaders() })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async getCustomersStats() {
    const res = await fetch(`${API_URL}/admin/customers/stats`, { headers: getHeaders() })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async getCustomer(id: string) {
    const res = await fetch(`${API_URL}/admin/customers/${id}`, { headers: getHeaders() })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async exportCustomers() {
    const res = await fetch(`${API_URL}/admin/customers-export`, { headers: getHeaders() })
    return res.blob()
  },

  // =============================================
  // 🆕 PROMOTIONS (Акции / Спецпредложения)
  // =============================================

  async getPromotions() {
    const res = await fetch(`${API_URL}/admin/promotions`, { headers: getHeaders() })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async getPromotion(id: string) {
    const res = await fetch(`${API_URL}/admin/promotions/${id}`, { headers: getHeaders() })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async createPromotion(promotion: any) {
    const res = await fetch(`${API_URL}/admin/promotions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(promotion),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async updatePromotion(id: string, promotion: any) {
    const res = await fetch(`${API_URL}/admin/promotions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(promotion),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async updatePromotionStatus(id: string, status: string) {
    const res = await fetch(`${API_URL}/admin/promotions/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async deletePromotion(id: string) {
    const res = await fetch(`${API_URL}/admin/promotions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async addProductToPromotion(promotionId: string, productId: string) {
    const res = await fetch(`${API_URL}/admin/promotions/${promotionId}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },

  async removeProductFromPromotion(promotionId: string, productId: string) {
    const res = await fetch(`${API_URL}/admin/promotions/${promotionId}/products/${productId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message)
    return data.data
  },
}