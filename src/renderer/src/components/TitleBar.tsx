import React, { useState, useEffect } from 'react';
import './TitleBar.css';

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial state using invoke
    (window.electronAPI as any)?.isMaximized?.()?.then?.((max: boolean) => {
      setIsMaximized(max);
    });

    // Listen for maximize state changes using the generic 'on' method
    const handleMaxChange = (maximized: boolean) => {
      setIsMaximized(maximized);
    };

    window.electronAPI?.on?.('window-maximize-change', handleMaxChange);

    return () => {
      window.electronAPI?.removeListener?.('window-maximize-change', handleMaxChange);
    };
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow?.();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow?.();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-drag-region">
        <div className="title-bar-content">
          <div className="title-bar-left">
            <div className="app-icon">✨</div>
            <span className="app-title-text">IMPRIME</span>
          </div>
          <div className="title-bar-right">
            {/* Minimize Button */}
            <button
              className="title-bar-button"
              onClick={handleMinimize}
              title="Minimizar"
              aria-label="Minimizar janela"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 5 L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Maximize/Restore Button */}
            <button
              className="title-bar-button"
              onClick={handleMaximize}
              title={isMaximized ? "Restaurar" : "Maximizar"}
              aria-label={isMaximized ? "Restaurar janela" : "Maximizar janela"}
            >
              {isMaximized ? (
                // Restore icon (two overlapping squares - Windows style)
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="2.5" y="3.5" width="5" height="5" stroke="currentColor" strokeWidth="1" fill="none" rx="0.5" />
                  <path d="M3.5 3.5V2.5C3.5 2.22386 3.72386 2 4 2H7.5C7.77614 2 8 2.22386 8 2.5V6C8 6.27614 7.77614 6.5 7.5 6.5H7" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
              ) : (
                // Maximize icon (single square)
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor" strokeWidth="1.2" fill="none" rx="1" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              className="title-bar-button title-bar-button-close"
              onClick={handleClose}
              title="Fechar"
              aria-label="Fechar janela"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
