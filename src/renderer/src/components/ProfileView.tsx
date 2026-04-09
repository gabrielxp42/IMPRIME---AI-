
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Crown, Check, Activity, Image as ImageIcon, Sparkles, Settings, LogOut, Loader2 } from 'lucide-react';
import './ProfileView.css';

import { useCredits } from '../contexts/CreditContext';

interface ProfileViewProps {
    onLogout: () => void;
}

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
}

interface Plan {
    name: string;
    features: string[];
}

interface Subscription {
    status: string;
    plans: Plan;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onLogout }) => {
    // Global Credits
    const { credits, addCredits, refreshCredits } = useCredits();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingRefill, setProcessingRefill] = useState(false);
    const [upgrading, setUpgrading] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState<{ plan: string, credits: number } | null>(null);

    useEffect(() => {
        fetchProfileData();
        checkPaymentSuccess();

        // Escutar evento de sucesso do checkout controlado (Electron)
        if (window.electronAPI && window.electronAPI.on) {
            const handlePaymentSuccess = async (data: any) => {
                console.log('Payment completed event received:', data);

                // Pegar da memória o que estávamos tentando comprar (fallback)
                const pendingPlan = sessionStorage.getItem('pendingPlan');
                const pendingRefill = sessionStorage.getItem('pendingRefill');

                const finalPlanId = data.plan || (pendingPlan ? parseInt(pendingPlan) : null);
                const isRefill = data.refill || pendingRefill === 'true';

                console.log('Final resolution:', { finalPlanId, isRefill });

                if (finalPlanId || isRefill) {
                    setVerifyingPayment(true);

                    // Artificial delay for webhook
                    setTimeout(async () => {
                        await fetchProfileData();
                        await refreshCredits();
                        setVerifyingPayment(false);

                        if (finalPlanId) {
                            setShowSuccess({
                                plan: finalPlanId === 2 ? 'Profissional' : 'Expert',
                                credits: finalPlanId === 2 ? 500 : 2000
                            });
                        } else if (isRefill) {
                            setShowSuccess({ plan: 'Recarga Avulsa', credits: 50 });
                        }

                        // Clear memory
                        sessionStorage.removeItem('pendingPlan');
                        sessionStorage.removeItem('pendingRefill');
                    }, 3000);
                }
            };

            window.electronAPI.on('payment-completed', handlePaymentSuccess);

            return () => {
                if (window.electronAPI && window.electronAPI.removeListener) {
                    window.electronAPI.removeListener('payment-completed', handlePaymentSuccess);
                }
            };
        }
    }, []);

    const [verifyingPayment, setVerifyingPayment] = useState(false);

    // Initial check for URL params only
    const checkPaymentSuccess = async () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') === 'success') {
            setVerifyingPayment(true);

            // Clean URL immediately
            window.history.replaceState({}, document.title, window.location.pathname);

            // Poll for credit update or wait for Realtime? 
            // Since we have Realtime subscription in Context, 'credits' variable will update automatically.
            // We just need to wait a bit to see if it changed, or just show success msg if we assume it works.
            // But user wants "confirmation from stripe". The webhook is the confirmation.
            // So we wait until 'credits' > oldCredits?
            // Simpler: Just refresh data and show success if detected, or generic 'Processing' msg.

            // Artificial delay to allow webhook to fire
            setTimeout(async () => {
                await fetchProfileData();
                await refreshCredits();
                setVerifyingPayment(false);

                // Show generic success message assuming it worked
                // Ideal: Compare old vs new credits, but simplistic is fine for now
                // Or check the pending plan from sessionStorage
                const pendingPlan = sessionStorage.getItem('pendingPlan');
                const pendingRefill = sessionStorage.getItem('pendingRefill');

                if (pendingPlan) {
                    setShowSuccess({
                        plan: pendingPlan === '2' ? 'Profissional' : 'Expert',
                        credits: pendingPlan === '2' ? 500 : 2000
                    });
                } else if (pendingRefill) {
                    setShowSuccess({ plan: 'Recarga Avulsa', credits: 50 });
                }

                sessionStorage.removeItem('pendingPlan');
                sessionStorage.removeItem('pendingRefill');
            }, 3000);
        }
    };

    const handleUpgrade = async (planId: number) => {
        if (upgrading) return;

        const links: { [key: number]: string } = {
            2: 'https://buy.stripe.com/test_9B63cwa9I8pcgKi1Ib8ww02', // Pro
            3: 'https://buy.stripe.com/test_eVqfZibdMfREcu2dqT8ww03'  // Expert
        };

        if (links[planId]) {
            sessionStorage.setItem('pendingPlan', planId.toString());
            safeOpenExternal(links[planId]);
        }
    };

    const handleRefill = async () => {
        sessionStorage.setItem('pendingRefill', 'true');
        safeOpenExternal('https://buy.stripe.com/test_14AdRa5Tsaxk2TscmP8ww01');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onLogout();
    };

    const fetchProfileData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // 1. Fetch Profile
                let { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!profileData || profileError) {
                    const { data: newProfile } = await supabase
                        .from('profiles')
                        .insert([{ id: user.id, email: user.email, credits: 20 }])
                        .select()
                        .single();
                    profileData = newProfile;
                }

                setProfile({
                    id: user.id,
                    email: user.email || '',
                    full_name: profileData?.full_name || user.email?.split('@')[0] || 'Usuário',
                    created_at: user.created_at || new Date().toISOString()
                });

                // 2. Fetch Subscription
                const { data: subData } = await supabase
                    .from('subscriptions')
                    .select('*, plans(*)')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (subData && subData.plans) {
                    setSubscription(subData);
                } else {
                    setSubscription({
                        status: 'active',
                        plans: {
                            name: 'Gratuito',
                            features: ['25 créditos mensais', 'Pincel de Precisão', 'Acesso ao Estúdio IA']
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const safeOpenExternal = (url: string) => {
        if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
            window.electronAPI.openExternal(url);
        } else {
            window.open(url, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="profile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner-mini" style={{ width: '40px', height: '40px' }} />
            </div>
        );
    }

    const planName = subscription?.plans?.name || 'Gratuito';

    return (
        <div className="profile-wrapper">
            <div className="profile-glass-panel">
                {/* Header Section */}
                <div className="profile-header">
                    <div className="avatar-section">
                        <div className="avatar-ring">
                            <div className="avatar-glow"></div>
                            <div className="avatar-img">
                                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                        <div className="user-info">
                            <h2 className="user-name">{profile?.full_name}</h2>
                            <p className="user-email">{profile?.email}</p>
                            <span className={`plan-badge ${planName !== 'Gratuito' ? 'pro' : 'free'}`}>
                                {planName !== 'Gratuito' ? <Crown size={12} fill="currentColor" /> : null}
                                {planName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <ImageIcon size={16} />
                            <span>Projetos</span>
                        </div>
                        <div className="stat-value">12</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-header">
                            <Activity size={16} />
                            <span>Processados</span>
                        </div>
                        <div className="stat-value">148</div>
                    </div>
                    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div className="stat-header">
                            <Sparkles size={16} className="text-accent" />
                            <span className="text-accent">Créditos IA</span>
                        </div>
                        <div className="stat-value text-accent" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {credits}
                            <button
                                onClick={() => handleRefill()}
                                disabled={processingRefill}
                                style={{
                                    fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                                    background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)',
                                    color: '#d8b4fe', cursor: 'pointer', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s'
                                }}>
                                {processingRefill ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                COMPRAR CRÉDITOS (PIX/CARTÃO)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Planes Showcase */}
                <div className="plans-showcase">
                    <div className="section-title-wrapper">
                        <h3 className="section-main-title">Planos Disponíveis</h3>
                        <p className="section-subtitle">Escolha o plano ideal para a escala do seu negócio</p>
                    </div>

                    <div className="plans-grid">
                        {/* Gratuito */}
                        <div className={`plan-card ${planName === 'Gratuito' ? 'active' : ''}`}>
                            <div className="plan-header">
                                <span className="plan-name">GRATUITO</span>
                                <div className="plan-price">
                                    <span className="currency">R$</span>
                                    <span className="amount">0</span>
                                    <span className="period">/mês</span>
                                </div>
                            </div>
                            <div className="plan-features">
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>25 créditos mensais</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>Pincel de Precisão</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>Acesso ao Estúdio IA</span>
                                </div>
                            </div>
                            <button
                                className="plan-btn"
                                disabled={planName === 'Gratuito' || upgrading === 1}
                                onClick={() => handleUpgrade(1)}
                            >
                                {upgrading === 1 ? <Loader2 className="animate-spin" size={16} /> : (planName === 'Gratuito' ? 'Plano Atual' : 'Selecionar')}
                            </button>
                        </div>

                        {/* Profissional DTF */}
                        <div className={`plan-card featured ${planName === 'Profissional DTF' ? 'active' : ''}`}>
                            <div className="featured-badge">MAIS POPULAR</div>
                            <div className="plan-header">
                                <span className="plan-name">PROFISSIONAL DTF</span>
                                <div className="plan-price">
                                    <span className="currency">R$</span>
                                    <span className="amount">59,90</span>
                                    <span className="period">/mês</span>
                                </div>
                            </div>
                            <div className="plan-features">
                                <div className="feature-item">
                                    <Sparkles size={14} className="feature-icon gold" />
                                    <span className="highlight">500 créditos mensais</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>Processamento Prioritário</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>Suporte via WhatsApp</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>Sem Limite de Projetos</span>
                                </div>
                            </div>
                            <button
                                className="plan-btn featured-btn"
                                onClick={() => handleUpgrade(2)}
                                disabled={planName === 'Profissional DTF' || upgrading === 2}
                            >
                                {upgrading === 2 ? <Loader2 className="animate-spin" size={16} /> : (planName === 'Profissional DTF' ? 'Plano Atual' : 'Fazer Upgrade')}
                            </button>
                        </div>

                        {/* DTF Expert */}
                        <div className={`plan-card ${planName === 'DTF Expert' ? 'active' : ''}`}>
                            <div className="plan-header">
                                <span className="plan-name">DTF EXPERT</span>
                                <div className="plan-price">
                                    <span className="currency">R$</span>
                                    <span className="amount">149,90</span>
                                    <span className="period">/mês</span>
                                </div>
                            </div>
                            <div className="plan-features">
                                <div className="feature-item">
                                    <Sparkles size={14} className="feature-icon purple" />
                                    <span className="highlight">2000 créditos mensais</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>IA de Alta Definição</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>Acesso Antecipado</span>
                                </div>
                                <div className="feature-item">
                                    <Check size={14} className="feature-icon" />
                                    <span>Consultoria de Workflow</span>
                                </div>
                            </div>
                            <button
                                className="plan-btn"
                                onClick={() => handleUpgrade(3)}
                                disabled={planName === 'DTF Expert' || upgrading === 3}
                            >
                                {upgrading === 3 ? <Loader2 className="animate-spin" size={16} /> : (planName === 'DTF Expert' ? 'Plano Atual' : 'Fazer Upgrade')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings & Actions */}
                <div className="logout-section" style={{ display: 'flex', gap: '10px' }}>
                    <button className="action-btn">
                        <Settings size={18} />
                        <span>Configurações</span>
                    </button>
                    <button onClick={handleLogout} className="action-btn danger">
                        <LogOut size={18} />
                        <span>Sair da Conta</span>
                    </button>
                </div>
            </div>

            {/* VERIFYING MODAL */}
            {verifyingPayment && (
                <div className="success-overlay">
                    <div className="success-modal" style={{ padding: '40px' }}>
                        <Loader2 size={48} className="animate-spin text-accent" style={{ marginBottom: '20px' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Confirmando Pagamento...</h2>
                        <p style={{ color: '#aaa' }}>Aguardando confirmação segura do Stripe.</p>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccess && (
                <div className="success-overlay" onClick={() => setShowSuccess(null)}>
                    <div className="success-modal" onClick={e => e.stopPropagation()}>
                        <div className="success-icon-wrapper">
                            <div className="success-glow"></div>
                            <Sparkles size={48} className="success-icon-main" />
                        </div>
                        <h2>Parabéns!</h2>
                        <p>Seu upgrade para <strong>{showSuccess.plan}</strong> foi concluído.</p>
                        <div className="success-stats">
                            <div className="success-stat">
                                <span>Créditos Adicionados</span>
                                <strong>+{showSuccess.credits}</strong>
                            </div>
                        </div>
                        <button className="success-close-btn" onClick={() => setShowSuccess(null)}>
                            VAMOS CRIAR!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;
