import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import WebApp from '@twa-dev/sdk'
import { AppRouter } from './router'
import { Layout } from './components/layout/Layout'

function App() {
    useEffect(() => {
        // Initialize Telegram WebApp
        WebApp.ready()
        WebApp.expand()

        // Set header color
        WebApp.setHeaderColor('#22c55e')
        WebApp.setBackgroundColor('#f9fafb')
    }, [])

    return (
        <BrowserRouter>
            <Layout>
                <AppRouter />
            </Layout>
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