import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2.5"
        >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="h-2 w-2 rounded-full bg-gray-400"
                            animate={{
                                y: [0, -6, 0],
                                opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                    <span className="text-xs text-gray-400 ml-2 font-medium">Thinking...</span>
                </div>
            </div>
        </motion.div>
    );
}
