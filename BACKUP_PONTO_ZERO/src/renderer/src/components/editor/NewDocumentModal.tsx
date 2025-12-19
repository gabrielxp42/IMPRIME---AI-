/**
 * Modal de Novo Documento
 * Cria uma prancheta com dimensões em cm/px e DPI
 * Similar ao Photoshop
 */

import React, { useState, useCallback } from 'react';
import './NewDocumentModal.css';

interface NewDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (settings: DocumentSettings) => void;
}

export interface DocumentSettings {
    width: number;      // em pixels
    height: number;     // em pixels
    widthCm: number;    // valor original em cm
    heightCm: number;   // valor original em cm
    dpi: number;
    name: string;
    backgroundColor: 'transparent' | 'white' | 'black';
}

type Unit = 'cm' | 'px';

// Presets comuns para DTF
const PRESETS = [
    { name: 'DTF Rolo 58cm', widthCm: 58, heightCm: 100, dpi: 150 },
    { name: 'DTF Rolo 30cm', widthCm: 30, heightCm: 100, dpi: 150 },
    { name: 'A4 (21 x 29.7)', widthCm: 21, heightCm: 29.7, dpi: 300 },
    { name: 'A3 (29.7 x 42)', widthCm: 29.7, heightCm: 42, dpi: 300 },
    { name: 'Personalizado', widthCm: 0, heightCm: 0, dpi: 150 },
];

const DPI_OPTIONS = [72, 96, 150, 200, 300, 600];

const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [name, setName] = useState('Novo Documento');
    const [widthValue, setWidthValue] = useState(58);
    const [heightValue, setHeightValue] = useState(100);
    const [unit, setUnit] = useState<Unit>('cm');
    const [dpi, setDpi] = useState(150);
    const [backgroundColor, setBackgroundColor] = useState<'transparent' | 'white' | 'black'>('transparent');
    const [selectedPreset, setSelectedPreset] = useState(0);

    // Converter cm para pixels
    const cmToPixels = useCallback((cm: number, resolution: number) => {
        return Math.round(cm * (resolution / 2.54));
    }, []);

    // Converter pixels para cm
    const pixelsToCm = useCallback((px: number, resolution: number) => {
        return px / (resolution / 2.54);
    }, []);

    // Calcular dimensões em pixels
    const getPixelDimensions = useCallback(() => {
        if (unit === 'px') {
            return { width: widthValue, height: heightValue };
        }
        return {
            width: cmToPixels(widthValue, dpi),
            height: cmToPixels(heightValue, dpi),
        };
    }, [unit, widthValue, heightValue, dpi, cmToPixels]);

    // Aplicar preset
    const applyPreset = (index: number) => {
        setSelectedPreset(index);
        const preset = PRESETS[index];
        if (preset.widthCm > 0) {
            setWidthValue(preset.widthCm);
            setHeightValue(preset.heightCm);
            setDpi(preset.dpi);
            setUnit('cm');
            setName(preset.name);
        }
    };

    // Confirmar criação
    const handleConfirm = () => {
        const pixels = getPixelDimensions();
        const settings: DocumentSettings = {
            width: pixels.width,
            height: pixels.height,
            widthCm: unit === 'cm' ? widthValue : pixelsToCm(widthValue, dpi),
            heightCm: unit === 'cm' ? heightValue : pixelsToCm(heightValue, dpi),
            dpi,
            name,
            backgroundColor,
        };
        onConfirm(settings);
        onClose();
    };

    // Trocar unidade mantendo o valor visual
    const toggleUnit = () => {
        if (unit === 'cm') {
            // Converter para pixels
            setWidthValue(cmToPixels(widthValue, dpi));
            setHeightValue(cmToPixels(heightValue, dpi));
            setUnit('px');
        } else {
            // Converter para cm
            setWidthValue(Math.round(pixelsToCm(widthValue, dpi) * 10) / 10);
            setHeightValue(Math.round(pixelsToCm(heightValue, dpi) * 10) / 10);
            setUnit('cm');
        }
    };

    if (!isOpen) return null;

    const pixels = getPixelDimensions();

    return (
        <div className="new-doc-overlay" onClick={onClose}>
            <div className="new-doc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="new-doc-header">
                    <h2>📄 Novo Documento</h2>
                    <button className="new-doc-close" onClick={onClose}>✕</button>
                </div>

                <div className="new-doc-content">
                    {/* Presets */}
                    <div className="new-doc-section">
                        <label>Presets:</label>
                        <div className="preset-buttons">
                            {PRESETS.map((preset, index) => (
                                <button
                                    key={index}
                                    className={`preset-btn ${selectedPreset === index ? 'active' : ''}`}
                                    onClick={() => applyPreset(index)}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nome */}
                    <div className="new-doc-section">
                        <label>Nome:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="new-doc-input"
                        />
                    </div>

                    {/* Dimensões */}
                    <div className="new-doc-section dimensions">
                        <div className="dimension-row">
                            <div className="dimension-field">
                                <label>Largura:</label>
                                <div className="input-with-unit">
                                    <input
                                        type="number"
                                        value={widthValue}
                                        onChange={(e) => {
                                            setWidthValue(Number(e.target.value));
                                            setSelectedPreset(PRESETS.length - 1);
                                        }}
                                        min={1}
                                        className="new-doc-input"
                                    />
                                    <span className="unit-label">{unit}</span>
                                </div>
                            </div>

                            <div className="dimension-separator">×</div>

                            <div className="dimension-field">
                                <label>Altura:</label>
                                <div className="input-with-unit">
                                    <input
                                        type="number"
                                        value={heightValue}
                                        onChange={(e) => {
                                            setHeightValue(Number(e.target.value));
                                            setSelectedPreset(PRESETS.length - 1);
                                        }}
                                        min={1}
                                        className="new-doc-input"
                                    />
                                    <span className="unit-label">{unit}</span>
                                </div>
                            </div>

                            <button className="unit-toggle" onClick={toggleUnit} title="Alternar unidade">
                                🔄 {unit === 'cm' ? 'px' : 'cm'}
                            </button>
                        </div>

                        {/* Preview Dinâmico */}
                        <div className="dimension-preview" style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#aaa',
                            textAlign: 'center'
                        }}>
                            <span>
                                {pixels.width} × {pixels.height} px
                            </span>
                            {unit === 'px' && (
                                <span style={{ marginLeft: '8px', color: '#667eea' }}>
                                    ({pixelsToCm(widthValue, dpi).toFixed(1)} × {pixelsToCm(heightValue, dpi).toFixed(1)} cm @ {dpi} DPI)
                                </span>
                            )}
                            {unit === 'cm' && (
                                <span style={{ marginLeft: '8px', color: '#667eea' }}>
                                    (@ {dpi} DPI)
                                </span>
                            )}
                        </div>


                    </div>

                    {/* DPI */}
                    <div className="new-doc-section">
                        <label>Resolução (DPI):</label>
                        <div className="dpi-options">
                            {DPI_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    className={`dpi-btn ${dpi === option ? 'active' : ''}`}
                                    onClick={() => {
                                        // Recalcular se estiver em cm
                                        if (unit === 'cm') {
                                            // Manter cm, só muda DPI
                                            setDpi(option);
                                        } else {
                                            // Se estiver em px, converter mantendo o tamanho em cm
                                            const currentCmW = pixelsToCm(widthValue, dpi);
                                            const currentCmH = pixelsToCm(heightValue, dpi);
                                            setDpi(option);
                                            setWidthValue(cmToPixels(currentCmW, option));
                                            setHeightValue(cmToPixels(currentCmH, option));
                                        }
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                            <input
                                type="number"
                                value={dpi}
                                onChange={(e) => setDpi(Math.max(1, Number(e.target.value)))}
                                className="dpi-custom"
                                min={1}
                                max={1200}
                            />
                        </div>
                        <p className="dpi-hint">
                            {dpi >= 300 ? '✓ Alta qualidade para impressão' :
                                dpi >= 150 ? '✓ Boa qualidade para DTF' :
                                    '⚠️ Baixa resolução'}
                        </p>
                    </div>

                    {/* Cor de fundo */}
                    <div className="new-doc-section">
                        <label>Fundo:</label>
                        <div className="bg-options">
                            <button
                                className={`bg-btn transparent ${backgroundColor === 'transparent' ? 'active' : ''}`}
                                onClick={() => setBackgroundColor('transparent')}
                                title="Transparente"
                            >
                                <span className="checkerboard"></span>
                            </button>
                            <button
                                className={`bg-btn white ${backgroundColor === 'white' ? 'active' : ''}`}
                                onClick={() => setBackgroundColor('white')}
                                title="Branco"
                            >
                                <span className="color-preview white"></span>
                            </button>
                            <button
                                className={`bg-btn black ${backgroundColor === 'black' ? 'active' : ''}`}
                                onClick={() => setBackgroundColor('black')}
                                title="Preto"
                            >
                                <span className="color-preview black"></span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="new-doc-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-create" onClick={handleConfirm}>
                        ✓ Criar Documento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewDocumentModal;
