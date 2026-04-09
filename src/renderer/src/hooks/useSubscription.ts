
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Subscription {
    status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';
    plan: {
        name: 'Free' | 'Pro' | 'Enterprise';
        features: string[];
    };
    loading: boolean;
}

const DEFAULT_SUBSCRIPTION: Subscription = {
    status: 'active',
    plan: {
        name: 'Free',
        features: ['Acesso Básico']
    },
    loading: true
};

export const useSubscription = () => {
    const [subscription, setSubscription] = useState<Subscription>(DEFAULT_SUBSCRIPTION);

    useEffect(() => {
        let mounted = true;

        const fetchSubscription = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    if (mounted) setSubscription({ ...DEFAULT_SUBSCRIPTION, loading: false });
                    return;
                }

                const { data: subData, error } = await supabase
                    .from('subscriptions')
                    .select('status, plans(name, features)')
                    .eq('user_id', user.id)
                    .single();

                if (error || !subData) {
                    // Fallback to Free if no record found
                    if (mounted) setSubscription({ ...DEFAULT_SUBSCRIPTION, loading: false });
                } else {
                    // Supabase joins can return object or array depending on relationship (1:1 or 1:many)
                    const planData = Array.isArray(subData.plans) ? subData.plans[0] : subData.plans;

                    if (mounted) {
                        setSubscription({
                            status: subData.status as any,
                            plan: {
                                name: (planData?.name as any) || 'Free',
                                features: planData?.features || []
                            },
                            loading: false
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching subscription:', err);
                if (mounted) setSubscription({ ...DEFAULT_SUBSCRIPTION, loading: false });
            }
        };

        fetchSubscription();

        // Listen to subscription changes (realtime) can be added here later

        return () => {
            mounted = false;
        };
    }, []);

    return subscription;
};
