import { supabase } from '../lib/supabase';

export const technicianAssignmentService = {
    // ─── Smart Assignment: Find Best Technician ────────────────
    async findBestTechnician(category, priority) {
        // 1. Get all available technicians with matching specialization
        const { data: specs, error } = await supabase
            .from('technician_specializations')
            .select('*, profiles!technician_id(name, phone)')
            .eq('category', category)
            .eq('is_available', true)
            .lt('current_load', supabase.rpc ? 5 : 999) // Under max load
            .order('current_load', { ascending: true })  // Least loaded first
            .order('rating', { ascending: false });       // Highest rated

        if (error) throw error;

        let candidates = specs || [];

        // 2. If no category-specific match, get any available technician
        if (candidates.length === 0) {
            const { data: fallback } = await supabase
                .from('technician_specializations')
                .select('*, profiles!technician_id(name, phone)')
                .eq('is_available', true)
                .order('current_load', { ascending: true })
                .order('rating', { ascending: false })
                .limit(5);

            candidates = fallback || [];
        }

        // 3. If still no match, get any technician profile
        if (candidates.length === 0) {
            const { data: techProfiles } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'technician')
                .limit(5);

            if (techProfiles && techProfiles.length > 0) {
                return {
                    technician_id: techProfiles[0].id,
                    technician_name: techProfiles[0].name,
                    estimated_hours: priority === 'emergency' ? 2 : priority === 'high' ? 8 : 24,
                    assignment_reason: 'Fallback assignment — no specialization data',
                };
            }
            return null; // No technicians at all
        }

        // 4. Priority-based selection
        let selected;
        if (priority === 'emergency') {
            // For emergencies, pick the one with lowest current load regardless
            selected = candidates[0];
        } else {
            // For normal, balance load and rating
            // Score = (5 - current_load) * 2 + rating * 3
            candidates.sort((a, b) => {
                const scoreA = (a.max_load - a.current_load) * 2 + (a.rating || 4) * 3;
                const scoreB = (b.max_load - b.current_load) * 2 + (b.rating || 4) * 3;
                return scoreB - scoreA;
            });
            selected = candidates[0];
        }

        // 5. Calculate ETA
        const etaHours = priority === 'emergency' ? 2
            : priority === 'high' ? Math.min(selected.avg_resolution_hours || 12, 12)
            : selected.avg_resolution_hours || 24;

        return {
            technician_id: selected.technician_id,
            technician_name: selected.profiles?.name || 'Technician',
            specialization_id: selected.id,
            estimated_hours: Math.round(etaHours),
            current_load: selected.current_load,
            rating: selected.rating,
            assignment_reason: `Matched by ${category} specialization, load: ${selected.current_load}/${selected.max_load}`,
        };
    },

    // ─── Assign Technician to Ticket ───────────────────────────
    async assignToTicket(ticketId, technicianId, estimatedHours) {
        // 1. Update ticket
        const { error: ticketError } = await supabase
            .from('tickets')
            .update({
                assigned_technician_id: technicianId,
                status: 'assigned',
                estimated_resolution_hours: estimatedHours,
            })
            .eq('id', ticketId);

        if (ticketError) throw ticketError;

        // 2. Increment technician load
        const { data: spec } = await supabase
            .from('technician_specializations')
            .select('current_load')
            .eq('technician_id', technicianId)
            .limit(1)
            .single();

        if (spec) {
            await supabase
                .from('technician_specializations')
                .update({ current_load: (spec.current_load || 0) + 1 })
                .eq('technician_id', technicianId);
        }
    },

    // ─── Auto-Assign (Combined find + assign) ──────────────────
    async autoAssign(ticketId, category, priority) {
        const best = await this.findBestTechnician(category, priority);
        if (!best) return null;

        await this.assignToTicket(ticketId, best.technician_id, best.estimated_hours);
        return best;
    },

    // ─── Release Technician Load ───────────────────────────────
    async releaseLoad(technicianId) {
        const { data: spec } = await supabase
            .from('technician_specializations')
            .select('current_load')
            .eq('technician_id', technicianId)
            .limit(1)
            .single();

        if (spec && spec.current_load > 0) {
            await supabase
                .from('technician_specializations')
                .update({ current_load: spec.current_load - 1 })
                .eq('technician_id', technicianId);
        }
    },
};
