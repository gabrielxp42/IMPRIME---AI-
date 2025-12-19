#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste SAM para remoção automática de fundo
"""
import sys
import os
import numpy as np
from PIL import Image
import torch

print("Iniciando teste SAM...")

try:
    from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
    print("SAM importado com sucesso!")
    
    # Detectar dispositivo
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Usando dispositivo: {device}")
    
    # Verificar se modelo existe, senão baixar
    model_path = "sam_vit_b_01ec64.pth"
    if not os.path.exists(model_path):
        print(f"Modelo não encontrado em {model_path}")
        print("Baixe o modelo com:")
        print("wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth")
        sys.exit(1)
    
    # Carregar modelo
    print("Carregando modelo SAM (vit_b)...")
    sam = sam_model_registry["vit_b"](checkpoint=model_path)
    sam.to(device=device)
    
    # Criar gerador automático de máscaras
    print("Criando gerador de máscaras...")
    mask_generator = SamAutomaticMaskGenerator(
        model=sam,
        points_per_side=32,  # Reduzido para performance
        pred_iou_thresh=0.86,
        stability_score_thresh=0.92,
        crop_n_layers=1,
        crop_n_points_downscale_factor=2,
        min_mask_region_area=100,  # Ignorar regiões muito pequenas
    )
    
    # Criar imagem de teste
    print("Criando imagem de teste...")
    img_array = np.zeros((400, 400, 3), dtype=np.uint8)
    img_array[:, :] = [200, 200, 200]  # Fundo cinza
    # Adicionar um "objeto" (círculo vermelho no centro)
    center_y, center_x = 200, 200
    radius = 80
    y, x = np.ogrid[:400, :400]
    mask_circle = (x - center_x)**2 + (y - center_y)**2 <= radius**2
    img_array[mask_circle] = [255, 0, 0]  # Vermelho
    
    # Gerar máscaras
    print("Gerando máscaras automaticamente...")
    masks = mask_generator.generate(img_array)
    
    print(f"Total de máscaras geradas: {len(masks)}")
    
    if len(masks) > 0:
        # Ordenar por área (maior primeiro)
        masks_sorted = sorted(masks, key=lambda x: x['area'], reverse=True)
        
        print("\nTop 3 máscaras por área:")
        for i, mask_data in enumerate(masks_sorted[:3]):
            print(f"  {i+1}. Área: {mask_data['area']}, IoU: {mask_data['predicted_iou']:.3f}, Stability: {mask_data['stability_score']:.3f}")
        
        # Estratégia: pegar a maior máscara que não seja o fundo inteiro
        # (assumindo que o fundo seria a maior máscara se existir)
        main_mask = None
        for mask_data in masks_sorted:
            area_ratio = mask_data['area'] / (img_array.shape[0] * img_array.shape[1])
            if area_ratio < 0.9:  # Não é o fundo inteiro
                main_mask = mask_data['segmentation']
                print(f"\nMáscara principal selecionada: área={mask_data['area']}, ratio={area_ratio:.2%}")
                break
        
        if main_mask is not None:
            # Criar imagem com fundo removido
            result = Image.new('RGBA', (img_array.shape[1], img_array.shape[0]))
            img_pil = Image.fromarray(img_array)
            result.paste(img_pil, (0, 0))
            
            # Aplicar máscara alpha
            alpha = np.where(main_mask, 255, 0).astype(np.uint8)
            result.putalpha(Image.fromarray(alpha))
            
            print("Resultado criado com sucesso!")
            print(f"Modo: {result.mode}, Tamanho: {result.size}")
        else:
            print("Nenhuma máscara adequada encontrada")
    else:
        print("Nenhuma máscara foi gerada")
    
    print("\nTeste concluído com sucesso!")
    
except Exception as e:
    print(f"Erro no teste: {e}")
    import traceback
    traceback.print_exc()
