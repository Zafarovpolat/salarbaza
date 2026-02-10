import { motion } from 'framer-motion'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-cream z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          <span className="font-display text-4xl font-semibold text-forest">
            Decor<span className="text-sage font-normal">house</span>
          </span>
        </motion.div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-2 h-2 bg-forest rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}