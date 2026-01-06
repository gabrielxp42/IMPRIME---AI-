
import React from 'react';
import './HomeView.css';

interface HomeViewProps {
    onNavigate: (view: 'spotwhite' | 'upscayl' | 'editor' | 'mockups' | 'tools') => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
    return (
        <div className="home-view">
            <div className="home-header">
                <h1>O que vamos criar hoje?</h1>
                <p>Selecione uma ferramenta para começar o seu fluxo de trabalho.</p>
            </div>

            <div className="bento-grid">
                <div className="bento-card main" onClick={() => onNavigate('spotwhite')}>
                    <div className="card-icon">🖨️</div>
                    <div className="card-content">
                        <h3>Spot White Automático</h3>
                        <p>Prepare seus arquivos para DTF com um clique. Validação de DPI e separação de cores branca automática.</p>
                    </div>
                    <div className="card-badge">Novo Motor v2</div>
                </div>

                <div className="bento-card secondary" onClick={() => onNavigate('upscayl')}>
                    <div className="card-icon">🚀</div>
                    <div className="card-content">
                        <h3>IA Upscayl</h3>
                        <p>Aumente a resolução de suas imagens em até 8x sem perder a qualidade usando inteligência artificial.</p>
                    </div>
                </div>

                <div className="bento-card secondary" onClick={() => onNavigate('editor')}>
                    <div className="card-icon">✏️</div>
                    <div className="card-content">
                        <h3>Editor Pro</h3>
                        <p>Editor completo com camadas, remoção de fundo e ferramentas inteligentes.</p>
                    </div>
                </div>

                <div className="bento-card accent" onClick={() => onNavigate('mockups')}>
                    <div className="card-icon">👕</div>
                    <div className="card-content">
                        <h3>IA Mockups</h3>
                        <p>Gere visualizações realistas de seus designs em camisetas e produtos usando IA.</p>
                    </div>
                </div>

                <div className="bento-card accent" onClick={() => onNavigate('tools')}>
                    <div className="card-icon">🎨</div>
                    <div className="card-content">
                        <h3>Efeitos e Halftone</h3>
                        <p>Aplique retículas de meio-tom e efeitos especializados para estamparia.</p>
                    </div>
                </div>
            </div>

            <div className="home-footer">
                <div className="status-item">
                    <span className="dot online"></span>
                    IA Conectada
                </div>
                <div className="status-item">
                    <span className="dot online"></span>
                    Servidor de Processamento Ativo
                </div>
            </div>
        </div>
    );
};

export default HomeView;
