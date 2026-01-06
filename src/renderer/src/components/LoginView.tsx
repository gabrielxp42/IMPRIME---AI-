
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './LoginView.css';

interface LoginViewProps {
    onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        // Verificar se já existe uma sessão ativa
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) onLoginSuccess();
        });
    }, [onLoginSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isRegistering) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setError('Conta criada! Verifique seu email para confirmar.');
                setIsRegistering(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onLoginSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">🎨</div>
                    <h1>IMPRIME - AI</h1>
                    <p>{isRegistering ? 'Crie sua conta para começar' : 'Bem-vindo de volta!'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className={`message-banner ${error.includes('criada') ? 'success' : 'error'}`}>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <span className="spinner"></span> : (isRegistering ? 'Criar Conta' : 'Entrar')}
                    </button>
                </form>

                <div className="login-footer">
                    <button onClick={() => setIsRegistering(!isRegistering)} className="toggle-btn">
                        {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Registre-se'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
