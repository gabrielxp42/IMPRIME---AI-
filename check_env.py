
import sys
import subprocess
import importlib.util

def check_package(package_name, install_name=None):
    if install_name is None:
        install_name = package_name
        
    spec = importlib.util.find_spec(package_name)
    if spec is None:
        print(f"❌ {package_name} NÃO encontrado.")
        print(f"   Por favor execute: pip install {install_name}")
        return False
    else:
        print(f"✅ {package_name} encontrado.")
        return True

print("--- Verificando Dependências Python ---")

python_version = sys.version.split()[0]
print(f"🐍 Python Version: {python_version}")

all_good = True
all_good &= check_package("rembg", "rembg[gpu]")
all_good &= check_package("PIL", "Pillow")
all_good &= check_package("numpy")
all_good &= check_package("win32com", "pywin32")
all_good &= check_package("onnxruntime")

print("-" * 30)
if all_good:
    print("🎉 Tudo pronto! As dependências estão instaladas.")
else:
    print("⚠️ Faltam dependências. Instale-as para a remoção de fundo funcionar.")
