import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { preloadPromotions } from '@/components/home/PromotionWidget'

// Прелоадим акции до маунта React — запрос летит параллельно с разбором JS
preloadPromotions().catch(() => {
    // Silently fail
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)