import sys
import os
import io
import base64
from PIL import Image
try:
    from transparent_background import Remover
    print("Biblioteca importada com sucesso!")
    
    # Criar uma imagem simples para teste
    img = Image.new('RGB', (100, 100), color = 'red')
    
    # Inicializar o removedor (Fast mode para teste rápido, Base é o melhor)
    print("Carregando modelo InSPyReNet (isso pode demorar na 1ª vez)...")
    remover = Remover(mode='fast', device='cpu') 
    
    print("Processando imagem...")
    out = remover.process(img)
    
    print(f"Sucesso! Saída gerada: {out.size} modo {out.mode}")
    
except Exception as e:
    print(f"ERRO CRÍTICO: {e}")
    import traceback
    traceback.print_exc()
