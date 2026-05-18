import { useState, useRef } from 'react';
import { Send, Paperclip, Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatInput({ onSend, isTyping, disabled }) {
    const [text, setText] = useState('');
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim() && !isTyping && !disabled) {
            onSend(text.trim());
            setText('');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-lg shadow-black/5 focus-within:border-solar/50 focus-within:shadow-solar/10 transition-all">
                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isTyping ? "AI is thinking..." : "Type your message..."}
                    disabled={isTyping || disabled}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-gray-900 text-sm placeholder-gray-400 outline-none px-2 py-1.5 max-h-24 overflow-y-auto disabled:opacity-50"
                    style={{ minHeight: '36px' }}
                />

                <div className="flex items-center gap-1">
                    <AnimatePresence mode="wait">
                        {text.trim() ? (
                            <motion.button
                                key="send"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                type="submit"
                                disabled={isTyping || disabled}
                                className="h-9 w-9 rounded-xl bg-solar text-white flex items-center justify-center hover:bg-[#00c958] disabled:opacity-50 transition-all shadow-sm shadow-solar/20"
                            >
                                {isTyping ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </motion.button>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="h-9 w-9 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center"
                            >
                                <Send className="h-4 w-4" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </form>
    );
}
