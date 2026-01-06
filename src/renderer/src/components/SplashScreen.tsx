
import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Inicializando módulos de IA...');
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => {
                        setShow(false);
                        setTimeout(onComplete, 500); // Wait for exit animation
                    }, 500);
                    return 100;
                }

                // Simular carregamento de etapas
                if (prev === 20) setStatus('Carregando modelos de Upscaling...');
                if (prev === 45) setStatus('Conectando ao Supabase...');
                if (prev === 70) setStatus('Preparando Editor Gráfico...');
                if (prev === 90) setStatus('Finalizando...');

                return prev + 1.5; // Velocidade do carregamento
            });
        }, 30);

        return () => clearInterval(timer);
    }, [onComplete]);

    if (!show) return null;

    return (
        <div className={`splash-screen ${progress >= 100 ? 'fade-out' : ''}`}>
            <div className="splash-content">
                <div className="logo-container">
                    <div className="logo-icon-large">🎨</div>
                    <div className="logo-glow"></div>
                </div>

                <h1 className="app-title-large">
                    IMPRIME <span className="highlight">AI</span>
                </h1>
                <p className="app-subtitle">Automated Design Intelligence</p>

                <div className="loading-container">
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="status-text">
                        <span>{status}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>

                <div className="version-tag">v1.0.1 Stable</div>
            </div>
        </div>
    );
};

export default SplashScreen;
