import React, { useState } from 'react';
import MainContent from './MainContent';
import { FolderOpen, Play, Sliders } from 'lucide-react';
import './Sidebar.css';
import spotWhiteStandardImg from '../assets/SPOTWHITEPADRAO.png';
import spotWhiteEconomyImg from '../assets/MODOECONOMIA.png';

interface Config {
    minDPI: number;
    maxDPI: number;
    widthCm: number;
    widthTolerance: number;
    minHeightCm: number;
}

interface SpotWhiteWorkspaceProps {
    // MainContent props
    selectedFiles: string[];
    validationResults: any[];
    onRemoveFile?: (file: string) => void;
    processing: boolean;
    geminiApiKey: string;
    processedFiles: Set<string>;

    // Wizard Props
    clientName: string;
    onClientNameChange: (name: string) => void;
    spotWhiteMode: 'standard' | 'economy';
    onSpotWhiteModeChange: (mode: 'standard' | 'economy') => void;
    onFileSelect: () => void;
    onOutputDirSelect: () => void;
    outputDir: string | null;
    onProcess: () => void;

    config: Config;
    onConfigChange: (config: Config) => void;
    isValidating?: boolean;
    onPreviewFile: (path: string, name: string) => void;
}

const SpotWhiteWorkspace: React.FC<SpotWhiteWorkspaceProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'spotwhite' | 'settings'>('spotwhite');
    const [hoveredMode, setHoveredMode] = useState<'standard' | 'economy' | null>(null);

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Left Side: File Grid (MainContent) */}
            <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
                <MainContent
                    selectedFiles={props.selectedFiles}
                    validationResults={props.validationResults}
                    onRemoveFile={props.onRemoveFile}
                    processing={props.processing}
                    geminiApiKey={props.geminiApiKey}
                    processedFiles={props.processedFiles}
                    onFileSelect={props.onFileSelect}
                    onPreviewFile={props.onPreviewFile}
                />
            </div>

            {/* Right Side: Wizard Panel */}
            <div className="wizard-panel" style={{
                width: '350px',
                flexShrink: 0,
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(30px)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                padding: '20px 20px 80px 20px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                height: '100%',
                boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Tab Switcher (Upscayl Style) */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '24px',
                    padding: '4px',
                    display: 'flex',
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <button
                        onClick={() => setActiveTab('spotwhite')}
                        style={{
                            flex: 1,
                            background: activeTab === 'spotwhite' ? '#a855f7' : 'transparent',
                            color: activeTab === 'spotwhite' ? '#fff' : '#94a3b8',
                            borderRadius: '20px',
                            border: 'none',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            boxShadow: activeTab === 'spotwhite' ? '0 2px 8px rgba(168, 85, 247, 0.4)' : 'none'
                        }}
                    >
                        Spot White
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            flex: 1,
                            background: activeTab === 'settings' ? '#a855f7' : 'transparent',
                            color: activeTab === 'settings' ? '#fff' : '#94a3b8',
                            borderRadius: '20px',
                            border: 'none',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            boxShadow: activeTab === 'settings' ? '0 2px 8px rgba(168, 85, 247, 0.4)' : 'none'
                        }}
                    >
                        Preferências
                    </button>
                </div>

                {activeTab === 'spotwhite' ? (
                    /* WIZARD CONTENT */
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                        {/* PASSO 1: ARQUIVOS */}
                        <div className="step-card">
                            <div className="step-header">
                                <div className="step-number">1</div>
                                <span>Seleção de Arquivos</span>
                            </div>
                            <div className="step-content">
                                <button className="step-btn" onClick={props.onFileSelect}>
                                    <FolderOpen size={16} />
                                    {props.selectedFiles.length > 0 ? `${props.selectedFiles.length} selecionados` : 'Adicionar Arquivos'}
                                </button>
                                <div className="step-info">{props.selectedFiles.length} arquivos prontos</div>
                            </div>
                        </div>

                        {/* PASSO 2: CLIENTE & MODO */}
                        <div className="step-card">
                            <div className="step-header">
                                <div className="step-number">2</div>
                                <span>Dados do Job</span>
                            </div>
                            <div className="step-content">
                                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Cliente
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nome do Cliente ou Job"
                                    value={props.clientName}
                                    onChange={(e) => props.onClientNameChange(e.target.value)}
                                    className="step-input"
                                    style={{ marginBottom: '16px' }}
                                />

                                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
                                    Modo de Branco
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <button
                                            onClick={() => props.onSpotWhiteModeChange('standard')}
                                            onMouseEnter={() => setHoveredMode('standard')}
                                            onMouseLeave={() => setHoveredMode(null)}
                                            className={`step-btn ${props.spotWhiteMode === 'standard' ? 'active-mode' : ''}`}
                                            style={{
                                                justifyContent: 'center',
                                                background: props.spotWhiteMode === 'standard' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                borderColor: props.spotWhiteMode === 'standard' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                                color: props.spotWhiteMode === 'standard' ? '#60a5fa' : '#cbd5e1'
                                            }}
                                        >
                                            Padrão
                                        </button>
                                        <button
                                            onClick={() => props.onSpotWhiteModeChange('economy')}
                                            onMouseEnter={() => setHoveredMode('economy')}
                                            onMouseLeave={() => setHoveredMode(null)}
                                            className={`step-btn ${props.spotWhiteMode === 'economy' ? 'active-mode' : ''}`}
                                            style={{
                                                justifyContent: 'center',
                                                background: props.spotWhiteMode === 'economy' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                                                borderColor: props.spotWhiteMode === 'economy' ? '#ec4899' : 'rgba(255,255,255,0.1)',
                                                color: props.spotWhiteMode === 'economy' ? '#f472b6' : '#cbd5e1'
                                            }}
                                        >
                                            Econômico
                                        </button>
                                    </div>

                                    {/* Preview Image Overlay - Only Visible on Hover */}
                                    {hoveredMode && (
                                        <div className="fade-in" style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 8px)',
                                            left: '-12px',
                                            right: '-12px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            aspectRatio: '16/9',
                                            background: '#0f172a',
                                            zIndex: 200,
                                            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                            pointerEvents: 'none' // Prevent interfering with mouse leave
                                        }}>
                                            <img
                                                src={hoveredMode === 'standard' ? spotWhiteStandardImg : spotWhiteEconomyImg}
                                                alt="Mode Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: '8px 10px',
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
                                                color: 'white',
                                                fontSize: '11px',
                                                textShadow: '0 1px 2px black'
                                            }}>
                                                {hoveredMode === 'standard'
                                                    ? 'Spot White Sólido: Branco em toda a mancha da imagem.'
                                                    : 'Spot White Econômico: Remove branco das áreas escuras.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* PASSO 3: SAÍDA */}
                        <div className="step-card">
                            <div className="step-header">
                                <div className="step-number">3</div>
                                <span>Local de Saída</span>
                            </div>
                            <div className="step-content">
                                <button className={`step-btn ${props.outputDir ? 'success' : ''}`} onClick={props.onOutputDirSelect}>
                                    <FolderOpen size={16} />
                                    {props.outputDir ? 'Pasta Selecionada' : 'Selecionar Pasta'}
                                </button>
                                {props.outputDir && <div className="path-display" title={props.outputDir}>...\{props.outputDir.split('\\').pop() || props.outputDir.split('/').pop()}</div>}
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            {/* AÇÃO FINAL */}
                            <button
                                className="action-btn process-large"
                                onClick={props.onProcess}
                                disabled={props.processing || props.selectedFiles.length === 0 || !props.outputDir}
                            >
                                {props.processing ? (
                                    <>
                                        <span className="spinner-small"></span> Processando...
                                    </>
                                ) : (
                                    <>
                                        <Play size={20} fill="currentColor" /> INICIAR PRODUÇÃO
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* SETTINGS CONTENT (PREFERÊNCIAS) */
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="step-card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(30, 41, 59, 0.4)' }}>
                            <div className="step-header" style={{ marginBottom: '20px' }}>
                                <Sliders size={18} color="#3b82f6" />
                                <span style={{ fontSize: '15px', fontWeight: 600 }}>Configurações de Validação</span>
                            </div>

                            <div className="step-content">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                                            DPI Mínimo
                                        </label>
                                        <input
                                            type="number"
                                            className="step-input"
                                            value={props.config.minDPI}
                                            onChange={(e) => props.onConfigChange({ ...props.config, minDPI: Number(e.target.value) })}
                                        />
                                        <span style={{ fontSize: '9px', color: '#64748b' }}>Valor mínimo aceito</span>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                                            DPI Máximo
                                        </label>
                                        <input
                                            type="number"
                                            className="step-input"
                                            value={props.config.maxDPI}
                                            onChange={(e) => props.onConfigChange({ ...props.config, maxDPI: Number(e.target.value) })}
                                        />
                                        <span style={{ fontSize: '9px', color: '#64748b' }}>Valor máximo aceito</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Largura Máxima (cm)
                                    </label>
                                    <input
                                        type="number"
                                        className="step-input"
                                        value={props.config.widthCm}
                                        onChange={(e) => props.onConfigChange({ ...props.config, widthCm: Number(e.target.value) })}
                                    />
                                    <span style={{ fontSize: '9px', color: '#64748b' }}>Largura máxima (TETO) - não pode ultrapassar</span>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Tolerância de Largura
                                    </label>
                                    <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                                        Tolerância permitida para BAIXO: <strong>{props.config.widthTolerance.toFixed(1)}cm</strong><br />
                                        Aceito entre: <strong>{(props.config.widthCm - props.config.widthTolerance).toFixed(1)}cm</strong> e <strong>{props.config.widthCm.toFixed(1)}cm</strong>
                                    </p>

                                    <div className="tolerance-slider-container" style={{ margin: '0 -4px' }}>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="5.0"
                                            step="0.1"
                                            value={props.config.widthTolerance}
                                            onChange={(e) => props.onConfigChange({ ...props.config, widthTolerance: parseFloat(e.target.value) })}
                                            className="tolerance-slider"
                                            style={{ margin: 0 }}
                                        />
                                        <div className="slider-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#64748b' }}>
                                            <span>0.5cm</span>
                                            <span>2.5cm</span>
                                            <span>5.0cm</span>
                                        </div>
                                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                                borderRadius: '16px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#60a5fa'
                                            }}>
                                                {props.config.widthTolerance.toFixed(1)}cm
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Altura Mínima (cm)
                                    </label>
                                    <input
                                        type="number"
                                        className="step-input"
                                        value={props.config.minHeightCm}
                                        onChange={(e) => props.onConfigChange({ ...props.config, minHeightCm: Number(e.target.value) })}
                                    />
                                    <span style={{ fontSize: '9px', color: '#64748b' }}>Altura mínima aceita em centímetros</span>
                                </div>
                            </div>
                        </div>

                        {/* PADRÕES DE ARQUIVO */}
                        <div className="step-card" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(30, 41, 59, 0.4)' }}>
                            <div className="step-header" style={{ marginBottom: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>Padrões de Arquivo</span>
                            </div>
                            <div className="step-content">
                                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>Os arquivos processados seguirão o formato:</p>
                                <div style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #3b82f6',
                                    marginBottom: '10px'
                                }}>
                                    <code style={{ fontSize: '11px', color: '#4ade80', wordBreak: 'break-all' }}>
                                        (MEDIDA) - (NOME_CLIENTE) - (NOME_ARQUIVO).tiff
                                    </code>
                                </div>
                                <p style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                                    A medida é calculada automaticamente baseada na altura do arquivo (1M, 2M, etc.)
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpotWhiteWorkspace;
