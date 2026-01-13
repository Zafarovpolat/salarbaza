import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import WebApp from '@twa-dev/sdk'
import { AppRouter } from './router'

function App() {
    useEffect(() => {
        // Initialize Telegram WebApp
        try {
            WebApp.ready()
            WebApp.expand()
            WebApp.setHeaderColor('#22c55e')
            WebApp.setBackgroundColor('#f9fafb')
        } catch (e) {
            // Not in Telegram environment
        }
    }, [])

    return (
        <BrowserRouter>
            <AppRouter />
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '12px',
                    },
                }}
            />
        </BrowserRouter>
    )
}

export default App