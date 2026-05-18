import { motion } from 'framer-motion';
import { Bot, User, AlertTriangle } from 'lucide-react';

export function ChatBubble({ message, isLast }) {
    const isUser = message.role === 'user';
    const isEmergency = message.content?.includes('EMERGENCY') || message.ticketData?.priority === 'emergency';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isLast ? 'mb-2' : ''}`}
        >
            {/* Avatar */}
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isUser
                    ? 'bg-solar text-white'
                    : isEmergency
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            }`}>
                {isUser ? <User className="h-4 w-4" /> : isEmergency ? <AlertTriangle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                    ? 'bg-solar text-white rounded-tr-md'
                    : isEmergency
                        ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-md shadow-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-md shadow-sm'
            }`}>
                <div className="whitespace-pre-wrap prose-sm">
                    <FormattedContent content={message.content} />
                </div>
                <div className={`text-[10px] mt-1.5 ${isUser ? 'text-white/60' : 'text-gray-400'} text-right`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Simple Markdown-like Formatting ───────────────────────────
function FormattedContent({ content }) {
    if (!content) return null;

    const parts = content.split(/(\*\*.*?\*\*)/g);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                }
                // Handle bullet points
                const lines = part.split('\n');
                return lines.map((line, j) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                        return (
                            <div key={`${i}-${j}`} className="flex items-start gap-1.5 ml-1 my-0.5">
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-current flex-shrink-0 opacity-50" />
                                <span>{trimmed.slice(2)}</span>
                            </div>
                        );
                    }
                    if (trimmed.match(/^\d+\.\s/)) {
                        return (
                            <div key={`${i}-${j}`} className="flex items-start gap-1.5 ml-1 my-0.5">
                                <span className="font-bold text-xs opacity-60 mt-0.5 flex-shrink-0">{trimmed.match(/^\d+/)[0]}.</span>
                                <span>{trimmed.replace(/^\d+\.\s/, '')}</span>
                            </div>
                        );
                    }
                    if (line === '') return <div key={`${i}-${j}`} className="h-2" />;
                    return <span key={`${i}-${j}`}>{line}{j < lines.length - 1 ? '\n' : ''}</span>;
                });
            })}
        </>
    );
}
