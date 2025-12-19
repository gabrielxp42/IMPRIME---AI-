/**
 * DocumentSettingsPanel - Painel para configurar tamanho do documento
 * Com dimensões em CM por padrão e predefinições em accordion
 */

import React, { useState, useEffect } from 'react';
import './DocumentSettingsPanel.css';

interface DocumentSettingsPanelProps {
    width: number;
    height: number;
    dpi: number;
    backgroundColor: string;
    onSettingsChange: (settings: { width?: number; height?: number; dpi?: number; backgroundColor?: string }) => void;
}

// Predefinições principais (sempre visíveis)
const MAIN_PRESETS = [
    { name: 'A4 Retrato', width: 2480, height: 3508, dpi: 300 },
    { name: 'A4 Paisagem', width: 3508, height: 2480, dpi: 300 },
    { name: 'A3 Retrato', width: 3508, height: 4961, dpi: 300 },
    { name: 'A3 Paisagem', width: 4961, height: 3508, dpi: 300 },
];

// Predefinições extras (em accordion)
const MORE_PRESETS = [
    { name: 'Carta Retrato', width: 2550, height: 3300, dpi: 300 },
    { name: 'Carta Paisagem', width: 3300, height: 2550, dpi: 300 },
    { name: 'A5 Retrato', width: 1748, height: 2480, dpi: 300 },
    { name: 'A5 Paisagem', width: 2480, height: 1748, dpi: 300 },
    { name: 'Instagram Post', width: 1080, height: 1080, dpi: 72 },
    { name: 'Instagram Story', width: 1080, height: 1920, dpi: 72 },
    { name: 'Facebook Cover', width: 820, height: 312, dpi: 72 },
    { name: 'HD 1920x1080', width: 1920, height: 1080, dpi: 72 },
    { name: '4K 3840x2160', width: 3840, height: 2160, dpi: 72 },
    { name: '10x15 cm', width: 1181, height: 1772, dpi: 300 },
    { name: '15x21 cm', width: 1772, height: 2480, dpi: 300 },
    { name: '20x30 cm', width: 2362, height: 3543, dpi: 300 },
];

const DocumentSettingsPanel: React.FC<DocumentSettingsPanelProps> = ({
    width,
    height,
    dpi,
    backgroundColor,
    onSettingsChange,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMorePresets, setShowMorePresets] = useState(false);
    const [unit, setUnit] = useState<'cm' | 'px'>('cm'); // CM por padrão
    const [lockRatio, setLockRatio] = useState(true);

    // Valores locais em CM ou PX
    const [localWidth, setLocalWidth] = useState('');
    const [localHeight, setLocalHeight] = useState('');
    const [localDpi, setLocalDpi] = useState(dpi.toString());

    const aspectRatio = width / height;

    // Converter px para cm: cm = (px / dpi) * 2.54
    const pxToCm = (px: number) => (px / dpi) * 2.54;
    // Converter cm para px: px = (cm / 2.54) * dpi
    const cmToPx = (cm: number) => (cm / 2.54) * dpi;

    // Atualizar valores locais quando props mudam
    useEffect(() => {
        if (unit === 'cm') {
            setLocalWidth(pxToCm(width).toFixed(1));
            setLocalHeight(pxToCm(height).toFixed(1));
        } else {
            setLocalWidth(width.toString());
            setLocalHeight(height.toString());
        }
        setLocalDpi(dpi.toString());
    }, [width, height, dpi, unit]);

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalWidth(value);

        if (lockRatio && !isNaN(parseFloat(value))) {
            const newHeight = parseFloat(value) / aspectRatio;
            setLocalHeight(newHeight.toFixed(unit === 'cm' ? 1 : 0));
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalHeight(value);

        if (lockRatio && !isNaN(parseFloat(value))) {
            const newWidth = parseFloat(value) * aspectRatio;
            setLocalWidth(newWidth.toFixed(unit === 'cm' ? 1 : 0));
        }
    };

    const handleApply = () => {
        const w = parseFloat(localWidth);
        const h = parseFloat(localHeight);
        const d = parseInt(localDpi);

        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

        let finalW: number, finalH: number;

        if (unit === 'cm') {
            finalW = Math.round(cmToPx(w));
            finalH = Math.round(cmToPx(h));
        } else {
            finalW = Math.round(w);
            finalH = Math.round(h);
        }

        if (finalW > 0 && finalH > 0 && d > 0) {
            onSettingsChange({ width: finalW, height: finalH, dpi: d });
        }
    };

    const handlePresetClick = (preset: typeof MAIN_PRESETS[0]) => {
        onSettingsChange({ width: preset.width, height: preset.height, dpi: preset.dpi });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApply();
        }
    };

    const toggleUnit = () => {
        setUnit(u => u === 'cm' ? 'px' : 'cm');
    };

    // Valores para exibição
    const widthCm = pxToCm(width).toFixed(1);
    const heightCm = pxToCm(height).toFixed(1);

    return (
        <div className="document-settings-panel">
            <div
                className="doc-settings-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3>📐 Documento</h3>
                <span className="doc-settings-toggle">{isExpanded ? '▼' : '▶'}</span>
            </div>

            {/* Info resumido sempre visível */}
            <div className="doc-settings-summary">
                <span>{width} x {height} px</span>
                <span className="separator">•</span>
                <span>{widthCm} x {heightCm} cm</span>
                <span className="separator">•</span>
                <span>{dpi} DPI</span>
            </div>

            {isExpanded && (
                <div className="doc-settings-content">
                    {/* Predefinições principais */}
                    <div className="doc-settings-section">
                        <label>Predefinições</label>
                        <div className="presets-grid">
                            {MAIN_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    className={`preset-btn ${width === preset.width && height === preset.height ? 'active' : ''}`}
                                    onClick={() => handlePresetClick(preset)}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>

                        {/* Accordion para mais predefinições */}
                        <button
                            className="more-presets-toggle"
                            onClick={() => setShowMorePresets(!showMorePresets)}
                        >
                            {showMorePresets ? '▲ Menos opções' : '▼ Mais opções'}
                        </button>

                        {showMorePresets && (
                            <div className="presets-grid more-presets">
                                {MORE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        className={`preset-btn ${width === preset.width && height === preset.height ? 'active' : ''}`}
                                        onClick={() => handlePresetClick(preset)}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dimensões */}
                    <div className="doc-settings-section">
                        <div className="section-header">
                            <label>Dimensões</label>
                            <div className="unit-toggle">
                                <button
                                    className={`unit-btn ${unit === 'cm' ? 'active' : ''}`}
                                    onClick={() => setUnit('cm')}
                                >
                                    cm
                                </button>
                                <button
                                    className={`unit-btn ${unit === 'px' ? 'active' : ''}`}
                                    onClick={() => setUnit('px')}
                                >
                                    px
                                </button>
                            </div>
                        </div>
                        <div className="dimensions-row">
                            <div className="dimension-input">
                                <span>L</span>
                                <input
                                    type="number"
                                    value={localWidth}
                                    onChange={handleWidthChange}
                                    onBlur={handleApply}
                                    onKeyDown={handleKeyDown}
                                    min="0.1"
                                    step={unit === 'cm' ? '0.1' : '1'}
                                />
                                <span className="unit-label">{unit}</span>
                            </div>
                            <button
                                className={`lock-ratio-btn ${lockRatio ? 'locked' : ''}`}
                                onClick={() => setLockRatio(!lockRatio)}
                                title={lockRatio ? 'Proporção bloqueada' : 'Proporção livre'}
                            >
                                {lockRatio ? '🔗' : '⛓️‍💥'}
                            </button>
                            <div className="dimension-input">
                                <span>A</span>
                                <input
                                    type="number"
                                    value={localHeight}
                                    onChange={handleHeightChange}
                                    onBlur={handleApply}
                                    onKeyDown={handleKeyDown}
                                    min="0.1"
                                    step={unit === 'cm' ? '0.1' : '1'}
                                />
                                <span className="unit-label">{unit}</span>
                            </div>
                        </div>
                    </div>

                    {/* DPI */}
                    <div className="doc-settings-section">
                        <label>Resolução (DPI)</label>
                        <div className="dpi-options">
                            {[72, 150, 300, 600].map((d) => (
                                <button
                                    key={d}
                                    className={`dpi-btn ${dpi === d ? 'active' : ''}`}
                                    onClick={() => onSettingsChange({ dpi: d })}
                                >
                                    {d}
                                </button>
                            ))}
                            <input
                                type="number"
                                value={localDpi}
                                onChange={(e) => setLocalDpi(e.target.value)}
                                onBlur={() => {
                                    const d = parseInt(localDpi);
                                    if (d > 0) onSettingsChange({ dpi: d });
                                }}
                                onKeyDown={handleKeyDown}
                                min="1"
                                max="1200"
                                className="dpi-custom"
                                title="DPI personalizado"
                            />
                        </div>
                    </div>

                    {/* Cor de fundo */}
                    <div className="doc-settings-section">
                        <label>Cor de Fundo</label>
                        <div className="bg-options">
                            {(() => {
                                const normBg = backgroundColor === 'white' ? '#ffffff' :
                                    backgroundColor === 'black' ? '#000000' :
                                        backgroundColor;
                                return (
                                    <>
                                        <button
                                            className={`bg-btn transparent ${backgroundColor === 'transparent' ? 'active' : ''}`}
                                            onClick={() => onSettingsChange({ backgroundColor: 'transparent' })}
                                            title="Transparente"
                                        >
                                            🏁
                                        </button>
                                        <button
                                            className={`bg-btn white ${normBg === '#ffffff' ? 'active' : ''}`}
                                            onClick={() => onSettingsChange({ backgroundColor: '#ffffff' })}
                                            title="Branco"
                                        />
                                        <button
                                            className={`bg-btn black ${normBg === '#000000' ? 'active' : ''}`}
                                            onClick={() => onSettingsChange({ backgroundColor: '#000000' })}
                                            title="Preto"
                                        />
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentSettingsPanel;
