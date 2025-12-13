import { useEffect, useState, useCallback } from 'react'
import WebApp from '@twa-dev/sdk'

interface TelegramUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
}

export function useTelegram() {
    const [user, setUser] = useState<TelegramUser | null>(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        // Initialize WebApp
        WebApp.ready()
        WebApp.expand()

        // Get user data
        if (WebApp.initDataUnsafe?.user) {
            setUser(WebApp.initDataUnsafe.user)
        }

        setIsReady(true)
    }, [])

    // Show main button
    const showMainButton = useCallback((text: string, onClick: () => void) => {
        WebApp.MainButton.setText(text)
        WebApp.MainButton.onClick(onClick)
        WebApp.MainButton.show()
    }, [])

    // Hide main button
    const hideMainButton = useCallback(() => {
        WebApp.MainButton.hide()
    }, [])

    // Show back button
    const showBackButton = useCallback((onClick: () => void) => {
        WebApp.BackButton.onClick(onClick)
        WebApp.BackButton.show()
    }, [])

    // Hide back button
    const hideBackButton = useCallback(() => {
        WebApp.BackButton.hide()
    }, [])

    // Show confirm dialog
    const showConfirm = useCallback((message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            WebApp.showConfirm(message, (confirmed) => {
                resolve(confirmed)
            })
        })
    }, [])

    // Show alert
    const showAlert = useCallback((message: string): Promise<void> => {
        return new Promise((resolve) => {
            WebApp.showAlert(message, () => {
                resolve()
            })
        })
    }, [])

    // Haptic feedback
    const haptic = useCallback({
        impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
            WebApp.HapticFeedback.impactOccurred(style)
        },
        notification: (type: 'error' | 'success' | 'warning') => {
            WebApp.HapticFeedback.notificationOccurred(type)
        },
        selection: () => {
            WebApp.HapticFeedback.selectionChanged()
        },
    }, [])

    // Close app
    const close = useCallback(() => {
        WebApp.close()
    }, [])

    return {
        user,
        isReady,
        colorScheme: WebApp.colorScheme,
        themeParams: WebApp.themeParams,
        initData: WebApp.initData,
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