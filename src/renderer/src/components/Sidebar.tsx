
import React from 'react';
import './Sidebar.css';
import { Settings, User, ChevronRight, ChevronsLeft } from 'lucide-react';

interface Config {
  minDPI: number;
  maxDPI: number;
  widthCm: number;
  widthTolerance: number;
  minHeightCm: number;
}

interface SidebarProps {
  currentStep: number;
  photoshopDetected: boolean;
  photoshopPath: string;
  config: Config;
  onConfigChange: (config: Config) => void;
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
  clientName: string;
  onClientNameChange: (name: string) => void;
  spotWhiteMode: 'standard' | 'economy';
  onSpotWhiteModeChange: (mode: 'standard' | 'economy') => void;
  onFileSelect: () => void;
  onValidate: () => void;
  onOutputDirSelect: () => void;
  onProcess: () => void;
  selectedFiles: string[];
  outputDir: string | null;
  validationResults: any[];
  processing: boolean;
  currentView: 'home' | 'spotwhite' | 'settings' | 'tools' | 'upscayl' | 'editor' | 'mockups' | 'profile';
  onViewChange: (view: any) => void;
  onOpenAssistant: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { currentView, onViewChange, isCollapsed, onToggleCollapse } = props;

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={onToggleCollapse} title={isCollapsed ? "Expandir Sidebar" : "Recolher Sidebar"}>
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
      <div className="sidebar-header">
        <div className="logo-icon">🎨</div>
        <div className="app-title">
          <h1 className="label">IMPRIME</h1>
          <span className="subtitle label">AI AUTOMATION</span>
        </div>
      </div>

      <div className="nav-section">
        <button
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => onViewChange('home')}
          data-tooltip="Início"
        >
          <span className="icon">🏠</span> <span className="label">Início</span>
        </button>
        <button
          className={`nav-item ${currentView === 'spotwhite' ? 'active' : ''}`}
          onClick={() => onViewChange('spotwhite')}
          data-tooltip="Spot White"
        >
          <span className="icon">🖨️</span> <span className="label">Spot White</span>
        </button>
        <button
          className={`nav-item ${currentView === 'editor' ? 'active' : ''}`}
          onClick={() => onViewChange('editor')}
          data-tooltip="Editor Pro"
        >
          <span className="icon">✏️</span> <span className="label">Editor Pro</span>
        </button>
        <button
          className={`nav-item ${currentView === 'upscayl' ? 'active' : ''}`}
          onClick={() => onViewChange('upscayl')}
          data-tooltip="Upscayl AI"
        >
          <span className="icon">🚀</span> <span className="label">Upscayl AI</span>
        </button>
        <button
          className={`nav-item ${currentView === 'mockups' ? 'active' : ''}`}
          onClick={() => onViewChange('mockups')}
          data-tooltip="Mockups"
        >
          <span className="icon">👕</span> <span className="label">Mockups</span>
        </button>
      </div>



      <div className="sidebar-footer">
        <button
          className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
          data-tooltip="Perfil"
        >
          <User size={18} /> <span className="label">Perfil</span>
        </button>
        <button
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
          data-tooltip="Configurações"
        >
          <Settings size={18} /> <span className="label">Configurações</span>
        </button>
        <div className="status-indicator online">
          <span className="dot"></span> <span className="label">Sistema Pronto</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
