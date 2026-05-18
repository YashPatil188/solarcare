import { supabase } from '../lib/supabase';

export const chatService = {
    // ─── Create New Conversation ───────────────────────────────
    async createConversation(userId, title = 'New Conversation') {
        const { data, error } = await supabase
            .from('chatbot_conversations')
            .insert({ user_id: userId, title })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ─── Get User Conversations ────────────────────────────────
    async getConversations(userId) {
        const { data, error } = await supabase
            .from('chatbot_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ─── Get Conversation Messages ─────────────────────────────
    async getMessages(conversationId) {
        const { data, error } = await supabase
            .from('chatbot_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // ─── Save Message ──────────────────────────────────────────
    async saveMessage(conversationId, role, content, metadata = {}) {
        const { data, error } = await supabase
            .from('chatbot_messages')
            .insert({
                conversation_id: conversationId,
                role,
                content,
                metadata,
            })
            .select()
            .single();

        if (error) throw error;

        // Update conversation's message count and timestamp
        await supabase
            .from('chatbot_conversations')
            .update({
                message_count: supabase.rpc ? undefined : undefined, // handled by trigger
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);

        return data;
    },

    // ─── Update Conversation Title ─────────────────────────────
    async updateTitle(conversationId, title) {
        const { error } = await supabase
            .from('chatbot_conversations')
            .update({ title })
            .eq('id', conversationId);

        if (error) throw error;
    },

    // ─── Delete Conversation ───────────────────────────────────
    async deleteConversation(conversationId) {
        const { error } = await supabase
            .from('chatbot_conversations')
            .delete()
            .eq('id', conversationId);

        if (error) throw error;
    },

    // ─── Archive Conversation ──────────────────────────────────
    async archiveConversation(conversationId) {
        const { error } = await supabase
            .from('chatbot_conversations')
            .update({ status: 'archived' })
            .eq('id', conversationId);

        if (error) throw error;
    },
};
