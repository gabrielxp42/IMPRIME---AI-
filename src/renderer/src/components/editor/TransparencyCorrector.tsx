import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Layers, Wand2, Check, Eye, EyeOff } from 'lucide-react';
import { analyzeTransparency, fixTransparency, TransparencyResult } from '../../utils/transparencyAnalysis';
import './TransparencyCorrector.css';

interface TransparencyCorrectorProps {
    imageSrc: string;
    onApply: (newImageSrc: string) => void;
    onCancel: () => void;
}

const TransparencyCorrector: React.FC<TransparencyCorrectorProps> = ({ imageSrc, onApply, onCancel }) => {
    const [viewMode, setViewMode] = useState<'original' | 'analysis' | 'corrected'>('analysis');
    const [analysis, setAnalysis] = useState<TransparencyResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    // Sliders de Correção
    const [removeThreshold, setRemoveThreshold] = useState(20); // Abaixo de 20 vira 0
    const [solidifyThreshold, setSolidifyThreshold] = useState(200); // Acima de 200 vira 255

    const [previewSrc, setPreviewSrc] = useState<string>(imageSrc);

    // Initial Analysis
    useEffect(() => {
        analyzeImage();
    }, [imageSrc]);

    const analyzeImage = async () => {
        setIsAnalyzing(true);
        const res = await analyzeTransparency(imageSrc);
        setAnalysis(res);
        setIsAnalyzing(false);
        // Default to analysis view if issues found
        if (res.hasIssues) {
            setViewMode('analysis');
        } else {
            setViewMode('original');
        }
    };

    // Live Preview of Fix
    useEffect(() => {
        if (viewMode === 'corrected') {
            const updatePreview = async () => {
                const fixed = await fixTransparency(imageSrc, {
                    removeThreshold,
                    solidifyThreshold
                });
                setPreviewSrc(fixed);
            };
            // Debounce simple
            const timer = setTimeout(updatePreview, 100);
            return () => clearTimeout(timer);
        }
    }, [removeThreshold, solidifyThreshold, viewMode, imageSrc]);

    return (
        <div className="transparency-corrector-container">
            <div className="tc-header">
                <h3><Layers size={20} /> Correção de Transparência DTF</h3>
                <div className="tc-mode-toggles">
                    <button
                        className={`tc-toggle ${viewMode === 'original' ? 'active' : ''}`}
                        onClick={() => setViewMode('original')}
                    >
                        Original
                    </button>
                    <button
                        className={`tc-toggle ${viewMode === 'analysis' ? 'active' : ''}`}
                        onClick={() => setViewMode('analysis')}
                    >
                        <AlertTriangle size={14} /> Diagnóstico
                    </button>
                    <button
                        className={`tc-toggle ${viewMode === 'corrected' ? 'active' : ''}`}
                        onClick={() => setViewMode('corrected')}
                    >
                        <Wand2 size={14} /> Preview Correção
                    </button>
                </div>
            </div>

            <div className="tc-content">
                <div className="tc-preview-area">
                    {isAnalyzing ? (
                        <div className="tc-loading">Analisando pixels...</div>
                    ) : (
                        <div className="tc-image-wrapper">
                            {viewMode === 'original' && <img src={imageSrc} alt="Original" />}
                            {viewMode === 'analysis' && analysis && (
                                <>
                                    <img src={analysis.previewUrl} alt="Analysis" />
                                    {analysis.hasIssues && (
                                        <div className="tc-issue-overlay">
                                            <span>{analysis.issuePercentage.toFixed(1)}% da imagem tem risco de transparência</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {viewMode === 'corrected' && <img src={previewSrc} alt="Corrected" />}
                        </div>
                    )}
                </div>

                <div className="tc-controls">
                    {analysis?.hasIssues ? (
                        <>
                            <div className="tc-control-group">
                                <label>
                                    Limpar Sujeira (Alpha &lt; {removeThreshold})
                                    <span className="tc-desc">Remove pixels muito transparentes (fumaça fraca, bordas sujas)</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="128"
                                    value={removeThreshold}
                                    onChange={(e) => setRemoveThreshold(Number(e.target.value))}
                                />
                            </div>

                            <div className="tc-control-group">
                                <label>
                                    Solidificar (Alpha &gt; {solidifyThreshold})
                                    <span className="tc-desc">Torna pixels quase sólidos em 100% Sólidos (Garante base branca)</span>
                                </label>
                                <input
                                    type="range"
                                    min="100"
                                    max="255"
                                    value={solidifyThreshold}
                                    onChange={(e) => setSolidifyThreshold(Number(e.target.value))}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="tc-success-msg">
                            <Check size={32} />
                            <p>Nenhuma semitransparência crítica detectada!</p>
                            <p className="tc-sub">Sua imagem está segura para impressão DTF.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="tc-footer">
                <button className="tc-btn-secondary" onClick={onCancel}>Cancelar</button>
                <button
                    className="tc-btn-primary"
                    onClick={async () => {
                        const fixed = await fixTransparency(imageSrc, { removeThreshold, solidifyThreshold });
                        onApply(fixed);
                    }}
                >
                    Aplicar Correção
                </button>
            </div>
        </div>
    );
};

export default TransparencyCorrector;
