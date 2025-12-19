import sys
import os
from PIL import Image
import torch

print("Iniciando teste BEN2...")
try:
    try:
        from BEN2 import BEN_Base
        print("Importado como BEN2")
    except ImportError:
        try:
            import ben2
            print("Importado como ben2")
            # Tentar encontrar a classe dentro de ben2
            if hasattr(ben2, 'BEN_Base'):
                BEN_Base = ben2.BEN_Base
            else:
                print(f"Conteúdo de ben2: {dir(ben2)}")
                # Tentar adivinhar
                BEN_Base = ben2.BEN_Base # Vai falhar se não existir, mas o dir ajuda
        except ImportError:
            print("Não foi possível importar BEN2 nem ben2")
            raise
    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Usando dispositivo (detectado): {device}")
    
    try:
        # Tentar sem argumentos
        ben = BEN_Base()
        print("Modelo BEN2 carregado (sem argumentos)!")
    except TypeError:
        # Tentar com backbone se necessário (chute)
        ben = BEN_Base(backbone='pvt_v2_b2')
        print("Modelo BEN2 carregado (com backbone)!")

    # Verificar métodos
    print(f"Métodos disponíveis: {[m for m in dir(ben) if not m.startswith('__')]}")

    # Criar imagem dummy para teste
    img = Image.new('RGB', (100, 100), color = 'red')
    
    print("Tentando inferência...")
    # Testar inferência
    # O método pode ser inference, segment, predict...
    if hasattr(ben, 'inference'):
        result = ben.inference(img)
    elif hasattr(ben, 'segment'):
        result = ben.segment(img)
    else:
        # Tentar chamar como função
        result = ben(img)
    
    print(f"Tipo do resultado: {type(result)}")
    if isinstance(result, Image.Image):
        print(f"Resultado é uma imagem PIL. Modo: {result.mode}")
    else:
        print(f"Resultado não é imagem PIL: {result}")

except Exception as e:
    print(f"Erro no teste: {e}")
    import traceback
    traceback.print_exc()
