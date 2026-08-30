import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id, currentUser);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id, currentUser);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId, userObj = null) => {
        try {
            const targetUser = userObj || user;
            const targetEmail = targetUser?.email?.trim().toLowerCase();

            let data = null;

            // 1. Check by Email first to preserve pre-onboarded Role, Name, Phone & Address!
            if (targetEmail) {
                const { data: dataByEmail } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('email', targetEmail)
                    .maybeSingle();

                if (dataByEmail) {
                    data = dataByEmail;
                    // Auto-link profile ID to Auth User ID for fast future lookups
                    if (data.id !== userId) {
                        try {
                            await supabase.from('profiles').update({ id: userId }).eq('email', targetEmail);
                            data.id = userId;
                        } catch (linkErr) {
                            console.warn('Profile ID link notice:', linkErr);
                        }
                    }
                }
            }

            // 2. If not found by Email, match by exact Auth ID
            if (!data) {
                const { data: dataById } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();
                if (dataById) data = dataById;
            }

            // 3. If still not found, check customers_master by email
            if (!data && targetEmail) {
                const { data: custData } = await supabase
                    .from('customers_master')
                    .select('*')
                    .ilike('email', targetEmail)
                    .maybeSingle();

                if (custData) {
                    const newProf = {
                        id: userId,
                        name: custData.name,
                        email: custData.email,
                        phone: custData.phone,
                        address: custData.address,
                        role: 'customer',
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${custData.email}`
                    };
                    try {
                        await supabase.from('profiles').upsert(newProf);
                    } catch (upsertErr) {
                        console.warn('Customer profile upsert notice:', upsertErr);
                    }
                    data = newProf;
                }
            }

            // 4. Fallback: Auto-generate profile from Auth user metadata if missing
            if (!data) {
                const defaultRole = targetUser?.user_metadata?.role || 'customer';
                const defaultName = targetUser?.user_metadata?.name || targetEmail?.split('@')[0] || 'Solar Care User';
                const fallbackProf = {
                    id: userId,
                    name: defaultName,
                    email: targetEmail || '',
                    role: defaultRole,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetEmail || userId}`
                };
                try {
                    await supabase.from('profiles').upsert(fallbackProf);
                } catch (err) {
                    console.warn('Fallback profile upsert notice:', err);
                }
                data = fallbackProf;
            }

            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile({
                id: userId,
                role: userObj?.user_metadata?.role || 'customer',
                name: userObj?.user_metadata?.name || 'Solar Care User'
            });
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, metadata) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        if (error) throw error;
        return data;
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id, user);
    };

    return (
        <AuthContext.Provider value={{ user, profile, fetchProfile, refreshProfile, signUp, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
