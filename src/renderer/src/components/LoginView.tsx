
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
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
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: email.split('@')[0], // Default name
                        }
                    }
                });
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
            <div className="login-bg-orb orb-1"></div>
            <div className="login-bg-orb orb-2"></div>

            <div className="login-content-wrapper">
                {/* Left Panel - Brand */}
                <div className="login-left-panel">
                    <div className="brand-large">
                        <div className="brand-icon">🎨</div>
                        <h1 className="brand-title">IMPRIME <span>AI</span></h1>
                        <p className="brand-description">
                            Sua plataforma inteligente de design e automação.
                            Crie, edite e transforme com o poder da Inteligência Artificial.
                        </p>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="login-right-panel">
                    <div className="form-header">
                        <h2>{isRegistering ? 'Criar Conta' : 'Bem-vindo'}</h2>
                        <p>{isRegistering ? 'Preencha os dados abaixo' : 'Entre com suas credenciais'}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className={`message-box ${error.includes('criada') ? 'success' : 'error'}`}>
                                {error.includes('criada') ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="input-container">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    className="custom-input"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-container">
                            <label>Senha</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type="password"
                                    className="custom-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Processando...' : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {isRegistering ? 'Cadastrar' : 'Acessar Plataforma'}
                                    <ArrowRight size={18} />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="toggle-section">
                        {isRegistering ? 'Já tem uma conta?' : 'Novo por aqui?'}
                        <button onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError(null);
                        }} className="toggle-link">
                            {isRegistering ? 'Fazer Login' : 'Criar uma conta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
