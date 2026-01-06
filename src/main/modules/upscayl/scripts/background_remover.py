#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Background Remover usando REMBG (otimizado)
Versão rápida e inteligente para remoção automática de fundo
"""

import sys
import os
import numpy as np
from PIL import Image

# Imports do rembg
try:
    from rembg import remove, new_session
except ImportError as e:
    print(f"ERROR:Erro ao importar rembg: {str(e)}", file=sys.stderr)
    print(f"ERROR:Execute: pip install rembg[gpu]", file=sys.stderr)
    sys.exit(1)

def remove_black_pixels(image, threshold=30):
    """
    Remove pixels pretos/escuros da imagem (útil para limpar artefatos)
    
    Args:
        image: PIL Image em modo RGBA
        threshold: Valor de threshold (0-255). Pixels com R,G,B <= threshold são removidos
    
    Returns:
        PIL Image com pixels pretos removidos
    """
    data = np.array(image)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Identificar pixels pretos (todos os canais RGB abaixo do threshold)
    is_black = (r <= threshold) & (g <= threshold) & (b <= threshold)
    
    # Tornar pixels pretos transparentes
    a[is_black] = 0
    
    data[:,:,3] = a
    return Image.fromarray(data, 'RGBA')

def remove_background_advanced(input_path, output_path, remove_internal_blacks=False, black_threshold=30):
    """
    Remove o fundo de uma imagem usando rembg
    
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
        
        print(f"PROGRESS:Carregando imagem...", file=sys.stderr, flush=True)
        input_image = Image.open(input_path)
        original_size = input_image.size
        
        # Converter para RGB se necessário
        if input_image.mode != 'RGB':
            input_image = input_image.convert('RGB')
        
        # OTIMIZAÇÃO: Redimensionar para modo ultra-rápido
        MAX_DIMENSION = 720 # Reduzido de 1024 para ganho de performance
        if max(original_size) > MAX_DIMENSION:
            print(f"PROGRESS:Otimizando para velocidade...", file=sys.stderr, flush=True)
            ratio = MAX_DIMENSION / max(original_size)
            new_size = (int(original_size[0] * ratio), int(original_size[1] * ratio))
            input_image = input_image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Modo Rápido usa u2netp (Pequeno e Veloz)
        model_name = "u2netp" 
        try:
            session = new_session(model_name)
        except Exception as e:
            print(f"WARNING:Erro ao carregar modelo {model_name}: {e}. Usando fallback...", file=sys.stderr, flush=True)
            session = new_session("u2netp")

        print(f"PROGRESS:Removendo fundo (Modo Ultra-Rápido)...", file=sys.stderr, flush=True)
        
        # Remover fundo
        output_image = remove(
            input_image, 
            session=session,
            alpha_matting=False, 
        )
        
        # Se redimensionamos, voltar ao tamanho original
        if max(original_size) > MAX_DIMENSION:
            print(f"PROGRESS:Restaurando resolução original...", file=sys.stderr, flush=True)
            output_image = output_image.resize(original_size, Image.Resampling.LANCZOS)
        
        # Remover pretos internos se solicitado
        if remove_internal_blacks:
            print(f"PROGRESS:Removendo pretos internos (threshold: {black_threshold})...", file=sys.stderr, flush=True)
            output_image = remove_black_pixels(output_image, black_threshold)
        
        # Garantir que o diretório de saída existe
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Salvar
        print(f"PROGRESS:Salvando resultado...", file=sys.stderr, flush=True)
        output_image.save(output_path, 'PNG', optimize=True)
        
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
        print("ERROR:Uso: python background_remover.py <input_path> <output_path> [remove_blacks] [threshold]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    remove_blacks = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else False
    threshold = int(sys.argv[4]) if len(sys.argv) > 4 else 30
    
    try:
        result = remove_background_advanced(input_path, output_path, remove_blacks, threshold)
        print(f"SUCCESS:{result}")
        sys.exit(0)
    except Exception as e:
        print(str(e), file=sys.stderr, flush=True)
        sys.exit(1)
