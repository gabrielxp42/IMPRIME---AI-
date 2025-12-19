#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Background Remover MANUAL usando SAM (Segment Anything Model)
Permite seleção interativa via ponto ou caixa
"""

import sys
import os
import numpy as np
from PIL import Image
import torch
import json

# Imports do SAM
try:
    from segment_anything import sam_model_registry, SamPredictor
except ImportError as e:
    print(f"ERROR:Erro ao importar SAM: {str(e)}", file=sys.stderr)
    print(f"ERROR:Execute: pip install git+https://github.com/facebookresearch/segment-anything.git", file=sys.stderr)
    sys.exit(1)

# Caminho do modelo
MODEL_FILENAME = "sam_vit_b_01ec64.pth"
MODEL_URL = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"

def get_model_path():
    """Retorna o caminho absoluto do modelo, compatível com PyInstaller"""
    if getattr(sys, 'frozen', False):
        base_path = os.path.dirname(sys.executable)
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
        root_path = os.getcwd()
        if os.path.exists(os.path.join(root_path, MODEL_FILENAME)):
            return os.path.join(root_path, MODEL_FILENAME)
            
    return os.path.join(base_path, MODEL_FILENAME)

MODEL_PATH = get_model_path()

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

def remove_background_manual(input_path, output_path, selection_data):
    """
    Remove o fundo usando SAM com seleção manual
    
    Args:
        input_path: Caminho da imagem de entrada
        output_path: Caminho da imagem de saída (PNG com transparência)
        selection_data: Dict com 'type' ('point' ou 'box') e coordenadas
            - point: {'type': 'point', 'x': int, 'y': int}
            - box: {'type': 'box', 'x1': int, 'y1': int, 'x2': int, 'y2': int}
    
    Returns:
        str: Caminho do arquivo de saída se sucesso
    """
    try:
        # Verificar arquivo
        if not os.path.exists(input_path):
            raise Exception(f"ERROR:Arquivo não encontrado: {input_path}")
        
        # Baixar modelo se necessário
        download_model_if_needed()
        
        print(f"PROGRESS:Carregando imagem...", file=sys.stderr, flush=True)
        input_image = Image.open(input_path)
        
        if input_image.mode != 'RGB':
            input_image = input_image.convert('RGB')
        
        img_array = np.array(input_image)
        
        # Carregar modelo SAM
        print(f"PROGRESS:Inicializando SAM...", file=sys.stderr, flush=True)
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        sam = sam_model_registry["vit_b"](checkpoint=MODEL_PATH)
        sam.to(device=device)
        
        predictor = SamPredictor(sam)
        
        # Processar imagem
        print(f"PROGRESS:Processando imagem...", file=sys.stderr, flush=True)
        predictor.set_image(img_array)
        
        # Preparar prompt baseado no tipo de seleção
        if selection_data['type'] == 'point':
            # Modo ponto: usuário clicou no objeto
            point_coords = np.array([[selection_data['x'], selection_data['y']]])
            point_labels = np.array([1])  # 1 = foreground
            
            print(f"PROGRESS:Segmentando objeto no ponto ({selection_data['x']}, {selection_data['y']})...", file=sys.stderr, flush=True)
            
            masks, scores, _ = predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=True  # Gera 3 máscaras, pegamos a melhor
            )
            
            # Pegar a máscara com melhor score
            best_mask_idx = np.argmax(scores)
            mask = masks[best_mask_idx]
            
        elif selection_data['type'] == 'box':
            # Modo caixa: usuário desenhou retângulo
            box = np.array([
                selection_data['x1'],
                selection_data['y1'],
                selection_data['x2'],
                selection_data['y2']
            ])
            
            print(f"PROGRESS:Segmentando área selecionada...", file=sys.stderr, flush=True)
            
            masks, scores, _ = predictor.predict(
                box=box,
                multimask_output=False  # Box já define bem a área
            )
            
            mask = masks[0]
        else:
            raise Exception(f"ERROR:Tipo de seleção inválido: {selection_data['type']}")
        
        # Criar imagem RGBA com máscara
        print(f"PROGRESS:Criando imagem com fundo transparente...", file=sys.stderr, flush=True)
        
        result = Image.new('RGBA', (img_array.shape[1], img_array.shape[0]))
        img_pil = Image.fromarray(img_array)
        result.paste(img_pil, (0, 0))
        
        # Aplicar máscara
        alpha = np.where(mask, 255, 0).astype(np.uint8)
        result.putalpha(Image.fromarray(alpha))
        
        # Garantir diretório de saída
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
    if len(sys.argv) < 4:
        print("ERROR:Uso: python background_remover_manual.py <input_path> <output_path> <selection_json>")
        print("ERROR:selection_json exemplo: {\"type\":\"point\",\"x\":100,\"y\":200}")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    selection_json = sys.argv[3]
    
    try:
        selection_data = json.loads(selection_json)
        result = remove_background_manual(input_path, output_path, selection_data)
        print(f"SUCCESS:{result}")
        sys.exit(0)
    except Exception as e:
        print(str(e), file=sys.stderr, flush=True)
        sys.exit(1)
