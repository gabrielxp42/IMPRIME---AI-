
import React, { useEffect, useRef } from 'react';
import './Ruler.css';

interface RulerProps {
    orientation: 'horizontal' | 'vertical';
    length: number; // Largura ou altura total em pixels (zoom 100%)
    scale: number;  // Nível de zoom atual
    dpi: number;    // DPI do documento
    offset?: number; // Scroll offset
}

const Ruler: React.FC<RulerProps> = ({ orientation, length, scale, dpi, offset = 0 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configurar tamanho do canvas para alta resolução (Retina display support)
        const dpr = window.devicePixelRatio || 1;

        // Dimensões visuais
        const width = orientation === 'horizontal' ? canvas.parentElement?.clientWidth || length : 20;
        const height = orientation === 'vertical' ? canvas.parentElement?.clientHeight || length : 20;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // Estilos
        ctx.fillStyle = '#1e293b'; // Cor de fundo da régua
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#94a3b8'; // Cor dos traços
        ctx.fillStyle = '#94a3b8';   // Cor do texto
        ctx.font = '10px Inter, sans-serif';
        ctx.lineWidth = 1;

        // Conversão: 1 polegada = 2.54 cm
        const pxPerCm = dpi / 2.54;
        const pxPerMm = pxPerCm / 10;

        // Calcular início e fim visíveis baseados no offset
        // Offset é quanto o conteúdo "andou" para dentro (scroll)
        const startPos = 0; // Simplificação: desenhamos tudo e o CSS clipa, ou podemos otimizar

        // Desenhar marcações
        // Vamos iterar cm por cm
        const totalCm = (length / pxPerCm); // Comprimento total em cm reais do documento

        ctx.beginPath();

        if (orientation === 'horizontal') {
            // Régua Horizontal
            for (let cm = 0; cm <= totalCm; cm++) {
                const x = (cm * pxPerCm * scale) + offset; // Posição em pixels na tela

                // Traço de CM (longo)
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 20);

                // Número
                if (cm > 0) ctx.fillText(cm.toString(), x + 4, 12);

                // Traços de meio CM (médio)
                const halfPos = x + (0.5 * pxPerCm * scale);
                ctx.moveTo(halfPos, 12);
                ctx.lineTo(halfPos, 20);

                // Traços de MM (curtos)
                for (let mm = 1; mm < 10; mm++) {
                    if (mm === 5) continue; // Já desenhado
                    const mmPos = x + (mm * pxPerMm * scale);
                    ctx.moveTo(mmPos, 16);
                    ctx.lineTo(mmPos, 20);
                }
            }
        } else {
            // Régua Vertical
            for (let cm = 0; cm <= totalCm; cm++) {
                const y = (cm * pxPerCm * scale) + offset;

                // Traço de CM
                ctx.moveTo(0, y);
                ctx.lineTo(20, y);

                // Número (rotacionado ou pequeno)
                if (cm > 0) {
                    ctx.save();
                    ctx.translate(12, y + 4);
                    // ctx.rotate(-Math.PI / 2);
                    ctx.fillText(cm.toString(), -8, 8); // Ajuste fino
                    ctx.restore();
                }

                // Meio CM
                const halfPos = y + (0.5 * pxPerCm * scale);
                ctx.moveTo(12, halfPos);
                ctx.lineTo(20, halfPos);

                // MM
                for (let mm = 1; mm < 10; mm++) {
                    if (mm === 5) continue;
                    const mmPos = y + (mm * pxPerMm * scale);
                    ctx.moveTo(16, mmPos);
                    ctx.lineTo(20, mmPos);
                }
            }
        }

        ctx.stroke();

        // Adicionar borda final
        ctx.beginPath();
        if (orientation === 'horizontal') {
            ctx.moveTo(0, 19.5);
            ctx.lineTo(width, 19.5);
        } else {
            ctx.moveTo(19.5, 0);
            ctx.lineTo(19.5, height);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();

    }, [orientation, length, scale, dpi, offset]);

    return (
        <canvas
            ref={canvasRef}
            className={`ruler ruler-${orientation}`}
            style={{
                backgroundColor: '#1e293b',
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 10
            }}
        />
    );
};

export default Ruler;
