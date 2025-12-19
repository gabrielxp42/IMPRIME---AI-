"""
Extrai o app.asar do concorrente usando Python
"""

import os
import sys
import subprocess

def extrair_asar():
    asar_path = r"C:\Program Files\dtf-dtg-indexcolor-ultra-pro\resources\app.asar"
    output_dir = r"C:\Users\Direct\Desktop\concorrente_extracted"
    
    print("=" * 70)
    print("EXTRAINDO APP.ASAR DO CONCORRENTE")
    print("=" * 70)
    print(f"\nOrigem: {asar_path}")
    print(f"Destino: {output_dir}")
    
    if not os.path.exists(asar_path):
        print(f"\n❌ Arquivo não encontrado: {asar_path}")
        return False
    
    print(f"\n✅ Arquivo encontrado!")
    print(f"   Tamanho: {os.path.getsize(asar_path):,} bytes")
    
    # Criar diretório de saída
    os.makedirs(output_dir, exist_ok=True)
    
    # Tentar extrair usando npx asar
    print(f"\n[1] Tentando extrair com npx asar...")
    try:
        result = subprocess.run(
            ["npx", "--yes", "asar", "extract", asar_path, output_dir],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("     ✅ Extração bem-sucedida!")
            
            # Listar arquivos extraídos
            print(f"\n[2] Arquivos extraídos:")
            count = 0
            for root, dirs, files in os.walk(output_dir):
                for file in files:
                    if count < 30:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, output_dir)
                        print(f"     • {rel_path}")
                        count += 1
            
            if count > 30:
                print(f"     ... e mais {count - 30} arquivos")
            
            print(f"\n✅ Total: {count} arquivos extraídos")
            print(f"📁 Pasta: {output_dir}")
            
            return True
        else:
            print(f"     ❌ Erro: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("     ❌ npx não encontrado. Tentando instalar asar...")
        try:
            subprocess.run(["npm", "install", "-g", "@electron/asar"], check=True)
            print("     ✅ asar instalado! Tente executar este script novamente.")
            return False
        except:
            print("     ❌ npm não encontrado. Instale Node.js primeiro.")
            return False
    except Exception as e:
        print(f"     ❌ Erro: {str(e)}")
        return False

if __name__ == "__main__":
    print()
    if extrair_asar():
        print("\n" + "=" * 70)
        print("✅ EXTRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 70)
        print(f"\nAgora posso analisar o código do concorrente.")
    else:
        print("\n" + "=" * 70)
        print("❌ EXTRAÇÃO FALHOU")
        print("=" * 70)
        print("\nVocê pode:")
        print("1. Instalar Node.js (https://nodejs.org)")
        print("2. Ou me enviar o código do concorrente manualmente")
    
    print("\n⏸️  Pressione ENTER para sair...")
    input()

