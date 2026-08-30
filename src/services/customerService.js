import { supabase } from '../lib/supabase';
import { cleanPhone } from '../utils/phone';

export const customerService = {
    async getCustomers(status = 'all') {
        let query = supabase.from('customers_master').select('*');

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addCustomer(customerData) {
        const formattedPhone = cleanPhone(customerData.phone);
        const targetEmail = customerData.email?.trim().toLowerCase();

        if (targetEmail) {
            // Clean up any stale pre-registration record with the exact same email
            try {
                await supabase.from('customers_master').delete().eq('email', targetEmail);
            } catch (cleanupErr) {
                console.warn('Pre-onboarding cleanup notice:', cleanupErr);
            }
        }

        const payload = {
            name: customerData.name,
            email: targetEmail,
            phone: formattedPhone,
            address: customerData.address,
            system_capacity_kw: customerData.system_capacity_kw || 5.0,
            installation_date: customerData.installation_date || new Date().toISOString(),
            amc_status: customerData.amc_status || 'active',
            amc_valid_until: customerData.amc_valid_until || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            status: 'verified'
        };

        // Try adding role if table column exists
        if (customerData.role) {
            payload.role = customerData.role;
        }

        let insertedCustomer = null;
        let { data, error } = await supabase
            .from('customers_master')
            .insert(payload)
            .select()
            .maybeSingle();

        if (error && error.message?.includes('role')) {
            // Fallback without role column if column not added yet
            delete payload.role;
            const res = await supabase
                .from('customers_master')
                .insert(payload)
                .select()
                .maybeSingle();
            data = res.data;
            error = res.error;
        }

        if (error) {
            console.error('Error inserting into customers_master:', error);
            throw new Error(error.message || 'Failed to onboard user.');
        }

        insertedCustomer = data || { id: crypto.randomUUID(), email: targetEmail, name: customerData.name, phone: formattedPhone, address: customerData.address, role: customerData.role };

        return insertedCustomer;
    },

    async verifyCustomer(customerId) {
        const { error } = await supabase
            .from('customers_master')
            .update({ status: 'verified' })
            .eq('id', customerId);
        if (error) throw error;
    },

    async deleteCustomer(customerId) {
        try {
            // 1. Get customer record to obtain email
            const { data: targetCust } = await supabase
                .from('customers_master')
                .select('id, email')
                .eq('id', customerId)
                .maybeSingle();

            const custEmail = targetCust?.email;

            // 2. Cascade delete from tickets & notifications
            if (customerId) {
                await supabase.from('tickets').delete().eq('customer_id', customerId);
                await supabase.from('notifications').delete().eq('user_id', customerId);
                await supabase.from('amc_subscriptions').delete().eq('user_id', customerId);
            }

            // 3. Delete from customers_master (by id & by email)
            if (customerId) await supabase.from('customers_master').delete().eq('id', customerId);
            if (custEmail) await supabase.from('customers_master').delete().eq('email', custEmail);

            // 4. Delete from profiles (by id & by email)
            if (customerId) await supabase.from('profiles').delete().eq('id', customerId);
            if (custEmail) await supabase.from('profiles').delete().eq('email', custEmail);

        } catch (err) {
            console.error('Error in deleteCustomer cascade:', err);
            throw err;
        }
    },

    async deleteProfile(userId) {
        try {
            // 1. Get profile details to obtain email
            const { data: targetProfile } = await supabase
                .from('profiles')
                .select('id, email, name')
                .eq('id', userId)
                .maybeSingle();

            const userEmail = targetProfile?.email;

            // 2. Cascade delete from tickets where customer_id or assigned_technician_id
            if (userId) {
                await supabase.from('tickets').delete().or(`customer_id.eq.${userId},assigned_technician_id.eq.${userId}`);
                await supabase.from('notifications').delete().eq('user_id', userId);
                await supabase.from('amc_subscriptions').delete().eq('user_id', userId);
            }

            // 3. Delete from customers_master (by id & by email)
            if (userId) await supabase.from('customers_master').delete().eq('id', userId);
            if (userEmail) await supabase.from('customers_master').delete().eq('email', userEmail);

            // 4. Delete from profiles (by id & by email)
            if (userId) await supabase.from('profiles').delete().eq('id', userId);
            if (userEmail) await supabase.from('profiles').delete().eq('email', userEmail);

        } catch (err) {
            console.error('Error in deleteProfile cascade:', err);
            throw err;
        }
    },

    async updateProfile(userId, updates) {
        const payload = { ...updates };
        if (payload.phone) {
            payload.phone = cleanPhone(payload.phone);
        }
        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', userId);
        if (error) throw error;
    }
};
