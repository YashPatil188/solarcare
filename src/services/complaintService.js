import { supabase } from '../lib/supabase';

export const complaintService = {
    // ─── Create AI-Generated Ticket from Chat ──────────────────
    async createTicketFromChat({ userId, systemId, ticketData, conversationId }) {
        const payload = {
            customer_id: userId,
            system_id: systemId || null,
            issue_type: ticketData.category || 'general',
            category: ticketData.category || 'general',
            description: ticketData.summary || '',
            customer_summary: ticketData.title || '',
            ai_diagnosis: ticketData.diagnosis || '',
            priority: ticketData.priority || 'medium',
            status: 'open',
            ai_generated: true,
            conversation_id: conversationId || null,
            estimated_resolution_hours: ticketData.estimated_resolution_hours || 24,
        };

        const { data, error } = await supabase
            .from('tickets')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // Update conversation to mark as converted
        if (conversationId) {
            await supabase
                .from('chatbot_conversations')
                .update({ status: 'converted_to_ticket', ticket_id: data.id })
                .eq('id', conversationId);
        }

        return data;
    },

    // ─── Create Manual Ticket ──────────────────────────────────
    async createManualTicket({ userId, systemId, category, priority, title, description, photos }) {
        const payload = {
            customer_id: userId,
            system_id: systemId || null,
            issue_type: category,
            category: category,
            description: description,
            customer_summary: title,
            priority: priority || 'medium',
            status: 'open',
            ai_generated: false,
            photos: photos || [],
        };

        const { data, error } = await supabase
            .from('tickets')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ─── Get Customer Tickets ──────────────────────────────────
    async getCustomerTickets(userId, filters = {}) {
        let query = supabase
            .from('tickets')
            .select(`
                *,
                profiles!customer_id(name, phone, address),
                technician:profiles!assigned_technician_id(id, name, phone, avatar_url),
                solar_systems(capacity_kw),
                customer_feedback(rating, review_text)
            `)
            .eq('customer_id', userId);

        if (filters.status && filters.status !== 'all') {
            if (filters.status === 'open') {
                query = query.in('status', ['open', 'raised']);
            } else if (filters.status === 'resolved') {
                query = query.in('status', ['resolved', 'completed', 'closed']);
            } else {
                query = query.eq('status', filters.status);
            }
        }
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    // ─── Get Single Ticket with Full Details ───────────────────
    async getTicketDetails(ticketId) {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                profiles!customer_id(name, phone, address),
                solar_systems(capacity_kw, installation_date),
                ticket_updates(*, profiles!technician_id(name)),
                customer_feedback(*)
            `)
            .eq('id', ticketId)
            .single();

        if (error) throw error;
        return data;
    },

    // ─── Escalate Ticket ───────────────────────────────────────
    async escalateTicket(ticketId) {
        const { error } = await supabase
            .from('tickets')
            .update({
                escalated: true,
                priority: 'high',
                status: 'escalated',
            })
            .eq('id', ticketId);

        if (error) throw error;
    },

    // ─── Resolve Ticket ────────────────────────────────────────
    async resolveTicket(ticketId, resolutionNotes) {
        const { error } = await supabase
            .from('tickets')
            .update({
                status: 'resolved',
                resolution_notes: resolutionNotes,
                resolved_at: new Date().toISOString(),
            })
            .eq('id', ticketId);

        if (error) throw error;
    },

    // ─── Get Ticket Statistics ─────────────────────────────────
    async getTicketStats(userId) {
        const { data, error } = await supabase
            .from('tickets')
            .select('status, priority, category, created_at, resolved_at')
            .eq('customer_id', userId);

        if (error) throw error;

        const tickets = data || [];
        const total = tickets.length;
        const open = tickets.filter(t => ['open', 'raised', 'assigned', 'in_progress'].includes(t.status)).length;
        const resolved = tickets.filter(t => ['resolved', 'closed', 'completed'].includes(t.status)).length;
        const escalated = tickets.filter(t => t.status === 'escalated').length;
        const emergency = tickets.filter(t => t.priority === 'emergency').length;

        // Average resolution time (hours)
        const resolvedTickets = tickets.filter(t => t.resolved_at && t.created_at);
        const avgResolutionHrs = resolvedTickets.length > 0
            ? resolvedTickets.reduce((acc, t) => {
                const diff = new Date(t.resolved_at) - new Date(t.created_at);
                return acc + diff / (1000 * 60 * 60);
            }, 0) / resolvedTickets.length
            : 0;

        // Category breakdown
        const categoryBreakdown = {};
        tickets.forEach(t => {
            const cat = t.category || t.issue_type || 'general';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        });

        return {
            total,
            open,
            resolved,
            escalated,
            emergency,
            avgResolutionHrs: Math.round(avgResolutionHrs),
            categoryBreakdown,
        };
    },
};
