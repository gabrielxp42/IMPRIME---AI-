/**
 * Ferramenta de Remoção de Fundo Inteligente
 * Usa rembg via IPC do Electron (sem servidor separado)
 * Com detecção e correção de semitransparência integrada
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { analyzeTransparency, fixTransparency } from '../../utils/transparencyAnalysis';
import './BackgroundRemovalTool.css';

interface BackgroundRemovalToolProps {
    imageId?: string;
    imageSrc: string;
    onClose?: () => void;
    onCancel?: () => void;
    onApply: (processedImageSrc: string) => void;
}

type RemovalMode = 'auto' | 'precision';

const BackgroundRemovalTool: React.FC<BackgroundRemovalToolProps> = ({
    imageSrc,
    onClose,
    onCancel,
    onApply,
}) => {
    // Handler unificado para fechar
    const handleClose = onCancel || onClose || (() => { });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<RemovalMode>('auto');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Transparency States (Integrado)
    const [hasTransparencyIssues, setHasTransparencyIssues] = useState(false);
    const [transparencyPercentage, setTransparencyPercentage] = useState(0);
    const [removeThreshold, setRemoveThreshold] = useState(30);
    const [solidifyThreshold, setSolidifyThreshold] = useState(220);
    const [correctedImage, setCorrectedImage] = useState<string | null>(null);
    const [isApplyingFix, setIsApplyingFix] = useState(false);
    const [diagnosticPreview, setDiagnosticPreview] = useState<string | null>(null);
    const [showDiagnostic, setShowDiagnostic] = useState(false);

    // Carregar imagem ao montar
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
            drawOriginalCanvas();
        };
        img.onerror = () => {
            setError('Erro ao carregar imagem');
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Desenhar canvas original
    const drawOriginalCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const maxSize = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        drawCheckerboard(ctx, width, height);
        ctx.drawImage(img, 0, 0, width, height);
    }, []);

    const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const size = 10;
        for (let x = 0; x < width; x += size) {
            for (let y = 0; y < height; y += size) {
                ctx.fillStyle = ((x + y) / size) % 2 === 0 ? '#e0e0e0' : '#c0c0c0';
                ctx.fillRect(x, y, size, size);
            }
        }
    };

    useEffect(() => {
        if (imageLoaded) {
            drawOriginalCanvas();
        }
    }, [imageLoaded, drawOriginalCanvas, showComparison, resultImage]);

    // Aplicar correção de transparência em tempo real
    useEffect(() => {
        if (!hasTransparencyIssues || !resultImage) return;

        const applyFix = async () => {
            setIsApplyingFix(true);
            try {
                const fixed = await fixTransparency(resultImage, {
                    removeThreshold,
                    solidifyThreshold
                });
                setCorrectedImage(fixed);
            } catch (e) {
                console.error('Erro ao aplicar correção:', e);
            } finally {
                setIsApplyingFix(false);
            }
        };

        const debounce = setTimeout(applyFix, 300);
        return () => clearTimeout(debounce);
    }, [removeThreshold, solidifyThreshold, hasTransparencyIssues, resultImage]);

    // Processar remoção de fundo
    const handleRemoveBackground = useCallback(async () => {
        setProcessing(true);
        setError(null);
        setResultImage(null);
        setHasTransparencyIssues(false);
        setCorrectedImage(null);

        try {
            if (!window.electronAPI?.removeBackgroundBase64) {
                throw new Error('Função de remoção de fundo não disponível neste ambiente');
            }

            const base64Data = imageSrc.includes('base64,')
                ? imageSrc.split('base64,')[1]
                : imageSrc;

            const result = await window.electronAPI.removeBackgroundBase64(
                base64Data,
                mode === 'precision'
            );

            if (result.success && result.resultBase64) {
                const processedSrc = `data:image/png;base64,${result.resultBase64}`;
                setResultImage(processedSrc);
                setShowComparison(true);

                // Analisar transparência
                const analysis = await analyzeTransparency(processedSrc);
                if (analysis.hasIssues) {
                    console.log('[BG Tool] Transparência problemática detectada:', analysis.issuePercentage.toFixed(2) + '%');
                    setHasTransparencyIssues(true);
                    setTransparencyPercentage(analysis.issuePercentage);
                    setDiagnosticPreview(analysis.previewUrl); // Imagem com marcação neon
                    setShowDiagnostic(true); // Mostrar diagnóstico por padrão
                }
            } else {
                throw new Error(result.error || 'Erro ao processar imagem');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
            console.error('Erro na remoção de fundo:', err);
        } finally {
            setProcessing(false);
        }
    }, [imageSrc, mode]);

    // HANDLER DO MODO TESTER
    const handleTesterRemove = useCallback(async () => {
        setProcessing(true);
        setError(null);
        setResultImage(null);
        setHasTransparencyIssues(false);
        setCorrectedImage(null);

        try {
            const response = await fetch('http://localhost:8002/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_base64: imageSrc,
                    threshold: 0.2
                })
            });

            if (!response.ok) {
                throw new Error(`Erro no servidor de teste: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.result_image) {
                setResultImage(result.result_image);
                setShowComparison(true);

                // Analisar transparência
                const analysis = await analyzeTransparency(result.result_image);
                if (analysis.hasIssues) {
                    setHasTransparencyIssues(true);
                    setTransparencyPercentage(analysis.issuePercentage);
                    setDiagnosticPreview(analysis.previewUrl);
                    setShowDiagnostic(true);
                }
            } else {
                throw new Error(result.error || 'Erro desconhecido no Tester');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar no servidor de teste';
            setError(errorMessage);
        } finally {
            setProcessing(false);
        }
    }, [imageSrc]);

    // Aplicar resultado (usando imagem corrigida se disponível)
    const handleApply = useCallback(() => {
        const imageToApply = (hasTransparencyIssues && correctedImage) ? correctedImage : resultImage;
        if (imageToApply) {
            onApply(imageToApply);
        }
    }, [resultImage, correctedImage, hasTransparencyIssues, onApply]);

    const handleReset = useCallback(() => {
        setResultImage(null);
        setShowComparison(false);
        setError(null);
        setHasTransparencyIssues(false);
        setCorrectedImage(null);
        setDiagnosticPreview(null);
        setShowDiagnostic(false);
    }, []);

    // Imagem a mostrar no preview
    // Se showDiagnostic e temos diagnosticPreview -> mostra diagnóstico (neon)
    // Senão, se temos correção aplicada -> mostra corrigida
    // Senão -> mostra resultado bruto
    const displayImage = showDiagnostic && diagnosticPreview
        ? diagnosticPreview
        : (hasTransparencyIssues && correctedImage ? correctedImage : resultImage);

    return (
        <div className="background-removal-tool">
            <div className="bg-tool-header">
                <h3>Remoção de Fundo Inteligente</h3>
                <button onClick={onClose} className="bg-tool-close" title="Fechar (Esc)">
                    ✕
                </button>
            </div>

            <div className="bg-tool-content">
                <div className="bg-tool-canvas-container">
                    {showComparison && displayImage ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ReactCompareSlider
                                itemOne={<ReactCompareSliderImage src={displayImage} alt="Sem Fundo" style={{ objectFit: 'contain' }} />}
                                itemTwo={<ReactCompareSliderImage src={imageSrc} alt="Original" style={{ objectFit: 'contain' }} />}
                                style={{ width: '100%', height: '100%', maxHeight: '600px' }}
                            />
                        </div>
                    ) : (
                        <canvas ref={canvasRef} className="bg-tool-canvas" />
                    )}

                    {processing && (
                        <div className="bg-tool-loading">
                            <div className="spinner"></div>
                            <p>Removendo fundo...</p>
                            <p className="loading-hint">Isso pode levar alguns segundos</p>
                        </div>
                    )}
                </div>

                <div className="bg-tool-controls">
                    {/* Modo de remoção */}
                    <div className="bg-tool-mode">
                        <label>Modo de Remoção:</label>
                        <div className="mode-buttons">
                            <button
                                className={mode === 'auto' ? 'active' : ''}
                                onClick={() => setMode('auto')}
                                disabled={processing}
                            >
                                <span className="mode-icon">⚡</span>
                                <span>Rápido</span>
                            </button>
                            <button
                                className={mode === 'precision' ? 'active' : ''}
                                onClick={() => setMode('precision')}
                                disabled={processing}
                            >
                                <span className="mode-icon">🎯</span>
                                <span>Precisão</span>
                            </button>
                        </div>
                        <p className="mode-hint">
                            {mode === 'auto'
                                ? '⚡ Processamento rápido, ideal para a maioria das imagens'
                                : '🎯 Alta precisão com alpha matting para detalhes finos'}
                        </p>
                    </div>

                    {/* TESTER */}
                    <div className="bg-tool-tester-section" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            onClick={handleTesterRemove}
                            disabled={processing}
                            className="btn"
                            style={{
                                width: '100%',
                                background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                                border: 'none',
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '12px'
                            }}
                        >
                            🚀 TESTER (Qualidade Extrema)
                        </button>
                        <p className="loading-hint" style={{ fontSize: '0.8em', marginTop: '5px' }}>
                            Requer <strong>run_tester.bat</strong> rodando
                        </p>
                    </div>

                    {/* === SEÇÃO DE TRANSPARÊNCIA (INTEGRADA) === */}
                    {hasTransparencyIssues && resultImage && (
                        <div style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: 'linear-gradient(135deg, rgba(255,0,255,0.15), rgba(139,92,246,0.15))',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,0,255,0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '1.2em' }}>⚠️</span>
                                <span style={{ fontWeight: 'bold', color: '#ff00ff' }}>
                                    Semitransparência Detectada ({transparencyPercentage.toFixed(1)}%)
                                </span>
                            </div>
                            <p style={{ fontSize: '0.85em', color: '#aaa', marginBottom: '12px' }}>
                                Ajuste os controles abaixo para evitar falhas de impressão DTF/DTG:
                            </p>

                            {/* Toggle de visualização */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <button
                                    onClick={() => setShowDiagnostic(true)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: showDiagnostic ? '2px solid #ff00ff' : '1px solid #555',
                                        background: showDiagnostic ? 'rgba(255,0,255,0.2)' : 'transparent',
                                        color: showDiagnostic ? '#ff00ff' : '#888',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: showDiagnostic ? 'bold' : 'normal',
                                        fontSize: '0.85em'
                                    }}
                                >
                                    🔍 Ver Diagnóstico
                                </button>
                                <button
                                    onClick={() => setShowDiagnostic(false)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: !showDiagnostic ? '2px solid #22c55e' : '1px solid #555',
                                        background: !showDiagnostic ? 'rgba(34,197,94,0.2)' : 'transparent',
                                        color: !showDiagnostic ? '#22c55e' : '#888',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: !showDiagnostic ? 'bold' : 'normal',
                                        fontSize: '0.85em'
                                    }}
                                >
                                    ✓ Ver Correção
                                </button>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Remover (Alpha &lt; {removeThreshold})</span>
                                    <span style={{ color: '#888' }}>Limpa bordas fracas</span>
                                </label>
                                <input
                                    type="range"
                                    min={0}
                                    max={128}
                                    value={removeThreshold}
                                    onChange={(e) => setRemoveThreshold(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#ff00ff' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Solidificar (Alpha &gt; {solidifyThreshold})</span>
                                    <span style={{ color: '#888' }}>Torna opaco</span>
                                </label>
                                <input
                                    type="range"
                                    min={128}
                                    max={255}
                                    value={solidifyThreshold}
                                    onChange={(e) => setSolidifyThreshold(parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                                />
                            </div>

                            {isApplyingFix && (
                                <p style={{ fontSize: '0.8em', color: '#888', marginTop: '8px', textAlign: 'center' }}>
                                    Aplicando correção...
                                </p>
                            )}
                        </div>
                    )}

                    {/* Dicas */}
                    <div className="bg-tool-tips">
                        <h4>💡 Dicas</h4>
                        <ul>
                            <li>Use o modo <strong>Precisão</strong> para fotos de pessoas</li>
                            <li>Imagens com fundo limpo têm melhores resultados</li>
                            <li>Arraste o divisor para comparar antes/depois</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="bg-tool-error">
                            <strong>Erro:</strong> {error}
                        </div>
                    )}

                    {/* Botões de ação */}
                    <div className="bg-tool-actions">
                        {!resultImage ? (
                            <button
                                onClick={handleRemoveBackground}
                                disabled={processing || !imageLoaded}
                                className="btn btn-primary"
                            >
                                {processing ? 'Processando...' : '🎯 Remover Fundo'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleApply}
                                    disabled={processing || isApplyingFix}
                                    className="btn btn-success"
                                >
                                    ✓ Aplicar Resultado
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={processing}
                                    className="btn btn-secondary"
                                >
                                    ↻ Tentar Novamente
                                </button>
                            </>
                        )}

                        <button
                            onClick={handleClose}
                            disabled={processing}
                            className="btn btn-danger"
                        >
                            ✕ Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackgroundRemovalTool;
