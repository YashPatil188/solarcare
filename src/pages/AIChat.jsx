import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Plus, MessageSquare, Trash2, ChevronLeft, Clock, Loader2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { TicketPrompt } from '../components/chat/TicketPrompt';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useChat } from '../hooks/useChat';
import { supabase } from '../lib/supabase';

export default function AIChat() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [showSidebar, setShowSidebar] = useState(false);
    const [systemId, setSystemId] = useState(null);
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const messagesContainerRef = useRef(null);

    const {
        messages,
        conversationId,
        conversations,
        isTyping,
        pendingTicket,
        sendMessage,
        startNewConversation,
        loadConversation,
        loadConversations,
        createTicketFromChat,
        dismissTicket,
        deleteConversation,
    } = useChat(user?.id, systemId);

    // Fetch system ID
    useEffect(() => {
        if (!user) return;
        supabase
            .from('solar_systems')
            .select('id')
            .eq('customer_id', user.id)
            .single()
            .then(({ data }) => {
                if (data) setSystemId(data.id);
            });
    }, [user]);

    // Load conversations on mount
    useEffect(() => {
        if (user) loadConversations();
    }, [user, loadConversations]);

    // Auto-start a new conversation if none loaded
    useEffect(() => {
        if (user && !conversationId && conversations.length === 0) {
            startNewConversation();
        }
    }, [user, conversationId, conversations]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleCreateTicket = async () => {
        setIsCreatingTicket(true);
        try {
            await createTicketFromChat();
            toast.success('Ticket created successfully!');
        } catch (err) {
            toast.error('Failed to create ticket');
        } finally {
            setIsCreatingTicket(false);
        }
    };

    const handleDeleteConv = async (convId) => {
        await deleteConversation(convId);
        toast.success('Conversation deleted');
    };

    // Quick action buttons for common queries
    const quickActions = [
        { label: '🔧 Troubleshoot Issue', prompt: 'I have a problem with my solar system that I need help troubleshooting.' },
        { label: '🧹 Book Cleaning', prompt: 'I want to schedule a panel cleaning service.' },
        { label: '📋 Raise Complaint', prompt: 'I want to raise a complaint about a problem with my solar setup.' },
        { label: '☀️ Solar Tips', prompt: 'Give me some tips to improve my solar panel efficiency.' },
    ];

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 pb-16">
            {/* Header */}
            <Header
                title={
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <span>SolarCare AI</span>
                    </div>
                }
                rightAction={
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startNewConversation()}
                            className="h-8 w-8"
                            title="New Chat"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="h-8 w-8"
                            title="History"
                        >
                            <Clock className="h-4 w-4" />
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Conversation History Sidebar */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="absolute inset-y-0 left-0 z-20 w-72 bg-white border-r border-gray-200 shadow-xl flex flex-col"
                        >
                            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chat History</span>
                                <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-gray-600">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className={`group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all ${
                                            conv.id === conversationId
                                                ? 'bg-solar/10 border border-solar/20'
                                                : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                        onClick={() => {
                                            loadConversation(conv.id);
                                            setShowSidebar(false);
                                        }}
                                    >
                                        <MessageSquare className={`h-4 w-4 flex-shrink-0 ${
                                            conv.id === conversationId ? 'text-solar' : 'text-gray-400'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{conv.title}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(conv.updated_at).toLocaleDateString()}
                                                {conv.status === 'converted_to_ticket' && ' • 🎫 Ticket'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteConv(conv.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {conversations.length === 0 && (
                                    <p className="text-center text-sm text-gray-400 py-8">No conversations yet</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlay when sidebar open */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 bg-black/20"
                            onClick={() => setShowSidebar(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Messages */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                    >
                        {messages.length === 0 && !isTyping && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-200"
                                >
                                    <Bot className="h-10 w-10 text-white" />
                                </motion.div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">SolarCare AI Assistant</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                        Ask me anything about your solar system, raise complaints, or get expert troubleshooting help.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                                    {quickActions.map((action, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            onClick={() => sendMessage(action.prompt)}
                                            className="text-xs text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-solar/40 hover:bg-solar/5 transition-all text-left font-medium"
                                        >
                                            {action.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <ChatBubble
                                key={msg.id}
                                message={msg}
                                isLast={i === messages.length - 1}
                            />
                        ))}

                        <AnimatePresence>
                            {isTyping && <TypingIndicator />}
                        </AnimatePresence>
                    </div>

                    {/* Ticket Prompt (above input) */}
                    <AnimatePresence>
                        {pendingTicket && (
                            <TicketPrompt
                                ticketData={pendingTicket}
                                onConfirm={handleCreateTicket}
                                onDismiss={dismissTicket}
                                isCreating={isCreatingTicket}
                            />
                        )}
                    </AnimatePresence>

                    {/* Input Area */}
                    <div className="px-4 pb-4 pt-2">
                        <ChatInput
                            onSend={sendMessage}
                            isTyping={isTyping}
                        />
                        <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
                            Powered by Google Gemini • SolarCare AI may occasionally provide inaccurate info
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
