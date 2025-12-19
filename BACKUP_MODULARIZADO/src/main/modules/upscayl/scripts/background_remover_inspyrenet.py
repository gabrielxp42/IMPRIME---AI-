#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Background Remover usando InSPyReNet (via transparent-background)
Versão de Alta Precisão para detalhes complexos (cabelos, transparências)
"""

import sys
import os
from PIL import Image
import torch

# Adicionar o diretório atual ao path para garantir que imports locais funcionem se necessário
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from transparent_background import Remover
except ImportError as e:
    print(f"ERROR:Biblioteca 'transparent-background' não encontrada.", file=sys.stderr, flush=True)
    print(f"ERROR:Por favor, instale com: pip install transparent-background", file=sys.stderr, flush=True)
    sys.exit(1)

def remove_background_inspyrenet(input_path, output_path, mode='base'):
    """
    Remove o fundo usando InSPyReNet
    
    Args:
        input_path: Caminho da imagem de entrada
        output_path: Caminho da imagem de saída
        mode: 'base' ou 'fast' (base é mais preciso, fast é mais rápido)
    """
    try:
        if not os.path.exists(input_path):
            raise Exception(f"Arquivo não encontrado: {input_path}")

        print(f"PROGRESS:Inicializando InSPyReNet ({mode})...", file=sys.stderr, flush=True)
        
        # Configurar o removedor
        # mode='base' usa o checkpoint padrão (InSPyReNet_SwinB) - Alta qualidade
        # mode='fast' usa InSPyReNet_Res2Net50 - Mais rápido
        remover = Remover(mode=mode, device='cuda' if torch.cuda.is_available() else 'cpu')
        
        print(f"PROGRESS:Carregando imagem...", file=sys.stderr, flush=True)
        img = Image.open(input_path).convert('RGB')
        
        print(f"PROGRESS:Processando imagem (pode demorar alguns segundos)...", file=sys.stderr, flush=True)
        out = remover.process(img)
        
        print(f"PROGRESS:Salvando resultado...", file=sys.stderr, flush=True)
        out.save(output_path)
        
        print(f"SUCCESS:{output_path}", flush=True)
        
    except Exception as e:
        print(f"ERROR:{str(e)}", file=sys.stderr, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python background_remover_inspyrenet.py <input_path> <output_path> [mode]")
        sys.exit(1)
        
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    mode = sys.argv[3] if len(sys.argv) > 3 else 'base'
    
    remove_background_inspyrenet(input_file, output_file, mode)
