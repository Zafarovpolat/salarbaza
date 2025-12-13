import { motion } from 'framer-motion'

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
            >
                {/* Logo */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mb-4"
                >
                    <span className="text-white font-bold text-3xl">D</span>
                </motion.div>

                {/* Loading dots */}
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -8, 0],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                            className="w-2 h-2 bg-primary-500 rounded-full"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    )
}