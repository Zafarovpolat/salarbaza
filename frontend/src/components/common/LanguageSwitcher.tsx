import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { cn } from '@/utils/helpers'

const languages = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
] as const

export function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false)
    const { language, setLanguage } = useLanguageStore()

    const currentLang = languages.find(l => l.code === language)

    return (
        <div className="relative">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                    'bg-gray-100 hover:bg-gray-200 transition-colors',
                    'text-sm font-medium text-gray-700'
                )}
            >
                <Globe className="w-4 h-4" />
                <span>{language.toUpperCase()}</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl 
                       shadow-lg border border-gray-100 overflow-hidden min-w-[140px]"
                        >
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-2.5',
                                        'hover:bg-gray-50 transition-colors',
                                        language === lang.code && 'bg-primary-50'
                                    )}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span className={cn(
                                        'text-sm',
                                        language === lang.code ? 'font-medium text-primary-600' : 'text-gray-700'
                                    )}>
                                        {lang.label}
                                    </span>
                                    {language === lang.code && (
                                        <Check className="w-4 h-4 text-primary-500 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}