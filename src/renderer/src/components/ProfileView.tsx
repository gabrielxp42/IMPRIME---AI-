
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './ProfileView.css';

interface ProfileViewProps {
    onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onLogout }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onLogout();
    };

    if (loading) return <div className="profile-loading">Carregando perfil...</div>;

    return (
        <div className="profile-wrapper">
            <div className="profile-header">
                <div className="avatar-large">
                    {user?.email?.charAt(0).toUpperCase()}
                </div>
                <h2>{user?.email}</h2>
                <span className="badge-premium">Usuário Beta</span>
            </div>

            <div className="profile-content">
                <div className="settings-section">
                    <h3>Sua Conta</h3>
                    <div className="info-row">
                        <span>ID do Usuário:</span>
                        <code>{user?.id}</code>
                    </div>
                    <div className="info-row">
                        <span>Membro desde:</span>
                        <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Assinatura</h3>
                    <p>Você está no plano gratuito. Upgrade em breve.</p>
                </div>

                <button onClick={handleLogout} className="logout-btn">
                    🚪 Sair da Conta
                </button>
            </div>
        </div>
    );
};

export default ProfileView;
