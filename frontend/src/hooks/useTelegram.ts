import { useEffect, useState, useCallback, useMemo } from 'react'
import WebApp from '@twa-dev/sdk'

interface TelegramUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
}

interface HapticFeedback {
    impact: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notification: (type: 'error' | 'success' | 'warning') => void
    selection: () => void
}

export function useTelegram() {
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        try {
            WebApp.ready()
            WebApp.expand()

            if (WebApp.initDataUnsafe?.user) {
                setUser(WebApp.initDataUnsafe.user)
            }

            setIsReady(true)
        } catch (error) {
            console.warn('Telegram WebApp not available:', error)
            setIsReady(true)
        }
    }, [])

    const showMainButton = useCallback((text: string, onClick: () => void) => {
        try {
            WebApp.MainButton.setText(text)
            WebApp.MainButton.onClick(onClick)
            WebApp.MainButton.show()
        } catch (error) {
            console.warn('MainButton not available')
        }
    }, [])

    const hideMainButton = useCallback(() => {
        try {
            WebApp.MainButton.hide()
        } catch (error) {
            console.warn('MainButton not available')
        }
    }, [])

    const showBackButton = useCallback((onClick: () => void) => {
        try {
            WebApp.BackButton.onClick(onClick)
            WebApp.BackButton.show()
        } catch (error) {
            console.warn('BackButton not available')
        }
    }, [])

    const hideBackButton = useCallback(() => {
        try {
            WebApp.BackButton.hide()
        } catch (error) {
            console.warn('BackButton not available')
        }
    }, [])

    const showConfirm = useCallback((message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            try {
                WebApp.showConfirm(message, (confirmed) => {
                    resolve(confirmed)
                })
            } catch (error) {
                // Fallback to browser confirm
                resolve(window.confirm(message))
            }
        })
    }, [])

    const showAlert = useCallback((message: string): Promise<void> => {
        return new Promise((resolve) => {
            try {
                WebApp.showAlert(message, () => {
                    resolve()
                })
            } catch (error) {
                // Fallback to browser alert
                window.alert(message)
                resolve()
            }
        })
    }, [])

    // ✅ Haptic как объект с методами
    const haptic: HapticFeedback = useMemo(() => ({
        impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
            try {
                WebApp.HapticFeedback.impactOccurred(style)
            } catch (error) {
                // Haptic not available
            }
        },
        notification: (type: 'error' | 'success' | 'warning') => {
            try {
                WebApp.HapticFeedback.notificationOccurred(type)
            } catch (error) {
                // Haptic not available
            }
        },
        selection: () => {
            try {
                WebApp.HapticFeedback.selectionChanged()
            } catch (error) {
                // Haptic not available
            }
        },
    }), [])

    const close = useCallback(() => {
        try {
            WebApp.close()
        } catch (error) {
            console.warn('Close not available')
        }
    }, [])

    return {
        user,
        isReady,
        colorScheme: WebApp.colorScheme || 'light',
        themeParams: WebApp.themeParams || {},
        initData: WebApp.initData || '',
        showMainButton,
        hideMainButton,
        showBackButton,
        hideBackButton,
        showConfirm,
        showAlert,
        haptic,
        close,
    }
}