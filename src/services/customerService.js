import { supabase } from '../lib/supabase';

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
        // Default status is 'pre_registered' for new adds
        const payload = { ...customerData, status: 'pre_registered' };
        const { error } = await supabase.from('customers_master').insert(payload);
        if (error) throw error;
    },

    async verifyCustomer(customerId) {
        const { error } = await supabase
            .from('customers_master')
            .update({ status: 'verified' })
            .eq('id', customerId);
        if (error) throw error;
    }
};
