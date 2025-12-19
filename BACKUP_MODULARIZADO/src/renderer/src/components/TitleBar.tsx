import React from 'react';
import './TitleBar.css';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="title-bar">
      <div className="title-bar-drag-region">
        <div className="title-bar-content">
          <div className="title-bar-left">
            <div className="app-icon">🎨</div>
            <span className="app-title-text">Spot White Automation</span>
          </div>
          <div className="title-bar-right">
            <button className="title-bar-button" onClick={handleMinimize} title="Minimizar">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M0 5 L10 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="title-bar-button" onClick={handleMaximize} title="Maximizar">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none"/>
              </svg>
            </button>
            <button className="title-bar-button title-bar-button-close" onClick={handleClose} title="Fechar">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;

