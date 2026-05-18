import { useState, useCallback, useRef } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { chatService } from '../services/chatService';
import { complaintService } from '../services/complaintService';
import { technicianAssignmentService } from '../services/technicianAssignmentService';

export function useChat(userId, systemId) {
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [pendingTicket, setPendingTicket] = useState(null);
    const messagesEndRef = useRef(null);

    // ─── Load Conversations ────────────────────────────────────
    const loadConversations = useCallback(async () => {
        try {
            const data = await chatService.getConversations(userId);
            setConversations(data);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    }, [userId]);

    // ─── Start New Conversation ────────────────────────────────
    const startNewConversation = useCallback(async () => {
        try {
            const conv = await chatService.createConversation(userId);
            setConversationId(conv.id);
            setMessages([]);
            setPendingTicket(null);

            // Add welcome message
            const welcomeMsg = {
                id: 'welcome',
                role: 'assistant',
                content: "Hello! 👋 I'm your SolarCare AI assistant. I can help you with:\n\n• 🔧 **Troubleshooting** solar panel, inverter, or battery issues\n• 🧹 **Scheduling** cleaning and maintenance\n• 📋 **Raising complaints** and tracking tickets\n• ☀️ **Solar education** and subsidy information\n• 🆘 **Emergency support** for urgent issues\n\nHow can I help you today?",
                created_at: new Date().toISOString(),
            };
            setMessages([welcomeMsg]);

            await chatService.saveMessage(conv.id, 'assistant', welcomeMsg.content);
            await loadConversations();

            return conv.id;
        } catch (err) {
            console.error('Failed to start conversation:', err);
        }
    }, [userId, loadConversations]);

    // ─── Load Existing Conversation ────────────────────────────
    const loadConversation = useCallback(async (convId) => {
        try {
            const msgs = await chatService.getMessages(convId);
            setConversationId(convId);
            setMessages(msgs);
            setPendingTicket(null);
        } catch (err) {
            console.error('Failed to load conversation:', err);
        }
    }, []);

    // ─── Send Message ──────────────────────────────────────────
    const sendMessage = useCallback(async (userText) => {
        if (!userText.trim() || isTyping) return;

        let currentConvId = conversationId;

        // Auto-create conversation if none exists
        if (!currentConvId) {
            currentConvId = await startNewConversation();
        }

        // Add user message to UI immediately
        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userText,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            // Save user message to DB
            await chatService.saveMessage(currentConvId, 'user', userText);

            // Build conversation history (last 20 messages for context)
            const history = messages
                .filter(m => m.id !== 'welcome')
                .slice(-20)
                .map(m => ({ role: m.role, content: m.content }));

            // Get AI response
            const response = await sendChatMessage(history, userText);

            // Add AI response to UI
            const aiMsg = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: response.message,
                created_at: new Date().toISOString(),
                ticketData: response.ticketData,
            };
            setMessages(prev => [...prev, aiMsg]);

            // Save AI response to DB
            await chatService.saveMessage(currentConvId, 'assistant', response.message, {
                ticketData: response.ticketData,
            });

            // If AI detected a complaint, set pending ticket
            if (response.ticketData?.should_create_ticket) {
                setPendingTicket({
                    ...response.ticketData,
                    conversationId: currentConvId,
                });
            }

            // Update conversation title from first user message
            if (messages.length <= 1) {
                const title = userText.slice(0, 50) + (userText.length > 50 ? '...' : '');
                await chatService.updateTitle(currentConvId, title);
                await loadConversations();
            }
        } catch (err) {
            console.error('Chat error:', err);
            const errorMsg = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again. If the issue persists, you can call our helpline at 8792015164.",
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    }, [conversationId, messages, isTyping, startNewConversation, loadConversations]);

    // ─── Create Ticket from Pending ────────────────────────────
    const createTicketFromChat = useCallback(async () => {
        if (!pendingTicket) return null;

        try {
            const ticket = await complaintService.createTicketFromChat({
                userId,
                systemId,
                ticketData: pendingTicket,
                conversationId: pendingTicket.conversationId,
            });

            // Try auto-assigning technician
            try {
                const assignment = await technicianAssignmentService.autoAssign(
                    ticket.id,
                    pendingTicket.category,
                    pendingTicket.priority
                );

                if (assignment) {
                    // Notify in chat
                    const assignMsg = {
                        id: `system-${Date.now()}`,
                        role: 'assistant',
                        content: `✅ **Ticket Created Successfully!**\n\n📋 **Ticket ID:** ${ticket.id.slice(0, 8).toUpperCase()}\n🏷️ **Category:** ${pendingTicket.category.replace(/_/g, ' ')}\n⚡ **Priority:** ${pendingTicket.priority.toUpperCase()}\n👨‍🔧 **Assigned to:** ${assignment.technician_name}\n⏱️ **Estimated Resolution:** ${assignment.estimated_hours} hours\n\nYou can track your ticket progress in the **Tickets** section.`,
                        created_at: new Date().toISOString(),
                    };
                    setMessages(prev => [...prev, assignMsg]);
                }
            } catch {
                // Assignment failed but ticket was created
                const noAssignMsg = {
                    id: `system-${Date.now()}`,
                    role: 'assistant',
                    content: `✅ **Ticket Created!** (ID: ${ticket.id.slice(0, 8).toUpperCase()})\n\nOur team will assign a technician shortly. Track progress in the **Tickets** section.`,
                    created_at: new Date().toISOString(),
                };
                setMessages(prev => [...prev, noAssignMsg]);
            }

            setPendingTicket(null);
            return ticket;
        } catch (err) {
            console.error('Failed to create ticket:', err);
            throw err;
        }
    }, [pendingTicket, userId, systemId]);

    // ─── Dismiss Pending Ticket ────────────────────────────────
    const dismissTicket = useCallback(() => {
        setPendingTicket(null);
    }, []);

    // ─── Delete Conversation ───────────────────────────────────
    const deleteConversation = useCallback(async (convId) => {
        try {
            await chatService.deleteConversation(convId);
            if (convId === conversationId) {
                setConversationId(null);
                setMessages([]);
            }
            await loadConversations();
        } catch (err) {
            console.error('Failed to delete conversation:', err);
        }
    }, [conversationId, loadConversations]);

    return {
        messages,
        conversationId,
        conversations,
        isTyping,
        pendingTicket,
        messagesEndRef,
        sendMessage,
        startNewConversation,
        loadConversation,
        loadConversations,
        createTicketFromChat,
        dismissTicket,
        deleteConversation,
    };
}
