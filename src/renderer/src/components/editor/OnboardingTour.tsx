/**
 * OnboardingTour - Tour interativo para novos usuários
 * Guia visual destacando recursos do editor
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Sparkles,
    MousePointer2,
    Wand2,
    MessageCircle,
    Layers,
    X,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import './OnboardingTour.css';

interface TourStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    target?: string; // CSS selector do elemento alvo
    position: 'center' | 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao Spot White Editor! ✨',
        description: 'Um editor de imagens profissional com IA integrada. Vamos fazer um tour rápido pelos principais recursos.',
        icon: <Sparkles size={32} />,
        position: 'center'
    },
    {
        id: 'toolbar',
        title: 'Barra de Ferramentas',
        description: 'Aqui você encontra as ferramentas principais: adicionar imagens, remover fundo com IA, melhorar qualidade, e muito mais.',
        icon: <MousePointer2 size={32} />,
        target: '.editor-toolbar',
        position: 'bottom-center'
    },
    {
        id: 'canvas',
        title: 'Área de Trabalho',
        description: 'Arraste imagens para cá ou use a ferramenta de adicionar. Você pode mover, redimensionar e rotacionar elementos livremente.',
        icon: <Layers size={32} />,
        target: '.canvas-container',
        position: 'center'
    },
    {
        id: 'magic-bar',
        title: 'Sua Designer IA',
        description: 'Converse naturalmente! Diga "duplica 4 vezes", "preenche a folha A4", ou "remove o fundo". A Spot entende e executa.',
        icon: <MessageCircle size={32} />,
        target: '.magic-bar-overlay',
        position: 'top-center'
    },
    {
        id: 'shortcuts',
        title: 'Atalhos de Teclado',
        description: 'Ctrl+Z para desfazer, Ctrl+D para duplicar, Delete para excluir. Pressione "?" para ver todos os atalhos.',
        icon: <Wand2 size={32} />,
        position: 'center'
    }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

    const step = TOUR_STEPS[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === TOUR_STEPS.length - 1;

    // Calcula a posição do highlight
    useEffect(() => {
        if (!isOpen || !step.target) {
            setHighlightRect(null);
            return;
        }

        const targetEl = document.querySelector(step.target);
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            setHighlightRect(rect);
        }
    }, [isOpen, step, currentStep]);

    const handleNext = useCallback(() => {
        if (isLast) {
            onComplete();
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    }, [isLast, onComplete, onClose]);

    const handlePrev = useCallback(() => {
        if (!isFirst) {
            setCurrentStep(prev => prev - 1);
        }
    }, [isFirst]);

    const handleSkip = useCallback(() => {
        onClose();
    }, [onClose]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleSkip();
            if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleNext, handlePrev, handleSkip]);

    if (!isOpen) return null;

    const getTooltipPosition = () => {
        if (step.position === 'center') {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            };
        }
        if (highlightRect) {
            const padding = 20;
            switch (step.position) {
                case 'bottom-center':
                    return {
                        top: highlightRect.bottom + padding,
                        left: highlightRect.left + highlightRect.width / 2,
                        transform: 'translateX(-50%)'
                    };
                case 'top-center':
                    return {
                        bottom: window.innerHeight - highlightRect.top + padding,
                        left: highlightRect.left + highlightRect.width / 2,
                        transform: 'translateX(-50%)'
                    };
                default:
                    return {};
            }
        }
        return {};
    };

    return (
        <>
            <div
                className={`onboarding-overlay ${highlightRect ? 'has-highlight' : ''}`}
                style={{
                    '--hole-x': `${highlightRect ? highlightRect.left - 8 : 0}px`,
                    '--hole-y': `${highlightRect ? highlightRect.top - 8 : 0}px`,
                    '--hole-w': `${highlightRect ? highlightRect.width + 16 : 0}px`,
                    '--hole-h': `${highlightRect ? highlightRect.height + 16 : 0}px`,
                } as React.CSSProperties}
            />

            <div className="onboarding-tour-ui" role="dialog" aria-modal="true" aria-label="Tour de introdução">
                {/* Spotlight Cutout (Borda/Brilho) */}
                {highlightRect && (
                    <div
                        className="spotlight-cutout"
                        style={{
                            top: highlightRect.top - 8,
                            left: highlightRect.left - 8,
                            width: highlightRect.width + 16,
                            height: highlightRect.height + 16
                        }}
                    />
                )}

                {/* Tooltip Card */}
                <div className="tour-tooltip" style={getTooltipPosition()}>
                    <button
                        className="tour-close"
                        onClick={handleSkip}
                        aria-label="Pular tour"
                    >
                        <X size={18} />
                    </button>

                    <div className="tour-icon" aria-hidden="true">
                        {step.icon}
                    </div>

                    <h3 className="tour-title">{step.title}</h3>
                    <p className="tour-description">{step.description}</p>

                    {/* Progress Dots */}
                    <div className="tour-progress" role="navigation" aria-label="Progresso do tour">
                        {TOUR_STEPS.map((_, idx) => (
                            <button
                                key={idx}
                                className={`progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                                onClick={() => setCurrentStep(idx)}
                                aria-label={`Passo ${idx + 1} de ${TOUR_STEPS.length}`}
                                aria-current={idx === currentStep ? 'step' : undefined}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="tour-actions">
                        {!isFirst && (
                            <button className="tour-btn secondary" onClick={handlePrev}>
                                <ChevronLeft size={16} />
                                Anterior
                            </button>
                        )}
                        <button className="tour-btn primary" onClick={handleNext}>
                            {isLast ? 'Começar!' : 'Próximo'}
                            {!isLast && <ChevronRight size={16} />}
                        </button>
                    </div>

                    <p className="tour-hint">
                        Use as setas do teclado para navegar • ESC para pular
                    </p>
                </div>
            </div>
        </>
    );
};

export default OnboardingTour;
