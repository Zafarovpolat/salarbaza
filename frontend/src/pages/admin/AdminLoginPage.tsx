import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function AdminLoginPage() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
                headers: {
                    'X-Admin-Password': password
                }
            })

            if (response.ok) {
                localStorage.setItem('adminPassword', password)
                toast.success('Добро пожаловать!')
                navigate('/admin/dashboard')
            } else {
                toast.error('Неверный пароль')
            }
        } catch (error) {
            toast.error('Ошибка подключения')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Админ-панель</h1>
                    <p className="text-gray-500 mt-1 text-sm">DekorHouse</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Пароль
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-base"
                                placeholder="Введите пароль"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 text-base"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    )
}