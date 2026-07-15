import { API_URL } from '@/utils/constants'

// Images are uploaded through the authenticated backend. The Supabase service
// role is never exposed to the browser, and anonymous Storage writes stay disabled.
export async function uploadImage(file: File, folder: 'products' | 'categories' = 'products'): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/admin/uploads?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    const payload = await response.json()
    if (!response.ok || !payload.success) {
      console.error('Upload error:', payload.message || response.statusText)
      return null
    }
    return payload.data.url
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}
