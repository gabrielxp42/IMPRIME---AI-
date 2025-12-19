/**
 * Ferramenta de Remoção de Fundo Inteligente
 * Usa rembg via IPC do Electron (sem servidor separado)
 * Traduzido para Português BR
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
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

        // Ajustar tamanho do canvas
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

        // Desenhar padrão de transparência
        drawCheckerboard(ctx, width, height);

        // Desenhar imagem
        ctx.drawImage(img, 0, 0, width, height);
    }, []);

    // Desenhar padrão xadrez (transparência)
    const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const size = 10;
        for (let x = 0; x < width; x += size) {
            for (let y = 0; y < height; y += size) {
                ctx.fillStyle = ((x + y) / size) % 2 === 0 ? '#e0e0e0' : '#c0c0c0';
                ctx.fillRect(x, y, size, size);
            }
        }
    };

    // Redesenhar quando imagem carregar ou mudar modo de visualização
    useEffect(() => {
        if (imageLoaded) {
            drawOriginalCanvas();
        }
    }, [imageLoaded, drawOriginalCanvas, showComparison, resultImage]);

    // Processar remoção de fundo
    const handleRemoveBackground = useCallback(async () => {
        setProcessing(true);
        setError(null);
        setResultImage(null);

        try {
            // Verificar se estamos no Electron
            if (!window.electronAPI?.removeBackgroundBase64) {
                throw new Error('Função de remoção de fundo não disponível neste ambiente');
            }

            // Extrair base64 puro
            const base64Data = imageSrc.includes('base64,')
                ? imageSrc.split('base64,')[1]
                : imageSrc;

            // Chamar o handler do Electron
            const result = await window.electronAPI.removeBackgroundBase64(
                base64Data,
                mode === 'precision' // highPrecision
            );

            if (result.success && result.resultBase64) {
                const processedSrc = `data:image/png;base64,${result.resultBase64}`;
                setResultImage(processedSrc);
                setShowComparison(true);
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

    // HANDLER DO MODO TESTER (Alta Qualidade)
    const handleTesterRemove = useCallback(async () => {
        setProcessing(true);
        setError(null);
        setResultImage(null);

        try {
            console.log("Iniciando remoção via TESTER (InSPyReNet)...");

            // Chamar servidor Python local na porta 8002
            const response = await fetch('http://localhost:8002/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_base64: imageSrc,
                    threshold: 0.2 // Tenta preservar detalhes tênues (texto)
                })
            });

            if (!response.ok) {
                throw new Error(`Erro no servidor de teste: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.result_image) {
                setResultImage(result.result_image);
                setShowComparison(true);
            } else {
                throw new Error(result.error || 'Erro desconhecido no Tester');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar no servidor de teste (Verifique se run_tester.bat está rodando)';
            setError(errorMessage);
            console.error('Erro Tester:', err);
        } finally {
            setProcessing(false);
        }
    }, [imageSrc]);

    // Aplicar resultado
    const handleApply = useCallback(() => {
        if (resultImage) {
            onApply(resultImage);
        }
    }, [resultImage, onApply]);

    // Limpar e reiniciar
    const handleReset = useCallback(() => {
        setResultImage(null);
        setShowComparison(false);
        setError(null);
    }, []);

    // Controle de comparação removido em favor do ReactCompareSlider


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
                    {/* Preview com comparação */}
                    {showComparison && resultImage ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ReactCompareSlider
                                itemOne={<ReactCompareSliderImage src={resultImage} alt="Sem Fundo" style={{ objectFit: 'contain' }} />}
                                itemTwo={<ReactCompareSliderImage src={imageSrc} alt="Original" style={{ objectFit: 'contain' }} />}
                                style={{ width: '100%', height: '100%', maxHeight: '600px' }}
                            />
                        </div>
                    ) : (
                        <canvas ref={canvasRef} className="bg-tool-canvas" />
                    )}

                    {/* Loading */}
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
                                : '🎯 Alta precisão com alpha matting para detalhes finos (cabelos, pelos)'}
                        </p>
                    </div>

                    {/* MODO TESTER (BETA) */}
                    <div className="bg-tool-tester-section" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
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

                    {/* Dicas */}
                    <div className="bg-tool-tips">
                        <h4>💡 Dicas</h4>
                        <ul>
                            <li>Use o modo <strong>Precisão</strong> para fotos de pessoas</li>
                            <li>Imagens com fundo limpo têm melhores resultados</li>
                            <li>Arraste o divisor para comparar antes/depois</li>
                        </ul>
                    </div>

                    {/* Erro */}
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
                                    disabled={processing}
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
