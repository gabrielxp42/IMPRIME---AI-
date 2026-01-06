
import React, { useState, useRef, useEffect } from 'react';
import {
    Download,
    X,
    Plus,
    Send,
    Bot,
    User,
    ImagePlus,
    RefreshCw,
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Palette,
    Monitor,
    Maximize2
} from 'lucide-react';
import './MockupsView.css';
import model1 from '../assets/modelo-mck-01.png';
import model2 from '../assets/modelo-mck-02.jpg';
import model3 from '../assets/modelo-mck-03.jpg';

interface UploadedImage {
    id: string;
    dataUrl: string;
    index: number;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    images?: string[];
    resultImage?: string;
}

interface MockupsViewProps {
    kieAiApiKey: string;
}

const MOCKUP_MODELS = [
    { id: 'mck-01', name: 'Duo Studio', image: model1, hasTwoSides: true },
    { id: 'mck-02', name: 'Lifestyle', image: model2, hasTwoSides: false },
    { id: 'mck-03', name: 'Streetwear', image: model3, hasTwoSides: false },
];

const COLORS = [
    { name: 'Branco', hex: '#FFFFFF', border: '#e2e8f0' },
    { name: 'Preto', hex: '#000000', border: '#333' },
    { name: 'Cinza', hex: '#808080', border: 'transparent' },
    { name: 'Azul', hex: '#2563eb', border: 'transparent' },
    { name: 'Vermelho', hex: '#dc2626', border: 'transparent' },
];

interface PendingImage {
    url: string;
    placement: 'frente' | 'costas' | 'manga_esq' | 'manga_dir' | 'livre';
    size: 'pequeno' | 'medio' | 'grande' | 'total';
    notes: string;
}

const MockupsView: React.FC<MockupsViewProps> = ({ kieAiApiKey }) => {
    const [selectedModel, setSelectedModel] = useState(MOCKUP_MODELS[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[1]);

    // Lista de imagens já processadas na sessão (histórico)
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

    // Imagens que o usuário acabou de adicionar e está configurando
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Olá! 👋 Escolha um modelo, cor e envie suas artes abaixo.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastResult, setLastResult] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setPendingImages(prev => [...prev, {
                        url: ev.target!.result as string,
                        placement: 'livre',
                        size: 'medio',
                        notes: ''
                    }]);
                }
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (ev.target?.result) {
                            setPendingImages(prev => [...prev, {
                                url: ev.target!.result as string,
                                placement: 'livre',
                                size: 'medio',
                                notes: ''
                            }]);
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const updatePending = (index: number, field: keyof PendingImage, value: any) => {
        setPendingImages(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const removePending = (index: number) => {
        setPendingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if (!inputValue.trim() && pendingImages.length === 0) return;

        // Converter pendingImages (smart cards) para uploadedImages (histórico)
        const newUploadedImages: UploadedImage[] = pendingImages.map((p, i) => ({
            id: Date.now().toString() + i,
            dataUrl: p.url,
            index: uploadedImages.length + i + 1
        }));

        const allSessionImages = [...uploadedImages, ...newUploadedImages];
        setUploadedImages(allSessionImages);

        let autoGeneratedPrompt = "";
        pendingImages.forEach((p, i) => {
            const imgIndex = uploadedImages.length + i + 1;
            const placeMap = {
                'frente': 'NO PEITO/FRENTE',
                'costas': 'NAS COSTAS',
                'manga_esq': 'NA MANGA ESQUERDA',
                'manga_dir': 'NA MANGA DIREITA',
                'livre': ''
            };
            const sizeMap = {
                'pequeno': 'PEQUENO (LOGO)',
                'medio': 'TAMANHO MÉDIO',
                'grande': 'GRANDE DESTAQUE',
                'total': 'PADRÃO FULL PRINT'
            };

            const placement = placeMap[p.placement];
            const size = sizeMap[p.size];

            autoGeneratedPrompt += `(USE O ARQUIVO DA IMAGEM ${imgIndex + 1}) `;
            if (placement) autoGeneratedPrompt += `APLICADA ${placement} `;
            if (size) autoGeneratedPrompt += `EM ${size}. `;
            if (p.notes) autoGeneratedPrompt += `DETALHE: ${p.notes}. `;
            autoGeneratedPrompt += "\n";
        });

        if (inputValue.trim()) {
            autoGeneratedPrompt += `NOTA GERAL / AJUSTE: ${inputValue}`;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: autoGeneratedPrompt || inputValue,
            images: pendingImages.map(p => p.url)
        };
        setMessages(prev => [...prev, userMsg]);

        setInputValue('');
        setPendingImages([]);

        setIsGenerating(true);
        const processingMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '🎨 Recriando Mockup...'
        };
        setMessages(prev => [...prev, processingMsg]);

        try {
            const base64Model = await urlToBase64(selectedModel.image);
            const userArtsBase64 = allSessionImages.map(img => img.dataUrl.split(',')[1]);

            let instructionalPrompt = `A IMAGEM 1 É O MODELO DE MOCKUP BASE (A CAMISA DEVE SER ${selectedColor.name.toUpperCase()}).\n`;

            if (allSessionImages.length > 0) {
                instructionalPrompt += `\nESTAMPAS DISPONÍVEIS NA MEMÓRIA:\n`;
                allSessionImages.forEach(img => {
                    instructionalPrompt += `- (ARQUIVO IMAGEM ${img.index + 1}) PRONTO PARA USO.\n`;
                });
            }

            instructionalPrompt += `\nINSTRUÇÕES DE APLICAÇÃO:\n${autoGeneratedPrompt}`;

            if (pendingImages.length === 0 && allSessionImages.length > 0) {
                instructionalPrompt += `\n(IMPORTANTE: Use as estamaps disponíveis acima conforme o pedido de ajuste: "${inputValue}").`;
            }

            instructionalPrompt += `\n\nCRITICAL: DO NOT CHANGE THE HUMAN MODEL ANATOMY OR POSE. KEEP BACKGROUND EXACTLY AS IMAGE 1. JUST APPLY THE ARTWORK ON THE FABRIC. (photorealistic, 8k, high fidelity, no deformation, realistic texture).`;


            const result = await window.electronAPI.kieAiProcess({
                prompt: instructionalPrompt,
                imageBase64: base64Model,
                additionalImages: userArtsBase64,
                model: 'nano-banana',
                apiKey: kieAiApiKey
            });

            if (result.success && result.imageBase64) {
                const resultUrl = `data:image/png;base64,${result.imageBase64}`;
                setLastResult(resultUrl);
                setMessages(prev => prev.map(m => m.id === processingMsg.id ? { ...m, content: '✨ Mockup atualizado!', resultImage: resultUrl } : m));
            } else {
                throw new Error(result.error || 'Erro na geração');
            }
        } catch (e: any) {
            setMessages(prev => prev.map(m => m.id === processingMsg.id ? { ...m, content: `❌ Ops: ${e.message}` } : m));
        } finally {
            setIsGenerating(false);
        }
    };

    const urlToBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });
    };

    const resetAll = () => {
        setUploadedImages([]);
        setPendingImages([]);
        setLastResult(null);
        setMessages([{ id: '1', role: 'assistant', content: 'Resetado! Comece novamente.' }]);
    };

    return (
        <div className="pro-layout">
            <main className="pro-preview-area">

                {/* TOOLBAR SUPERIOR FIXA */}
                <div className="pro-top-toolbar">
                    <div className="pro-toolbar-info">
                        <span className="pro-model-badge">
                            {selectedModel.name}
                        </span>
                        <span className="pro-color-badge" style={{ backgroundColor: selectedColor.hex, border: `1px solid ${selectedColor.border}` }}></span>
                    </div>
                    <div className="pro-toolbar-actions">
                        {lastResult && (
                            <button className="pro-tool-btn primary" onClick={() => {
                                const link = document.createElement('a'); link.download = 'mockup.png'; link.href = lastResult; link.click();
                            }} title="Baixar Resultado">
                                <Download size={18} />
                                <span>Baixar</span>
                            </button>
                        )}
                        <button className="pro-tool-btn" onClick={resetAll} title="Resetar tudo">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="pro-preview-container">
                    <img src={lastResult || selectedModel.image} className={`pro-preview-img ${isGenerating ? 'blur-loading' : ''}`} alt="Preview" />
                    {isGenerating && (
                        <div className="pro-loading-overlay">
                            <Loader2 className="spin" size={32} />
                            <span>Gerando Mockup...</span>
                        </div>
                    )}
                </div>
            </main>

            <aside className="pro-sidebar">
                <div className="pro-sidebar-header">
                    <h3><Sparkles size={16} /> Studio Mockup</h3>
                </div>

                <div className="pro-config-scroll">

                    {/* LISTA UNIFICADA: CONFIGURAÇÃO + CHAT */}

                    <div className="pro-section">
                        <label>Modelo Base</label>
                        <div className="pro-model-list">
                            {MOCKUP_MODELS.map(m => (
                                <div key={m.id} className={`pro-model-item ${selectedModel.id === m.id ? 'active' : ''}`} onClick={() => { setSelectedModel(m); setLastResult(null); }}>
                                    <img src={m.image} alt={m.name} />
                                    {selectedModel.id === m.id && <div className="active-badge"><Sparkles size={10} /></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pro-section">
                        <label>Cor do Tecido</label>
                        <div className="pro-color-list">
                            {COLORS.map(c => (
                                <button key={c.name} className={`pro-color-dot ${selectedColor.name === c.name ? 'active' : ''}`} style={{ background: c.hex }} onClick={() => setSelectedColor(c)} title={c.name} />
                            ))}
                        </div>
                    </div>

                    <div className="pro-divider"></div>

                    {/* AREA DE CHAT */}
                    <div className="pro-chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`pro-msg ${msg.role}`}>
                                <div className="pro-msg-content">
                                    <p style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>
                                    {msg.images && (
                                        <div className="pro-msg-imgs">
                                            {msg.images.map((img, i) => <img key={i} src={img} alt="thumb" />)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                </div>

                {/* INPUT AREA */}
                <div className="pro-input-area">
                    {pendingImages.length > 0 && (
                        <div className="pro-smart-uploads">
                            {pendingImages.map((img, i) => (
                                <div key={i} className="pro-smart-card">
                                    <div className="pro-card-header-v2">
                                        <div className="pro-header-thumb">
                                            <img src={img.url} alt="art" className="pro-smart-img-v2" />
                                        </div>
                                        <div className="pro-header-actions">
                                            <button className="pro-remove-card-btn-v2" onClick={() => removePending(i)} title="Remover arte">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pro-smart-controls-area">
                                        <div className="pro-control-row">
                                            <span className="pro-label-mini">Posição</span>
                                            <div className="pro-visual-tabs">
                                                <button className={`pro-tab ${img.placement === 'frente' ? 'active' : ''}`} onClick={() => updatePending(i, 'placement', 'frente')}>Frente</button>
                                                <button className={`pro-tab ${img.placement === 'costas' ? 'active' : ''}`} onClick={() => updatePending(i, 'placement', 'costas')}>Costas</button>
                                                <button className={`pro-tab ${img.placement === 'manga_dir' ? 'active' : ''}`} onClick={() => updatePending(i, 'placement', 'manga_dir')}>Manga</button>
                                            </div>
                                        </div>
                                        <div className="pro-control-row">
                                            <span className="pro-label-mini">Tamanho</span>
                                            <div className="pro-size-segments">
                                                {[{ id: 'pequeno', label: 'Logo' }, { id: 'medio', label: 'Médio' }, { id: 'grande', label: 'Max' }, { id: 'total', label: 'Full' }].map((sizeOpt) => (
                                                    <button key={sizeOpt.id} className={`pro-segment ${img.size === sizeOpt.id ? 'active' : ''}`} onClick={() => updatePending(i, 'size', sizeOpt.id as any)}>{sizeOpt.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <input type="text" className="pro-input-mini" placeholder="Detalhes (ex: dourado, bordado)..." value={img.notes} onChange={(e) => updatePending(i, 'notes', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pro-input-row">
                        <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} multiple accept="image/*" />
                        <button className="pro-icon-btn" onClick={() => fileInputRef.current?.click()} title="Anexar Arte">
                            <ImagePlus size={20} />
                        </button>
                        <input
                            type="text"
                            placeholder="Descreva ajustes ou alterações..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            onPaste={handlePaste}
                            disabled={isGenerating}
                        />
                        <button className={`pro-send-btn ${(inputValue || pendingImages.length) ? 'active' : ''}`} onClick={handleSend} disabled={isGenerating}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default MockupsView;
