/**
 * ZoomControls - Controles de Zoom Premium
 * Barra flutuante com zoom in/out, fit, e porcentagem
 */

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Move } from 'lucide-react';
import './ZoomControls.css';

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
    onZoomReset: () => void;
    onScaleChange?: (scale: number) => void;
    minScale?: number;
    maxScale?: number;
}

const PRESET_ZOOMS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

const ZoomControls: React.FC<ZoomControlsProps> = ({
    scale,
    onZoomIn,
    onZoomOut,
    onZoomFit,
    onZoomReset,
    onScaleChange,
    minScale = 0.1,
    maxScale = 5
}) => {
    const [showPresets, setShowPresets] = useState(false);
    const presetRef = useRef<HTMLDivElement>(null);

    const percentage = Math.round(scale * 100);

    // Close presets when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
                setShowPresets(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePresetClick = (preset: number) => {
        if (onScaleChange) {
            onScaleChange(preset / 100);
        }
        setShowPresets(false);
    };

    const canZoomIn = scale < maxScale;
    const canZoomOut = scale > minScale;

    return (
        <div className="zoom-controls" role="group" aria-label="Controles de zoom">
            {/* Preset Dropdown */}
            {showPresets && (
                <div className="zoom-presets" ref={presetRef} role="listbox" aria-label="Níveis de zoom predefinidos">
                    {PRESET_ZOOMS.map(preset => (
                        <button
                            key={preset}
                            className={`zoom-preset-item ${percentage === preset ? 'active' : ''}`}
                            onClick={() => handlePresetClick(preset)}
                            role="option"
                            aria-selected={percentage === preset}
                        >
                            {preset}%
                        </button>
                    ))}
                </div>
            )}

            {/* Main Controls */}
            <div className="zoom-bar">
                <button
                    className="zoom-btn"
                    onClick={onZoomOut}
                    disabled={!canZoomOut}
                    title="Diminuir zoom (Scroll -)"
                    aria-label="Diminuir zoom"
                >
                    <ZoomOut size={16} />
                </button>

                <button
                    className="zoom-percentage"
                    onClick={() => setShowPresets(!showPresets)}
                    title="Clique para escolher nível de zoom"
                    aria-haspopup="listbox"
                    aria-expanded={showPresets}
                >
                    <span>{percentage}%</span>
                </button>

                <button
                    className="zoom-btn"
                    onClick={onZoomIn}
                    disabled={!canZoomIn}
                    title="Aumentar zoom (Scroll +)"
                    aria-label="Aumentar zoom"
                >
                    <ZoomIn size={16} />
                </button>

                <div className="zoom-divider" aria-hidden="true" />

                <button
                    className="zoom-btn"
                    onClick={onZoomFit}
                    title="Ajustar ao tamanho da tela"
                    aria-label="Ajustar ao tamanho da tela"
                >
                    <Maximize size={16} />
                </button>

                <button
                    className="zoom-btn"
                    onClick={onZoomReset}
                    title="Resetar para 100%"
                    aria-label="Resetar zoom para 100%"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Pan hint */}
            <div className="zoom-hint" aria-hidden="true">
                <Move size={12} />
                <span>Space + Arraste para mover</span>
            </div>
        </div>
    );
};

export default ZoomControls;
