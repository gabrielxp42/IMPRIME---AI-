import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface CreditContextType {
    credits: number;
    loading: boolean;
    refreshCredits: () => Promise<void>;
    deductCost: (cost: number) => Promise<boolean>;
    addCredits: (amount: number) => Promise<boolean>; // For refill
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshCredits = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                setCredits(data.credits || 0);
            }
        } catch (error) {
            console.error('Error fetching credits:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load initial credits and listen for Auth changes
    useEffect(() => {
        refreshCredits();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                refreshCredits();
            } else if (event === 'SIGNED_OUT') {
                setCredits(0); // Clear sensitive data
            }
        });

        // Subscribe to changes in real-time
        const subscription = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                const newCredits = (payload.new as any).credits;
                if (typeof newCredits === 'number') {
                    // Ideally we should check if this update belongs to the current user
                    // But Supabase RLS should prevent receiving others' data
                    refreshCredits(); // Safer to refetch to be sure, or use payload if RLS is trusted
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
            authListener.subscription.unsubscribe();
        };
    }, []);

    const deductCost = async (cost: number): Promise<boolean> => {
        // 1. Optimistic check
        if (credits < cost) return false;

        try {
            // 2. Secure RPC deduction
            const { error } = await supabase.rpc('deduct_credits', { amount: cost });
            if (error) throw error;

            // 3. Update local state (Optimistic or wait for subscription)
            // waiting for subscription might have slight delay, but is safer. 
            // We can optimistic update for invalidation protection.
            refreshCredits();
            return true;
        } catch (error) {
            console.error('Deduction failed:', error);
            return false;
        }
    };

    const addCredits = async (amount: number): Promise<boolean> => {
        try {
            const { error } = await supabase.rpc('add_credits', { amount });
            if (error) throw error;
            refreshCredits();
            return true;
        } catch (err) {
            console.error('Add credits failed:', err);
            return false;
        }
    };

    return (
        <CreditContext.Provider value={{ credits, loading, refreshCredits, deductCost, addCredits }}>
            {children}
        </CreditContext.Provider>
    );
};

export const useCredits = () => {
    const context = useContext(CreditContext);
    if (context === undefined) {
        throw new Error('useCredits must be used within a CreditProvider');
    }
    return context;
};
