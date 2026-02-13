import { supabase } from '../lib/supabase';

export const ticketService = {
    async getTickets(userId, role) {
        let query = supabase.from('tickets').select('*, profiles!customer_id(name), solar_systems(capacity_kw)');

        if (role === 'customer') {
            query = query.eq('customer_id', userId);
        } else if (role === 'technician') {
            query = query.eq('assigned_technician_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createTicket(ticketData) {
        const { error } = await supabase.from('tickets').insert(ticketData);
        if (error) throw error;
    },

    async updateTicket(ticketId, updates) {
        const { error } = await supabase.from('tickets').update(updates).eq('id', ticketId);
        if (error) throw error;
    }
};
