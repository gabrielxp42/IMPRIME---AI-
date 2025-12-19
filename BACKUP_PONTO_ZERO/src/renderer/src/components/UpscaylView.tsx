import React, { useState, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import './UpscaylView.css';

const UpscaylView: React.FC = () => {
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [scale, setScale] = useState<number>(4);
    const [inputPath, setInputPath] = useState<string>('');
    const [originalInputPath, setOriginalInputPath] = useState<string>('');
    const [outputPath, setOutputPath] = useState<string>('');
    const [beforePreview, setBeforePreview] = useState<string>('');
    const [afterPreview, setAfterPreview] = useState<string>('');
    const [processing, setProcessing] = useState<boolean>(false);
    const [removingBg, setRemovingBg] = useState<boolean>(false);
    const [showModelModal, setShowModelModal] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
    const [removeInternalBlacks, setRemoveInternalBlacks] = useState<boolean>(false);
    const [blackThreshold, setBlackThreshold] = useState<number>(30);
    const [showPhotoshopModal, setShowPhotoshopModal] = useState<boolean>(false);
    const [targetWidth, setTargetWidth] = useState<string>('10');
    const [targetDpi, setTargetDpi] = useState<string>('300');
    const [addMargin, setAddMargin] = useState<boolean>(true);
    const [previewBgPath, setPreviewBgPath] = useState<string>('');
    const [previewBgDataUrl, setPreviewBgDataUrl] = useState<string>(''); // Data URL para preview de remoção de fundo
    const [imageError, setImageError] = useState<string>('');

    // Metadados dos modelos para exibição visual
    const MODEL_METADATA: Record<string, { name: string; description: string; gradient: string }> = {
        'realesrgan-x4plus': {
            name: 'Upscayl Padrão',
            description: 'Adequado para a maioria das imagens. Equilibra velocidade e qualidade.',
            gradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
        },
        'remacri': {
            name: 'Upscayl Leve',
            description: 'Aprimoramento de alta velocidade com perda mínima de qualidade. Ideal para testes rápidos.',
            gradient: 'linear-gradient(135deg, #16a085 0%, #f4d03f 100%)'
        },
        'ultramix': {
            name: 'Ultramix (Alta Fidelidade)',
            description: 'Para imagens naturais com equilíbrio perfeito entre nitidez e detalhe.',
            gradient: 'linear-gradient(135deg, #8e44ad 0%, #c0392b 100%)'
        },
        'ultrasharp': {
            name: 'Ultrasharp (Máxima Nitidez)',
            description: 'Foco total em nitidez e bordas definidas. Ótimo para arquitetura e objetos.',
            gradient: 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)'
        },
        'realesrgan-x4plus-anime': {
            name: 'Anime / Desenho',
            description: 'Otimizado especificamente para arte 2D, anime e desenhos animados.',
            gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)'
        }
    };

    const getModelInfo = (modelId: string) => {
        return MODEL_METADATA[modelId] || {
            name: modelId,
            description: 'Modelo de upscaling genérico.',
            gradient: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)'
        };
    };

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            const modelList = await window.electronAPI.listUpscaleModels();
            setModels(modelList);
            if (modelList.length > 0) {
                setSelectedModel(modelList[0]);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao carregar modelos' });
        }
    };

    const handleSelectFile = async () => {
        try {
            const files = await window.electronAPI.selectFiles();
            if (!files || files.length === 0) {
                setMessage({ type: 'error', text: 'Nenhum arquivo selecionado' });
                return;
            }
            const file = files[0];
            console.log('[Upscayl] Arquivo selecionado:', file);

            setInputPath(file);
            setOriginalInputPath(file);
            setImageError('');

            // Ler arquivo como data URL usando IPC (funciona sem restrições de segurança)
            const result = await window.electronAPI.readFileAsDataUrl(file);
            if (result.success && result.dataUrl) {
                console.log('[Upscayl] Data URL gerada com sucesso');
                setBeforePreview(result.dataUrl);
            } else {
                console.error('[Upscayl] Erro ao gerar data URL:', result.error);
                setMessage({ type: 'error', text: result.error || 'Erro ao carregar preview' });
            }

            const outputFile = file.replace(/(\.\w+)$/, '_upscaled$1');
            setOutputPath(outputFile);

            setMessage({ type: 'info', text: 'Arquivo selecionado. Pronto para upscaling!' });
            setAfterPreview('');
        } catch (error) {
            console.error('[Upscayl] Erro ao selecionar arquivo:', error);
            setMessage({ type: 'error', text: 'Erro ao selecionar arquivo' });
        }
    };

    const handleUpscale = async () => {
        if (!inputPath) {
            setMessage({ type: 'error', text: 'Selecione um arquivo primeiro' });
            return;
        }

        setProcessing(true);
        setMessage({ type: 'info', text: 'Processando... Isso pode levar alguns minutos.' });

        try {
            const result = await window.electronAPI.upscaleImage(inputPath, outputPath, selectedModel, scale);

            if (result.success && result.outputPath) {
                // Carregar imagem upscaled como data URL
                const dataUrlResult = await window.electronAPI.readFileAsDataUrl(result.outputPath);
                if (dataUrlResult.success && dataUrlResult.dataUrl) {
                    setAfterPreview(dataUrlResult.dataUrl);
                    setMessage({ type: 'success', text: `Imagem upscaled com sucesso! Salva em: ${result.outputPath}` });
                } else {
                    setMessage({ type: 'error', text: 'Upscale concluído, mas erro ao carregar preview' });
                }
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro desconhecido ao processar' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: (error as Error).message });
        } finally {
            setProcessing(false);
        }
    };

    const handleRemoveBackground = async () => {
        if (!inputPath) return;

        setRemovingBg(true);
        setMessage({ type: 'info', text: 'Gerando preview sem fundo...' });

        try {
            let sourceFile = inputPath;

            if (afterPreview) {
                sourceFile = outputPath;
            }

            const outputBgPath = sourceFile.replace(/(\.\w+)$/, '_preview_nobg.png');

            console.log('[RemoveBG] Gerando preview em:', outputBgPath);

            const result = await window.electronAPI.removeBackground(
                sourceFile,
                outputBgPath,
                removeInternalBlacks,
                blackThreshold
            );

            if (result.success && result.outputPath) {
                setPreviewBgPath(result.outputPath);
                // Carregar preview como data URL
                const dataUrlResult = await window.electronAPI.readFileAsDataUrl(result.outputPath);
                if (dataUrlResult.success && dataUrlResult.dataUrl) {
                    setPreviewBgDataUrl(dataUrlResult.dataUrl);
                }
                setMessage({ type: 'success', text: 'Preview gerado! Confirme para salvar.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao remover fundo' });
            }
        } catch (error) {
            console.error('Erro ao remover fundo:', error);
            setMessage({ type: 'error', text: 'Erro ao remover fundo' });
        } finally {
            setRemovingBg(false);
        }
    };

    const handleConfirmBgRemoval = async () => {
        if (!previewBgPath) return;

        try {
            setInputPath(previewBgPath);
            // Carregar preview como data URL
            const dataUrlResult = await window.electronAPI.readFileAsDataUrl(previewBgPath);
            if (dataUrlResult.success && dataUrlResult.dataUrl) {
                setBeforePreview(dataUrlResult.dataUrl);
            }
            setAfterPreview('');
            setPreviewBgPath('');
            setPreviewBgDataUrl('');
            setMessage({ type: 'success', text: 'Fundo removido aplicado com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao aplicar alteração' });
        }
    };

    const handleCancelBgRemoval = () => {
        setPreviewBgPath('');
        setPreviewBgDataUrl('');
        setMessage({ type: 'info', text: 'Remoção de fundo cancelada.' });
    };

    const handleUndoRemoveBackground = async () => {
        if (originalInputPath) {
            setInputPath(originalInputPath);
            // Carregar preview como data URL
            const dataUrlResult = await window.electronAPI.readFileAsDataUrl(originalInputPath);
            if (dataUrlResult.success && dataUrlResult.dataUrl) {
                setBeforePreview(dataUrlResult.dataUrl);
            }
            setAfterPreview('');
            setMessage({ type: 'info', text: 'Remoção de fundo desfeita' });
        }
    };

    const handleRemoveBackgroundManual = async () => {
        if (!inputPath) {
            setMessage({ type: 'error', text: 'Selecione uma imagem primeiro' });
            return;
        }

        setRemovingBg(true);
        setMessage({ type: 'info', text: 'Processando com alta precisão (InSPyReNet)...' });

        try {
            let sourceFile = inputPath;

            if (afterPreview) {
                sourceFile = outputPath;
            }

            const outputBgPath = sourceFile.replace(/(\.\w+)$/, '_preview_nobg_inspyrenet.png');

            console.log('[RemoveBG InSPyReNet] Arquivo fonte:', sourceFile);
            console.log('[RemoveBG InSPyReNet] Saída:', outputBgPath);

            const result = await window.electronAPI.removeBackgroundManual(
                sourceFile,
                outputBgPath,
                null
            );

            if (result.success && result.outputPath) {
                setPreviewBgPath(result.outputPath);
                // Carregar preview como data URL
                const dataUrlResult = await window.electronAPI.readFileAsDataUrl(result.outputPath);
                if (dataUrlResult.success && dataUrlResult.dataUrl) {
                    setPreviewBgDataUrl(dataUrlResult.dataUrl);
                }
                setMessage({ type: 'success', text: 'Preview gerado com alta precisão! Confirme para salvar.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao remover fundo' });
            }
        } catch (error) {
            console.error('Erro ao remover fundo (InSPyReNet):', error);
            setMessage({ type: 'error', text: 'Erro ao processar com InSPyReNet' });
        } finally {
            setRemovingBg(false);
        }
    };

    const handleOpenInPhotoshopClick = () => {
        setShowPhotoshopModal(true);
    };

    const handleConfirmOpenPhotoshop = async () => {
        setShowPhotoshopModal(false);

        let fileToOpen = inputPath;

        if (afterPreview) {
            fileToOpen = outputPath;
        }

        if (!fileToOpen) {
            setMessage({ type: 'error', text: 'Nenhum arquivo para abrir' });
            return;
        }

        try {
            setMessage({ type: 'info', text: 'Enviando para o Photoshop...' });

            const widthCm = parseFloat(targetWidth) || 0;
            const dpi = parseInt(targetDpi) || 300;

            if (widthCm > 0) {
                await window.electronAPI.openInPhotoshop(fileToOpen, widthCm, dpi, addMargin);
            } else {
                await window.electronAPI.openInPhotoshop(fileToOpen);
            }

            setMessage({ type: 'success', text: 'Enviado para o Photoshop!' });
        } catch (error) {
            console.error('Erro ao abrir no Photoshop:', error);
            setMessage({ type: 'error', text: 'Erro ao abrir no Photoshop' });
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        console.error('[Upscayl] Erro ao carregar imagem:', target.src);
        setImageError(`Erro ao carregar: ${target.src}`);
    };

    return (
        <div className="upscayl-container">
            {/* Controles no topo */}
            <div className="upscayl-controls">
                <div className="control-group">
                    <label>Imagem</label>
                    <button
                        className="btn btn-select"
                        onClick={handleSelectFile}
                        disabled={processing}
                    >
                        📁 Selecionar Imagem
                    </button>
                </div>

                <div className="control-group">
                    <label>Modelo AI</label>
                    <button
                        className="model-selector-btn"
                        onClick={() => setShowModelModal(true)}
                        disabled={processing}
                    >
                        <div className="model-selector-info">
                            <span className="model-name">{getModelInfo(selectedModel).name}</span>
                            <span className="model-desc">{getModelInfo(selectedModel).description.substring(0, 40)}...</span>
                        </div>
                        <span>▼</span>
                    </button>
                </div>

                <div className="control-group">
                    <label>Escala ({scale}x)</label>
                    <input
                        type="range"
                        min={2}
                        max={8}
                        value={scale}
                        onChange={(e) => setScale(parseInt(e.target.value))}
                        disabled={processing}
                        className="scale-slider"
                    />
                </div>

                <div className="control-group">
                    <label>Ação</label>
                    <button
                        className="btn btn-primary"
                        onClick={handleUpscale}
                        disabled={processing || !inputPath}
                    >
                        {processing ? (
                            <>
                                <span className="spinner"></span>
                                <span>Processando...</span>
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                <span>Upscayl</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Mensagem */}
            {message && (
                <div className={`message-bar message-${message.type}`}>
                    <span className="message-icon">
                        {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <span>{message.text}</span>
                </div>
            )}

            {/* Debug: mostrar erro de imagem */}
            {imageError && (
                <div style={{ background: 'red', color: 'white', padding: '10px', margin: '10px' }}>
                    DEBUG: {imageError}
                </div>
            )}

            {/* Controles Avançados de Remoção de Fundo */}
            {inputPath && (
                <div className="bg-removal-advanced-controls">
                    <div className="advanced-control-item">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={removeInternalBlacks}
                                onChange={(e) => setRemoveInternalBlacks(e.target.checked)}
                                disabled={processing || removingBg}
                            />
                            <span>✂️ Remover pretos internos também</span>
                        </label>
                    </div>

                    {removeInternalBlacks && (
                        <div className="advanced-control-item">
                            <label className="slider-label">
                                <span>Sensibilidade de Preto: <strong>{blackThreshold}</strong></span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={blackThreshold}
                                    onChange={(e) => setBlackThreshold(parseInt(e.target.value))}
                                    disabled={processing || removingBg}
                                    className="black-threshold-slider"
                                />
                                <div className="slider-labels">
                                    <span>Menos (0)</span>
                                    <span>Mais (100)</span>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* Preview */}
            <div className="upscayl-preview">
                {/* Toolbar de Confirmação de Remoção de Fundo */}
                {previewBgPath && (
                    <div className="preview-toolbar" style={{ justifyContent: 'space-between', background: 'rgba(52, 152, 219, 0.2)', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#3498db' }}>👁️ Confirmar Remoção?</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-toolbar" onClick={handleCancelBgRemoval} style={{ background: '#e74c3c' }}>❌ Cancelar</button>
                            <button className="btn-toolbar" onClick={handleConfirmBgRemoval} style={{ background: '#2ecc71' }}>✅ Aplicar</button>
                        </div>
                    </div>
                )}

                {/* Toolbar Normal (só mostra se não estiver em preview de remoção) */}
                {inputPath && !previewBgPath && (
                    <div className="preview-toolbar">
                        <button
                            className="btn-toolbar"
                            onClick={handleRemoveBackground}
                            disabled={processing || removingBg}
                            title="Remover Fundo da Imagem"
                        >
                            {removingBg ? '⏳ Removendo...' : '✂️ Remover Fundo'}
                        </button>

                        <button
                            className="btn-toolbar"
                            onClick={handleRemoveBackgroundManual}
                            disabled={processing || removingBg}
                            title="Remover Fundo com Alta Precisão (InSPyReNet)"
                            style={{ marginLeft: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                            ✨ Alta Precisão
                        </button>

                        {originalInputPath && inputPath !== originalInputPath && (
                            <button
                                className="btn-toolbar"
                                onClick={handleUndoRemoveBackground}
                                disabled={processing || removingBg}
                                title="Desfazer Remoção de Fundo"
                                style={{ marginLeft: '10px' }}
                            >
                                ↩️ Desfazer
                            </button>
                        )}

                        <button
                            className="btn-toolbar"
                            onClick={handleOpenInPhotoshopClick}
                            disabled={processing || removingBg}
                            title="Abrir no Photoshop"
                            style={{ marginLeft: '10px' }}
                        >
                            🎨 Abrir no Photoshop
                        </button>
                    </div>
                )}

                {/* Área de Visualização */}
                {previewBgPath && previewBgDataUrl ? (
                    <ReactCompareSlider
                        itemOne={
                            <ReactCompareSliderImage
                                src={previewBgDataUrl}
                                alt="Sem Fundo"
                                style={{ objectFit: 'contain' }}
                            />
                        }
                        itemTwo={
                            <ReactCompareSliderImage
                                src={beforePreview}
                                alt="Original"
                                style={{ objectFit: 'contain' }}
                            />
                        }
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : beforePreview && afterPreview ? (
                    <ReactCompareSlider
                        itemOne={<ReactCompareSliderImage src={afterPreview} alt="Aprimorado" style={{ objectFit: 'contain' }} />}
                        itemTwo={<ReactCompareSliderImage src={beforePreview} alt="Original" style={{ objectFit: 'contain' }} />}
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : beforePreview ? (
                    <div className="preview-single">
                        <img
                            src={beforePreview}
                            alt="Preview"
                            onError={handleImageError}
                        />
                        <p className="preview-hint">Clique em "Upscayl" para processar</p>
                    </div>
                ) : (
                    <div className="preview-empty">
                        <span className="empty-icon">🖼️</span>
                        <p>Selecione uma imagem para começar</p>
                    </div>
                )}
            </div>

            {/* Modal de Photoshop */}
            {showPhotoshopModal && (
                <div className="modal-overlay" onClick={() => setShowPhotoshopModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Abrir no Photoshop</h3>
                            <button className="btn-close" onClick={() => setShowPhotoshopModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Largura Final (cm):</label>
                                <input
                                    type="number"
                                    value={targetWidth}
                                    onChange={e => setTargetWidth(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: '#fff' }}
                                />
                                <small style={{ color: '#aaa' }}>Deixe 0 para manter tamanho original</small>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Resolução (DPI):</label>
                                <input
                                    type="number"
                                    value={targetDpi}
                                    onChange={e => setTargetDpi(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: '#fff' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={addMargin}
                                        onChange={e => setAddMargin(e.target.checked)}
                                    />
                                    <span>Adicionar margem de segurança (10%)</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="btn" onClick={() => setShowPhotoshopModal(false)} style={{ background: '#555' }}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleConfirmOpenPhotoshop}>Abrir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Seleção de Modelo */}
            {showModelModal && (
                <div className="modal-overlay" onClick={() => setShowModelModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Selecionar modelo AI</h3>
                            <button className="btn-close" onClick={() => setShowModelModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="models-grid">
                                {models.map(model => {
                                    const info = getModelInfo(model);
                                    return (
                                        <div
                                            key={model}
                                            className={`model-card ${selectedModel === model ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedModel(model);
                                                setShowModelModal(false);
                                            }}
                                        >
                                            <div className="card-image">
                                                <div className="card-image-preview">
                                                    <div
                                                        className="preview-before"
                                                        style={{ backgroundImage: info.gradient }}
                                                    >
                                                        <span className="preview-label">Antes</span>
                                                    </div>
                                                    <div
                                                        className="preview-after"
                                                        style={{ backgroundImage: info.gradient, filter: 'brightness(1.2) contrast(1.1)' }}
                                                    >
                                                        <span className="preview-label">Depois</span>
                                                    </div>
                                                </div>
                                                {selectedModel === model && (
                                                    <div className="selected-indicator">✓</div>
                                                )}
                                            </div>
                                            <div className="card-content">
                                                <div className="card-title">{info.name}</div>
                                                <div className="card-desc">{info.description}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpscaylView;
