import { supabase } from '../lib/supabase';

export const ticketService = {
    async getTickets(userId, role) {
        let query = supabase.from('tickets').select(`
            *,
            customer:profiles!customer_id(id, name, phone, address, avatar_url),
            technician:profiles!assigned_technician_id(id, name, phone, avatar_url),
            solar_systems(capacity_kw)
        `);

        if (role === 'customer') {
            query = query.eq('customer_id', userId);
        } else if (role === 'technician') {
            query = query.eq('assigned_technician_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            // Fallback for missing relationships or standard query
            const fallbackQuery = supabase.from('tickets').select('*, profiles!customer_id(name), solar_systems(capacity_kw)');
            if (role === 'customer') fallbackQuery.eq('customer_id', userId);
            else if (role === 'technician') fallbackQuery.eq('assigned_technician_id', userId);
            const { data: fallbackData, error: fbError } = await fallbackQuery.order('created_at', { ascending: false });
            if (fbError) throw fbError;
            return fallbackData;
        }
        return data;
    },

    async createTicket(ticketData) {
        const payload = {
            ...ticketData,
            created_at: new Date().toISOString()
        };
        const { error } = await supabase.from('tickets').insert(payload);
        if (error) throw error;
    },

    async updateTicket(ticketId, updates) {
        const payload = { ...updates, updated_at: new Date().toISOString() };
        
        // Auto-set timeline timestamps
        if (updates.assigned_technician_id && !updates.assigned_at) {
            payload.assigned_at = new Date().toISOString();
        }
        if (updates.status === 'in_progress' && !updates.started_at) {
            payload.started_at = new Date().toISOString();
        }
        if (['completed', 'closed', 'resolved'].includes(updates.status) && !updates.completed_at) {
            payload.completed_at = new Date().toISOString();
        }

        const { data: ticketData, error } = await supabase
            .from('tickets')
            .update(payload)
            .eq('id', ticketId)
            .select('customer_id, issue_type, status')
            .maybeSingle();

        if (error) throw error;

        // Auto-notify customer
        if (ticketData?.customer_id) {
            let notificationMessage = `Your ticket #${ticketId.slice(0, 8).toUpperCase()} has been updated to ${updates.status?.toUpperCase() || 'UPDATED'}.`;
            if (updates.assigned_technician_id) {
                notificationMessage = `A technician has been assigned to your service ticket #${ticketId.slice(0, 8).toUpperCase()}.`;
            }
            try {
                await supabase.from('notifications').insert({
                    user_id: ticketData.customer_id,
                    message: notificationMessage,
                    read: false,
                    is_read: false,
                    created_at: new Date().toISOString()
                });
            } catch (notifErr) {
                console.warn('Notification insert notice:', notifErr);
            }
        }
    },

    async deleteTicket(ticketId) {
        const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
        if (error) throw error;
    }
};
