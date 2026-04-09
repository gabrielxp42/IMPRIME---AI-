import os
import requests
import sys
from tqdm import tqdm

def download_file(url, destination):
    """
    Downloads a file with a progress bar.
    """
    if os.path.exists(destination):
        print(f"✅ {os.path.basename(destination)} já existe.")
        return

    dirname = os.path.dirname(destination)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    print(f"📥 Baixando {os.path.basename(destination)}...")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))
        
        with open(destination, 'wb') as file, tqdm(
            desc=os.path.basename(destination),
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for data in response.iter_content(chunk_size=1024):
                size = file.write(data)
                bar.update(size)
        print(f"✨ {os.path.basename(destination)} concluído!")
    except Exception as e:
        print(f"❌ Erro ao baixar {os.path.basename(destination)}: {e}")

def main():
    # Lista de modelos necessários
    MODELS = [
        {
            "name": "Segment Anything Model (SAM) - vit_b",
            "url": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth",
            "path": "sam_vit_b_01ec64.pth"
        },
        # Upscayl Models
        {
            "name": "Upscayl Standard 4x Bin",
            "url": "https://raw.githubusercontent.com/upscayl/upscayl/main/resources/models/upscayl-standard-4x.bin",
            "path": "upscayl-bin/models/upscayl-standard-4x.bin"
        },
        {
            "name": "Upscayl Standard 4x Param",
            "url": "https://raw.githubusercontent.com/upscayl/upscayl/main/resources/models/upscayl-standard-4x.param",
            "path": "upscayl-bin/models/upscayl-standard-4x.param"
        },
        {
            "name": "Upscayl Lite 4x Bin",
            "url": "https://raw.githubusercontent.com/upscayl/upscayl/main/resources/models/upscayl-lite-4x.bin",
            "path": "upscayl-bin/models/upscayl-lite-4x.bin"
        },
        {
            "name": "Upscayl Lite 4x Param",
            "url": "https://raw.githubusercontent.com/upscayl/upscayl/main/resources/models/upscayl-lite-4x.param",
            "path": "upscayl-bin/models/upscayl-lite-4x.param"
        }
    ]

    print("🚀 Iniciando download dos modelos necessários para o IMPRIME - AI...\n")
    
    # Verificar se as dependências do script estão instaladas
    try:
        import requests
        from tqdm import tqdm
    except ImportError:
        print("📦 Instalando dependências necessárias (requests, tqdm)...")
        os.system(f"{sys.executable} -m pip install requests tqdm")
        import requests
        from tqdm import tqdm

    for model in MODELS:
        download_file(model["url"], model["path"])

    print("\n✅ Todos os modelos foram verificados/baixados com sucesso!")
    print("Agora o projeto está pronto para ser executado (npm run dev).")

if __name__ == "__main__":
    main()
