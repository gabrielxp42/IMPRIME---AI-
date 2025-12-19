#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Background Remover usando SAM (Segment Anything Model) da Meta
Versão otimizada para remoção automática de fundo
"""

import sys
import os
import numpy as np
from PIL import Image
import torch

# Imports do SAM
try:
    from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
except ImportError as e:
    print(f"ERROR:Erro ao importar SAM: {str(e)}", file=sys.stderr)
    print(f"ERROR:Execute: pip install git+https://github.com/facebookresearch/segment-anything.git", file=sys.stderr)
    sys.exit(1)

# Caminho do modelo (será baixado automaticamente se necessário)
MODEL_PATH = "sam_vit_b_01ec64.pth"
MODEL_URL = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"

def download_model_if_needed():
    """Baixa o modelo SAM se não existir"""
    if not os.path.exists(MODEL_PATH):
        print(f"PROGRESS:Baixando modelo SAM (~375MB)...", file=sys.stderr, flush=True)
        try:
            import urllib.request
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print(f"PROGRESS:Modelo baixado com sucesso!", file=sys.stderr, flush=True)
        except Exception as e:
            raise Exception(f"ERROR:Erro ao baixar modelo: {e}")

def find_main_object_mask(masks, image_shape):
    """
    Encontra a máscara do objeto principal
    Estratégia: maior área que não seja o fundo inteiro, mais centralizada
    """
    if not masks:
        return None
    
    height, width = image_shape[:2]
    total_pixels = height * width
    center_y, center_x = height // 2, width // 2
    
    # Ordenar por área (maior primeiro)
    masks_sorted = sorted(masks, key=lambda x: x['area'], reverse=True)
    
    best_mask = None
    best_score = -1
    
    for mask_data in masks_sorted:
        area = mask_data['area']
        area_ratio = area / total_pixels
        
        # Ignorar se for muito grande (provavelmente fundo) ou muito pequeno
        if area_ratio > 0.85 or area_ratio < 0.01:
            continue
        
        # Calcular centralização
        segmentation = mask_data['segmentation']
        y_coords, x_coords = np.where(segmentation)
        if len(y_coords) == 0:
            continue
        
        centroid_y = np.mean(y_coords)
        centroid_x = np.mean(x_coords)
        
        # Distância do centro (normalizada)
        dist_from_center = np.sqrt(
            ((centroid_x - center_x) / width) ** 2 +
            ((centroid_y - center_y) / height) ** 2
        )
        
        # Score: combina área e centralização
        # Quanto maior a área e mais centralizado, melhor
        score = area_ratio * (1 - dist_from_center) * mask_data['predicted_iou']
        
        if score > best_score:
            best_score = score
            best_mask = mask_data
    
    return best_mask['segmentation'] if best_mask else None

def remove_background_sam(input_path, output_path, remove_internal_blacks=False, black_threshold=30):
    """
    Remove o fundo usando SAM
    
    Args:
        input_path: Caminho da imagem de entrada
        output_path: Caminho da imagem de saída (PNG com transparência)
        remove_internal_blacks: Se True, remove pretos internos também
        black_threshold: Threshold para considerar pixel como "preto" (0-255)
    
    Returns:
        str: Caminho do arquivo de saída se sucesso
    """
    try:
        # Verificar se arquivo existe
        if not os.path.exists(input_path):
            raise Exception(f"ERROR:Arquivo de entrada não encontrado: {input_path}")
        
        # Baixar modelo se necessário
        download_model_if_needed()
        
        print(f"PROGRESS:Carregando imagem...", file=sys.stderr, flush=True)
        input_image = Image.open(input_path)
        original_size = input_image.size
        
        # Converter para RGB se necessário
        if input_image.mode != 'RGB':
            input_image = input_image.convert('RGB')
        
        img_array = np.array(input_image)
        
        # OTIMIZAÇÃO: Redimensionar se muito grande
        MAX_DIMENSION = 1024  # SAM funciona bem com imagens menores
        if max(original_size) > MAX_DIMENSION:
            print(f"PROGRESS:Redimensionando imagem grande ({original_size[0]}x{original_size[1]}) para {MAX_DIMENSION}px...", file=sys.stderr, flush=True)
            ratio = MAX_DIMENSION / max(original_size)
            new_size = (int(original_size[0] * ratio), int(original_size[1] * ratio))
            input_image_resized = input_image.resize(new_size, Image.Resampling.LANCZOS)
            img_array = np.array(input_image_resized)
            print(f"PROGRESS:Nova resolução para processamento: {new_size[0]}x{new_size[1]}", file=sys.stderr, flush=True)
        
        # Carregar modelo SAM
        print(f"PROGRESS:Inicializando SAM (Meta AI)...", file=sys.stderr, flush=True)
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        sam = sam_model_registry["vit_b"](checkpoint=MODEL_PATH)
        sam.to(device=device)
        
        # Criar gerador de máscaras
        print(f"PROGRESS:Gerando máscaras de segmentação...", file=sys.stderr, flush=True)
        mask_generator = SamAutomaticMaskGenerator(
            model=sam,
            points_per_side=24,  # Otimizado para performance
            pred_iou_thresh=0.88,
            stability_score_thresh=0.95,
            crop_n_layers=1,
            crop_n_points_downscale_factor=2,
            min_mask_region_area=100,
        )
        
        masks = mask_generator.generate(img_array)
        print(f"PROGRESS:Geradas {len(masks)} máscaras. Identificando objeto principal...", file=sys.stderr, flush=True)
        
        # Encontrar máscara do objeto principal
        main_mask = find_main_object_mask(masks, img_array.shape)
        
        if main_mask is None:
            raise Exception("ERROR:Não foi possível identificar o objeto principal na imagem")
        
        print(f"PROGRESS:Objeto principal identificado. Criando imagem com fundo transparente...", file=sys.stderr, flush=True)
        
        # Se redimensionamos, voltar ao tamanho original
        if max(original_size) > MAX_DIMENSION:
            print(f"PROGRESS:Restaurando resolução original...", file=sys.stderr, flush=True)
            main_mask_pil = Image.fromarray(main_mask.astype(np.uint8) * 255)
            main_mask_pil = main_mask_pil.resize(original_size, Image.Resampling.LANCZOS)
            main_mask = np.array(main_mask_pil) > 128
            img_array = np.array(input_image)
        
        # Criar imagem RGBA
        result = Image.new('RGBA', (img_array.shape[1], img_array.shape[0]))
        img_pil = Image.fromarray(img_array)
        result.paste(img_pil, (0, 0))
        
        # Aplicar máscara alpha
        alpha = np.where(main_mask, 255, 0).astype(np.uint8)
        result.putalpha(Image.fromarray(alpha))
        
        # Remover pretos internos se solicitado
        if remove_internal_blacks:
            print(f"PROGRESS:Removendo pretos internos (threshold: {black_threshold})...", file=sys.stderr, flush=True)
            data = np.array(result)
            r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
            is_black = (r <= black_threshold) & (g <= black_threshold) & (b <= black_threshold)
            a[is_black] = 0
            data[:,:,3] = a
            result = Image.fromarray(data, 'RGBA')
        
        # Garantir que o diretório de saída existe
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Salvar
        print(f"PROGRESS:Salvando resultado...", file=sys.stderr, flush=True)
        result.save(output_path, 'PNG', optimize=True)
        
        print(f"PROGRESS:Concluído!", file=sys.stderr, flush=True)
        
        if not os.path.exists(output_path):
            raise Exception("ERROR:Arquivo de saída não foi criado")
        
        return output_path
        
    except Exception as e:
        error_msg = str(e)
        if error_msg.startswith("ERROR:"):
            raise
        else:
            raise Exception(f"ERROR:Erro ao remover fundo: {error_msg}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("ERROR:Uso: python background_remover_sam.py <input_path> <output_path> [remove_blacks] [threshold]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    remove_blacks = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else False
    threshold = int(sys.argv[4]) if len(sys.argv) > 4 else 30
    
    try:
        result = remove_background_sam(input_path, output_path, remove_blacks, threshold)
        print(f"SUCCESS:{result}")
        sys.exit(0)
    except Exception as e:
        print(str(e), file=sys.stderr, flush=True)
        sys.exit(1)
