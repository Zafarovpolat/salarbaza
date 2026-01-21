import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yjfyvedavmrdifmepvkh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZnl2ZWRhdm1yZGlmbWVwdmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDg2MTQsImV4cCI6MjA4MTIyNDYxNH0.UsDJzn40bIgofdkbyx_y2ObyDBDDbXJzQZWhFnNjoro'  // Найдите в Supabase Dashboard → Settings → API

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadImage(file: File, folder: string = 'products'): Promise<string | null> {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data, error } = await supabase.storage
            .from('products')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            return null
        }

        // Получаем публичный URL
        const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName)

        return urlData.publicUrl
    } catch (error) {
        console.error('Upload error:', error)
        return null
    }
}