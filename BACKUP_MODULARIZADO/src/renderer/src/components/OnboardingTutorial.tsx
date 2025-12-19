import React, { useState } from 'react';
import './OnboardingTutorial.css';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isOpen, onClose, onGoToSettings }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Bem-vindo ao Spot White Automation! 🎨',
      content: 'Este é um sistema de automação para processar imagens no Photoshop com inteligência artificial.',
      icon: '👋'
    },
    {
      title: 'Configuração Inicial Necessária',
      content: 'Antes de começar, você precisa configurar a Chave API do Google Gemini. Ela é essencial para:\n\n• Processar arquivos com IA\n• Usar o assistente virtual\n• Obter explicações inteligentes de erros',
      icon: '🔑',
      highlight: 'settings'
    },
    {
      title: 'Como Obter a Chave API',
      content: '1. Acesse: https://makersuite.google.com/app/apikey\n2. Faça login com sua conta Google\n3. Clique em "Criar chave API"\n4. Copie a chave gerada\n5. Cole na seção de Configurações',
      icon: '📝'
    },
    {
      title: 'Pronto para Começar!',
      content: 'Agora você pode:\n\n• Selecionar arquivos para processar\n• Usar o assistente virtual para tirar dúvidas\n• Processar imagens automaticamente\n\nVamos configurar a chave API agora?',
      icon: '🚀',
      action: 'settings'
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onGoToSettings();
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-icon">{currentStepData.icon}</div>
          <h2>{currentStepData.title}</h2>
          <button className="onboarding-close" onClick={onClose}>×</button>
        </div>

        <div className="onboarding-body">
          <div className="onboarding-content">
            {currentStepData.content.split('\n').map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < currentStepData.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>

          <div className="onboarding-progress">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="onboarding-footer">
          <button className="onboarding-button onboarding-button-skip" onClick={handleSkip}>
            Pular
          </button>
          <button className="onboarding-button onboarding-button-primary" onClick={handleNext}>
            {isLastStep ? 'Ir para Configurações' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;

